import type { Scene } from '../engine/types';

/**
 * 하루 서사 — 아침부터 밤까지.
 *
 * v1은 문항 100개를 챕터별로 쏟아냈고, 돌려본 사람들이 길다고 했다.
 * v2는 "좋아하는 애가 있는 하루"를 따라가면서 그 상황에 맞는 문항만 묻는다.
 * 장면 7개 × 문항 5개 = 35개. 분량이 3분의 1로 줄고 맥락이 생긴다.
 *
 * 35개인 이유: 축이 4개라 축당 8문항쯤은 있어야 판정이 흔들리지 않는다.
 * 더 줄이면 결과가 찍기와 구별이 안 되고, 더 늘리면 v1의 문제로 돌아간다.
 *
 * ── 장면이 문항을 고르는 방식 ───────────────────────────
 * 장면마다 두 가지를 선언한다. 이 둘이 만나는 문항만 그 장면에 나온다.
 *
 *   accepts  어느 자리의 문항을 받을지 (시간·장소)
 *   stages   어느 관계 단계를 다룰지 (문항의 ch)
 *
 * 예전에는 "1장면 = 1뱅크" 로 못박혀 있었다. 뱅크가 관계 단계로 나뉘어 있어서
 * 하루 안에 연애 전체 아크가 강제로 들어갔고, 그래서 17:40 하굣길에서
 * "사귄 지 한 달" 을 묻는 일이 생겼다. 축을 둘로 분리해서 그걸 푼다.
 *
 * stages 를 뱅크 파일이 아니라 ch 로 적는 것도 이유가 있다 —
 * pool-extra 의 186문항에도 ch 가 붙어 있어서, 이렇게 해야 같이 뽑힌다.
 * (뱅크로 고정하던 시절엔 이 문항들이 한 번도 출제되지 않았다)
 *
 * ── 고치는 법 ──────────────────────────────────────────
 * 대사·지문을 바꾸려면      : 아래 beats 의 text 만 고치면 된다
 * 문항 수를 바꾸려면        : question 비트를 넣거나 빼면 된다
 * 장면에 맞는 문항을 바꾸려면 : accepts / stages 를 고친다
 * 특정 문항을 고정하려면     : slot 에 id 를 준다
 * 뽑는 규칙 자체를 바꾸려면  : engine/select.ts (이 파일은 안 건드려도 된다)
 * 그림을 바꾸려면           : art.src 를 실제 이미지 경로로 교체
 *
 * ART_STYLE 은 7장이 한 세트로 보이게 하는 공통 지시문이다.
 * 장면별 prompt 앞에 붙여서 생성한다. (docs/ART-MANIFEST.md 참고)
 */

export const ART_STYLE =
  '세로 9:16 모바일 배경. 한국 고등학교 배경의 부드러운 애니메이션 일러스트. ' +
  '인물 얼굴은 클로즈업하지 않고 뒷모습이나 실루엣 위주. ' +
  '화면 아래 1/3은 텍스트가 올라갈 자리라 밝고 단순하게 비워둘 것. ' +
  '채도 낮은 파스텔, 부드러운 빛번짐, 선은 얇게.';

