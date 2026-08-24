import type {
  Answers, AxisId, Conflict, Question, ScoreResult, StyleDef, Strength, Traits,
} from './types';
import { AXES } from '../data/axes';
import { STYLES } from '../data/styles';
import { aspectCounts } from './select';

/**
 * 채점.
 *
 * 축이 몇 개든, 문항이 선택지형이든 슬라이더형이든 상관없이 돈다.
 * 축 정의는 data/axes.ts 에서 읽는다.
 *
 * ── 정규화를 왜 이렇게 하나 ──
 *
 * 점수를 그냥 더하면 "그 사람에게 어떤 문항이 뽑혔는지"가 결과에 섞여 들어간다.
 * 조건부 출제 때문에 사람마다 문항이 달라지는 구조에서는 치명적이다.
 * 그래서:
 *
 *   1. 그 세트를 무작위로 찍었을 때의 기댓값(exp)을 구한다 → 이게 판정선
 *   2. 실제 점수가 거기서 얼마나 벗어났는지(dev) 본다
 *   3. 그 방향으로 갈 수 있었던 최대 이탈폭(room)으로 나눈다
 *
 * 세트가 어느 쪽으로 치우쳐 있든 판정선이 자동으로 가운데 온다.
 * 이 방식은 유지하는 걸 권한다. 문항이 바뀌어도 그대로 쓸 수 있다.
 */
export function score(
  questions: Question[],
  answers: Answers,
  traits: Traits = {}
): ScoreResult {
  const ids: AxisId[] = AXES.map(a => a.id);
  const raw: Record<AxisId, number> = {};
  const maxP: Record<AxisId, number> = {};
  const maxN: Record<AxisId, number> = {};
  const exp: Record<AxisId, number> = {};
  for (const id of ids) { raw[id] = 0; maxP[id] = 0; maxN[id] = 0; exp[id] = 0; }

  let answered = 0;
  const gained: Traits = { ...traits };
  const tags: Record<string, number> = {};

  for (const q of questions) {
    const a = answers[q.id];
    const hasAnswer = a != null;
    if (hasAnswer) answered++;

    if (q.kind === 'choice') {
      const pick = hasAnswer ? q.options[a] : undefined;
      if (pick?.traits) Object.assign(gained, pick.traits);
      // 하위 지표 — 고른 선택지의 태그만 센다. 유형 판정에는 안 들어간다
      for (const t of pick?.tags ?? []) tags[t] = (tags[t] ?? 0) + 1;
      for (const id of ids) {
        const vals = q.options.map(o => o.score?.[id] ?? 0);
        if (!vals.some(v => v !== 0)) continue;   // 이 축을 안 재는 문항
        maxP[id] += Math.max(...vals);
        maxN[id] += Math.min(...vals);
        exp[id] += vals.reduce((x, y) => x + y, 0) / vals.length;
        if (pick?.score?.[id]) raw[id] += pick.score[id]!;
      }
    } else {
      // 슬라이더: 응답 위치를 -1 ~ +1 로 환산해서 weight 에 곱한다
      const pos = hasAnswer && q.steps > 1 ? (a / (q.steps - 1)) * 2 - 1 : 0;
      for (const id of ids) {
        const w = q.weight[id];
        if (!w) continue;
        maxP[id] += Math.abs(w);
        maxN[id] -= Math.abs(w);
        // 단계가 대칭이라 무작위 응답의 기댓값은 0
        if (hasAnswer) raw[id] += pos * w;
      }
    }
  }

  const norm: Record<AxisId, number> = {};
  const strength: Record<AxisId, Strength> = {};
  for (const id of ids) {
    norm[id] = normalize(raw[id], exp[id], maxP[id], maxN[id]);
    strength[id] = strengthOf(norm[id]);
  }

  // 역할별로 몇 문항이나 물었는지 — 결과 신뢰도를 보여줄 때 쓴다.
  // 어떤 항목을 2문항만 물었으면 그 항목 점수는 믿을 게 못 된다
  const answeredQs = questions.filter(q => answers[q.id] != null);

  return {
    norm, strength, answered, traits: gained,
    perAspect: aspectCounts(answeredQs),
    code: codeOf(norm),
    style: styleOf(norm),
    tags,
    conflicts: findConflicts(answeredQs, answers),
  };
}

/* ══ 유형 코드 ════════════════════════════════════════════
   축 부호를 이어붙인다. 공유 링크와 결과 주소가 이걸로 만들어진다.
   축 순서(axes.ts 의 배열 순서)에 의존하므로, 축 순서를 바꾸면
   이미 공유된 링크가 다른 유형을 가리키게 된다. 바꾸지 말 것. */
export function codeOf(norm: Record<AxisId, number>): string {
  return AXES.map(a => {
    const pos = (norm[a.id] ?? 0) >= 0;
    const fallback = a.id.charAt(0).toUpperCase();
    return (pos ? a.posCode : a.negCode) ?? fallback;
  }).join('');
}

/* ══ 1차 유형 ════════════════════════════════════════════
   축 두 개로 만드는 사분면. 정의는 data/styles.ts 에 있다.
   거기 적힌 축이 axes.ts 에 없으면 null 을 돌려준다 — 검사는 계속 돈다. */
