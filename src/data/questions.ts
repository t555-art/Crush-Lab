import type { Question } from '../engine/types';

/**
 * 본 문항.
 *
 * ── 지금 상태: 1단계 수직 슬라이스 32개 ──
 * 목표는 380개지만, 프레임워크가 버티는지 먼저 확인하려고 32개만 썼다.
 * `class`(교실) · `night`(밤·폰) 두 slot 에 축 4개 × 주요 분기를 전부 관통시켰다.
 * 여기서 규약이 틀린 게 나오면 32개만 고치면 된다.
 * (지난 설계에서 364개를 통째로 버린 적이 있다)
 *
 * ── 집필 규약은 docs/DESIGN.md 에 있다. 요약하면 ──
 *   · 선택지 4개 고정, 22자 이내       화면 높이가 매번 바뀌면 눈이 피로하다
 *   · 한 문항은 한 축만               aspect 를 하나만 적는다
 *   · 선택지 점수는 그 축에서 갈려야   전부 같으면 안 재는 문항이다
 *   · 조건부(show)는 반드시 짝으로     한쪽만 쓰면 반대편 사람 자리가 빈다
 *   · 상대는 '걔' · '그 사람'          성별 중립. 동성을 좋아해도 그대로 읽힌다
 *
 * ── 축 헷갈리지 말 것 ──
 *   avoid = 가까워지는 것 **자체**가 불편한가   (속마음 · 의존 · 거리)
 *   move  = 먼저 **움직이는가**                (말 걸기 · 연락 · 약속)
 * 3년째 혼자 좋아하는 사람은 avoid 낮고 move 낮다. 둘은 다른 축이다.
 *
 * ── id 규칙 ──
 *   c-  class(교실) slot / n-  night(밤·폰) slot
 *   anx 신호민감도 / avo 거리조절 / mov 행동 / tem 속도
 */
