/**
 * 문항 건강검진.
 *
 * 문항을 손볼 때마다 돌릴 것. 눈으로는 못 잡는 것들을 잡아준다.
 *   · id 중복
 *   · 어떤 축도 재지 않는 문항 (있어도 결과에 영향이 없다)
 *   · 아무도 못 받는 문항 (show 조건이 실제 특성 조합과 안 맞음)
 *   · 특성 조합별 출제량 편차 (어떤 사람은 10문항, 어떤 사람은 40문항)
 *   · 축별 문항 수 불균형
 *   · 장면의 문항 자리가 안 채워지는 경우
 *
 * 실행: npm run check:questions
 */
import { build } from 'esbuild';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { writeFileSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = mkdtempSync(resolve(tmpdir(), 'crushlab-'));
const entry = resolve(tmp, 'entry.ts');
const outfile = resolve(tmp, 'bundle.mjs');
const p = (rel) => JSON.stringify(resolve(root, rel));

writeFileSync(entry, `
export { AXES } from ${p('src/data/axes.ts')};
export { INTRO } from ${p('src/data/intro.ts')};
export { QUESTIONS } from ${p('src/data/questions.ts')};
export { SCENES } from ${p('src/data/scenes.ts')};
export { resolve as resolveScenes, askedQuestions, canAsk } from ${p('src/engine/select.ts')};
export { score } from ${p('src/engine/score.ts')};
`);

await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile, logLevel: 'error' });
const m = await import(pathToFileURL(outfile).href);
const { AXES, INTRO, QUESTIONS, SCENES, resolveScenes, askedQuestions, canAsk, score } = m;

const problems = [];
const warn = (s) => problems.push(s);

console.log(`축 ${AXES.length}개 · 시작질문 ${INTRO.length}개 · 문항 ${QUESTIONS.length}개 · 장면 ${SCENES.length}개`);

if (!QUESTIONS.length) {
  console.log('\n아직 문항이 없다. 채우고 다시 돌릴 것.');
  rmSync(tmp, { recursive: true, force: true });
  process.exit(0);
}

/* ── id 중복 ── */
const seen = new Set();
for (const q of [...INTRO, ...QUESTIONS]) {
  if (seen.has(q.id)) warn(`id 중복: ${q.id}`);
  seen.add(q.id);
}

/* ── 축을 안 재는 문항 ── */
const axisIds = AXES.map(a => a.id);
for (const q of QUESTIONS) {
  const scores = q.kind === 'choice'
    ? q.options.flatMap(o => Object.entries(o.score ?? {}))
    : Object.entries(q.weight ?? {});
  const live = scores.filter(([id, v]) => axisIds.includes(id) && v !== 0);
  if (!live.length) warn(`어떤 축도 재지 않음: ${q.id}`);
  const unknown = scores.map(([id]) => id).filter(id => !axisIds.includes(id));
  if (unknown.length) warn(`없는 축을 가리킴: ${q.id} → ${[...new Set(unknown)].join(', ')}`);
}

/* ── 축별 문항 수 ── */
const perAxis = Object.fromEntries(axisIds.map(id => [id, 0]));
for (const q of QUESTIONS) {
  for (const id of axisIds) {
    const used = q.kind === 'choice'
      ? q.options.some(o => o.score?.[id])
      : Boolean(q.weight?.[id]);
    if (used) perAxis[id]++;
  }
}
console.log('축별 문항 수:', Object.entries(perAxis).map(([k, v]) => `${k}=${v}`).join(' ') || '(없음)');
for (const [id, n] of Object.entries(perAxis)) {
  if (n < 6) warn(`축 '${id}' 문항이 ${n}개뿐 — 6개 미만이면 판정이 흔들린다`);
}

/* ── 시작 질문이 만들어내는 특성 조합을 전수로 돌린다 ── */
const fields = INTRO.map(q => [
  q.id,
  q.options.map(o => o.traits ?? {}),
]);
let combos = [{}];
for (const [, optionTraits] of fields) {
  combos = combos.flatMap(base => optionTraits.map(t => ({ ...base, ...t })));
}
if (combos.length > 20000) {
  warn(`특성 조합이 ${combos.length}가지 — 너무 많아 일부만 검사한다`);
  combos = combos.slice(0, 20000);
}

const counts = new Map();
const neverAsked = new Set(QUESTIONS.map(q => q.id));
let errors = 0;

for (const traits of combos) {
  try {
    const scenes = resolveScenes(SCENES, traits);
    const asked = askedQuestions(scenes);
    counts.set(asked.length, (counts.get(asked.length) ?? 0) + 1);
    for (const q of asked) neverAsked.delete(q.id);

    const ids = asked.map(q => q.id);
    if (new Set(ids).size !== ids.length) warn(`중복 출제: ${JSON.stringify(traits)}`);

    // 무작위 응답으로 채점까지 돌려본다
    const answers = {};
    for (const q of asked) {
      answers[q.id] = q.kind === 'choice'
        ? Math.floor(Math.random() * q.options.length)
        : Math.floor(Math.random() * q.steps);
    }
    score(asked, answers, traits);
  } catch (e) {
    errors++;
    if (errors < 4) warn(`${JSON.stringify(traits)} :: ${e.message}`);
  }
}

console.log(`특성 조합 ${combos.length}가지 검사`);
const dist = [...counts.entries()].sort((a, b) => a[0] - b[0]);
console.log('출제 개수 분포:', dist.map(([n, c]) => `${n}문항×${c}`).join('  '));

if (dist.length > 1) {
  const [lo] = dist[0], [hi] = dist[dist.length - 1];
  if (hi - lo > Math.max(3, hi * 0.2)) {
    warn(`사람마다 출제량 차이가 큼 (${lo}~${hi}문항) — 조건(show)이 한쪽으로 쏠렸는지 확인`);
  }
}
for (const id of neverAsked) warn(`아무에게도 안 나감: ${id} — show 조건 확인`);

/* ── 결과 ── */
if (problems.length) {
  console.log(`\n짚어볼 것 ${problems.length}개`);
  for (const s of problems) console.log(`  · ${s}`);
} else {
  console.log('\n문제 없음');
}

rmSync(tmp, { recursive: true, force: true });
process.exit(errors ? 1 : 0);
