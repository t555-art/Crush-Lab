import type {
  Condition, Question, ResolvedScene, Scene, Traits,
} from './types';
import { QUESTIONS } from '../data/questions';

/**
 * 문항 고르기.
 *
 * ★ 뽑는 규칙을 바꾸고 싶으면 이 파일만 고치면 된다.
 *   문항(data/questions.ts)도 장면(data/scenes.ts)도 채점(score.ts)도 안 건드려도 된다.
 *
 * 지금 규칙은 일부러 최소한이다 — 조건에 맞는 것 중에서 순서대로 뽑는다.
 * 문항이 확정되면 그때 필요한 규칙(축 균형, 난이도 배분, 중복 주제 회피 등)을
 * 여기에 얹으면 된다.
 */

export { QUESTIONS };

/** 조건이 특성과 맞는지 */
export function matches(cond: Condition | undefined, traits: Traits): boolean {
  if (!cond) return true;
  for (const [key, want] of Object.entries(cond)) {
    // tags 는 문항의 태그 배열을 보는 특수 키
    if (key === 'tags') continue;
    const have = traits[key];
    if (have === undefined) return false;
    if (Array.isArray(want) ? !want.includes(have) : want !== have) return false;
  }
  return true;
}

/** 문항이 이 응답자에게 나갈 수 있는지 */
export function canAsk(q: Question, traits: Traits): boolean {
  return matches(q.show, traits);
}

/** pick 조건에 맞는 문항인지 (tags 는 문항 태그를 본다) */
function fitsPick(q: Question, pick: Condition | undefined, traits: Traits): boolean {
  if (!canAsk(q, traits)) return false;
  if (!pick) return true;
  const wantTags = pick.tags;
  if (wantTags) {
    const list = Array.isArray(wantTags) ? wantTags : [wantTags];
    if (!list.some(t => q.tags?.includes(t))) return false;
  }
  return true;
}

/* 같은 사람에게는 같은 문항이 나오게 시드를 고정한다.
   결과를 다시 열거나 공유할 때 흔들리면 안 된다. */
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

export function seedFrom(traits: Traits): number {
  const s = Object.keys(traits).sort().map(k => `${k}:${traits[k]}`).join('|');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * 장면의 문항 자리를 실제 문항으로 채운다.
 *
 * 장면이 하나도 없으면 조건에 맞는 문항을 순서대로 낸다.
 * 즉 서사가 없어도 검사는 돌아간다.
 */
export function resolve(
  scenes: Scene[],
  traits: Traits,
  seed = seedFrom(traits)
): ResolvedScene[] {
  const rnd = mulberry32(seed);
  const used = new Set<string>();
  const pool = shuffle(QUESTIONS.filter(q => canAsk(q, traits)), rnd);

  // 서사가 없으면 문항만 담은 장면 하나로 만든다
  if (!scenes.length) {
    return pool.length
      ? [{
          id: 'all', title: '',
          beats: pool.map(q => ({ kind: 'question' as const, question: q })),
        }]
      : [];
  }

  const take = (pick?: Condition): Question | null => {
    const found = pool.find(q => !used.has(q.id) && fitsPick(q, pick, traits));
    if (found) { used.add(found.id); return found; }
    return null;
  };

  return scenes.map(scene => ({
    id: scene.id,
    title: scene.title,
    label: scene.label,
    art: scene.art,
    beats: scene.beats.flatMap(beat => {
      if (beat.kind !== 'question') {
        return [{
          kind: beat.kind,
          text: (beat as { text?: string }).text,
          speaker: (beat as { speaker?: string }).speaker,
        }];
      }
      // 특정 문항으로 고정한 자리
      if (beat.id) {
        const fixed = QUESTIONS.find(q => q.id === beat.id);
        if (fixed && !used.has(fixed.id) && canAsk(fixed, traits)) {
          used.add(fixed.id);
          return [{ kind: 'question' as const, question: fixed }];
        }
      }
      const picked = take(beat.pick);
      // 채울 문항이 없으면 그 자리는 조용히 건너뛴다 (빈 화면보다 낫다)
      return picked ? [{ kind: 'question' as const, question: picked }] : [];
    }),
  }));
}

/** 실제로 출제된 문항들 */
export function askedQuestions(scenes: ResolvedScene[]): Question[] {
  const out: Question[] = [];
  for (const s of scenes) {
    for (const b of s.beats) if (b.kind === 'question' && b.question) out.push(b.question);
  }
  return out;
}