export const QUESTIONS: Question[] = [

  /* ══════════════════════════════════════════════════════
     교실 — 오전. 근접·반복노출이 작동하는 자리
     ══════════════════════════════════════════════════════ */

  /* ── 신호 민감도 ────────────────────────────────────── */
  {
    id: 'c-anx-01', kind: 'choice', aspect: 'anxiety', slots: ['class'],
    text: '쉬는 시간에 걔가 내 쪽을 봤다.\n눈이 마주친 건지는 확실하지 않다.',
    options: [
      { text: '남은 수업 내내 그 생각만 한다', score: { anxiety: 3 }, tags: ['reject'] },
      { text: '몇 번 다시 떠올린다', score: { anxiety: 1 } },
      { text: '기분은 좋은데 금방 잊는다', score: { anxiety: -1 } },
      { text: '봤는지 아닌지 신경 안 쓴다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'c-anx-02', kind: 'scale', aspect: 'anxiety', slots: ['class'],
    text: '걔가 내 인사를 안 받아주면\n하루 종일 그게 걸린다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { anxiety: 3 },
  },
  {
    id: 'c-anx-03', kind: 'choice', aspect: 'anxiety', slots: ['class'],
    show: { meet: 'class' },
    text: '같은 반이라 하루에도 몇 번씩 마주친다.\n그게 너한테는?',
    options: [
      { text: '매번 심장이 뛴다. 익숙해지질 않는다', score: { anxiety: 3 } },
      { text: '볼 때마다 조금씩 신경 쓰인다', score: { anxiety: 1 } },
      { text: '이제 좀 익숙해졌다', score: { anxiety: -1 } },
      { text: '그냥 같은 반 애다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'c-anx-04', kind: 'choice', aspect: 'anxiety', slots: ['class'],
    show: { meet: ['school', 'academy', 'outside'] },
    text: '오늘은 걔를 볼 일이 없는 날이다.\n그런 날 너는?',
    options: [
      { text: '하루 종일 폰만 들여다본다', score: { anxiety: 3 }, tags: ['reject'] },
      { text: '문득문득 생각난다', score: { anxiety: 1 } },
      { text: '평소랑 별로 다르지 않다', score: { anxiety: -1 } },
      { text: '오히려 편하다', score: { anxiety: -3 } },
    ],
  },

  /* ── 거리 조절 ──────────────────────────────────────── */
  {
    id: 'c-avo-01', kind: 'choice', aspect: 'avoid', slots: ['class'],
    text: '친구가 요즘 무슨 일 있냐고 묻는다.\n사실 걔 때문에 정신이 없다.',
    options: [
      { text: '아무 일 없다고 한다', score: { avoid: 3 } },
      { text: '있다고만 하고 안 말한다', score: { avoid: 1 } },
      { text: '눈치 보다가 조금 흘린다', score: { avoid: -1 } },
      { text: '그냥 다 말한다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'c-avo-02', kind: 'scale', aspect: 'avoid', slots: ['class'], pair: 'open-up',
    text: '내 속마음은 웬만하면 안 꺼낸다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { avoid: 3 },
  },
  {
    id: 'c-avo-03', kind: 'choice', aspect: 'avoid', slots: ['class'],
    show: { school: 'boys' },
    text: '남고라 연애 얘기가 돌면 다 부풀려진다.\n네 얘기가 나올 것 같으면?',
    options: [
      { text: '아예 없던 일로 만든다', score: { avoid: 3 } },
      { text: '웃어넘기고 화제를 돌린다', score: { avoid: 1 } },
      { text: '친한 애한테만 따로 말한다', score: { avoid: -1 } },
      { text: '어차피 알 거 그냥 인정한다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'c-avo-04', kind: 'choice', aspect: 'avoid', slots: ['class'],
    show: { school: ['girls', 'co'] },
    text: '누가 "너 걔 좋아하지?" 하고 훅 들어왔다.\n주변에 애들이 있다.',
    options: [
      { text: '정색하고 아니라고 한다', score: { avoid: 3 } },
      { text: '웃기만 하고 대답 안 한다', score: { avoid: 1 } },
      { text: '"왜?" 하고 되묻는다', score: { avoid: -1 } },
      { text: '그냥 맞다고 한다', score: { avoid: -3 } },
    ],
  },

  /* ── 행동 ───────────────────────────────────────────── */
  {
    id: 'c-mov-01', kind: 'choice', aspect: 'move', slots: ['class'], pair: 'reach-out',
    text: '말을 걸 기회가 생겼다.\n자연스러우려면 지금이어야 한다.',
    options: [
      { text: '바로 말 건다', score: { move: 3 } },
      { text: '지나가는 척 근처로 간다', score: { move: 1 } },
      { text: '눈치만 보다 만다', score: { move: -1 }, tags: ['mga'] },
      { text: '다음 기회를 기다린다', score: { move: -3 }, tags: ['mga'] },
    ],
  },
  {
    id: 'c-mov-02', kind: 'choice', aspect: 'move', slots: ['class'],
    text: '조별 과제 짝을 알아서 정하라고 한다.\n걔랑 같은 조가 될 수도 있다.',
    options: [
      { text: '직접 가서 같이 하자고 한다', score: { move: 3 } },
      { text: '친구를 시켜서 엮이게 한다', score: { move: 1 } },
      { text: '근처에서 정해지길 기다린다', score: { move: -1 } },
      { text: '아무것도 안 한다', score: { move: -3 } },
    ],
  },
  {
    id: 'c-mov-03', kind: 'choice', aspect: 'move', slots: ['class'],
    show: { meet: 'class' },
    text: '걔 옆자리가 비어 있다.\n지금이면 앉아도 이상하지 않다.',
    options: [
      { text: '가서 앉는다', score: { move: 3 } },
      { text: '한 자리 건너 앉는다', score: { move: 1 } },
      { text: '고민하다 원래 자리로 간다', score: { move: -1 } },
      { text: '쳐다도 안 본다', score: { move: -3 }, tags: ['mga'] },
    ],
  },
  {
    id: 'c-mov-04', kind: 'choice', aspect: 'move', slots: ['class'],
    show: { meet: ['school', 'academy', 'outside'] },
    text: '걔한테 연락할 구실이 하나 생겼다.\n딱히 급한 건 아니다.',
    options: [
      { text: '바로 보낸다', score: { move: 3 } },
      { text: '문장 다듬어서 보낸다', score: { move: 1 } },
      { text: '썼다가 지운다', score: { move: -1 }, tags: ['mga'] },
      { text: '구실이 약하다고 접는다', score: { move: -3 } },
    ],
  },

  /* ── 속도 ───────────────────────────────────────────── */
  {
    id: 'c-tem-01', kind: 'choice', aspect: 'tempo', slots: ['class'],
    text: '괜찮아 보이는 사람이 생겼다.\n안 지는 아직 며칠 안 됐다.',
    options: [
      { text: '벌써 좋아하는 것 같다', score: { tempo: 3 } },
      { text: '관심은 확실히 간다', score: { tempo: 1 } },
      { text: '좀 더 봐야 알겠다', score: { tempo: -1 } },
      { text: '이 정도로는 아무것도 아니다', score: { tempo: -3 } },
    ],
  },
  {
    id: 'c-tem-02', kind: 'choice', aspect: 'tempo', slots: ['class'],
    text: '누가 괜찮아 보일 때\n제일 먼저 확인하게 되는 건?',
    options: [
      { text: '없다. 느낌이 오면 그걸로 끝', score: { tempo: 3 } },
      { text: '나한테 관심 있는지', score: { tempo: 1 } },
      { text: '평소에 남들한테 어떻게 하는지', score: { tempo: -1 } },
      { text: '나랑 오래 갈 사람인지', score: { tempo: -3 } },
    ],
  },
  {
    id: 'c-tem-03', kind: 'scale', aspect: 'tempo', slots: ['class'],
    text: '좋다고 느끼면 그날로 확신이 선다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { tempo: 3 },
  },
  {
    id: 'c-tem-04', kind: 'choice', aspect: 'tempo', slots: ['class'],
    text: '친구가 "쟤 좀 괜찮지 않냐" 한다.\n생각해본 적 없는 사람이다.',
    options: [
      { text: '듣고 보니 그런 것 같다', score: { tempo: 3 } },
      { text: '한번 다시 보게 된다', score: { tempo: 1 } },
      { text: '남 말로는 안 바뀐다', score: { tempo: -1 } },
      { text: '오히려 더 안 보게 된다', score: { tempo: -3 } },
    ],
  },

  /* ══════════════════════════════════════════════════════
     밤 · 폰 — 자기개방이 일어나는 자리
     ══════════════════════════════════════════════════════ */

  /* ── 신호 민감도 ────────────────────────────────────── */
  {
    id: 'n-anx-01', kind: 'choice', aspect: 'anxiety', slots: ['night'],
    text: '읽음 표시는 떴는데 답이 없다.\n30분째다.',
    options: [
      { text: '뭘 잘못 보냈나 계속 다시 읽는다', score: { anxiety: 3 }, tags: ['reject'] },
      { text: '신경은 쓰이는데 그냥 둔다', score: { anxiety: 1 } },
      { text: '바쁜가 보다 한다', score: { anxiety: -1 } },
      { text: '언제 답 왔는지도 모른다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'n-anx-02', kind: 'choice', aspect: 'anxiety', slots: ['night'],
    text: '걔가 스토리를 올렸다.\n내 톡에는 아직 답이 없는 상태다.',
    options: [
      { text: '무슨 뜻인지 계속 해석한다', score: { anxiety: 3 }, tags: ['reject'] },
      { text: '좀 서운하다', score: { anxiety: 1 } },
      { text: '볼 건 보고 넘긴다', score: { anxiety: -1 } },
      { text: '별생각 없다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'n-anx-03', kind: 'choice', aspect: 'anxiety', slots: ['night'],
    show: { gender: 'm' },
    text: '보낸 톡이 재미없었나 싶다.\n이불 속에서 그 생각이 든다.',
    options: [
      { text: '대화를 처음부터 다시 읽어본다', score: { anxiety: 3 } },
      { text: '다음엔 다르게 써야지 한다', score: { anxiety: 1 } },
      { text: '그럴 수도 있지 하고 만다', score: { anxiety: -1 } },
      { text: '그런 생각 자체를 안 한다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'n-anx-04', kind: 'choice', aspect: 'anxiety', slots: ['night'],
    show: { gender: 'f' },
    text: '아까 한 말이 좀 과했나 싶다.\n이불 속에서 그 생각이 든다.',
    options: [
      { text: '대화를 처음부터 다시 읽어본다', score: { anxiety: 3 } },
      { text: '내일 자연스럽게 수습해야지 한다', score: { anxiety: 1 } },
      { text: '그럴 수도 있지 하고 만다', score: { anxiety: -1 } },
      { text: '그런 생각 자체를 안 한다', score: { anxiety: -3 } },
    ],
  },

  /* ── 거리 조절 ──────────────────────────────────────── */
  {
    id: 'n-avo-01', kind: 'choice', aspect: 'avoid', slots: ['night'], pair: 'open-up',
    text: '새벽에 힘든 일이 생겼다.\n걔한테 말할 수도 있다.',
    options: [
      { text: '절대 안 한다. 부담 주기 싫다', score: { avoid: 3 } },
      { text: '괜찮은 척 다른 얘기를 꺼낸다', score: { avoid: 1 } },
      { text: '조금 돌려서 말한다', score: { avoid: -1 } },
      { text: '그냥 힘들다고 말한다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'n-avo-02', kind: 'choice', aspect: 'avoid', slots: ['night'],
    text: '걔가 자기 고민을 길게 털어놨다.\n생각보다 무거운 얘기다.',
    options: [
      { text: '부담스러워서 거리를 둔다', score: { avoid: 3 } },
      { text: '들어는 주되 선은 지킨다', score: { avoid: 1 } },
      { text: '고맙다. 더 가까워진 느낌이다', score: { avoid: -1 } },
      { text: '나도 내 얘기를 꺼낸다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'n-avo-03', kind: 'scale', aspect: 'avoid', slots: ['night'],
    text: '누가 나한테 너무 가까워지면\n슬슬 부담스러워진다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { avoid: 3 },
  },
  {
    id: 'n-avo-04', kind: 'choice', aspect: 'avoid', slots: ['night'],
    text: '걔가 "너는 어떤 사람이야?" 하고 물었다.\n새벽 한 시다.',
    options: [
      { text: '적당히 웃기게 넘긴다', score: { avoid: 3 } },
      { text: '남들 다 아는 것만 말한다', score: { avoid: 1 } },
      { text: '조금 진짜 얘기를 섞는다', score: { avoid: -1 } },
      { text: '이때다 싶어 길게 답한다', score: { avoid: -3 } },
    ],
  },

  /* ── 행동 ───────────────────────────────────────────── */
  {
    id: 'n-mov-01', kind: 'scale', aspect: 'move', slots: ['night'], pair: 'reach-out',
    text: '먼저 연락하는 일은 거의 없다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    // 동의할수록 '관망' 쪽이므로 음수
    weight: { move: -3 },
  },
  {
    id: 'n-mov-02', kind: 'choice', aspect: 'move', slots: ['night'],
    text: '대화가 끊겼다.\n마지막 톡은 걔가 보낸 "ㅇㅇ" 이다.',
    options: [
      { text: '새 얘기를 바로 꺼낸다', score: { move: 3 } },
      { text: '한참 뒤에 슬쩍 다시 건다', score: { move: 1 } },
      { text: '걔가 먼저 하길 기다린다', score: { move: -1 } },
      { text: '이대로 끝나면 끝나는 거다', score: { move: -3 } },
    ],
  },
  {
    id: 'n-mov-03', kind: 'choice', aspect: 'move', slots: ['night'],
    show: { school: ['boys', 'girls'] },
    text: '학교에선 볼 일이 없으니\n만나려면 누가 정해야 한다.',
    options: [
      { text: '내가 날짜까지 잡아서 말한다', score: { move: 3 } },
      { text: '"언제 한번 보자" 정도는 던진다', score: { move: 1 } },
      { text: '상대가 먼저 말하길 기다린다', score: { move: -1 } },
      { text: '어차피 안 될 것 같아 안 꺼낸다', score: { move: -3 }, tags: ['mga'] },
    ],
  },
  {
    id: 'n-mov-04', kind: 'choice', aspect: 'move', slots: ['night'],
    show: { school: 'co' },
    text: '내일 학교에서 자연스럽게 말 걸 방법을\n지금 미리 생각하고 있다.',
    options: [
      { text: '생각만 하지 말고 톡을 먼저 보낸다', score: { move: 3 } },
      { text: '내일 할 말을 정해둔다', score: { move: 1 } },
      { text: '상황 봐서 되면 하는 걸로 둔다', score: { move: -1 } },
      { text: '어차피 못 할 걸 안다', score: { move: -3 }, tags: ['mga'] },
    ],
  },

  /* ── 속도 ───────────────────────────────────────────── */
  {
    id: 'n-tem-01', kind: 'choice', aspect: 'tempo', slots: ['night'],
    text: '오늘 처음 길게 대화를 했다.\n생각보다 잘 통했다.',
    options: [
      { text: '이 사람이다 싶다', score: { tempo: 3 } },
      { text: '많이 기대된다', score: { tempo: 1 } },
      { text: '아직 한 번인데 뭘', score: { tempo: -1 } },
      { text: '말 잘 통하는 거랑은 별개다', score: { tempo: -3 } },
    ],
  },
  {
    id: 'n-tem-02', kind: 'choice', aspect: 'tempo', slots: ['night'],
    text: '마음이 식을 때는 보통 어떻게 식어?',
    options: [
      { text: '식은 적이 없다. 늘 끝까지 간다', score: { tempo: -3 } },
      { text: '오래 걸리고 천천히 식는다', score: { tempo: -1 } },
      { text: '어느 날 갑자기 그냥 식는다', score: { tempo: 1 } },
      { text: '뜨거워진 만큼 빨리 식는다', score: { tempo: 3 }, tags: ['ludus'] },
    ],
  },
  {
    id: 'n-tem-03', kind: 'scale', aspect: 'tempo', slots: ['night'],
    text: '한 사람을 오래 좋아하는 편이다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    // 동의할수록 '늦사빠' 쪽이므로 음수
    weight: { tempo: -3 },
  },
  {
    id: 'n-tem-04', kind: 'choice', aspect: 'tempo', slots: ['night'],
    text: '자기 전에 좋아하는 사람 생각을 한 지\n얼마나 됐어?',
    options: [
      { text: '며칠 안 됐다', score: { tempo: 3 } },
      { text: '몇 주쯤', score: { tempo: 1 } },
      { text: '몇 달째다', score: { tempo: -1 } },
      { text: '해가 바뀌었다', score: { tempo: -3 } },
    ],
  },
];
