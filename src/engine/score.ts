import type {
  Answers, AxisId, Question, ScoreResult, Strength, Traits,
} from './types';
import { AXES } from '../data/axes';
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

  for (const q of questions) {
    const a = answers[q.id];
    const hasAnswer = a != null;
    if (hasAnswer) answered++;

    if (q.kind === 'choice') {
      const pick = hasAnswer ? q.options[a] : undefined;
      if (pick?.traits) Object.assign(gained, pick.traits);
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

  return { norm, strength, answered, traits: gained, perAspect: aspectCounts(answeredQs) };
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
