import type { Question } from '../engine/types';

/**
 * 본 문항.
 *
 * ⚠️ 비어 있다. 오늘 여기를 채우는 게 목표다.
 *
 * 두 종류를 섞어 쓸 수 있다.
 *
 * 1) 선택지형 — 상황을 주고 행동을 고르게 한다
 *
 *    {
 *      id: 'q-001', kind: 'choice',
 *      text: '쉬는 시간 10분.\n걔가 혼자 앉아 있다.',
 *      tags: ['classroom'],
 *      options: [
 *        { text: '가서 말 건다',        score: { express: 3 } },
 *        { text: '지나가는 척 근처로',   score: { express: 1 } },
 *        { text: '그냥 본다',           score: { express: -2 } },
 *      ],
 *    }
 *
 * 2) 슬라이더형 — 정도만 물을 때. 화면이 짧고 답하기 빠르다
 *
 *    {
 *      id: 'q-002', kind: 'scale',
 *      text: '읽씹당하면 하루 종일 신경 쓰여',
 *      minLabel: '전혀', maxLabel: '완전',
 *      steps: 5,
 *      weight: { invest: 3 },
 *    }
 *
 *    steps 를 홀수로 두면 가운데(중립)가 생긴다.
 *    응답 위치를 -1~+1로 환산해 weight 를 곱한다.
 *
 * ── 조건부 출제 ──
 * `show` 를 붙이면 시작 질문에서 쌓인 특성에 맞는 사람에게만 나간다.
 *
 *    show: { gender: 'f' }
 *    show: { confidence: ['low', 'mid'] }
 *
 * ── 파일 나누기 ──
 * 문항이 많아지면 이 파일을 `questions/` 폴더로 쪼개고
 * 여기서 합쳐서 내보내면 된다. 지금은 한 파일로 시작한다.
 *
 * ── 손봤으면 ──
 * `npm run check:questions` 를 돌릴 것. id 중복·조건 충돌 등을 잡아준다.
 */
export const QUESTIONS: Question[] = [];
