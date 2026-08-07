import type {
  Answers, BankId, IntroAnswers, Question, ResolvedScene, Scene,
} from './types';

import ch1 from '../data/questions/ch1-me.json';
import ch2 from '../data/questions/ch2-pull.json';
import ch3 from '../data/questions/ch3-crush.json';
import ch4 from '../data/questions/ch4-some.json';
import ch5 from '../data/questions/ch5-ask.json';
import ch6 from '../data/questions/ch6-dating.json';
import ch7 from '../data/questions/ch7-after.json';
import extra from '../data/questions/pool-extra.json';

/**
 * 문항 선택.
 *
 * ★ 문항 뽑는 규칙을 바꾸고 싶으면 이 파일만 고치면 된다.
 *   장면(data/scenes.ts)도 채점(score.ts)도 안 건드려도 된다.
 *
 * 지금 규칙은 일부러 단순하게 뒀다 —
 *   1. 자기소개 조건(need)에 맞는 문항만 남긴다
 *   2. 조건이 붙은 문항을 먼저 쓴다 (개인화가 눈에 보이게)
 *   3. 나머지는 시드 기반 무작위
 * v1의 챕터 할당량·미러쌍 강제 같은 건 아직 안 옮겼다.
 * 문항 내용이 확정되면 그때 필요한 규칙만 골라서 되살리는 게 낫다.
 */

export const BANKS: Record<BankId, Question[]> = {
  'ch1-me': ch1 as Question[],
  'ch2-pull': ch2 as Question[],
  'ch3-crush': ch3 as Question[],
  'ch4-some': ch4 as Question[],
  'ch5-ask': ch5 as Question[],
  'ch6-dating': ch6 as Question[],
  'ch7-after': ch7 as Question[],
  'pool-extra': extra as Question[],
};

export const ALL_QUESTIONS: Question[] = Object.values(BANKS).flat();

/** 자기소개 답변으로 이 문항을 낼 수 있는지 */
export function matches(q: Question, intro: IntroAnswers): boolean {
  const n = q.need;
  if (!n) return true;
  if (n.g && n.g !== intro.gender) return false;
  if (n.grade && !n.grade.includes(intro.grade)) return false;
  if (n.school && n.school !== intro.school) return false;
  if (n.exp && !n.exp.includes(intro.exp)) return false;
  if (n.status && !n.status.includes(intro.status)) return false;
  if (n.social && !n.social.includes(intro.social)) return false;
  return true;
}

/* 같은 자기소개 + 같은 시드면 같은 문항이 나오게 한다.
   결과를 다시 열거나 공유할 때 흔들리지 않아야 하므로 난수는 시드 고정. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function seedFrom(intro: IntroAnswers): number {
  const s = Object.keys(intro).sort().map(k => `${k}:${intro[k]}`).join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 장면들의 문항 자리를 실제 문항으로 채운다.
 * 같은 문항이 두 번 나오지 않게 전역으로 중복을 막는다.
 */
export function resolveScenes(
  scenes: Scene[],
  intro: IntroAnswers,
  seed = seedFrom(intro)
): ResolvedScene[] {
  const rnd = mulberry32(seed);
  const used = new Set<string>();

  /** 뱅크별로 미리 섞어두고 앞에서부터 꺼내 쓴다 */
  const queues = new Map<BankId, Question[]>();
  const queueFor = (bank: BankId): Question[] => {
    let q = queues.get(bank);
    if (!q) {
      const avail = (BANKS[bank] ?? []).filter(x => matches(x, intro));
      // 조건부 문항을 앞에 둬서 개인화가 실제로 드러나게 한다
      const targeted = shuffle(avail.filter(x => x.need), rnd);
      const general = shuffle(avail.filter(x => !x.need), rnd);
      q = [...targeted, ...general];
      queues.set(bank, q);
    }
    return q;
  };

  const take = (bank: BankId): Question | null => {
    const q = queueFor(bank);
    while (q.length) {
      const next = q.shift()!;
      if (!used.has(next.id)) {
        used.add(next.id);
        return next;
      }
    }
    // 뱅크가 말랐으면 여분 풀에서 메운다
    if (bank !== 'pool-extra') return take('pool-extra');
    return null;
  };

  return scenes.map(scene => ({
    id: scene.id,
    time: scene.time,
    place: scene.place,
    title: scene.title,
    art: scene.art,
    beats: scene.beats.flatMap(beat => {
      if (beat.kind !== 'question') {
        return [{ kind: beat.kind, text: (beat as any).text, speaker: (beat as any).speaker }];
      }
      // 특정 문항으로 고정한 자리
      if (beat.slot.id) {
        const fixed = ALL_QUESTIONS.find(x => x.id === beat.slot.id);
        if (fixed && !used.has(fixed.id)) {
          used.add(fixed.id);
          return [{ kind: 'question' as const, question: fixed }];
        }
      }
      const picked = take(beat.slot.from);
      // 채울 문항이 없으면 그 자리는 조용히 건너뛴다 (빈 화면보다 낫다)
      return picked ? [{ kind: 'question' as const, question: picked }] : [];
    }),
  }));
}

/** 진행률 표시용 — 실제로 출제된 문항 수 */
export function countQuestions(scenes: ResolvedScene[]): number {
  return scenes.reduce((n, s) => n + s.beats.filter(b => b.kind === 'question').length, 0);
}

/** 아직 답하지 않은 문항이 있는지 */
export function unanswered(scenes: ResolvedScene[], answers: Answers): number {
  let n = 0;
  for (const s of scenes) {
    for (const b of s.beats) {
      if (b.kind === 'question' && b.question && answers[b.question.id] == null) n++;
    }
  }
  return n;
}
