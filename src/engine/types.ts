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
  /** v1의 챕터 번호(1~7). 관계 단계를 뜻한다 (1 나 → 7 이별) */
  ch: number;
  /**
   * 이 문항을 어느 자리에서 물을 수 있는가.
   * 없으면 'any' 로 본다 — 뒤늦게 태그를 붙여도 기존 문항이 안 깨지게.
   */
  where?: Where;
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

/* ── 자리 (v2.1 신규) ─────────────────────────────────── */

/**
 * 이 문항이 성립하려면 어떤 자리에 있어야 하는가.
 *
 * 뱅크(ch1~ch7)가 "관계 단계"로 나눠져 있는 것과 별개의 축이다.
 * 뱅크만으로 장면을 채우면 하루 안에 연애 전체 아크가 들어가버려서
 * 17:40 하굣길에서 "사귄 지 한 달" 을 묻는 일이 생긴다.
 *
 * 'any' 가 기본값이고 실제로 대다수다 — "고백은 누가 하는 게 맞다고 봐?"
 * 같은 의견·경험형은 아침이든 밤이든 물어도 어색하지 않다.
 * 구체적인 상황을 그리는 문항만 자리를 지정한다.
 */
export type Where =
  /** 아무 데서나. 의견·성향·과거 경험을 묻는 문항 */
  | 'any'
  /** 내 방·침대. 혼자 있는 시간, 등교 준비, 잠들기 전 */
  | 'room'
  /** 오가는 길. 등하굣길·버스·편의점·우산 */
  | 'road'
  /** 교실. 수업·자습·쉬는 시간·짝꿍 */
  | 'class'
  /** 급식실·매점. 밥 먹는 자리 */
  | 'meal'
  /** 복도·사물함·계단. 스쳐 지나가는 자리 */
  | 'hall'
  /** 폰 안에서 벌어지는 일. 톡·DM·스토리·읽음 표시 */
  | 'phone';

export const WHERE_KEYS: Where[] =
  ['any', 'room', 'road', 'class', 'meal', 'hall', 'phone'];

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
 *
 * 아무것도 안 주면 그 장면의 accepts 에 맞는 문항 전체에서 고른다.
 * 문항 선택 규칙을 바꾸고 싶으면 engine/select.ts 만 고치면 된다.
 */
export interface QuestionSlot {
  /** 이 문항으로 고정한다 */
  id?: string;
  /**
   * 관계 단계를 이 뱅크로 제한한다.
   * 안 주면 단계를 안 가리고 장면에 맞는 것 중에서 고른다.
   */
  from?: BankId;
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
  /**
   * 이 장면에서 물어도 되는 자리 태그.
   * 'any' 를 빼면 그 장면은 장소 특정 문항만 받는다 (보통은 넣어둔다).
   * 장면에 맞는 문항을 바꾸고 싶으면 문항을 다시 태깅하는 대신 여기를 손보면 된다.
   */
  accepts: Where[];
  /**
   * 이 장면이 다루는 관계 단계 = 문항의 ch (1 나 → 7 이별).
   *
   * 뱅크 파일이 아니라 ch 로 거른다는 게 중요하다.
   * pool-extra 에도 ch 가 붙어 있어서, 이렇게 해야 그 안의 문항들이 같이 뽑힌다.
   * 여러 개를 적으면 섞어서 낸다.
   */
  stages: number[];
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
