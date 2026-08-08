/** 부품 이미지 규격. tools/make-art-guide.mjs 가 생성한다 — 직접 고치지 말 것 */
export const CANVAS = { w: 1024, h: 1536 } as const;

/** 기준선 (캔버스 픽셀). 모든 부품이 이 위치를 지켜야 겹쳐진다 */
export const ANCHORS = {
  center: 512,
  crown: 210,
  eyes: 400,
  chin: 530,
  shoulder: 640,
  waist: 940,
  knee: 1230,
  feet: 1460,
} as const;
