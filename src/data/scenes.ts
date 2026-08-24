import type { Scene } from '../engine/types';

/**
 * 서사 — 생활 상황을 따라간다.
 * 등교 전 → 학교(교실·급식실·복도) → 하교 후 → 밤 → 주말/학원 → 데이트
 *
 * ── 왜 이 순서인가 ──  ★ 그냥 하루 순서가 아니다
 * 끌림이 실제로 만들어지는 기제가 셋으로 정리돼 있는데, 장소 순서와 그대로 겹친다.
 *
 *   ① 근접·반복노출 — 가까이 있고 자주 보면 그것만으로 호감이 생긴다
 *        → 교실·급식실·복도
 *   ② 상호성 — 상대가 관심 있다는 신호 하나면 끌림이 켜진다 (눈길·질문 한 번으로 충분)
 *        → 하교 후
 *   ③ 자기개방 — 속마음을 **서로** 주고받아야 친밀해진다. 일방적이면 효과 없음
 *        → 밤·폰
 *   그다음이 의도적 만남(주말·학원)과 관계 성립(데이트).
 *
 * 즉 **장소가 사적인 정도 = 관계의 진행도**다. 날짜를 세지 않아도 진행이 된다.
 *
 * ── 걔가 학교에 있느냐 없느냐 ──  ★ 여기가 이 파일의 핵심
 *
 * 남고 다니는 사람이 여자를 좋아하면 교실·급식실·복도에 그 사람이 **있을 수가 없다.**
 * 그런데 이건 school 만으로는 판정이 안 된다 — 남고라도 상대가 남자면 학교에 있다.
 * (Condition 이 AND 로만 묶여서 그런 OR 조건을 못 쓴다)
 *
 * 그래서 시작 질문에서 `meet` 을 직접 물어보고, **그 답을 기준으로 장면을 가른다.**
 *
 *   meet: class            같은 반        → 모든 학교 장면에 걔가 있다
 *   meet: school           다른 반        → 교실엔 없고, 급식실·복도·등하굣길엔 있다
 *   meet: academy/outside  학교 밖        → 학교 장면에 아예 없다
 *
 * 없는 쪽은 **문항을 빼는 게 아니라 다른 이야기를 깐다.** 이유가 있다 —
 * 매일 못 보는 사람은 근접·반복노출 기제가 통째로 빠져서, 안 움직이면 아무 일도
 * 안 일어난다. 우연이 없으니 `move`(행동) 축이 결과를 훨씬 크게 좌우하고,
 * 폰이 보조가 아니라 주무대가 된다. 연애의 모양 자체가 다르다.
 *
 * ── 짝 맞추기 규칙 ──
 * 변형본끼리는 **slot 이 같고 문항 자리 수가 같아야 한다.** 안 그러면 그 사람만
 * 검사가 짧아지고 채점이 흔들린다. 지금 전부 7개씩이다.
 * when 조건은 서로 배타적이고 빠짐없이 덮어야 한다.
 *
 * ── slot 9개 ──
 *   morning · commute · class · lunch · hall · afterschool · night · weekend · date
 *   → 9 × 7 = 한 명당 63문항
 *
 * ── 일러스트 ──
 * `background.prompt` 가 생성 지시문. ART_STYLE 을 앞에 붙여서 만든다.
 * 장면 안에서 특별히 그림이 붙을 문항은 `tags: ['art']` 로 표시한다 (docs/DESIGN.md).
 */

export const ART_STYLE =
  '세로 9:16 모바일 배경. 한국 고등학교를 배경으로 한 부드러운 애니메이션 일러스트. ' +
  '인물 얼굴은 클로즈업하지 않는다 — 뒷모습·실루엣·시선 밖으로. ' +
  '화면 아래 40%는 글씨가 올라갈 자리라 밝고 단순하게 비워둘 것. ' +
  '채도 낮은 파스텔, 부드러운 빛번짐, 얇은 선.';

/* 걔가 학교에 있는가 — 장면 조건을 한곳에 모아둔다.
   여기만 고치면 모든 장면이 따라온다. */
const AT_SCHOOL = { meet: ['class', 'school'] };
const AWAY = { meet: ['academy', 'outside'] };

