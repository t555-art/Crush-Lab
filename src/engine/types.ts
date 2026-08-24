/**
 * Crush Lab — 데이터 계약
 *
 * ⚠️ 여기 있는 모양은 **제안이지 확정이 아니다.**
 *    문항을 설계하다가 안 맞으면 고쳐라. 코드가 데이터를 따라가야 한다.
 *
 * ── 역할 분담 ──────────────────────────────────────────
 *   내용·미술 (문항, 스토리, 결과 텍스트, 그림)  → 친구 쪽
 *   기능      (이 파일, 엔진, 화면, 알고리즘)     → 코드 쪽
 *   상대 담당인 일은 직접 하지 말고 요청할 것. docs/HANDOFF.md 참고.
 */

/* ══ 축 ══════════════════════════════════════════════════
   무엇을 재는가. 개수 자유. */

export type AxisId = string;

export interface Axis {
  id: AxisId;
  name: string;
  posLabel: string;
  negLabel: string;
  desc?: string;
  /**
   * 유형 코드에 쓸 한 글자. 공유 링크와 결과 주소가 이걸로 만들어진다.
   * 안 적으면 id 첫 글자를 대문자로 쓴다. 축끼리 겹치지 않게 할 것.
   */
  posCode?: string;
  negCode?: string;
}

export type AxisScore = Record<AxisId, number>;

/* ══ 특성 ════════════════════════════════════════════════
   답변이 쌓아 올리는 값. 세 곳에 쓰인다.
     1. 아바타·상대 캐릭터의 부품 선택
     2. 어떤 문항을 낼지 거르는 조건
     3. 어떤 장면을 보여줄지

   키 이름은 자유다. 다만 상대 캐릭터에 관한 것은 `crush.` 를 앞에 붙인다.
     { gender: 'f', 'crush.gender': 'm' }
   그래야 같은 부품 시스템으로 두 인물을 따로 조립할 수 있다.

   사용자가 아바타를 직접 고친 경우 `self.<슬롯>` 으로 저장된다.
     { 'self.hair': 'hair-long' }   ← 자동 선택보다 우선한다 */

export type Traits = Record<string, string>;

/**
 * 조건.
 *   { gender: 'f' }                  여성 응답자에게만
 *   { school: ['co', 'girls'] }      둘 중 하나면
 *   여러 키를 쓰면 전부 만족해야 한다.
 *
 * 값 앞에 `!` 를 붙이면 부정이다.
 *   { school: '!boys' }              남고가 아닐 때만
 */
export type Condition = Record<string, string | string[]>;

/* ══ 문항 ════════════════════════════════════════════════ */

interface QuestionBase {
  id: string;
  /** 화면에 뜨는 질문. 줄바꿈은 \n */
  text: string;

  /**
   * 역할 — 이 문항이 무엇을 보는지.
   * 출제할 때 역할별로 고르게 나가도록 하는 데 쓴다.
   * 비워두면 점수를 주는 축에서 자동으로 유추한다.
   * 예: 'confidence', 'initiative'
   */
  aspect?: string;

  /**
   * 어느 시간대·장면에 어울리는가.
   * 출제기가 이 값을 보고 그 장면에 맞는 문항만 고른다.
   * 예: ['morning', 'classroom']
   */
  slots?: string[];

  /** 분류·검색용 자유 태그. 장면 배치(`pick.tags`)와 일러스트 표시('art')에 쓴다 */
  tags?: string[];

  /**
   * 모순 탐지용 묶음 이름.
   *
   * 같은 것을 **반대 방향으로 묻는 문항**끼리 같은 이름을 준다.
   *   "먼저 연락 안 하는 편이야"        pair: 'reach-out'
   *   "답장 30분 없으면 신경 쓰인다"     pair: 'reach-out'
   *
   * 답이 서로 어긋나면 결과지에서 그걸 짚어준다 —
   * "안 하는 게 아니라 못 하는 거야" 같은 문장이 여기서 나온다.
   * 유형 판정에는 영향을 주지 않는다.
   */
  pair?: string;

