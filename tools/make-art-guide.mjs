/**
 * 부품 정렬 가이드를 만든다.
 *
 * 이걸 ChatGPT에 참조 이미지로 같이 주면, 생성되는 부품들이
 * 전부 같은 위치·같은 비율로 나온다. 그래야 겹쳤을 때 안 어긋난다.
 *
 * 실행: npm run art:guide
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* AI 이미지 생성의 세로 기본 규격에 맞춘다 (1024×1536 = 2:3) */
export const CANVAS = { w: 1024, h: 1536 };

/** 기준선. 모든 부품이 이 위치를 지켜야 겹쳐진다 */
export const ANCHORS = {
  center: 512,   // 몸 중심선 (좌우 가운데)
  crown: 210,    // 정수리
  eyes: 400,     // 눈높이
  chin: 530,     // 턱끝
  shoulder: 640, // 어깨
  waist: 940,    // 허리
  knee: 1230,    // 무릎
  feet: 1460,    // 발바닥
};

const A = ANCHORS;
const line = (y, label) =>
  `<line x1="0" y1="${y}" x2="${CANVAS.w}" y2="${y}" stroke="#FF2D78" stroke-width="3" stroke-dasharray="14 10"/>
   <text x="18" y="${y - 14}" font-family="sans-serif" font-size="34" fill="#FF2D78" font-weight="700">${label} ${y}</text>`;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.w}" height="${CANVAS.h}" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}">
  <rect width="${CANVAS.w}" height="${CANVAS.h}" fill="#FFFFFF"/>

  <!-- 체크무늬: 투명해야 할 영역 표시 -->
  <defs>
    <pattern id="ck" width="64" height="64" patternUnits="userSpaceOnUse">
      <rect width="64" height="64" fill="#F2F0F4"/>
      <rect width="32" height="32" fill="#E4E0E9"/>
      <rect x="32" y="32" width="32" height="32" fill="#E4E0E9"/>
    </pattern>
  </defs>
  <rect width="${CANVAS.w}" height="${CANVAS.h}" fill="url(#ck)"/>

  <!-- 중심선 -->
  <line x1="${A.center}" y1="0" x2="${A.center}" y2="${CANVAS.h}"
        stroke="#2D7DFF" stroke-width="3" stroke-dasharray="14 10"/>
  <text x="${A.center + 14}" y="40" font-family="sans-serif" font-size="34"
        fill="#2D7DFF" font-weight="700">중심선 ${A.center}</text>

  <!-- 기준 가로선 -->
  ${line(A.crown, '정수리')}
  ${line(A.eyes, '눈높이')}
  ${line(A.chin, '턱끝')}
  ${line(A.shoulder, '어깨')}
  ${line(A.waist, '허리')}
  ${line(A.knee, '무릎')}
  ${line(A.feet, '발바닥')}

  <!-- 실루엣 참고 -->
  <g fill="none" stroke="#1B1620" stroke-width="5" opacity=".5">
    <ellipse cx="${A.center}" cy="${(A.crown + A.chin) / 2}"
             rx="150" ry="${(A.chin - A.crown) / 2}"/>
    <path d="M${A.center - 55} ${A.chin} L${A.center - 55} ${A.shoulder}
             M${A.center + 55} ${A.chin} L${A.center + 55} ${A.shoulder}"/>
    <path d="M${A.center - 190} ${A.shoulder} Q${A.center} ${A.shoulder - 40} ${A.center + 190} ${A.shoulder}
             L${A.center + 165} ${A.waist} L${A.center - 165} ${A.waist} Z"/>
    <path d="M${A.center - 150} ${A.waist} L${A.center - 130} ${A.knee} L${A.center - 120} ${A.feet}
             M${A.center + 150} ${A.waist} L${A.center + 130} ${A.knee} L${A.center + 120} ${A.feet}"/>
  </g>

  <text x="${A.center}" y="${CANVAS.h - 40}" text-anchor="middle"
        font-family="sans-serif" font-size="30" fill="#6B6478">
    Crush Lab 부품 정렬 가이드 · ${CANVAS.w}×${CANVAS.h}
  </text>
</svg>
`;

mkdirSync(resolve(root, 'public/art'), { recursive: true });
writeFileSync(resolve(root, 'public/art/_guide.svg'), svg, 'utf8');

/* 규격을 코드에서도 읽을 수 있게 내보낸다 */
writeFileSync(resolve(root, 'src/data/art-spec.ts'),
`/** 부품 이미지 규격. tools/make-art-guide.mjs 가 생성한다 — 직접 고치지 말 것 */
export const CANVAS = { w: ${CANVAS.w}, h: ${CANVAS.h} } as const;

/** 기준선 (캔버스 픽셀). 모든 부품이 이 위치를 지켜야 겹쳐진다 */
export const ANCHORS = {
${Object.entries(ANCHORS).map(([k, v]) => `  ${k}: ${v},`).join('\n')}
} as const;
`, 'utf8');

console.log(`정렬 가이드 생성: public/art/_guide.svg (${CANVAS.w}×${CANVAS.h})`);
console.log('규격 파일 생성: src/data/art-spec.ts');