export const SCENES: Scene[] = [
  {
    id: 'dawn',
    time: '07:10',
    place: '내 방',
    title: '눈을 뜬다',
    accepts: ['room', 'phone', 'any'],
    stages: [1],   // 혼자 있는 아침. 폰부터 확인하는 자리라 phone 도 받는다
    art: {
      src: '/art/scenes/dawn.svg',
      alt: '이른 아침 햇빛이 들어오는 방',
      prompt: '이른 아침 커튼 사이로 옅은 햇빛이 들어오는 학생 방. 침대 위에 던져진 교복. 창밖은 아직 푸르스름함.',
    },
    beats: [
      { kind: 'narration', text: '알람이 울린다.\n눈 뜨자마자 폰부터 확인한다.' },
      { kind: 'narration', text: '읽지 않은 알림 12개.\n근데 네가 찾는 그 이름은 없다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '거울 앞에 선다.\n오늘은 왠지 좀 신경 쓰인다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '가방을 메고 나선다.' },
      { kind: 'question', slot: {} },
    ],
  },
  {
    id: 'commute',
    time: '07:50',
    place: '등굣길',
    title: '멀리서 보인다',
    accepts: ['road', 'phone', 'any'],
    stages: [2],   // 오가는 길. 걸으면서 폰도 본다
    art: {
      src: '/art/scenes/commute.svg',
      alt: '아침 등굣길 골목',
      prompt: '아침 등굣길. 교복 입은 학생들이 드문드문 걸어가는 골목길. 멀리 학교 정문. 뒷모습 위주.',
    },
    beats: [
      { kind: 'narration', text: '횡단보도 앞.\n저 앞에 익숙한 뒷모습이 보인다.' },
      { kind: 'narration', text: '뛰면 따라잡을 수 있는 거리다.\n안 뛰면 그냥 모르는 사이로 학교까지 간다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '신호가 바뀐다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'line', speaker: '친구', text: '뭘 그렇게 봐?' },
      { kind: 'question', slot: {} },
    ],
  },
  {
    id: 'classroom',
    time: '08:40',
    place: '교실',
    title: '같은 공간, 다른 온도',
    accepts: ['class', 'any'],
    stages: [3],   // 걔가 눈앞에 있는 장면이다. 폰 문항을 받으면 5개가 전부 DM 얘기로 차서
                   //  "계속 그쪽 보는데" 라는 지문이 무의미해진다. 폰은 밤 장면으로 보낸다
    art: {
      src: '/art/scenes/classroom.svg',
      alt: '아침 교실',
      prompt: '1교시 전 교실. 창가 자리에 아침 햇빛. 책상 위 펼쳐진 교과서와 필통. 학생들 실루엣.',
    },
    beats: [
      { kind: 'narration', text: '교실에 들어선다.\n걔는 벌써 와 있다.' },
      { kind: 'line', speaker: '친구', text: '야, 너 아까부터 계속 그쪽 보는데.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '수업이 시작된다.\n칠판은 안 보이고 뒤통수만 보인다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '쉬는 시간 10분.\n지금 말을 걸면 자연스럽다.' },
      { kind: 'question', slot: {} },
    ],
  },
  {
    id: 'lunch',
    time: '12:30',
    place: '급식실',
    title: '자리가 하나 비어 있다',
    accepts: ['meal', 'any'],
    stages: [4],   // 급식실. 밥 먹는 자리에서 폰만 보고 있진 않다
    art: {
      src: '/art/scenes/lunch.svg',
      alt: '점심시간 급식실',
      prompt: '점심시간 학교 급식실. 긴 테이블과 식판. 창으로 들어오는 정오의 밝은 빛. 사람들은 뒷모습·실루엣.',
    },
    beats: [
      { kind: 'narration', text: '식판을 들고 서 있다.\n걔 옆자리가 비어 있다.' },
      { kind: 'narration', text: '자연스러워 보이려면 지금 움직여야 한다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '대화가 시작된다.\n생각보다 잘 이어진다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'line', speaker: '걔', text: '너 원래 이렇게 말 많았나?' },
      { kind: 'question', slot: {} },
    ],
  },
  {
    id: 'afternoon',
    time: '15:20',
    place: '복도',
    title: '둘만 남는 순간',
    accepts: ['hall', 'any'],
    stages: [4, 5],   // 둘만 남은 복도. 폰 볼 상황이 아니라 accepts 에서 phone 을 뺐다.
                      //  썸의 긴장과 고백 직전이 둘 다 어울리는 자리다
    art: {
      src: '/art/scenes/afternoon.svg',
      alt: '오후 학교 복도',
      prompt: '오후 학교 복도. 창으로 길게 들어오는 늦은 오후 햇빛과 사물함. 인적이 드물어 조용한 분위기.',
    },
    beats: [
      { kind: 'narration', text: '청소 당번이 겹쳤다.\n복도에 둘만 남았다.' },
      { kind: 'narration', text: '아무 말도 안 하면 이대로 끝난다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'line', speaker: '걔', text: '너 오늘 좀 이상한데?' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '창밖이 슬슬 붉어진다.' },
      { kind: 'question', slot: {} },
    ],
  },
  {
    id: 'walkhome',
    time: '17:40',
    place: '하굣길',
    title: '같이 걸을 기회',
    accepts: ['road', 'phone', 'any'],
    stages: [3, 5],   // "갈림길까지 12분" 은 고백 직전의 압박이다.
                      //  ch6(연애 중)을 여기 두면 아직 사귀지도 않았는데 애인 얘기를 묻게 된다.
                      //  ch3 를 넣은 건 우산·편의점·눈 오는 하교길 문항이 전부 ch3 여서다
    art: {
      src: '/art/scenes/walkhome.svg',
      alt: '노을 지는 하굣길',
      prompt: '노을이 짙게 깔린 하굣길. 두 사람의 긴 그림자가 나란히 늘어진 인도. 뒷모습만. 따뜻한 주황빛.',
    },
    beats: [
      { kind: 'narration', text: '교문을 나선다.\n걔가 같은 방향으로 걷는다.' },
      { kind: 'narration', text: '갈림길까지 딱 12분.\n그 안에 무슨 말이든 해야 한다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '편의점 앞을 지난다.\n들어가자고 하면 10분이 더 생긴다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '갈림길이 보인다.' },
      { kind: 'question', slot: {} },
    ],
  },
  {
    id: 'night',
    time: '23:10',
    place: '침대 위',
    title: '오늘을 되감는다',
    accepts: ['room', 'phone', 'any'],
    stages: [7, 3, 6, 4],   // 되감는 자리. 회고 프레임이라 단계를 안 가린다 —
                            //  짝사랑 불안·썸의 애매함·연애 반추·이별 회상이 다 여기서 자연스럽다.
                            //  ch4 를 넣은 건 "밤 11시다" 처럼 본문이 밤을 지목하는 폰 문항 때문
    art: {
      src: '/art/scenes/night.svg',
      alt: '불 꺼진 방, 폰 불빛',
      prompt: '한밤중 불 꺼진 방. 이불 속 폰 화면 불빛만 얼굴 아래를 비춤. 창밖은 어두운 파랑. 아주 조용한 분위기.',
    },
    beats: [
      { kind: 'narration', text: '불을 끄고 누웠다.\n오늘 한 말을 하나씩 다시 돌려본다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '읽음 표시는 떴는데 답이 없다.' },
      { kind: 'question', slot: {} },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '폰을 엎어놓는다.\n그래도 계속 신경 쓰인다.' },
      { kind: 'question', slot: {} },
      { kind: 'narration', text: '내일 또 같은 교실에서 만난다.' },
    ],
  },
];

/** 장면들이 요구하는 문항 자리 총 개수 */
export const QUESTION_COUNT = SCENES.reduce(
  (n, s) => n + s.beats.filter(b => b.kind === 'question').length,
  0
);
