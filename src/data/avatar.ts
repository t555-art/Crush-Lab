import type { AvatarLayer } from '../engine/types';

/**
 * 아바타 — 응답자를 나타내는 그림.
 *
 * ⚠️ 비어 있다. 그림이 있어야 켜진다.
 *
 * 시작 질문에 답할 때마다 특성(traits)이 쌓이고,
 * 그 조건에 맞는 조각이 하나씩 켜지면서 아바타가 구체화된다.
 * "답할수록 내가 그려진다"는 연출이 여기서 나온다.
 *
 * ── 모양 ──
 *
 *   { id: 'body',      z: 0, src: '/art/avatar/body.svg' },              // 항상
 *   { id: 'hair-long', z: 2, src: '/art/avatar/hair-long.svg',
 *     when: { hairLength: 'long' } },
 *   { id: 'face-shy',  z: 3, src: '/art/avatar/face-shy.svg',
 *     when: { confidence: 'low' } },
 *
 * z 가 낮을수록 뒤에 깔린다. 조건(when)이 없으면 항상 그려진다.
 *
 * ── 그림 준비할 때 ──
 * 조각들이 같은 캔버스 크기·같은 기준점으로 그려져야 겹쳤을 때 안 어긋난다.
 * 조각 하나당 파일 하나이고, 조합 수만큼 그릴 필요는 없다.
 * (머리 3종 × 표정 3종 = 그림 6장이면 9가지 아바타가 나온다)
 */
export const AVATAR_LAYERS: AvatarLayer[] = [];
