import type { PartOption } from '../engine/types';

/**
 * 캐릭터 부품 카탈로그.
 *
 * ⚠️ 비어 있다. 그림이 생기면 채운다. (미술 = 친구 쪽 담당)
 *
 * ── 왜 부품으로 나누나 ──
 * 완성된 그림을 경우의 수만큼 그리면 감당이 안 된다.
 * 머리 4종 × 체형 3종 × 얼굴 4종 = 48가지인데, 부품으로 나누면 그림은 11장이면 된다.
 * 상대 캐릭터까지 생각하면 차이가 더 벌어진다.
 *
 * ── 슬롯 ──
 * 슬롯 하나당 부품 하나가 선택된다. 이름은 자유지만 대략 이런 식이다.
 *   body     체형
 *   uniform  교복
 *   hair     머리
 *   face     얼굴(표정)
 *   extra    안경·액세서리 등
 *
 * ── 고르는 순서 ──
 *   1. 사용자가 직접 고른 것        `self.hair` = 부품 id
 *   2. 조건(when)이 맞는 것 중 마지막 것
 *   3. 조건이 없는 것 (기본값)
 *
 * ── 자기 캐릭터 / 상대 캐릭터 ──
 * `for` 로 나눈다. 안 적으면 둘 다 쓴다.
 * 상대의 특성은 `crush.` 를 뗀 뒤 비교되므로 when 에는 `gender` 라고만 쓰면 된다.
 *
 * ── 그림 준비할 때 ──
 * 모든 부품이 **같은 캔버스 크기, 같은 기준점**으로 그려져야 겹쳤을 때 안 어긋난다.
 * 권장: 세로형 WebP(또는 SVG), 배경 투명.
 *
 * ── 예시 (지우고 새로 쓸 것) ──
 *
 *   { id:'body-slim', slot:'body', z:0, src:'/art/parts/body-slim.webp',
 *     label:'마른 편', when:{ build:'slim' } },
 *   { id:'body-mid',  slot:'body', z:0, src:'/art/parts/body-mid.webp',
 *     label:'보통' },                                    // 조건 없음 = 기본값
 *   { id:'hair-long', slot:'hair', z:3, src:'/art/parts/hair-long.webp',
 *     label:'긴 머리', when:{ hair:'long' } },
 *   { id:'face-shy',  slot:'face', z:4, src:'/art/parts/face-shy.webp',
 *     label:'수줍음',  when:{ conf:'low' }, for:'self' },
 */
export const PARTS: PartOption[] = [];
