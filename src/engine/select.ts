import {
  AXIS_KEYS,
  type Answers, type AxisKey, type BankId, type IntroAnswers,
  type Question, type ResolvedScene, type Scene, type Where,
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
 * ── 두 축으로 거른다 ────────────────────────────────────
 *
 * 예전에는 "이 장면은 이 뱅크에서" 로 못박혀 있었다. 뱅크는 관계 단계라서
 * 시간대와 축이 달랐고, 그 결과 하굣길에서 "사귄 지 한 달" 을 묻고
 * 아침 침대에서 "급식 줄에서" 를 물었다. 그래서 축을 분리했다.
 *
 *   자리(where)  ← 하드 필터. 장면의 accepts 에 없는 자리의 문항은 절대 안 나온다.
 *   단계(ch)     ← 장면의 stages 와 맞는 것을 먼저 쓴다. 모자라면 완화한다.
 *
 * 자리를 하드로 두는 이유: 급식실 문항이 새벽 침대에 뜨는 건 바로 눈에 띈다.
 * 단계를 소프트로 두는 이유: 하드로 걸면 특정 자기소개 조합에서 문항이 말라
 * 검사 길이가 사람마다 달라진다 (그러면 채점이 흔들린다).
 *
 * ── 우선순위 4층 ────────────────────────────────────────
 *   1. 자리 특정 + 단계 일치   그 장면을 위해 쓰인 것 같은 문항
 *   2. 단계 일치 (자리 any)    맥락은 맞고 자리는 안 타는 문항
 *   3. 자리 특정 + 단계 불일치  자리는 맞는데 단계가 어긋남
 *   4. 나머지                  자리가 빌 바에는 이거라도
 * 각 층 안에서는 need(자기소개 조건)가 붙은 문항을 먼저 쓴다 — 개인화가 보이게.
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

/** 문항의 자리. 태그가 없으면 아무 데서나 물어도 되는 것으로 본다 */
export const whereOf = (q: Question): Where => q.where ?? 'any';

/** 이 장면에서 이 문항을 물어도 되는가 (하드 필터) */
export function fitsPlace(q: Question, scene: Scene): boolean {
  const w = whereOf(q);
  return w === 'any' || scene.accepts.includes(w);
}

/**
 * 이 문항이 그 축을 실제로 재는가.
 * 선택지끼리 점수가 갈려야 잰다고 본다 — 전부 같은 값이면 뭘 골라도 결과가 같다.
 */
export function measures(q: Question, k: AxisKey): boolean {
  let lo = Infinity, hi = -Infinity;
  for (const o of q.o) {
    const v = o.s?.[k] ?? 0;
    if (v < lo) lo = v;
    if (v > hi) hi = v;
  }
  return lo !== hi;
}

/**
 * 축당 최소 몇 문항이 재고 있어야 하는가.
 *
 * 이 하한을 깨면 score.ts 의 normalize 에서 room<=0 이 되어 그 축이 0으로 눌리고,
 * 유형 코드의 그 자리가 사실상 동전 던지기가 된다.
 * 자리(where) 필터를 세게 걸수록 위험해진다 —
 * 예를 들어 phone 태그 문항은 sp(속도)를 14%밖에 안 잰다.
 */
const MIN_PER_AXIS = 8;

/**
 * 한 장면이 장소 특정 문항으로만 채워지는 걸 막는 상한.
 *
 * 자리가 맞는 문항을 무조건 앞에 세우면, 태그를 많이 가진 자리가 장면을 독점한다.
 * (phone 태그가 22개라 밤 장면 5칸이 전부 "읽씹·스토리" 로 채워졌었다)
 * 장면 맛은 두세 개면 충분히 나고, 나머지는 폭이 넓은 편이 낫다.
 */
const PLACE_CAP = 3;

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

  /* 자기소개 조건을 통과한 문항. 장면마다 다시 거를 필요가 없으니 한 번만 계산한다 */
  const pool = ALL_QUESTIONS.filter(x => matches(x, intro));

  /** 장면별로 우선순위대로 줄을 세워두고 앞에서부터 꺼내 쓴다 */
  const queues = new Map<string, Question[]>();
  const queueFor = (scene: Scene, bank?: BankId): Question[] => {
    const key = scene.id + (bank ? '/' + bank : '');
    let q = queues.get(key);
    if (!q) {
      let avail = pool.filter(x => fitsPlace(x, scene));
      // slot.from 으로 단계를 못박은 자리는 그 뱅크 안에서만 고른다
      if (bank) {
        const ids = new Set((BANKS[bank] ?? []).map(x => x.id));
        avail = avail.filter(x => ids.has(x.id));
      }

      const staged = (x: Question) => scene.stages.includes(x.ch);
      const placed = (x: Question) => whereOf(x) !== 'any';

      // 같은 층 안에서는 need 붙은 것을 앞에 — 개인화가 실제로 드러나게 한다
      const tier = (rows: Question[]) => [
        ...shuffle(rows.filter(x => x.need), rnd),
        ...shuffle(rows.filter(x => !x.need), rnd),
      ];

      // 자리가 딱 맞는 문항은 앞에 세우되 PLACE_CAP 개까지만.
      // 넘치는 건 뒤로 미뤄서, 장면이 한 태그로 도배되지 않게 한다.
      const spot = tier(avail.filter(x => placed(x) && staged(x)));
      q = [
        ...spot.slice(0, PLACE_CAP),
        ...tier(avail.filter(x => !placed(x) && staged(x))),
        ...spot.slice(PLACE_CAP),
        ...tier(avail.filter(x => placed(x) && !staged(x))),
        ...tier(avail.filter(x => !placed(x) && !staged(x))),
      ];
      queues.set(key, q);
    }
    return q;
  };

  const take = (scene: Scene, bank?: BankId): Question | null => {
    const q = queueFor(scene, bank);
    while (q.length) {
      const next = q.shift()!;
      if (!used.has(next.id)) {
        used.add(next.id);
        return next;
      }
    }
    // 뱅크를 못박은 자리가 말랐으면 장면 전체 후보로 넓혀서 다시 시도한다
    return bank ? take(scene) : null;
  };

  /* ── 1차: 자리·단계 우선순위대로 채운다 ────────────────
     여기까지는 몰입도(장면과 문항이 맞는지)만 본다. */
  type Filled = { scene: Scene; question: Question; pinned: boolean };
  const filled: Filled[] = [];

  const out = scenes.map(scene => ({
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
          const slot = { kind: 'question' as const, question: fixed };
          filled.push({ scene, question: fixed, pinned: true });
          return [slot];
        }
      }
      const picked = take(scene, beat.slot.from);
      // 채울 문항이 없으면 그 자리는 조용히 건너뛴다 (빈 화면보다 낫다)
      if (!picked) return [];
      const slot = { kind: 'question' as const, question: picked };
      filled.push({ scene, question: picked, pinned: false });
      return [slot];
    }),
  }));

  /* ── 2차: 모자란 축만 메운다 ───────────────────────────
     1차는 자리를 맞추는 데만 신경 써서, 특정 축을 아무도 안 재는 세트가 나올 수 있다.
     (아침·교실·밤이 phone/room 문항으로 채워지면 sp 를 재는 문항이 거의 안 남는다)

     그래서 여기서는 하한에 못 미친 축이 있을 때만, 그 축을 안 재는 문항 하나를
     같은 장면의 다른 후보(자리 조건은 그대로 지킨다)로 바꿔 끼운다.
     하한을 넘겼으면 아무것도 안 한다 — 몰입도를 괜히 깎지 않는다. */
  const count = (k: AxisKey) => filled.reduce((n, f) => n + (measures(f.question, k) ? 1 : 0), 0);

  for (const k of AXIS_KEYS) {
    let guard = 40;   // 후보가 없으면 못 채운다. 무한루프만 막는다
    while (count(k) < MIN_PER_AXIS && guard-- > 0) {
      // 바꿔도 손해가 제일 적은 자리를 고른다.
      // = 그 축을 안 재면서, 다른 모자란 축도 안 재는 문항
      const lacking = AXIS_KEYS.filter(a => count(a) < MIN_PER_AXIS);
      let victim: Filled | null = null, victimCost = Infinity, swap: Question | null = null;

      for (const f of filled) {
        if (f.pinned || measures(f.question, k)) continue;
        const cost = lacking.filter(a => measures(f.question, a)).length;
        if (cost >= victimCost) continue;

        // 같은 장면에서, 자리 조건을 지키면서 그 축을 재는 미사용 후보
        const cand = queueFor(f.scene).find(x => !used.has(x.id) && measures(x, k));
        if (!cand) continue;

        victim = f; victimCost = cost; swap = cand;
      }
      if (!victim || !swap) break;

      // 실제 교체 — out 안의 해당 문항을 갈아끼운다
      for (const s of out) {
        for (const b of s.beats) {
          if (b.kind === 'question' && b.question === victim.question) b.question = swap;
        }
      }
      used.delete(victim.question.id);
      used.add(swap.id);
      victim.question = swap;
    }
  }

  return out;
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
