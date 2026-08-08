import type { ChoiceQuestion } from '../engine/types';

/**
 * 시작 질문 — 응답자가 어떤 사람인지 알아보는 부분.
 *
 * ⚠️ 비어 있다.
 *
 * 본 검사와 성격이 다르다. 여기는 성향을 재는 게 아니라
 * **뒤에 쓸 정보를 모으는 곳**이다.
 *
 *   · 아바타를 그리는 재료      (traits 로 쌓인다)
 *   · 좋아하는 상대 묘사의 분기  (traits)
 *   · 어떤 문항을 낼지 거르는 조건 (show)
 *
 * 그래서 선택지마다 `traits` 를 붙인다. 축 점수(`score`)는 보통 없다.
 *
 * 답할 때마다 아바타가 한 겹씩 그려지는 연출이 붙을 자리다.
 * 문항 순서 = 아바타가 완성되는 순서이므로, 큰 것부터 물어보는 게 자연스럽다.
 * (성별 → 머리 → 분위기 → 성격 …)
 *
 * 예시 (지우고 새로 쓸 것):
 *
 *   {
 *     id: 'gender', kind: 'choice', text: '너는?',
 *     options: [
 *       { text: '남자', traits: { gender: 'm' } },
 *       { text: '여자', traits: { gender: 'f' } },
 *     ],
 *   },
 */
export const INTRO: ChoiceQuestion[] = [];
