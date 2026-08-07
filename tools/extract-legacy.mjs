/**
 * v1 index.html 안에 인라인으로 박혀 있던 데이터를 꺼내서
 * src/data/ 아래 JSON으로 옮긴다.
 *
 * v1은 스크립트 전체가 전역 스코프 한 덩어리라, 통째로 Function으로 실행한 뒤
 * 필요한 상수만 뽑아내는 게 정규식으로 긁는 것보다 안전하다.
 *
 * 실행: node tools/extract-legacy.mjs
 * 한 번 쓰고 버리는 스크립트가 아니다 — v1을 참고해 문항을 더 옮길 일이
 * 남아 있으므로 저장소에 남긴다.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
const js = html.split('<script>')[1].split('</script>')[0];

/* v1 스크립트는 로드 시점에 DOM을 건드린다. 최소한의 껍데기를 인자로 넘겨준다.
   (전역에 심으면 Node 22에서 navigator가 getter-only라 막힌다) */
const noop = () => {};
const stubEl = () => ({
  innerHTML: '', textContent: '', style: {}, dataset: {},
  classList: { add: noop, remove: noop, toggle: noop },
  addEventListener: noop, appendChild: noop, remove: noop,
});
const win = { addEventListener: noop, innerWidth: 400, scrollTo: noop, CSS: null };
const doc = {
  getElementById: stubEl, querySelector: () => null, querySelectorAll: () => [],
  addEventListener: noop, createElement: stubEl,
  body: { classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop },
};

const legacy = new Function(
  'window', 'document', 'navigator', 'location',
  js + ';return { AXES, CHAPTERS, INTRO, POOL, TYPES, IDEAL, QUOTA };'
)(win, doc, {}, { origin: '', pathname: '/', search: '' });

const out = (relPath, value) => {
  const full = resolve(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, JSON.stringify(value, null, 2) + '\n', 'utf8');
  const n = Array.isArray(value) ? value.length : Object.keys(value).length;
  console.log(`${relPath.padEnd(42)} ${String(n).padStart(4)}개`);
};

/* 문항은 출처 뱅크별로 쪼갠다. 364개를 한 파일에 두면 사람이 못 고친다. */
const banks = {
  'ch1-me': q => q.id.startsWith('c1-'),
  'ch2-pull': q => q.id.startsWith('c2-'),
  'ch3-crush': q => q.id.startsWith('c3-'),
  'ch4-some': q => q.id.startsWith('c4-'),
  'ch5-ask': q => q.id.startsWith('c5-'),
  'ch6-dating': q => q.id.startsWith('c6-'),
  'ch7-after': q => q.id.startsWith('c7-'),
};
const claimed = new Set();
for (const [name, test] of Object.entries(banks)) {
  const rows = legacy.POOL.filter(q => { if (test(q)) { claimed.add(q.id); return true; } return false; });
  out(`src/data/questions/${name}.json`, rows);
}
/* 나머지(EXTRA·FRIEND·SELF·SCENE·FUN·MORE…)는 한곳에 모아둔다.
   서사 구조로 재배치할 때 여기서 골라 쓰게 된다. */
out('src/data/questions/pool-extra.json', legacy.POOL.filter(q => !claimed.has(q.id)));

out('src/data/axes.json', legacy.AXES);
out('src/data/intro.json', legacy.INTRO);
out('src/data/types.json', legacy.TYPES);

console.log(`\n총 문항 ${legacy.POOL.length}개 / 유형 ${Object.keys(legacy.TYPES).length}개 이전 완료`);