  /**
   * 출제 조건. 이게 필터링의 핵심이다.
   * 남고 다니는데 복도에서 좋아하는 애를 마주치는 상황은 존재할 수 없다 —
   * 그런 문항에 `show: { school: '!boys' }` 를 걸어두면 안 나간다.
   */
  show?: Condition;
}

/** 선택지를 고르는 문항 */
export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice';
  options: Choice[];
}

export interface Choice {
  text: string;
  score?: Partial<AxisScore>;
  /** 이 선택지를 고르면 붙는 특성 */
  traits?: Traits;
  /**
   * 하위 지표 태그. 고른 선택지의 것만 집계된다.
   *
   * 축으로 만들기엔 다른 축과 상관이 높지만 결과 서술에는 쓰고 싶은 것들을 여기 담는다.
   *   'mga'        이성 앞 불안 (단성학교 이용자에게 특히 의미 있음)
   *   'reject'     거절민감성
   *   'ludus'      가볍게 즐기는 쪽
   * 유형 판정에는 안 들어간다 — 넣으면 축끼리 상관이 생겨 유형 공간이 접힌다.
   */
  tags?: string[];
}

/**
 * 슬라이더로 답하는 문항.
 * "매우 그렇다 ~ 전혀 아니다" 류. 선택지 네 개보다 화면이 짧고 빠르다.
 * 응답 위치를 -1~+1로 환산해 weight 를 곱한다.
 */
export interface ScaleQuestion extends QuestionBase {
  kind: 'scale';
  minLabel: string;
  maxLabel: string;
  /** 단계 수. 홀수면 가운데(중립)가 생긴다 */
  steps: number;
  weight: Partial<AxisScore>;
}

export type Question = ChoiceQuestion | ScaleQuestion;

/* ══ 캐릭터 조립 ══════════════════════════════════════════
   완성된 그림 한 장을 넣는 게 아니라, 부품을 겹쳐서 만든다.
   응답자 아바타와 스토리 속 상대가 **같은 시스템**을 쓴다.

   슬롯(slot) = 부품 자리. 'body' | 'hair' | 'face' | 'uniform' …
   슬롯마다 조건에 맞는 부품이 하나씩 선택되어 z 순서로 겹쳐진다. */

export interface PartOption {
  id: string;
  /** 부품 자리 */
  slot: string;
  src: string;
  /** 겹치는 순서. 낮을수록 뒤 */
  z: number;
  /** 이 조건일 때 자동 선택 (없으면 그 슬롯의 기본값) */
  when?: Condition;
  /** 직접 고르는 화면에 뜨는 이름 */
  label?: string;
  /** 누구에게 쓰는 부품인가 */
  for?: 'self' | 'crush' | 'both';
}

/** 조립된 결과 — 그릴 준비가 된 상태 */
export interface ComposedCharacter {
  who: CastRole;
  layers: { id: string; slot: string; src: string; z: number }[];
}

export type CastRole = 'self' | 'crush' | string;

/* ══ 장면 ════════════════════════════════════════════════ */

export interface ArtSlot {
  src: string;
  alt: string;
  /** 조건부 교체. 위에서부터 먼저 맞는 것을 쓴다 */
  variants?: { when: Condition; src: string }[];
  /** 이미지 생성용 지시문 */
  prompt?: string;
}

/** 장면에 세워지는 인물 */
export interface CastMember {
  who: CastRole;
  /** 화면 내 위치 (%) — 0~100 */
  x: number;
  y: number;
  /** 크기 배율. 1이 기본 */
  scale?: number;
  /** 좌우 반전 */
  flip?: boolean;
  /** 이 조건일 때만 등장 */
  when?: Condition;
}

export type Beat =
  /** 지문 */
  | { kind: 'narration'; text: string }
  /** 대사 */
  | { kind: 'line'; speaker: string; text: string }
  /** 문항 자리 */
  | { kind: 'question'; id?: string; pick?: QuestionPick };