export const SCENES: Scene[] = [
  /* ══ 등교 전 — 누구에게나 같다 ══════════════════════ */
  {
    id: 'morning',
    title: '아직 아무도 안 만났다',
    label: '오전 7시 10분 · 내 방',
    slot: 'morning',
    background: {
      src: '/art/scenes/morning.webp',
      alt: '이른 아침 햇빛이 들어오는 방',
      prompt: '이른 아침, 커튼 사이로 옅은 빛이 들어오는 학생 방. 의자에 걸린 교복, 열린 가방. 창밖은 아직 푸르스름하다.',
    },
    cast: [{ who: 'self', x: 50, y: 90 }],
    beats: [
      { kind: 'narration', text: '알람을 세 번 끄고 겨우 일어났다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '거울 앞에 선다.\n오늘은 왠지 좀 더 오래 서 있게 된다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '가방을 메고 나선다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 등굣길 ═══════════════════════════════════════════ */
  {
    id: 'commute-near',
    title: '저 앞에 보인다',
    label: '오전 7시 50분 · 등굣길',
    slot: 'commute',
    when: AT_SCHOOL,
    background: {
      src: '/art/scenes/commute.webp',
      alt: '아침 등굣길',
      prompt: '아침 등굣길. 교복 입은 학생들이 드문드문 걸어가는 골목. 멀리 학교 정문. 전부 뒷모습.',
    },
    cast: [
      { who: 'self', x: 36, y: 90 },
      { who: 'crush', x: 66, y: 86, scale: 0.85, flip: true },
    ],
    beats: [
      { kind: 'narration', text: '횡단보도 앞.\n저 앞에 익숙한 뒷모습이 보인다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '뛰면 따라잡을 수 있는 거리다.\n안 뛰면 그냥 모르는 사이로 학교까지 간다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '신호가 바뀐다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },
  {
    id: 'commute-far',
    title: '오늘은 못 본다',
    label: '오전 7시 50분 · 등굣길',
    slot: 'commute',
    when: AWAY,
    background: {
      src: '/art/scenes/commute.webp',
      alt: '아침 등굣길',
      prompt: '아침 등굣길. 교복 입은 학생들이 드문드문 걸어가는 골목. 멀리 학교 정문. 전부 뒷모습.',
    },
    cast: [{ who: 'self', x: 46, y: 90 }],
    beats: [
      { kind: 'narration', text: '학교로 걸어간다.\n이 길에서 걔를 마주칠 일은 없다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '대신 폰을 꺼낸다.\n아침에 뭐라도 보내면 이상할까.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '결국 아무것도 안 보내고 주머니에 넣는다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 학교 ① 교실 — 같은 반일 때만 걔가 있다 ═════════ */
  {
    id: 'class-same',
    title: '같은 공간, 다른 온도',
    label: '오전 · 교실',
    slot: 'class',
    when: { meet: 'class' },
    background: {
      src: '/art/scenes/class.webp',
      alt: '1교시 전 교실',
      prompt: '1교시 전 교실. 창가에 아침 햇빛이 길게 들어온다. 책상 위 펼쳐진 교과서와 필통, 학생들 실루엣.',
    },
    cast: [
      { who: 'self', x: 32, y: 90 },
      { who: 'crush', x: 70, y: 86, scale: 0.85, flip: true },
    ],
    beats: [
      { kind: 'narration', text: '교실에 들어선다.\n걔는 벌써 와 있다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '수업이 시작된다.\n칠판은 안 보이고 뒤통수만 보인다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '쉬는 시간 10분.\n지금 말을 걸면 자연스럽다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },
  {
    id: 'class-alone',
    title: '이 교실엔 걔가 없다',
    label: '오전 · 교실',
    slot: 'class',
    when: { meet: ['school', 'academy', 'outside'] },
    background: {
      src: '/art/scenes/class.webp',
      alt: '1교시 전 교실',
      prompt: '1교시 전 교실. 창가에 아침 햇빛이 길게 들어온다. 책상 위 펼쳐진 교과서와 필통, 학생들 실루엣.',
    },
    cast: [{ who: 'self', x: 50, y: 90 }],
    beats: [
      { kind: 'narration', text: '자리에 앉는다.\n이 교실 안에 걔는 없다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '수업이 시작되고, 창밖을 본다.\n지금 뭐 하고 있을까 같은 걸 생각한다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '쉬는 시간 10분.\n딱히 갈 데가 없다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 학교 ② 급식실 ═══════════════════════════════════ */
  {
    id: 'lunch-near',
    title: '자리가 하나 비어 있다',
    label: '오후 12시 30분 · 급식실',
    slot: 'lunch',
    when: AT_SCHOOL,
    background: {
      src: '/art/scenes/lunch.webp',
      alt: '점심시간 급식실',
      prompt: '점심시간 학교 급식실. 긴 테이블과 식판, 창으로 들어오는 정오의 밝은 빛. 사람들은 뒷모습과 실루엣.',
    },
    cast: [
      { who: 'self', x: 38, y: 90 },
      { who: 'crush', x: 64, y: 87, scale: 0.9, flip: true },
    ],
    beats: [
      { kind: 'narration', text: '식판을 들고 서 있다.\n걔 옆자리가 비어 있다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'line', speaker: '친구', text: '야, 너 아까부터 계속 그쪽 보는데.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '한 다리 건너면 다 아는 사이다.\n소문은 나보다 빠르다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },
  {
    id: 'lunch-far',
    title: '얘기로만 아는 사람',
    label: '오후 12시 30분 · 급식실',
    slot: 'lunch',
    when: AWAY,
    background: {
      src: '/art/scenes/lunch.webp',
      alt: '점심시간 급식실',
      prompt: '점심시간 학교 급식실. 긴 테이블과 식판, 창으로 들어오는 정오의 밝은 빛. 사람들은 뒷모습과 실루엣.',
    },
    cast: [{ who: 'self', x: 44, y: 90 }],
    beats: [
      { kind: 'narration', text: '친구들이랑 밥을 먹는다.\n여기 있는 애들은 걔를 본 적도 없다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'line', speaker: '친구', text: '야, 그 사람 사진 있어? 궁금한데.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '우리 학교엔 소문이 안 난다.\n그게 편하기도 하고, 좀 허전하기도 하다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 학교 ③ 복도 ═════════════════════════════════════ */
  {
    id: 'hall-near',
    title: '스쳐 지나가는 3초',
    label: '오후 · 복도',
    slot: 'hall',
    when: AT_SCHOOL,
    background: {
      src: '/art/scenes/hall.webp',
      alt: '오후 학교 복도',
      prompt: '오후 학교 복도. 창으로 길게 들어오는 늦은 햇빛, 사물함이 늘어선 벽. 인적이 드물어 조용하다.',
    },
    cast: [
      { who: 'self', x: 40, y: 90 },
      { who: 'crush', x: 62, y: 88, scale: 0.95, flip: true },
    ],
    beats: [
      { kind: 'narration', text: '이동수업 종이 울린다.\n복도 저쪽에서 걔가 걸어온다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '3초.\n인사를 하거나, 못 본 척하거나.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'line', speaker: '걔', text: '어, 안녕.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },
  {
    id: 'hall-far',
    title: '복도에선 아무 일도 없다',
    label: '오후 · 복도',
    slot: 'hall',
    when: AWAY,
    background: {
      src: '/art/scenes/hall.webp',
      alt: '오후 학교 복도',
      prompt: '오후 학교 복도. 창으로 길게 들어오는 늦은 햇빛, 사물함이 늘어선 벽. 인적이 드물어 조용하다.',
    },
    cast: [{ who: 'self', x: 48, y: 90 }],
    beats: [
      { kind: 'narration', text: '이동수업 종이 울린다.\n복도를 지나가는 얼굴 중에 아는 얼굴은 없다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '여기선 우연히 마주칠 일이 없다.\n뭐든 내가 만들어야 생긴다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '주머니에서 폰이 한 번 울린다.\n확인하려다 참는다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 하교 후 ══════════════════════════════════════════ */
  {
    id: 'afterschool-near',
    title: '같이 걸을 기회',
    label: '오후 5시 40분 · 하굣길',
    slot: 'afterschool',
    when: AT_SCHOOL,
    background: {
      src: '/art/scenes/afterschool.webp',
      alt: '노을 지는 하굣길',
      prompt: '노을이 짙게 깔린 하굣길. 두 사람의 긴 그림자가 나란히 늘어진 인도. 뒷모습만. 따뜻한 주황빛.',
    },
    cast: [
      { who: 'self', x: 42, y: 90 },
      { who: 'crush', x: 60, y: 90, flip: true },
    ],
    beats: [
      { kind: 'narration', text: '교문을 나선다.\n걔가 같은 방향으로 걷는다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '갈림길까지 딱 12분.\n그 안에 무슨 말이든 해야 한다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '편의점 앞을 지난다.\n들어가자고 하면 10분이 더 생긴다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },
  {
    id: 'afterschool-far',
    title: '만나려면 정해야 한다',
    label: '오후 5시 40분 · 하교 후',
    slot: 'afterschool',
    when: AWAY,
    background: {
      src: '/art/scenes/afterschool.webp',
      alt: '노을 지는 거리',
      prompt: '노을이 깔린 버스정류장 또는 지하철 입구. 혼자 서 있는 학생의 뒷모습, 긴 그림자. 따뜻한 주황빛.',
    },
    cast: [{ who: 'self', x: 50, y: 90 }],
    beats: [
      { kind: 'narration', text: '교문을 나선다.\n걔한테 가려면 버스를 타야 한다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '"오늘 뭐 해?" 한 줄이면 되는데\n그 한 줄이 제일 어렵다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '우연이 없는 사이는\n누가 먼저 정하지 않으면 아무 일도 안 일어난다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 밤 · 폰 — 누구에게나 같다 ═══════════════════════ */
  {
    id: 'night',
    title: '읽음 표시는 떴는데',
    label: '오후 11시 40분 · 침대',
    slot: 'night',
    background: {
      src: '/art/scenes/night.webp',
      alt: '불 꺼진 방, 폰 불빛',
      prompt: '한밤중 불 꺼진 방. 이불 속 폰 화면 불빛만 아래에서 위로 은은하게 비친다. 창밖은 어두운 파랑. 아주 조용하다.',
    },
    cast: [{ who: 'self', x: 50, y: 92 }],
    beats: [
      { kind: 'narration', text: '불을 끄고 누웠다.\n오늘 한 말을 하나씩 다시 돌려본다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '읽음 표시는 떴는데 답이 없다.\n11시 40분.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '폰을 엎어놓는다.\n그래도 계속 신경 쓰인다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 주말 ═════════════════════════════════════════════ */
  {
    id: 'weekend-academy',
    title: '학원 가는 길',
    label: '토요일 오후 · 학원',
    slot: 'weekend',
    when: { meet: 'academy' },
    background: {
      src: '/art/scenes/academy.webp',
      alt: '주말 학원 복도',
      prompt: '주말 오후 학원 건물 복도. 형광등 불빛, 늘어선 강의실 문, 자판기. 가방 멘 학생 몇 명의 뒷모습.',
    },
    cast: [
      { who: 'self', x: 40, y: 90 },
      { who: 'crush', x: 62, y: 88, scale: 0.95, flip: true },
    ],
    beats: [
      { kind: 'narration', text: '주말인데 학원이다.\n대신 여기선 학교에서 못 하던 얘기를 할 수 있다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '쉬는 시간, 자판기 앞에서 마주쳤다.\n여기엔 우리 반 애들이 없다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '수업이 끝나면 같은 방향으로 나가게 된다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },
  {
    id: 'weekend-out',
    title: '교복이 아닌 걸 처음 봤다',
    label: '토요일 오후 · 밖',
    slot: 'weekend',
    when: { meet: ['class', 'school', 'outside'] },
    background: {
      src: '/art/scenes/weekend.webp',
      alt: '주말 오후 번화가',
      prompt: '주말 오후 번화가 거리. 카페와 상점 간판, 사람들. 사복 차림 학생들의 뒷모습. 늦은 오후의 부드러운 빛.',
    },
    cast: [
      { who: 'self', x: 40, y: 90 },
      { who: 'crush', x: 62, y: 88, scale: 0.95, flip: true },
    ],
    beats: [
      { kind: 'narration', text: '주말에 만나기로 했다.\n교복이 아닌 걸 보는 건 처음이다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '학교에서 보던 얼굴인데 좀 다르게 보인다.\n여기선 아무도 우리를 모른다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '해가 기울기 시작한다.\n돌아가자는 말을 누가 먼저 할까.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 데이트 — 누구에게나 같다 ═══════════════════════ */
  {
    id: 'date',
    title: '둘이서만',
    label: '어느 날 · 둘이 있는 곳',
    slot: 'date',
    background: {
      src: '/art/scenes/date.webp',
      alt: '해질 무렵 둘이 있는 자리',
      prompt: '해질 무렵 강변이나 공원 벤치. 나란히 앉은 두 사람의 뒷모습, 사이에 살짝 벌어진 간격. 하늘은 분홍에서 보라로.',
    },
    cast: [
      { who: 'self', x: 44, y: 90 },
      { who: 'crush', x: 58, y: 90, flip: true },
    ],
    beats: [
      { kind: 'narration', text: '둘이서만 있는 시간이 생겼다.\n이제 우연이 아니다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '할 말을 미리 생각해뒀는데\n막상 만나니까 하나도 기억이 안 난다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '돌아가는 길.\n오늘을 어떻게 기억하게 될지 아직 모른다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },
];
