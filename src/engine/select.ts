import type {
  AxisId, Question, QuestionPick, ResolvedScene, Scene, Traits,
} from './types';
import { QUESTIONS } from '../data/questions';
import { AXES } from '../data/axes';
import { SURVEY } from '../data/survey';
import { matches, composeCast } from './character';

/**
 * 출제기 — 누구에게 어떤 문항을 낼지 정한다.
 *
 * ★ 뽑는 규칙을 바꾸려면 이 파일만 고치면 된다.
 *   문항·장면·채점은 안 건드려도 된다.
 *
 * 지켜야 하는 것 세 가지:
 *
 *   1. 불가능한 상황은 안 낸다
 *      남고 다니는데 복도에서 좋아하는 애를 마주치는 문항은 존재할 수 없다.
 *      문항의 `show` 조건과 장면의 `when` 조건으로 거른다.
 *
 *   2. 역할(aspect)별로 고르게 낸다
 *      자신감만 20문항 묻고 적극성은 2문항이면 결과가 한쪽만 맞는다.
 *      역할별 최소치(SURVEY.minPerAspect)를 먼저 채우고 나머지를 무작위로 채운다.
 *
 *   3. 시간대에 맞게 낸다
 *      아침 장면에서 밤 이야기를 묻지 않는다.
 *      문항의 `slots` 와 장면의 `slot` 을 맞춘다.
 *
 * 세부 조율(비율·가중치)은 문항이 충분히 쌓인 뒤에 한다.
 */

export { QUESTIONS };

/* ── 조건 검사 ─────────────────────────────────────────── */

export function canAsk(q: Question, traits: Traits): boolean {
  return matches(q.show, traits);
}

/** 이 문항이 무슨 역할을 보는가. 안 적었으면 점수 주는 축에서 유추 */
export function aspectsOf(q: Question): string[] {
  if (q.aspect) return [q.aspect];
  const ids = new Set<AxisId>();
  if (q.kind === 'choice') {
    for (const o of q.options) for (const k of Object.keys(o.score ?? {})) ids.add(k);
  } else {
    for (const k of Object.keys(q.weight ?? {})) ids.add(k);
  }
  return [...ids];
}

/** 이 문항이 이 자리(시간대·역할·태그)에 맞는가 */
function fits(q: Question, pick: QuestionPick | undefined, sceneSlot: string | undefined): boolean {
  const slot = pick?.slot ?? sceneSlot;
  // 문항에 slots 가 있으면 그중 하나와 맞아야 한다. 없으면 아무 데나 쓸 수 있다
  if (slot && q.slots?.length && !q.slots.includes(slot)) return false;
  if (pick?.aspect && !aspectsOf(q).includes(pick.aspect)) return false;
  if (pick?.tags) {
    const want = Array.isArray(pick.tags) ? pick.tags : [pick.tags];
    if (!want.some(t => q.tags?.includes(t))) return false;
  }
  return true;
}

/* ── 시드 난수 ─────────────────────────────────────────
   같은 사람에게는 같은 문항이 나와야 한다.
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

/* ── 출제 ─────────────────────────────────────────────── */

/**
 * 이 사람에게 낼 문항을 고른다.
 *
 * 1) 조건에 맞는 것만 남긴다
 * 2) 역할별 최소치를 먼저 채운다 (모든 항목을 골고루 보기 위해)
 * 3) 남은 자리를 무작위로 채운다 (매번 같지 않게)
 */
export function pickForPerson(traits: Traits, limit: number, rnd: () => number): Question[] {
  const avail = shuffle(QUESTIONS.filter(q => canAsk(q, traits)), rnd);
  const chosen: Question[] = [];
  const taken = new Set<string>();
  const perAspect = new Map<string, number>();

  const add = (q: Question) => {
    if (taken.has(q.id) || chosen.length >= limit) return false;
    taken.add(q.id);
    chosen.push(q);
    for (const a of aspectsOf(q)) perAspect.set(a, (perAspect.get(a) ?? 0) + 1);
    return true;
  };

  // 2) 역할별 최소치 채우기
  const aspects = new Set<string>();
  for (const q of avail) for (const a of aspectsOf(q)) aspects.add(a);
  for (const a of aspects) {
    for (const q of avail) {
      if ((perAspect.get(a) ?? 0) >= SURVEY.minPerAspect) break;
      if (aspectsOf(q).includes(a)) add(q);
    }
  }

  // 3) 나머지 무작위
  for (const q of avail) add(q);

  return chosen;
}

/**
 * 장면의 문항 자리를 실제 문항으로 채운다.
 * 장면이 하나도 없으면 문항만 순서대로 낸다 — 서사 없이도 검사는 돌아간다.
 */
export function resolve(
  scenes: Scene[],
  traits: Traits,
  seed = seedFrom(traits)
): ResolvedScene[] {
  const rnd = mulberry32(seed);
  const budget = Math.min(SURVEY.storyTarget, SURVEY.maxTotal);
  const pool = pickForPerson(traits, budget, rnd);
  const used = new Set<string>();

  // 서사가 없으면 문항만 담은 장면 하나
  const usable = scenes.filter(s => matches(s.when, traits));
  if (!usable.length) {
    return pool.length
      ? [{
          id: 'all', title: '', cast: [],
          beats: pool.map(q => ({ kind: 'question' as const, question: q })),
        }]
      : [];
  }

  return usable.map(scene => {
    let inScene = 0;
    return {
      id: scene.id,
      title: scene.title,
      label: scene.label,
      background: scene.background,
      cast: composeCast(scene.cast, traits),
      beats: scene.beats.flatMap(beat => {
        if (beat.kind !== 'question') {
          return [{
            kind: beat.kind,
            text: (beat as { text?: string }).text,
            speaker: (beat as { speaker?: string }).speaker,
          }];
        }
        if (inScene >= SURVEY.maxPerScene) return [];

        // 특정 문항으로 고정한 자리
        if (beat.id) {
          const fixed = QUESTIONS.find(q => q.id === beat.id);
          if (fixed && !used.has(fixed.id) && canAsk(fixed, traits)) {
            used.add(fixed.id); inScene++;
            return [{ kind: 'question' as const, question: fixed }];
          }
        }
        const found = pool.find(q => !used.has(q.id) && fits(q, beat.pick, scene.slot));
        if (!found) return [];   // 채울 문항이 없으면 조용히 건너뛴다
        used.add(found.id); inScene++;
        return [{ kind: 'question' as const, question: found }];
      }),
    };
  });
}

/** 실제로 출제된 문항들 */
export function askedQuestions(scenes: ResolvedScene[]): Question[] {
  const out: Question[] = [];
  for (const s of scenes) {
    for (const b of s.beats) if (b.kind === 'question' && b.question) out.push(b.question);
  }
  return out;
}

/** 역할별로 몇 문항 나갔는지 */
export function aspectCounts(questions: Question[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const q of questions) for (const a of aspectsOf(q)) out[a] = (out[a] ?? 0) + 1;
  return out;
}

/** 정의된 역할 전체 (축 + 문항에 적힌 aspect) */
export function allAspects(): string[] {
  const s = new Set<string>(AXES.map(a => a.id));
  for (const q of QUESTIONS) for (const a of aspectsOf(q)) s.add(a);
  return [...s];
}

export { matches };
