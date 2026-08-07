/**
 * 일러스트 자리표시자 SVG와 docs/ART-MANIFEST.md 를 만든다.
 *
 * 실제 그림은 제미나이로 생성해서 아래 경로에 같은 이름으로 덮어쓰면 된다.
 * 코드는 아무것도 안 고쳐도 된다 (확장자를 바꿀 때만 scenes.ts의 src 수정).
 *
 * 실행: node tools/make-art-placeholders.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* scenes.ts 를 그대로 import 하면 TS라 못 읽으니, 필요한 값만 정규식으로 뽑는다.
   장면이 추가되면 이 스크립트를 다시 돌리면 된다. */
const src = await import('node:fs').then(m =>
  m.readFileSync(resolve(root, 'src/data/scenes.ts'), 'utf8'));

const scenes = [...src.matchAll(
  /id:\s*'([^']+)',\s*\n\s*time:\s*'([^']+)',\s*\n\s*place:\s*'([^']+)',\s*\n\s*title:\s*'([^']+)',\s*\n\s*art:\s*\{\s*\n\s*src:\s*'([^']+)',\s*\n\s*alt:\s*'([^']+)',\s*\n\s*prompt:\s*'([^']+)'/g
)].map(m => ({
  id: m[1], time: m[2], place: m[3], title: m[4],
  src: m[5], alt: m[6], prompt: m[7],
}));