/** 이 자리에 어떤 문항을 넣을지 */
export interface QuestionPick {
  /** 이 시간대·장면 태그를 가진 문항 중에서 */
  slot?: string;
  /** 이 역할을 보는 문항 중에서 */
  aspect?: string;
  /** 추가 조건 */
  tags?: string | string[];
}

export interface Scene {
  id: string;
  title: string;
  /** 화면 상단에 띄울 것. 시각·장소 등 자유 */
  label?: string;
  /** 이 장면의 시간대 태그. 문항 고를 때 기본값으로 쓰인다 */
  slot?: string;
  /** 이 조건일 때만 이 장면이 나온다 (남고면 특정 장면 통째로 제외 등) */
  when?: Condition;
  background?: ArtSlot;
  /** 이 장면에 서 있는 인물들 */
  cast?: CastMember[];
  beats: Beat[];
}

/* ══ 진행 상태 ════════════════════════════════════════════ */

export interface ResolvedBeat {
  kind: Beat['kind'];
  text?: string;
  speaker?: string;
  question?: Question;
}

export interface ResolvedScene {
  id: string;
  title: string;
  label?: string;
  background?: ArtSlot;
  cast: ComposedCast[];
  beats: ResolvedBeat[];
}

export interface ComposedCast extends Omit<CastMember, 'when'> {
  character: ComposedCharacter;
}

/**
 * 응답.
 * 선택지형이면 고른 인덱스, 슬라이더형이면 단계 인덱스(0부터).
 */
export type Answers = Record<string, number>;

/* ══ 1차 유형 ════════════════════════════════════════════
   축 전부를 부호로 이어붙이면 2^n 가지가 나오는데, 그건 조합일 뿐이라
   유형마다 의미가 없다 (MBTI 가 딱 그 수준이다).

   대신 **축 두 개로 사분면을 만들어 1차 유형**을 잡고,
   나머지 축은 "그게 어떻게 드러나는가" 로 쓴다.
   같은 1차 유형이어도 나머지 축에 따라 완전히 다른 사람이 된다.

   어떤 축으로 사분면을 만들지는 data/styles.ts 에서 정한다 — 내용 쪽 결정이다. */

export interface StyleDef {
  id: string;
  /** '몰입형' */
  name: string;
  /** 한 줄 요약 */
  tag: string;
  desc?: string;
  /**
   * 이 유형이 되는 부호 조합.
   *   { anxiety: '+', avoid: '-' }   불안 높고 회피 낮으면 이 유형
   * 여기 적힌 축이 전부 맞아야 한다.
   */
  when: Record<AxisId, '+' | '-'>;
}

/* ══ 모순 ════════════════════════════════════════════════ */

/** 같은 `pair` 를 가진 문항들 사이에서 답이 어긋난 것 */
export interface Conflict {
  pair: string;
  axis: AxisId;
  /** 어긋난 정도 0~2. 클수록 대놓고 모순 */
  gap: number;
  items: {
    id: string;
    /** 문항 본문 */
    text: string;
    /** 고른 선택지 (슬라이더면 단계 설명) */
    pick: string;
    /** 그 문항 안에서의 응답 위치 -1~+1 */
    pos: number;
  }[];
}

/* ══ 채점 결과 ════════════════════════════════════════════ */

export type Strength = 'edge' | 'mild' | 'clear' | 'strong';

export interface ScoreResult {
  norm: Record<AxisId, number>;
  strength: Record<AxisId, Strength>;
  answered: number;
  traits: Traits;
  /** 역할별로 몇 문항씩 물었는지 — 결과 신뢰도를 보여줄 때 쓴다 */
  perAspect: Record<string, number>;

  /** 유형 코드. 축 부호를 이어붙인 것 — 공유 링크·결과 주소에 쓴다 */
  code: string;
  /** 1차 유형. data/styles.ts 가 비어 있으면 null */
  style: StyleDef | null;
  /** 하위 지표 집계. 고른 선택지의 tags 를 센 것 */
  tags: Record<string, number>;
  /** 서로 어긋난 답변. 결과지의 "솔직히 말하면" 에 쓴다 */
  conflicts: Conflict[];
}
