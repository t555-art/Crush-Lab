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

/* 축별 최소 출제량.
   자리·단계 필터가 촘촘해지면 특정 축을 재는 문항이 통째로 빠질 수 있다.
   그러면 score.ts 의 normalize 에서 room<=0 이 되어 그 축이 0으로 눌리고,
   결과 코드의 그 자리는 사실상 동전 던지기가 된다. 그래서 하한을 둔다.
   축이 4개인데 문항이 35개니, 축당 8개는 실제로 재고 있어야 한다. */
const AXIS_KEYS = ['sp', 'ex', 'st', 'iv'];
const MIN_PER_AXIS = 8;

/** 이 문항이 그 축을 실제로 재는가 (선택지마다 점수가 갈려야 잰다고 본다) */
function measures(q, k) {
  const vals = q.o.map(o => (o.s && o.s[k]) || 0);
  return Math.max(...vals) !== Math.min(...vals);
}

let short = [], counts = new Map(), codes = new Set(), errors = [];
let thin = [], axisMin = { sp: 99, ex: 99, st: 99, iv: 99 };
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

    // 축별로 몇 문항이 실제로 재고 있는지
    for (const k of AXIS_KEYS) {
      const c = asked.filter(q => measures(q, k)).length;
      if (c < axisMin[k]) axisMin[k] = c;
      if (c < MIN_PER_AXIS) thin.push({ intro, axis: k, count: c });
    }
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

console.log(`\n축별 최소 출제량 (하한 ${MIN_PER_AXIS}개)`);
for (const k of AXIS_KEYS) {
  const ok = axisMin[k] >= MIN_PER_AXIS;
  console.log(`  ${k}  최소 ${String(axisMin[k]).padStart(2)}문항  ${ok ? 'OK' : '← 부족'}`);
}
if (thin.length) {
  console.log(`  하한 미달 조합 ${thin.length}건. 예시:`, JSON.stringify(thin[0]));
  console.log('  → 그 축이 0으로 눌려 판정이 무작위가 된다. scenes.ts 의 stages/accepts 를 넓힐 것.');
}

console.log('\n오류:', errors.length, errors.slice(0, 3));

rmSync(tmp, { recursive: true, force: true });
process.exit(short.length || errors.length || thin.length ? 1 : 0);
