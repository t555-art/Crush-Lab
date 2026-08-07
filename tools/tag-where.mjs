/**
 * 문항에 `where` (자리) 태그를 붙인다.
 *
 * 뱅크(ch1~ch7)는 "관계 단계"라서 장면(시간대)에 그대로 못 얹는다.
 * 이 스크립트는 문항 본문을 읽고 "어디서 물어야 자연스러운가"를 따로 매긴다.
 *
 * 판정 규칙은 두 단계다.
 *   1. 의견·성향·과거경험을 묻는 문항이면 → 'any'
 *      ("고백은 누가 하는 게 맞다고 봐?" 는 급식실에서 물어도 안 어색하다)
 *   2. 구체적인 장면을 그리는 문항이면 → 그 장소 태그
 *      ("급식 줄에서 식판이 쏟아졌다" 는 급식실이어야 성립한다)
 *
 * 자동 판정은 초안일 뿐이다. OVERRIDE 에 손으로 적은 값이 항상 이긴다.
 *
 * 실행:
 *   node tools/tag-where.mjs          검토용 출력만 (파일 안 건드림)
 *   node tools/tag-where.mjs --write  questions/*.json 에 반영
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const QDIR = resolve(root, 'src/data/questions');
const WRITE = process.argv.includes('--write');

/* ── 1. 의견·경험형 표지 ───────────────────────────────
   이게 걸리면 장소 키워드가 있어도 'any' 로 본다.
   "톡 답장 속도, 너는 실제로 어때?" 는 폰 얘기지만 폰 앞이 아니어도 답한다. */
const OPINION = new RegExp([
  '생각해\\?', '생각하는\\?', '라고 봐\\?', '다고 봐\\?', '어떻게 봐',
  '편이야\\?', '편이\\?', '어때\\?', '어떤 느낌',
  '적 있어\\?', '적은 있어', '본 적', '해본 적',
  '얼마나', '몇 [번명개시달]', '어느 정도', '어디까지',
  '고른다면', '한다면\\?', '하면 좋겠어', '면 좋겠어',
  '뭐라고', '무엇이라고', '제일 [^?]*[은는이가]\\?',
  '중요한 게', '중요하다고', '가능하다고', '필요하다고',
  '너는\\?$', '입장은', '기준은', '이유는', '스타일은',
  '어느 쪽', '둘 중', '보통 [^?]*\\?',
].join('|'));

/* ── 2. 장소 표지 ──────────────────────────────────────
   구체 상황일 때만 쓴다. 위에서 아래로 먼저 걸리는 것이 이긴다. */
const PLACE = [
  ['meal',  /급식[실 줄]|식판|매점|밥 먹|점심시간|도시락/],
  ['class', /교실|수업 [중시]|칠판|자습[시 ]|짝꿍|앞자리|뒷자리|1교시|쉬는 시간|책상 위|조 편성|수행평가/],
  ['hall',  /복도|사물함|계단|청소 당번|화장실 갔/],
  ['road',  /등굣길|하굣길|등교|하교|교문|횡단보도|버스|지하철|골목|편의점|우산|눈 오는 날|비가 오는/],
  ['room',  /침대|이불 속|누웠|잠들|새벽에|아침에 눈|거울 앞|알람|등교 준비|방에서|불을 끄/],
  /* 폰은 "폰 안에서 벌어진 일" 일 때만. 답장·읽음·업로드처럼 사건이 있어야 한다. */
  ['phone', /(인스타|스토리|디엠|DM|톡|카톡|단톡|프로필|계정|메시지)[^?]{0,24}(올라왔|올렸|왔다|보냈|봤다|떴다|눌렀|바꿨|answer)|읽고 [0-9]|읽음 표시|조회 목록|답장을 보냈|안 왔다/],
];

/* ── 3. 손으로 잡는 예외 ───────────────────────────────
   자동 판정이 틀렸거나, 본문만으로는 알 수 없는 것들.
   여기 적은 값이 최종이다. */