export function styleOf(norm: Record<AxisId, number>): StyleDef | null {
  for (const s of STYLES) {
    const keys = Object.keys(s.when);
    if (!keys.length) continue;
    const ok = keys.every(id => {
      if (!(id in norm)) return false;
      return s.when[id] === '+' ? norm[id] >= 0 : norm[id] < 0;
    });
    if (ok) return s;
  }
  return null;
}

/* ══ 모순 탐지 ════════════════════════════════════════════
   같은 `pair` 를 가진 문항끼리 답이 어긋났는지 본다.
   "먼저 연락 안 하는 편" 이라고 해놓고 "30분 답 없으면 신경 쓰인다" 를 고르면
   그건 안 하는 게 아니라 못 하는 것이다 — 결과지에서 그걸 짚어준다.

   유형 판정에는 영향을 주지 않는다. 서술용이다. */

/** 이 문항이 실제로 재는 축. aspect 가 축 이름이면 그걸 쓰고, 아니면 점수를 주는 첫 축 */
function axisOf(q: Question): AxisId | null {
  const ids = AXES.map(a => a.id);
  if (q.aspect && ids.includes(q.aspect)) return q.aspect;
  for (const id of ids) if (spread(q, id) !== null) return id;
  return null;
}

/** 그 축에서 이 문항의 선택지들이 벌어진 폭. 안 재면 null */
function spread(q: Question, id: AxisId): [number, number] | null {
  if (q.kind === 'choice') {
    const vals = q.options.map(o => o.score?.[id] ?? 0);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    return lo === hi ? null : [lo, hi];
  }
  const w = q.weight[id];
  return w ? [-Math.abs(w), Math.abs(w)] : null;
}

/**
 * 그 문항 안에서 이 응답이 어디쯤인가. -1(neg 쪽) ~ +1(pos 쪽).
 * 문항마다 점수 폭이 달라서, 폭으로 나눠 정규화해야 서로 비교가 된다.
 */
function positionOf(q: Question, a: number, id: AxisId): number | null {
  const sp = spread(q, id);
  if (!sp) return null;
  const [lo, hi] = sp;

  if (q.kind === 'choice') {
    const v = q.options[a]?.score?.[id] ?? 0;
    return ((v - lo) / (hi - lo)) * 2 - 1;
  }
  if (q.steps <= 1) return null;
  const raw = (a / (q.steps - 1)) * 2 - 1;      // 슬라이더 위치
  return raw * Math.sign(q.weight[id] ?? 1);     // weight 가 음수면 방향이 뒤집힌다
}

/** 고른 것을 사람이 읽을 수 있게 */
function pickText(q: Question, a: number): string {
  if (q.kind === 'choice') return q.options[a]?.text ?? '';
  if (q.steps <= 1) return '';
  if (a === 0) return q.minLabel;
  if (a === q.steps - 1) return q.maxLabel;
  const mid = (q.steps - 1) / 2;
  if (a === mid) return '가운데';
  return a < mid ? `${q.minLabel} 쪽` : `${q.maxLabel} 쪽`;
}

/** 어긋났다고 볼 최소 폭. 위치가 -1~+1 이라 최대 간격은 2다 */
const CONFLICT_GAP = 1.0;

export function findConflicts(questions: Question[], answers: Answers): Conflict[] {
  const groups = new Map<string, Conflict['items']>();
  const axisFor = new Map<string, AxisId>();

  for (const q of questions) {
    if (!q.pair) continue;
    const a = answers[q.id];
    if (a == null) continue;

    // 묶음의 축은 처음 들어온 문항이 정한다. 서로 다른 축을 재면 비교가 무의미하다
    const id = axisFor.get(q.pair) ?? axisOf(q);
    if (!id) continue;
    const pos = positionOf(q, a, id);
    if (pos === null) continue;

    axisFor.set(q.pair, id);
    const list = groups.get(q.pair) ?? [];
    list.push({ id: q.id, text: q.text, pick: pickText(q, a), pos });
    groups.set(q.pair, list);
  }

  const out: Conflict[] = [];
  for (const [pair, items] of groups) {
    if (items.length < 2) continue;
    const sorted = [...items].sort((x, y) => x.pos - y.pos);
    const gap = sorted[sorted.length - 1].pos - sorted[0].pos;
    if (gap < CONFLICT_GAP) continue;
    // 양 끝 둘만 보여준다. 셋 이상이어도 제일 벌어진 쌍이 할 말이 제일 많다
    out.push({
      pair,
      axis: axisFor.get(pair)!,
      gap,
      items: [sorted[0], sorted[sorted.length - 1]],
    });
  }
  return out.sort((x, y) => y.gap - x.gap);
}

function normalize(raw: number, exp: number, maxP: number, maxN: number): number {
  const dev = raw - exp;
  const room = dev >= 0 ? maxP - exp : exp - maxN;
  if (room <= 0) return 0;
  return Math.max(-1, Math.min(1, dev / room));
}

/** 0에 가까우면 '경계형'이라고 알려주기 위한 확신도 */
function strengthOf(v: number): Strength {
  const a = Math.abs(v);
  if (a < 0.12) return 'edge';
  if (a < 0.35) return 'mild';
  if (a < 0.62) return 'clear';
  return 'strong';
}

/** 게이지 표시용 0~100 */
export function axisPercent(v: number): number {
  return Math.round(50 + v * 50);
}
