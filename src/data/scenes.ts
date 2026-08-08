import type { Scene } from '../engine/types';

/**
 * 서사 — 생활 상황을 따라간다.
 * 등교 전 → 학교(교실·급식실·복도) → 하교 후 → 밤 → 주말/학원 → 데이트
 *
 * ── 왜 이 순서인가 ──  ★ 그냥 하루 순서가 아니다
 * 끌림이 실제로 만들어지는 기제가 심리학에서 셋으로 정리돼 있는데,
 * 그게 장소 순서와 그대로 겹친다.
 *
 *   ① 근접·반복노출(mere exposure) — 가까이 있고 자주 보면 호감이 생긴다
 *        → 교실·급식실·복도. 매일 같은 공간에 있다는 것 자체가 재료다
 *   ② 상호성(reciprocity) — 상대가 나에게 관심 있다는 신호 하나면 끌림이 켜진다
 *        눈길 한 번, 질문 하나, 칭찬 한 마디로 충분하다고 보고돼 있다
 *        → 하교 후. 우연을 가장한 신호가 오가는 자리
 *   ③ 자기개방(self-disclosure) — 속마음을 **서로** 주고받아야 친밀해진다
 *        일방적이면 효과가 없다는 게 반복 검증됐다
 *        → 밤·폰. 낮에 못 하는 말이 여기서 나온다
 *   그다음이 의도적 만남(주말·학원)과 관계 성립(데이트)이다.
 *
 * 즉 **장소가 사적인 정도 = 관계의 진행도**다.
 * 교실(공개, 또래가 봄) → 하굣길(둘만, 우연) → 폰(사적, 밤) →
 * 주말(의도적 약속) → 데이트(관계 확정).
 * 학년이나 날짜를 세지 않아도 진행이 된다.
 *
 * ── 분량 ──
 * 장면 10개 × 문항 7개 = 70. 한 명이 답하는 양이 60~70이 되게 잡았다.
 * (SURVEY.maxPerScene 이 8이라 장면당 8을 넘지 못한다)
 *
 * ── slot ──
 * 문항의 `slots` 가 여기 `slot` 값을 가리킨다. 이 이름이 계약이다.
 *   morning · commute · class · lunch · hall · afterschool · night · weekend · date
 *
 * `weekend` 는 장면이 둘인데 slot 이 같다. 학원에서 보는 사이인 사람과
 * 아닌 사람에게 지문만 다르게 나가고 **문항 수는 똑같이 7개**다.
 * 조건부 장면을 만들 때는 항상 이렇게 짝을 맞춘다 — 안 그러면 그 사람만 검사가 짧아진다.
 *
 * ── 일러스트 ──
 * `background.prompt` 가 이미지 생성용 지시문이다. ART_STYLE 을 앞에 붙여서 생성한다.
 * 장면 안에서 특별히 그림이 붙을 문항은 `tags: ['art']` 로 표시한다 (docs/DESIGN.md).
 */

export const ART_STYLE =
  '세로 9:16 모바일 배경. 한국 고등학교를 배경으로 한 부드러운 애니메이션 일러스트. ' +
  '인물 얼굴은 클로즈업하지 않는다 — 뒷모습·실루엣·시선 밖으로. ' +
  '화면 아래 40%는 글씨가 올라갈 자리라 밝고 단순하게 비워둘 것. ' +
  '채도 낮은 파스텔, 부드러운 빛번짐, 얇은 선.';

export const SCENES: Scene[] = [
  /* ══ 등교 전 ══════════════════════════════════════════ */
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
      { kind: 'narration', text: '가방을 메고 나선다.\n오늘도 그 사람을 볼 것이다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 등굣길 ═══════════════════════════════════════════ */
  {
    id: 'commute',
    title: '저 앞에 보인다',
    label: '오전 7시 50분 · 등굣길',
    slot: 'commute',
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

  /* ══ 학교 ① 교실 ═════════════════════════════════════ */
  {
    id: 'class',
    title: '같은 공간, 다른 온도',
    label: '오전 · 교실',
    slot: 'class',
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

  /* ══ 학교 ② 급식실 ═══════════════════════════════════ */
  {
    id: 'lunch',
    title: '자리가 하나 비어 있다',
    label: '오후 12시 30분 · 급식실',
    slot: 'lunch',
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

  /* ══ 학교 ③ 복도·이동수업 ════════════════════════════ */
  {
    id: 'hall',
    title: '스쳐 지나가는 3초',
    label: '오후 · 복도',
    slot: 'hall',
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

  /* ══ 하교 후 ══════════════════════════════════════════ */
  {
    id: 'afterschool',
    title: '같이 걸을 기회',
    label: '오후 5시 40분 · 하굣길',
    slot: 'afterschool',
    background: {
      src: '/art/scenes/afterschool.webp',
      alt: '노을 지는 하굣길',
      prompt: '노을이 짙게 깔린 하굣길. 두 사람의 긴 그림자가 나란히 늘어진 인도. 뒷모습만. 따뜻한 주황빛.',
    },
    cast: [
      { who: 'self', x: 42, y: 90 },
      { who: 'crush', x: 60, y: 90, scale: 1, flip: true },
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

  /* ══ 밤 · 폰 ══════════════════════════════════════════ */
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

  /* ══ 주말 — 학원에서 보는 사이 ═══════════════════════ */
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
      { kind: 'narration', text: '쉬는 시간에 자판기 앞에서 마주쳤다.\n여기엔 우리 반 애들이 없다.' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'question' },
      { kind: 'narration', text: '수업이 끝나면 같은 방향으로 나가게 된다.' },
      { kind: 'question' },
      { kind: 'question' },
    ],
  },

  /* ══ 주말 — 그 외 (지문만 다르고 slot·문항 수는 같다) ══ */
  {
    id: 'weekend-out',
    title: '학교 밖에서 보는 건 처음이다',
    label: '토요일 오후 · 밖',
    slot: 'weekend',
    when: { meet: '!academy' },
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

  /* ══ 데이트 ═══════════════════════════════════════════ */
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
      { who: 'crush', x: 58, y: 90, scale: 1, flip: true },
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