const styleMatch = src.match(/export const ART_STYLE =\s*([\s\S]*?);\n/);
const ART_STYLE = styleMatch
  ? styleMatch[1].split('\n').map(l => l.trim().replace(/^'|'\s*\+?$|'$/g, '')).join('')
  : '';

if (!scenes.length) {
  console.error('장면을 못 읽었다. scenes.ts 형식이 바뀌었는지 확인할 것.');
  process.exit(1);
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

/** 여러 줄로 접어서 SVG text 로 뿌린다 */
function lines(text, perLine) {
  const out = [];
  for (let i = 0; i < text.length; i += perLine) out.push(text.slice(i, i + perLine));
  return out;
}

/* ── 장면 배경: 9:16 ──────────────────────────────────── */
mkdirSync(resolve(root, 'public/art/scenes'), { recursive: true });
for (const s of scenes) {
  const W = 810, H = 1440;
  const body = lines(s.prompt, 26).slice(0, 6);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#1B1822"/>
  <g stroke="#302B3C" stroke-width="2">
    <line x1="0" y1="${H * 0.66}" x2="${W}" y2="${H * 0.66}"/>
    <line x1="${W / 2}" y1="0" x2="${W / 2}" y2="${H}" opacity=".4"/>
  </g>
  <text x="${W / 2}" y="${H * 0.3}" text-anchor="middle" fill="#6E6680"
        font-family="sans-serif" font-size="30" letter-spacing="3">그림 자리</text>
  <text x="${W / 2}" y="${H * 0.36}" text-anchor="middle" fill="#F0ECF5"
        font-family="sans-serif" font-size="54" font-weight="700">${esc(s.time)}</text>
  <text x="${W / 2}" y="${H * 0.41}" text-anchor="middle" fill="#A79FB8"
        font-family="sans-serif" font-size="30">${esc(s.place)} · ${esc(s.title)}</text>
  ${body.map((l, i) =>
    `<text x="${W / 2}" y="${H * 0.47 + i * 34}" text-anchor="middle" fill="#5E5670"
        font-family="sans-serif" font-size="23">${esc(l)}</text>`).join('\n  ')}
  <text x="${W / 2}" y="${H * 0.7}" text-anchor="middle" fill="#4A4358"
        font-family="sans-serif" font-size="22">↓ 이 아래는 글씨가 올라가는 자리 ↓</text>
  <text x="${W / 2}" y="${H - 40}" text-anchor="middle" fill="#3A3446"
        font-family="monospace" font-size="20">${esc(s.id)}.svg · 810×1440 (9:16)</text>
</svg>
`;
  writeFileSync(resolve(root, 'public' + s.src), svg, 'utf8');
}

/* ── 공유 썸네일: 1200×630 ───────────────────────────── */
const types = JSON.parse(
  await import('node:fs').then(m => m.readFileSync(resolve(root, 'src/data/types.json'), 'utf8'))
);
mkdirSync(resolve(root, 'public/art/og'), { recursive: true });

function ogSvg(top, big, sub) {
  const W = 1200, H = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#FBFAF9"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" fill="none" stroke="#DDD8E2" stroke-width="2"/>
  <text x="${W / 2}" y="248" text-anchor="middle" fill="#8B8592"
        font-family="sans-serif" font-size="30" letter-spacing="4">${esc(top)}</text>
  <text x="${W / 2}" y="346" text-anchor="middle" fill="#17151B"
        font-family="sans-serif" font-size="84" font-weight="700">${esc(big)}</text>
  <text x="${W / 2}" y="404" text-anchor="middle" fill="#56515E"
        font-family="sans-serif" font-size="32">${esc(sub)}</text>
  <text x="${W / 2}" y="${H - 70}" text-anchor="middle" fill="#A9A3B2"
        font-family="sans-serif" font-size="26" letter-spacing="3">CRUSH LAB</text>
</svg>
`;
}

writeFileSync(resolve(root, 'public/art/og/default.svg'),
  ogSvg('연애 성향 검사', 'Crush Lab', '하루를 따라가며 알아보는 내 연애 성향'), 'utf8');

for (const [code, t] of Object.entries(types)) {
  writeFileSync(resolve(root, `public/art/og/${code}.svg`),
    ogSvg(t.gem, t.name, t.tag), 'utf8');
}

/* ── 파비콘 ───────────────────────────────────────────── */
writeFileSync(resolve(root, 'public/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="#17151B"/>
  <path d="M16 6 L24 14 L16 26 L8 14 Z" fill="none" stroke="#FBFAF9" stroke-width="2" stroke-linejoin="round"/>
</svg>
`, 'utf8');

/* ── 매니페스트 ───────────────────────────────────────── */
const md = `# 일러스트 생성 목록

이 파일은 \`node tools/make-art-placeholders.mjs\` 가 \`src/data/scenes.ts\` 를 읽어서 자동으로 만든다.
장면을 추가하거나 프롬프트를 고쳤으면 스크립트를 다시 돌릴 것.

## 공통 스타일

7장이 한 세트로 보여야 하므로, 아래 문장을 **모든 프롬프트 앞에 붙여서** 생성한다.

> ${ART_STYLE}

## 넣는 법

생성한 이미지를 아래 경로에 **같은 이름으로 덮어쓰기만** 하면 된다. 코드는 안 고쳐도 된다.
확장자를 바꾸려면(\`.svg\` → \`.webp\`) \`src/data/scenes.ts\` 의 \`art.src\` 도 같이 고친다.

권장 형식: **WebP, 810×1440 (9:16), 200KB 이하.**
화면 아래 3분의 1에는 글씨가 올라가니 그쪽은 밝고 단순하게 비워둘 것.

## 장면 배경 ${scenes.length}장

${scenes.map((s, i) => `### ${i + 1}. ${s.time} ${s.place} — ${s.title}

- 경로: \`public${s.src}\`
- 대체텍스트: ${s.alt}
- 프롬프트:

\`\`\`
${ART_STYLE} ${s.prompt}
\`\`\`
`).join('\n')}

## 공유 썸네일 ${Object.keys(types).length + 1}장

카톡·인스타에 링크를 붙였을 때 뜨는 그림이다.

> **주의** — 지금 들어 있는 자리표시자는 SVG인데, **카카오톡과 페이스북은 SVG 썸네일을 못 읽는다.**
> 공개 전에 반드시 **PNG 또는 JPG** 로 바꿔야 한다. 규격은 1200×630.

- \`public/art/og/default.svg\` — 사이트 공통
${Object.entries(types).map(([code, t]) =>
  `- \`public/art/og/${code}.svg\` — ${t.name} (${t.gem})`).join('\n')}
`;

mkdirSync(resolve(root, 'docs'), { recursive: true });
writeFileSync(resolve(root, 'docs/ART-MANIFEST.md'), md, 'utf8');

console.log(`장면 배경 ${scenes.length}장`);
console.log(`공유 썸네일 ${Object.keys(types).length + 1}장`);
console.log('docs/ART-MANIFEST.md 생성 완료');
