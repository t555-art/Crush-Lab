/**
 * 자기소개 조합을 전수로 돌려서, 문항 자리가 전부 채워지는지 확인한다.
 *
 * need 조건 때문에 특정 조합에서 뱅크가 말라버리면 문항이 조용히 빠진다.
 * 그러면 사람에 따라 검사 길이가 달라지고 채점도 흔들린다.
 * 문항을 손볼 때마다 이걸 돌려야 한다.
 *
 * 실행: node tools/check-coverage.mjs
 */
import { build } from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(resolve(tmpdir(), 'crushlab-'));
const outfile = resolve(tmp, 'bundle.mjs');

const entry = resolve(tmp, 'entry.ts');
writeFileSync(entry, `
export { SCENES, QUESTION_COUNT } from ${JSON.stringify(resolve(root, 'src/data/scenes.ts'))};
export { resolveScenes, countQuestions, BANKS } from ${JSON.stringify(resolve(root, 'src/engine/select.ts'))};
export { score } from ${JSON.stringify(resolve(root, 'src/engine/score.ts'))};
export { default as INTRO } from ${JSON.stringify(resolve(root, 'src/data/intro.json'))};
`);

await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile, logLevel: 'error' });
const m = await import(pathToFileURL(outfile).href);

const { SCENES, QUESTION_COUNT, resolveScenes, countQuestions, score, BANKS, INTRO } = m;

console.log(`장면 ${SCENES.length}개 / 문항 자리 ${QUESTION_COUNT}개`);
console.log('뱅크별 보유량:',
  Object.entries(BANKS).map(([k, v]) => `${k}=${v.length}`).join(' '));

/* 자기소개 선택지 전조합 */
const fields = INTRO.map(q => [q.id, q.opts.map(o => o.v)]);
const combos = fields.reduce(
  (acc, [id, vals]) => acc.flatMap(a => vals.map(v => ({ ...a, [id]: v }))),
  [{}]
);

let short = [], counts = new Map(), codes = new Set(), errors = [];
for (const intro of combos) {
  try {
    const scenes = resolveScenes(SCENES, intro);
    const n = countQuestions(scenes);
    counts.set(n, (counts.get(n) ?? 0) + 1);
    if (n < QUESTION_COUNT) short.push({ intro, n });

    // 중복 출제 검사
    const ids = [];
    for (const s of scenes) for (const b of s.beats) if (b.question) ids.push(b.question.id);
    if (new Set(ids).size !== ids.length) errors.push('중복 문항: ' + JSON.stringify(intro));

    // 무작위 응답으로 채점까지 돌려본다
    const asked = [], answers = {};
    for (const s of scenes) for (const b of s.beats) if (b.question) {
      asked.push(b.question);
      answers[b.question.id] = Math.floor(Math.random() * b.question.o.length);
    }
    codes.add(score(asked, answers).code);
  } catch (e) {
    errors.push(`${JSON.stringify(intro)} :: ${e.message}`);
  }
}

console.log(`\n자기소개 조합 ${combos.length}가지 검사`);
console.log('출제 개수 분포:', [...counts.entries()].sort((a, b) => a[0] - b[0])
  .map(([n, c]) => `${n}문항×${c}`).join('  '));
console.log('문항이 모자란 조합:', short.length);
if (short.length) console.log('  예시:', JSON.stringify(short[0]));
console.log('도달한 유형 코드:', codes.size, '/ 16');
console.log('오류:', errors.length, errors.slice(0, 3));

rmSync(tmp, { recursive: true, force: true });
process.exit(short.length || errors.length ? 1 : 0);
