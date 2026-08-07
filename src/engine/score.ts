import {
  AXIS_KEYS, type Answers, type AxisKey, type Question,
  type ScoreResult, type Strength, type SubAxisKey,
} from './types';
import axesJson from '../data/axes.json';

export const AXES = axesJson as Record<AxisKey, {
  name: string; pos: string; neg: string;
  posLabel: string; negLabel: string; desc: string;
}>;

const SUB_KEYS: SubAxisKey[] = ['conf', 'pop', 'peer'];

/**
 * 채점.
 *
 * v1에서 그대로 가져온 정규화 방식이고, 이건 바꾸지 않는 게 좋다.
 *
 * 단순히 점수를 합산하면 "그 세트에 어떤 문항이 많이 뽑혔는지"가
 * 결과에 그대로 실린다. 개인화 때문에 사람마다 세트가 다른 구조에서는
 * 치명적이다. 그래서 이렇게 한다:
 *
 *   1. 그 세트를 무작위로 찍었을 때의 기댓값(exp)을 구한다 → 이게 판정선
 *   2. 실제 점수가 기댓값에서 얼마나 벗어났는지(dev) 본다
 *   3. 그 방향으로 갈 수 있었던 최대 이탈폭(room)으로 나눈다
 *
 * 결과적으로 세트가 어느 쪽으로 치우쳐 있든 판정선이 자동으로 가운데 온다.
 */
export function score(questions: Question[], answers: Answers): ScoreResult {
  const raw = zero(), maxP = zero(), maxN = zero(), exp = zero();
  const rawSub = zeroSub(), maxPSub = zeroSub(), maxNSub = zeroSub(), expSub = zeroSub();
  const sub: Record<string, Record<string, number>> = {};
  let answered = 0;

  for (const q of questions) {
    const pickIndex = answers[q.id];
    const pick = pickIndex == null ? undefined : q.o[pickIndex];
    if (pick) answered++;

    for (const k of AXIS_KEYS) {
      const vals = q.o.map(o => o.s?.[k] ?? 0);
      maxP[k] += Math.max(...vals);
      maxN[k] += Math.min(...vals);
      exp[k] += vals.reduce((a, b) => a + b, 0) / vals.length;
      if (pick?.s?.[k]) raw[k] += pick.s[k]!;
    }

    for (const k of SUB_KEYS) {
      const vals = q.o.map(o => o.s2?.[k] ?? 0);
      if (!vals.some(v => v !== 0)) continue;   // 이 축을 안 재는 문항은 건너뛴다
      maxPSub[k] += Math.max(...vals);
      maxNSub[k] += Math.min(...vals);
      expSub[k] += vals.reduce((a, b) => a + b, 0) / vals.length;
      if (pick?.s2?.[k]) rawSub[k] += pick.s2[k]!;
    }

    // 'trigger:humor' → sub.trigger.humor++
    for (const tag of pick?.k ?? []) {
      const [cat, val] = tag.split(':');
      if (!cat || !val) continue;
      (sub[cat] ??= {})[val] = (sub[cat][val] ?? 0) + 1;
    }
  }

  const norm = {} as Record<AxisKey, number>;
  for (const k of AXIS_KEYS) norm[k] = normalize(raw[k], exp[k], maxP[k], maxN[k]);

  const norm2 = {} as Record<SubAxisKey, number>;
  for (const k of SUB_KEYS) norm2[k] = normalize(rawSub[k], expSub[k], maxPSub[k], maxNSub[k]);

  const code = AXIS_KEYS.map(k => (norm[k] >= 0 ? AXES[k].pos : AXES[k].neg)).join('');

  const strength = {} as Record<AxisKey, Strength>;
  for (const k of AXIS_KEYS) strength[k] = strengthOf(norm[k]);

  return { code, norm, norm2, strength, sub, answered };
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

const zero = () => ({ sp: 0, ex: 0, st: 0, iv: 0 }) as Record<AxisKey, number>;
const zeroSub = () => ({ conf: 0, pop: 0, peer: 0 }) as Record<SubAxisKey, number>;

/** 축 게이지용 0~100 */
export function axisPercent(v: number): number {
  return Math.round(50 + v * 50);
}

/** 16개 유형 코드 전부 (고정 순서 — 공유 링크 인코딩이 이 순서에 의존한다) */
export function allCodes(): string[] {
  const out: string[] = [];
  for (const a of ['F', 'S']) for (const b of ['D', 'I'])
    for (const c of ['O', 'N']) for (const d of ['A', 'G']) out.push(a + b + c + d);
  return out;
}
