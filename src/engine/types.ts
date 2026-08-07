/**
 * Crush Lab 코어 타입
 *
 * 여기 있는 모양은 v1에서 검증된 것들이라 그대로 가져왔다.
 * 반대로 "장면(Scene)"은 v2에서 새로 생긴 개념이다 —
 * v1은 문항을 무작위로 나열했지만 v2는 하루의 서사 위에 문항을 얹는다.
 */

/* ── 성향 축 ───────────────────────────────────────────── */
export type AxisKey = 'sp' | 'ex' | 'st' | 'iv';
export const AXIS_KEYS: AxisKey[] = ['sp', 'ex', 'st', 'iv'];

/** 유형 코드를 만들지는 않지만 결과지 문장을 고르는 데 쓰는 보조 축 */
export type SubAxisKey = 'conf' | 'pop' | 'peer';

export interface Axis {
  name: string;
  pos: string;
  neg: string;
  posLabel: string;
  negLabel: string;
  desc: string;
}

/* ── 문항 ─────────────────────────────────────────────── */
export interface Choice {
  /** 선택지 문구 */
  t: string;
  /** v1 아이콘 이름. v2 UI는 아직 안 쓰지만 데이터는 보존한다 */
  ic?: string;
  /** 축 점수 */
  s?: Partial<Record<AxisKey, number>>;
  /** 보조 축 점수 */
  s2?: Partial<Record<SubAxisKey, number>>;
  /** 결과지용 태그. 'trigger:humor' 같은 꼴 */
  k?: string[];
}

/** 자기소개 답변으로 출제 여부를 거르는 조건 */
export interface Need {
  g?: string;
  grade?: string[];
  school?: string;
  exp?: string[];
  status?: string[];
  social?: string[];
}

export interface Question {
  id: string;
  /** v1의 챕터 번호(1~7). v2에서는 장면 매핑의 힌트로만 쓴다 */
  ch: number;
  q: string;
  o: Choice[];
  need?: Need;
  /** 같은 태그를 가진 문항끼리 모순을 검사한다 */
  pair?: string;
  /** 이성친구 ↔ 좋아하는 사람 대조쌍 */
  mirror?: string;
  cf?: string;
}

/** 문항 뱅크 = src/data/questions/ 아래 파일 하나 */
export type BankId =
  | 'ch1-me' | 'ch2-pull' | 'ch3-crush' | 'ch4-some'
  | 'ch5-ask' | 'ch6-dating' | 'ch7-after' | 'pool-extra';

/* ── 자기소개 ─────────────────────────────────────────── */
export interface IntroOption { v: string; t: string; ic?: string }
export interface IntroQuestion { id: string; q: string; opts: IntroOption[] }
/** { gender:'f', grade:'2', ... } */
export type IntroAnswers = Record<string, string>;

/* ── 장면 (v2 신규) ───────────────────────────────────── */

/**
 * 배경 일러스트 자리.
 * 지금은 전부 자리표시자 SVG를 가리킨다. 제미나이로 실제 그림을 만들면
 * src만 갈아끼우면 되고, prompt는 그 생성에 쓸 지시문이다.
 */
export interface ArtSlot {
  src: string;
  alt: string;
  /** 이미지 생성용 지시문. docs/ART-MANIFEST.md 가 이 값에서 만들어진다 */
  prompt: string;
}

/**
 * 문항 자리.
 * id를 주면 그 문항으로 고정, 안 주면 뱅크에서 알고리즘이 고른다.
 * 문항 선택 규칙을 바꾸고 싶으면 engine/select.ts 만 고치면 된다.
 */
export interface QuestionSlot {
  from: BankId;
  id?: string;
}

export type Beat =
  /** 지문. 화자 없이 상황만 서술 */
  | { kind: 'narration'; text: string }
  /** 대사. 화자 이름이 붙는다 */
  | { kind: 'line'; speaker: string; text: string }
  /** 문항. 여기서 선택지가 뜬다 */
  | { kind: 'question'; slot: QuestionSlot };

export interface Scene {
  id: string;
  /** '07:10' — 하루의 흐름을 보여주는 표시용 */
  time: string;
  /** '내 방' */
  place: string;
  title: string;
  art: ArtSlot;
  beats: Beat[];
}

/* ── 진행 상태 ────────────────────────────────────────── */

/** 장면의 문항 자리를 실제 문항으로 채운 결과 */
export interface ResolvedBeat {
  kind: Beat['kind'];
  text?: string;
  speaker?: string;
  question?: Question;
}

export interface ResolvedScene {
  id: string;
  time: string;
  place: string;
  title: string;
  art: ArtSlot;
  beats: ResolvedBeat[];
}

/** 문항 id → 고른 선택지 인덱스 */
export type Answers = Record<string, number>;

/* ── 채점 결과 ────────────────────────────────────────── */
export type Strength = 'edge' | 'mild' | 'clear' | 'strong';

export interface ScoreResult {
  /** 'FDOA' 같은 4글자 */
  code: string;
  /** 축별 -1 ~ +1 */
  norm: Record<AxisKey, number>;
  norm2: Record<SubAxisKey, number>;
  strength: Record<AxisKey, Strength>;
  /** 태그 집계. sub.trigger.humor === 3 꼴 */
  sub: Record<string, Record<string, number>>;
  /** 답한 문항 수 */
  answered: number;
}

export interface CrystalType {
  name: string;
  gem: string;
  tag: string;
  en: string;
  mz: string;
  base: string;
  rim: string;
  dark: string;
  shape: string;
  face: string;
  why: string;
  sum: string;
}
