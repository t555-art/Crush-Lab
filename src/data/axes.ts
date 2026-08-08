import type { Axis } from '../engine/types';

/**
 * 무엇을 재는가.
 *
 * ⚠️ 비어 있다. 채워야 검사가 결과를 낸다.
 *
 * 축 개수는 자유다. 2개여도 되고 6개여도 된다.
 * 다만 축이 늘수록 축당 문항 수가 필요해지고(대략 축당 6~8문항),
 * 결과 유형 수가 2^n으로 늘어난다는 점만 계산에 넣으면 된다.
 *
 * 예시 (지우고 새로 쓸 것):
 *
 *   { id: 'speed',   name: '속도', posLabel: '금사빠', negLabel: '늦사빠',
 *     desc: '호감이 생기는 문턱과 확신까지 걸리는 시간' },
 *   { id: 'express', name: '표현', posLabel: '직진',   negLabel: '우회',
 *     desc: '마음을 티 내는가 숨기는가' },
 */
export const AXES: Axis[] = [];