const OVERRIDE = {
  /* 아침·혼자 있는 시간에 어울리는 자기인식 문항 */
  's-09': 'room',   // 등교 준비하면서 제일 신경 쓰는 건
  's-10': 'room',   // 거울을 볼 때 드는 생각
  's-16': 'room',   // 혼자 있는 시간이 어떤 느낌이야
  'c2-17f': 'room', // 다음 날 아침 준비 시간
  'x1-02': 'phone', // 카톡 프로필 상태
  'c1-06': 'phone', // 인스타 계정 상태

  /* 교실에서 벌어지는 일 */
  'c1-01': 'class', // 3월 첫 주 쉬는 시간
  'v-03': 'class',  // 자습시간 쪽지
  'v-01': 'class',  // 체육시간 자유활동 팀 나누기
  'c3-04': 'phone', // 단톡방에서 걔가 말을 걸었는데

  /* 급식실 */
  'v-24': 'meal',   // 급식 줄에서 식판 쏟음
  'c1-07': 'meal',  // 급식 줄에 걔가 세 명 앞에
  'v-11': 'meal',   // 급식에 걔가 못 먹는 반찬
  's-07': 'meal',   // 급식은 주로 누구랑 먹어

  /* 복도 */
  'c3-07': 'hall',  // 복도에서 정면으로 마주쳤다
  'f-01': 'hall',   // 복도에서 이성인 친구랑 마주쳤다

  /* 오가는 길 */
  'v-02': 'road',   // 우산이 하나뿐
  'v-09': 'road',   // 편의점에서 마주침
  'v-13': 'phone',  // 읽고 3시간째 답이 없는데 스토리는 올라옴
  'w-13': 'road',   // 눈 오는 날 하교길

  /* 밤·폰 */
  'c4-02': 'phone', // 매일 오던 톡이 오늘 안 왔다. 밤 11시
  'c3-06': 'phone', // 톡 보냈는데 30분째 읽고 답이 없다
  'x3-02': 'phone', // 예전 게시물 보다가 실수로 좋아요
  'x3-03': 'phone', // 걔가 내 스토리를 봤다
  'v-07': 'phone',  // 내 스토리에 하트 이모지 답장
  'c4-05': 'phone', // 걔가 "ㅋ" 하나만 보냈다
  'c4-17': 'phone', // 전화가 왔다. 걔다
  'x4-19m': 'phone',
  'c4-19m': 'phone', // 힘든 일 있다고 톡. 밤 12시
  'c3-05': 'phone',  // 개인톡 첫 마디로 뭘 보내

  /* 자동 판정이 선택지에 걸려서 틀린 것들 — 전부 자리를 안 타는 문항이다 */
  'c6-03': 'any',   // 해보고 싶은 연애 (선택지에 '버스' 가 있었을 뿐)
  'c2-06': 'any',   // 순식간에 식는 순간 (선택지에 '밥 먹' 이 있었을 뿐)
  'c4-29': 'any',   // 고3 썸, 시간이 없다
  'w-09': 'any',    // 고백받는다면 언제가 제일 좋아
  'w-15': 'any',    // 교복 입고 해보고 싶은 것
  'f-04': 'room',   // 만나기로 한 날 준비 시간 → 준비는 방에서 한다

  /* 다른 날 사건이라 하루 서사에 얹으면 어색한 것 — 자리를 안 준다 */
  'v-06': 'any',    // 수학여행 버스 (하굣길 장면에 넣으면 오늘이 깨진다)
};

/* ── 판정 ─────────────────────────────────────────────── */
function decide(q) {
  if (OVERRIDE[q.id]) return { where: OVERRIDE[q.id], by: 'override' };

  const body = q.q + ' ' + q.o.map(o => o.t).join(' ');

  // 의견형이면 장소를 안 따진다
  if (OPINION.test(q.q)) return { where: 'any', by: 'opinion' };

  for (const [tag, re] of PLACE) {
    if (re.test(body)) return { where: tag, by: 'place:' + tag };
  }
  return { where: 'any', by: 'default' };
}

/* ── 실행 ─────────────────────────────────────────────── */
const files = readdirSync(QDIR).filter(f => f.endsWith('.json'));
const report = {};
let changed = 0, total = 0;

for (const file of files) {
  const path = resolve(QDIR, file);
  const rows = JSON.parse(readFileSync(path, 'utf8'));

  for (const q of rows) {
    total++;
    const { where, by } = decide(q);
    (report[where] ??= []).push({ id: q.id, by, q: q.q.replace(/\n/g, ' / ') });

    if (q.where !== where) changed++;
    // ch 바로 뒤에 오도록 키 순서를 다시 만든다 (사람이 읽기 좋게)
    for (const k of Object.keys(q)) { const v = q[k]; delete q[k]; q[k] = v; if (k === 'ch') q.where = where; }
    if (!('where' in q)) q.where = where;
  }

  if (WRITE) writeFileSync(path, JSON.stringify(rows, null, 2) + '\n', 'utf8');
}

/* ── 보고 ─────────────────────────────────────────────── */
const order = ['room', 'road', 'class', 'meal', 'hall', 'phone', 'any'];
for (const tag of order) {
  const rows = report[tag] ?? [];
  console.log(`\n══ ${tag} — ${rows.length}개 ${'═'.repeat(Math.max(0, 46 - tag.length))}`);
  // 'any' 는 양이 많으니 자동 판정 근거만 집계해서 보여준다
  if (tag === 'any') {
    const byReason = {};
    for (const r of rows) byReason[r.by] = (byReason[r.by] ?? 0) + 1;
    console.log('  ', JSON.stringify(byReason));
    continue;
  }
  for (const r of rows) console.log(`  [${r.id.padEnd(7)}] ${r.by.padEnd(12)} ${r.q.slice(0, 62)}`);
}

console.log(`\n총 ${total}개 / 값이 바뀐 문항 ${changed}개`);
console.log(WRITE ? '→ questions/*.json 에 반영했다.' : '→ 검토용 출력이다. 반영하려면 --write');
