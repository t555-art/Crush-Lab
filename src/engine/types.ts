/**
 * Crush Lab — 데이터 계약
 *
 * ⚠️ 여기 있는 모양은 전부 **제안이지 확정이 아니다.**
 *    문항을 설계하다가 안 맞으면 이 파일을 고쳐라. 코드가 데이터를 따라가야지
 *    데이터가 코드에 맞출 이유가 없다. (docs/HANDOFF.md 참고)
 *
 * 지금 담겨 있는 건 "이런 것들이 필요하다고 들었다" 수준의 뼈대다.
 *   · 선택지형 문항과 슬라이더형 문항
 *   · 답변이 쌓이면서 아바타가 구체화되는 구조
 *   · 좋아하는 상대의 묘사가 답변에 따라 갈라지는 구조
 *   · 조건부 출제
 */

/* ── 축 ────────────────────────────────────────────────
   몇 개를 둘지, 뭘 잴지 전부 자유다. 4개여야 할 이유는 없다. */

export type AxisId = string;

export interface Axis {
  id: AxisId;
  /** '속도' 같은 축 이름 */
  name: string;
  /** 양수 방향 라벨. '금사빠' */
  posLabel: string;
  /** 음수 방향 라벨. '늦사빠' */
  negLabel: string;
  /** 이 축이 무엇을 재는지 (결과지에 쓸 수도 있고 안 쓸 수도) */
  desc?: string;
}

/** 문항이 축에 주는 점수. { speed: 2, express: -1 } */
export type AxisScore = Record<AxisId, number>;

/* ── 특성 ──────────────────────────────────────────────
   답변이 쌓아 올리는 값들. 아바타 그림, 상대 묘사, 다음 문항 출제에 쓴다.
   키 이름은 자유. gender / confidence / school 처럼 쓰면 된다. */

export type Traits = Record<string, string>;

/**
 * 출제 조건.
 * { gender: 'f' }            → 여성 응답자에게만
 * { confidence: ['low','mid'] } → 둘 중 하나면
 * 여러 키를 쓰면 전부 만족해야 한다.
 */
export type Condition = Record<string, string | string[]>;

/* ── 문항 ────────────────────────────────────────────── */

interface QuestionBase {
  id: string;
  /** 화면에 뜨는 질문. 줄바꿈은 \n */
  text: string;
  /** 분류·검색용 자유 태그. 'morning', 'first-move' 등 */
  tags?: string[];
  /** 이 조건을 만족할 때만 출제 */
  show?: Condition;
}

/** 선택지를 고르는 문항 */
export interface ChoiceQuestion extends QuestionBase {
  kind: 'choice';
  options: Choice[];
}

export interface Choice {
  text: string;
  /** 축 점수 */
  score?: Partial<AxisScore>;
  /** 이 선택지를 고르면 붙는 특성 (아바타·분기에 쓰인다) */
  traits?: Traits;
}

/**
 * 슬라이더로 답하는 문항.
 * "매우 그렇다 ~ 전혀 아니다" 처럼 한 축을 따라 정도만 묻는 경우에 쓴다.
 * 선택지를 네 개 쓰는 것보다 화면이 짧고 답하기 빠르다.
 *
 * 채점: 응답 위치를 -1~+1로 환산해서 weight에 곱한다.
 * 가운데를 고르면 0점, 끝을 고르면 weight 전부.
 */
export interface ScaleQuestion extends QuestionBase {
  kind: 'scale';
  /** 왼쪽 끝 라벨. '전혀 아니야' */
  minLabel: string;
  /** 오른쪽 끝 라벨. '완전 그래' */
  maxLabel: string;
  /** 단계 수. 홀수면 가운데(중립)가 생긴다 */
  steps: number;
  /** 오른쪽 끝까지 갔을 때 각 축에 주는 점수 */
  weight: Partial<AxisScore>;
}

export type Question = ChoiceQuestion | ScaleQuestion;

/* ── 아바타 ────────────────────────────────────────────
   답할수록 응답자를 나타내는 그림이 구체화되는 연출.
   특성이 쌓이면 조건에 맞는 조각이 하나씩 켜진다. */

export interface AvatarLayer {
  id: string;
  /** 이 조건일 때 이 조각을 그린다. 비우면 항상 */
  when?: Condition;
  /** 이미지 경로 (또는 인라인 SVG 조각) */
  src: string;
  /** 겹치는 순서. 낮을수록 뒤 */
  z: number;
}

/* ── 그림 자리 ────────────────────────────────────────── */

export interface ArtSlot {
  /** 기본 그림 */
  src: string;
  alt: string;
  /**
   * 조건부 교체. 좋아하는 상대의 성별·특징에 따라 다른 그림을 쓸 때.
   * 위에서부터 검사해서 먼저 맞는 것을 쓴다.
   */
  variants?: { when: Condition; src: string }[];
  /** 이미지 생성용 지시문 */
  prompt?: string;
}

/* ── 장면 ──────────────────────────────────────────────
   문항을 서사 위에 얹는 단위. 장면을 안 쓰고 문항만 쭉 내도 된다. */

export type Beat =
  /** 지문 */
  | { kind: 'narration'; text: string }
  /** 대사 */
  | { kind: 'line'; speaker: string; text: string }
  /** 문항 자리. id를 주면 고정, 안 주면 select.ts가 고른다 */
  | { kind: 'question'; id?: string; pick?: Condition };

export interface Scene {
  id: string;
  title: string;
  /** 부제·시각·장소 등 화면 상단에 띄울 것 (자유) */
  label?: string;
  art?: ArtSlot;
  beats: Beat[];
}

/* ── 진행 상태 ────────────────────────────────────────── */

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
  art?: ArtSlot;
  beats: ResolvedBeat[];
}

/**
 * 응답.
 * 선택지형이면 고른 인덱스, 슬라이더형이면 단계 인덱스(0부터).
 */
export type Answers = Record<string, number>;

/* ── 채점 결과 ────────────────────────────────────────── */

export interface ScoreResult {
  /** 축별 -1 ~ +1 */
  norm: Record<AxisId, number>;
  /** 축별 확신도 */
  strength: Record<AxisId, Strength>;
  /** 답한 문항 수 */
  answered: number;
  /** 쌓인 특성 */
  traits: Traits;
}

export type Strength = 'edge' | 'mild' | 'clear' | 'strong';
