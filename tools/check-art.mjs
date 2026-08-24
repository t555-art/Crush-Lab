/**
 * 부품 이미지 건강검진.
 *
 * 이미지를 몇 장 넣을 때마다 돌릴 것.
 * 50장 뽑고 나서 규격이 틀린 걸 알면 한 달이 날아간다.
 *
 *   · parts.ts 가 가리키는 파일이 실제로 있는지
 *   · 캔버스 크기가 규격(1024×1536)과 맞는지
 *   · 배경이 투명한지 (PNG/WebP)
 *   · 용량이 너무 크지 않은지
 *   · 슬롯마다 조건 없는 기본값이 하나씩 있는지
 *
 * 실행: npm run check:art
 */
import { build } from 'esbuild';
import { readFileSync, existsSync, statSync, rmSync, mkdtempSync, writeFileSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(resolve(tmpdir(), 'crushlab-art-'));
const entry = resolve(tmp, 'entry.ts');
const outfile = resolve(tmp, 'bundle.mjs');
const p = (rel) => JSON.stringify(resolve(root, rel));

writeFileSync(entry, `
export { PARTS } from ${p('src/data/parts.ts')};
export { CANVAS } from ${p('src/data/art-spec.ts')};
`);
await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile, logLevel: 'error' });
const { PARTS, CANVAS } = await import(pathToFileURL(outfile).href);

const MAX_KB = 250;
const problems = [];
const warn = (s) => problems.push(s);

console.log(`부품 ${PARTS.length}개 · 규격 ${CANVAS.w}×${CANVAS.h}`);

if (!PARTS.length) {
  console.log('\n아직 부품이 없다. 그림이 생기면 src/data/parts.ts 에 등록하고 다시 돌릴 것.');
  rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
}

/* ── 이미지 크기 읽기 (외부 라이브러리 없이) ── */
function pngSize(buf) {
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}
function pngHasAlpha(buf) {
  // IHDR 의 colour type: 4(회색+알파) 또는 6(트루컬러+알파)
  const ct = buf[25];
  return ct === 4 || ct === 6;
}
function webpSize(buf) {
  if (buf.slice(0, 4).toString() !== 'RIFF' || buf.slice(8, 12).toString() !== 'WEBP') return null;
  const fmt = buf.slice(12, 16).toString();
  if (fmt === 'VP8X') return { w: (buf.readUIntLE(24, 3) & 0xffffff) + 1, h: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
  if (fmt === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  if (fmt === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  return null;
}
function webpHasAlpha(buf) {
  const fmt = buf.slice(12, 16).toString();
  if (fmt === 'VP8X') return Boolean(buf[20] & 0x10);
  if (fmt === 'VP8L') return true;   // 무손실은 알파 지원
  return false;                       // 손실 단독 VP8 은 알파 없음
}
function svgSize(txt) {
  const m = txt.match(/viewBox\s*=\s*["']\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/);
  return m ? { w: Math.round(+m[1]), h: Math.round(+m[2]) } : null;
}

/* ── 부품별 검사 ── */
const bySlot = new Map();
for (const part of PARTS) {
  (bySlot.get(part.slot) ?? bySlot.set(part.slot, []).get(part.slot)).push(part);

  const file = resolve(root, 'public' + part.src);
  if (!existsSync(file)) { warn(`파일 없음: ${part.id} → public${part.src}`); continue; }

  const ext = extname(file).toLowerCase();
  const buf = readFileSync(file);
  const kb = Math.round(buf.length / 1024);
  if (kb > MAX_KB) warn(`용량 큼: ${part.id} ${kb}KB (권장 ${MAX_KB}KB 이하) — WebP로 줄일 것`);

  let size = null, alpha = null;
  if (ext === '.png') { size = pngSize(buf); alpha = pngHasAlpha(buf); }
  else if (ext === '.webp') { size = webpSize(buf); alpha = webpHasAlpha(buf); }
  else if (ext === '.svg') { size = svgSize(buf.toString('utf8')); alpha = true; }
  else warn(`형식 확인 필요: ${part.id} (${ext}) — PNG/WebP/SVG 권장`);

  if (size) {
    const ratio = size.w / size.h;
    const want = CANVAS.w / CANVAS.h;
    if (Math.abs(ratio - want) > 0.02) {
      warn(`비율 안 맞음: ${part.id} ${size.w}×${size.h} — 규격은 ${CANVAS.w}×${CANVAS.h} (2:3)`);
    } else if (size.w !== CANVAS.w) {
      console.log(`  · ${part.id}: ${size.w}×${size.h} (비율은 맞음)`);
    }
  }
  if (alpha === false) {
    warn(`배경이 불투명함: ${part.id} — 겹치면 아래 부품을 가린다. 배경 제거 필요`);
  }
}

/* ── 슬롯별 검사 ── */
console.log('슬롯:', [...bySlot.keys()].map(s => `${s}(${bySlot.get(s).length})`).join(' '));
for (const [slot, list] of bySlot) {
  if (!list.some(x => !x.when)) {
    warn(`슬롯 '${slot}' 에 기본값이 없다 — 조건에 아무것도 안 맞으면 그 자리가 빈다. ` +
         `when 없는 부품을 하나 둘 것`);
  }
  const zs = new Set(list.map(x => x.z));
  if (zs.size > 1) warn(`슬롯 '${slot}' 의 z 가 제각각 (${[...zs].join(', ')}) — 같은 슬롯은 같은 z 를 권한다`);
}

/* ── id 중복 ── */
const seen = new Set();
for (const x of PARTS) {
  if (seen.has(x.id)) warn(`id 중복: ${x.id}`);
  seen.add(x.id);
}

if (problems.length) {
  console.log(`\n짚어볼 것 ${problems.length}개`);
  for (const s of problems) console.log(`  · ${s}`);
} else {
  console.log('\n문제 없음');
}

rmSync(tmp, { recursive: true, force: true });
process.exit(0);
