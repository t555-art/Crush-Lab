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
    id: 'n-anx-01', kind: 'choice', aspect: 'anxiety', slots: ['night'], pair: 'phone-check',
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

  /* ══════════════════════════════════════════════════════
     등교 전 — 07:10 내 방. 아직 아무도 안 만난 시간
     하루의 기저선이자, 오늘을 앞둔 기대와 불안이 나오는 자리
     ══════════════════════════════════════════════════════ */

  /* ── 신호 민감도 ────────────────────────────────────── */
  {
    id: 'mo-anx-01', kind: 'scale', aspect: 'anxiety', slots: ['morning'], pair: 'phone-check',
    text: '눈 뜨자마자 폰부터 확인한다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { anxiety: 3 },
  },
  {
    id: 'mo-anx-02', kind: 'choice', aspect: 'anxiety', slots: ['morning'],
    text: '어젯밤에 보낸 톡에 아직 답이 없다.\n읽기는 읽었다.',
    options: [
      { text: '오늘 하루가 이걸로 시작된다', score: { anxiety: 3 }, tags: ['reject'] },
      { text: '신경 쓰이는데 준비부터 한다', score: { anxiety: 1 } },
      { text: '자느라 못 봤겠지 한다', score: { anxiety: -1 } },
      { text: '보낸 것도 잊고 있었다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'mo-anx-03', kind: 'choice', aspect: 'anxiety', slots: ['morning'],
    text: '오늘 걔를 보게 될 거라는 생각이 든다.\n지금 기분은?',
    options: [
      { text: '벌써 긴장돼서 속이 안 좋다', score: { anxiety: 3 } },
      { text: '조금 설렌다', score: { anxiety: 1 } },
      { text: '평소 아침이랑 비슷하다', score: { anxiety: -1 } },
      { text: '딱히 아무 생각 없다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'mo-anx-04', kind: 'choice', aspect: 'anxiety', slots: ['morning'],
    show: { status: ['some', 'dating'] },
    text: '어제까지 매일 오던 아침 인사가\n오늘은 없다.',
    options: [
      { text: '뭐 잘못했나 처음부터 되짚는다', score: { anxiety: 3 }, tags: ['reject'] },
      { text: '먼저 보낼까 한참 고민한다', score: { anxiety: 1 } },
      { text: '늦잠 잤겠거니 한다', score: { anxiety: -1 } },
      { text: '없었는지도 몰랐다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'mo-anx-05', kind: 'choice', aspect: 'anxiety', slots: ['morning'],
    show: { status: ['crush', 'broke', 'none'] },
    text: '어젯밤에 걔가 나오는 꿈을 꿨다.\n일어나서 제일 먼저 든 생각은?',
    options: [
      { text: '무슨 의미인지 계속 생각한다', score: { anxiety: 3 } },
      { text: '괜히 기분이 이상하다', score: { anxiety: 1 } },
      { text: '꿈은 꿈이라고 넘긴다', score: { anxiety: -1 } },
      { text: '금방 잊어버린다', score: { anxiety: -3 } },
    ],
  },

  /* ── 거리 조절 ──────────────────────────────────────── */
  {
    id: 'mo-avo-01', kind: 'choice', aspect: 'avoid', slots: ['morning'],
    text: '거울 앞에 섰다.\n오늘은 좀 더 신경이 쓰인다.',
    options: [
      { text: '티 나면 안 되니까 평소대로', score: { avoid: 3 } },
      { text: '아무도 모를 만큼만 바꾼다', score: { avoid: 1 } },
      { text: '신경 쓴 티가 나도 상관없다', score: { avoid: -1 } },
      { text: '대놓고 공들인다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'mo-avo-02', kind: 'scale', aspect: 'avoid', slots: ['morning'],
    text: '내 기분을 남이 알아채는 게 싫다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { avoid: 3 },
  },
  {
    id: 'mo-avo-03', kind: 'choice', aspect: 'avoid', slots: ['morning'],
    text: '아침부터 기분이 가라앉았다.\n학교 가면 티가 날 것 같다.',
    options: [
      { text: '평소보다 더 멀쩡한 척한다', score: { avoid: 3 } },
      { text: '말수를 줄이고 넘긴다', score: { avoid: 1 } },
      { text: '물어보면 대충은 말한다', score: { avoid: -1 } },
      { text: '먼저 얘기 꺼낼 사람을 찾는다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'mo-avo-04', kind: 'choice', aspect: 'avoid', slots: ['morning'],
    show: { gender: 'f' },
    text: '평소보다 공들인 게 티가 날 것 같다.\n친구가 분명히 알아볼 텐데.',
    options: [
      { text: '그럴 바엔 원래대로 하고 간다', score: { avoid: 3 } },
      { text: '"늦게 일어나서" 라고 해둔다', score: { avoid: 1 } },
      { text: '물어보면 웃고 만다', score: { avoid: -1 } },
      { text: '알아봐 주면 오히려 좋다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'mo-avo-05', kind: 'choice', aspect: 'avoid', slots: ['morning'],
    show: { gender: 'm' },
    text: '오늘따라 머리가 마음에 안 든다.\n다시 감으면 늦는다.',
    options: [
      { text: '모자 쓰고 아무 말 안 한다', score: { avoid: 3 } },
      { text: '신경 쓰이지만 그냥 간다', score: { avoid: 1 } },
      { text: '늦더라도 다시 감는다', score: { avoid: -1 } },
      { text: '친구한테 어떠냐고 물어본다', score: { avoid: -3 } },
    ],
  },

  /* ── 행동 ───────────────────────────────────────────── */
  {
    id: 'mo-mov-01', kind: 'scale', aspect: 'move', slots: ['morning'], pair: 'initiate',
    text: '만날 일은 내가 먼저 만드는 편이다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { move: 3 },
  },
  {
    id: 'mo-mov-02', kind: 'choice', aspect: 'move', slots: ['morning'],
    text: '오늘은 꼭 말을 걸어보자고 마음먹었다.\n집을 나서기 직전이다.',
    options: [
      { text: '할 말까지 정해놓는다', score: { move: 3 } },
      { text: '기회 오면 하자고 생각한다', score: { move: 1 } },
      { text: '어제도 그렇게 마음먹었다', score: { move: -1 }, tags: ['mga'] },
      { text: '생각만 하고 접는다', score: { move: -3 }, tags: ['mga'] },
    ],
  },
  {
    id: 'mo-mov-03', kind: 'choice', aspect: 'move', slots: ['morning'],
    text: '"좋은 아침" 네 글자를 쓸까 말까\n5분째 고민 중이다.',
    options: [
      { text: '고민 안 하고 벌써 보냈다', score: { move: 3 } },
      { text: '읽씹당해도 보내본다', score: { move: 1 } },
      { text: '썼다 지웠다 하다 만다', score: { move: -1 }, tags: ['mga'] },
      { text: '이상해 보일까 봐 안 보낸다', score: { move: -3 }, tags: ['mga'] },
    ],
  },
  {
    id: 'mo-mov-04', kind: 'choice', aspect: 'move', slots: ['morning'],
    show: { meet: ['class', 'school'] },
    text: '오늘 학교에서 걔랑 마주칠 일이 있다.\n지금 그 생각을 하고 있다.',
    options: [
      { text: '어떻게 말 걸지 미리 짠다', score: { move: 3 } },
      { text: '자연스러우면 인사한다', score: { move: 1 } },
      { text: '상황 봐서 정한다', score: { move: -1 } },
      { text: '괜히 안 마주치는 길로 간다', score: { move: -3 } },
    ],
  },
  {
    id: 'mo-mov-05', kind: 'choice', aspect: 'move', slots: ['morning'],
    show: { meet: ['academy', 'outside'] },
    text: '오늘 학교에선 걔를 볼 일이 없다.\n보려면 따로 만들어야 한다.',
    options: [
      { text: '오늘 보자고 지금 톡한다', score: { move: 3 } },
      { text: '이번 주 안에 보자고 해본다', score: { move: 1 } },
      { text: '연락 오면 그때 잡는다', score: { move: -1 } },
      { text: '굳이 내가 먼저 안 한다', score: { move: -3 } },
    ],
  },

  /* ── 속도 ───────────────────────────────────────────── */
  {
    id: 'mo-tem-01', kind: 'choice', aspect: 'tempo', slots: ['morning'],
    text: '아침마다 같은 사람 생각이 난다.\n언제부터였는지 기억나?',
    options: [
      { text: '처음 본 날부터 그랬다', score: { tempo: 3 } },
      { text: '며칠 만에 그렇게 됐다', score: { tempo: 1 } },
      { text: '한참 지나서 알아챘다', score: { tempo: -1 } },
      { text: '언제부터인지 모르겠다', score: { tempo: -3 } },
    ],
  },
  {
    id: 'mo-tem-02', kind: 'scale', aspect: 'tempo', slots: ['morning'],
    text: '마음이 생기면 그날 안에 내가 안다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { tempo: 3 },
  },
  {
    id: 'mo-tem-03', kind: 'choice', aspect: 'tempo', slots: ['morning'],
    text: '오늘 학교에서 새로운 사람을 알게 된다면\n너는 어떨 것 같아?',
    options: [
      { text: '첫인상으로 거의 정해진다', score: { tempo: 3 } },
      { text: '괜찮으면 금방 관심이 간다', score: { tempo: 1 } },
      { text: '몇 번 더 봐야 안다', score: { tempo: -1 } },
      { text: '한 학기는 지나야 알겠다', score: { tempo: -3 } },
    ],
  },
  {
    id: 'mo-tem-04', kind: 'choice', aspect: 'tempo', slots: ['morning'],
    show: { exp: 'none' },
    text: '아직 사귀어본 적은 없다.\n그게 지금 너한테는?',
    options: [
      { text: '기회만 오면 바로 하고 싶다', score: { tempo: 3 } },
      { text: '해보고는 싶다', score: { tempo: 1 } },
      { text: '확실한 사람 아니면 안 한다', score: { tempo: -1 } },
      { text: '급할 것 하나도 없다', score: { tempo: -3 } },
    ],
  },
  {
    id: 'mo-tem-05', kind: 'choice', aspect: 'tempo', slots: ['morning'],
    show: { exp: ['few', 'many'] },
    text: '지난 연애를 떠올려보면,\n마음이 생기기까지 보통 얼마나 걸렸어?',
    options: [
      { text: '거의 만나자마자였다', score: { tempo: 3 } },
      { text: '몇 번 보고 나서', score: { tempo: 1 } },
      { text: '한참 알고 지낸 뒤에', score: { tempo: -1 } },
      { text: '친구인 줄 알았다가 나중에', score: { tempo: -3 } },
    ],
  },

  /* ══════════════════════════════════════════════════════
     등굣길 — 07:50. 근접·반복노출이 시작되는 자리
     걔가 저 앞에 보이거나(near), 오늘은 볼 일이 없거나(far)
     ══════════════════════════════════════════════════════ */

  /* ── 신호 민감도 ────────────────────────────────────── */
  {
    id: 'cm-anx-01', kind: 'choice', aspect: 'anxiety', slots: ['commute'],
    text: '앞에 걸어가는 뒷모습이 걔 같다.\n아닐 수도 있다.',
    options: [
      { text: '확인될 때까지 눈을 못 뗀다', score: { anxiety: 3 } },
      { text: '자꾸 흘끗거리게 된다', score: { anxiety: 1 } },
      { text: '맞으면 인사하지 하고 만다', score: { anxiety: -1 } },
      { text: '별로 궁금하지 않다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'cm-anx-02', kind: 'scale', aspect: 'anxiety', slots: ['commute'],
    text: '걔가 나를 어떻게 볼지\n자주 상상한다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { anxiety: 3 },
  },
  {
    id: 'cm-anx-03', kind: 'choice', aspect: 'anxiety', slots: ['commute'],
    text: '어제 걔가 내 인사에 대충 대답했다.\n오늘 아침 그게 다시 떠오른다.',
    options: [
      { text: '내가 뭘 잘못했나 계속 찾는다', score: { anxiety: 3 }, tags: ['reject'] },
      { text: '오늘은 좀 조심해야겠다 싶다', score: { anxiety: 1 } },
      { text: '바빴겠지 하고 넘긴다', score: { anxiety: -1 } },
      { text: '어제 일은 기억도 안 난다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'cm-anx-04', kind: 'choice', aspect: 'anxiety', slots: ['commute'],
    show: { meet: ['class', 'school'] },
    text: '매일 등굣길에서 마주치던 걔가\n요즘 며칠째 안 보인다.',
    options: [
      { text: '무슨 일 있나 계속 신경 쓴다', score: { anxiety: 3 } },
      { text: '괜히 그 시간에 맞춰 나가본다', score: { anxiety: 1 } },
      { text: '길이 바뀌었나 보다 한다', score: { anxiety: -1 } },
      { text: '안 보인다는 것도 몰랐다', score: { anxiety: -3 } },
    ],
  },
  {
    id: 'cm-anx-05', kind: 'choice', aspect: 'anxiety', slots: ['commute'],
    show: { meet: ['academy', 'outside'] },
    text: '등굣길에 걔랑 닮은 사람을 봤다.\n당연히 걔는 아니다.',
    options: [
      { text: '그 뒤로 계속 걔 생각만 한다', score: { anxiety: 3 } },
      { text: '한참 쳐다보게 된다', score: { anxiety: 1 } },
      { text: '닮았네 하고 지나간다', score: { anxiety: -1 } },
      { text: '닮은 줄도 몰랐다', score: { anxiety: -3 } },
    ],
  },

  /* ── 거리 조절 ──────────────────────────────────────── */
  {
    id: 'cm-avo-01', kind: 'choice', aspect: 'avoid', slots: ['commute'],
    text: '같이 걷게 됐는데 대화가 끊겼다.\n갈림길까지 아직 5분 남았다.',
    options: [
      { text: '이어폰 꺼내서 각자 간다', score: { avoid: 3 } },
      { text: '침묵이 어색해서 폰만 본다', score: { avoid: 1 } },
      { text: '아무 얘기나 꺼내본다', score: { avoid: -1 } },
      { text: '이때다 싶어 진짜 얘기를 한다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'cm-avo-02', kind: 'choice', aspect: 'avoid', slots: ['commute'],
    text: '걔가 "무슨 일 있어? 표정이 왜 그래" 한다.\n사실 있다.',
    options: [
      { text: '"아무것도 아니야" 로 끝낸다', score: { avoid: 3 } },
      { text: '있다고만 하고 안 말한다', score: { avoid: 1 } },
      { text: '가볍게 요약해서 말한다', score: { avoid: -1 } },
      { text: '걷는 동안 다 털어놓는다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'cm-avo-03', kind: 'scale', aspect: 'avoid', slots: ['commute'],
    text: '누구랑 오래 붙어 있으면\n혼자 있는 시간이 그리워진다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { avoid: 3 },
  },
  {
    id: 'cm-avo-04', kind: 'choice', aspect: 'avoid', slots: ['commute'],
    show: { school: ['boys', 'girls'] },
    text: '학교엔 이성이 없어서\n연애 얘기 자체를 잘 안 하게 된다.',
    options: [
      { text: '그게 편하다. 물어보면 피한다', score: { avoid: 3 } },
      { text: '별로 꺼낼 일이 없다', score: { avoid: 1 } },
      { text: '친한 애들끼린 다 한다', score: { avoid: -1 } },
      { text: '오히려 더 많이 하게 된다', score: { avoid: -3 } },
    ],
  },
  {
    id: 'cm-avo-05', kind: 'choice', aspect: 'avoid', slots: ['commute'],
    show: { school: 'co' },
    text: '공학이라 같이 걸어가는 것만으로도\n말이 나올 수 있다.',
    options: [
      { text: '오해 사기 싫어서 거리를 둔다', score: { avoid: 3 } },
      { text: '사람 없는 길로 돌아간다', score: { avoid: 1 } },
      { text: '신경은 쓰이는데 그냥 간다', score: { avoid: -1 } },
      { text: '말이 나면 나는 거다', score: { avoid: -3 } },
    ],
  },

  /* ── 행동 ───────────────────────────────────────────── */
  {
    id: 'cm-mov-01', kind: 'choice', aspect: 'move', slots: ['commute'], pair: 'initiate',
    text: '뛰면 따라잡을 수 있는 거리다.\n안 뛰면 그냥 각자 학교까지 간다.',
    options: [
      { text: '뛰어가서 아는 척한다', score: { move: 3 } },
      { text: '걸음을 좀 빨리해본다', score: { move: 1 } },
      { text: '따라잡히길 기대하며 천천히', score: { move: -1 }, tags: ['mga'] },
      { text: '거리를 그대로 유지한다', score: { move: -3 }, tags: ['mga'] },
    ],
  },
  {
    id: 'cm-mov-02', kind: 'choice', aspect: 'move', slots: ['commute'],
    text: '신호가 바뀌길 기다리는데\n걔가 바로 옆에 와서 섰다.',
    options: [
      { text: '먼저 말을 건다', score: { move: 3 } },
      { text: '눈 마주치면 인사한다', score: { move: 1 } },
      { text: '못 본 척 폰을 본다', score: { move: -1 }, tags: ['mga'] },
      { text: '한 발짝 물러선다', score: { move: -3 }, tags: ['mga'] },
    ],
  },
  {
    id: 'cm-mov-03', kind: 'choice', aspect: 'move', slots: ['commute'],
    text: '걔가 늘 같은 시간에 그 길을 지난다는 걸\n알게 됐다.',
    options: [
      { text: '그 시간에 맞춰 나간다', score: { move: 3 } },
      { text: '가끔 맞춰볼까 생각한다', score: { move: 1 } },
      { text: '알아도 원래대로 다닌다', score: { move: -1 } },
      { text: '오히려 시간을 피한다', score: { move: -3 } },
    ],
  },
  {
    id: 'cm-mov-04', kind: 'scale', aspect: 'move', slots: ['commute'],
    text: '먼저 인사하는 쪽은 대체로 나다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    weight: { move: 3 },
  },
  {
    id: 'cm-mov-05', kind: 'choice', aspect: 'move', slots: ['commute'],
    text: '친구가 "야 쟤 너 기다리는 거 아니야?" 한다.\n확실하지는 않다.',
    options: [
      { text: '바로 가서 확인한다', score: { move: 3 } },
      { text: '아닌 척 근처로 간다', score: { move: 1 } },
      { text: '아니면 창피하니까 만다', score: { move: -1 }, tags: ['reject'] },
      { text: '그럴 리 없다고 잘라 말한다', score: { move: -3 }, tags: ['reject'] },
    ],
  },

  /* ── 속도 ───────────────────────────────────────────── */
  {
    id: 'cm-tem-01', kind: 'choice', aspect: 'tempo', slots: ['commute'],
    text: '매일 등굣길에 스치기만 하던 사람이\n어느 날 달라 보였다.',
    options: [
      { text: '그 한 번으로 끝났다', score: { tempo: 3 } },
      { text: '그 뒤로 빨리 커졌다', score: { tempo: 1 } },
      { text: '천천히 쌓여서 그렇게 됐다', score: { tempo: -1 } },
      { text: '몇 달 지나서야 알았다', score: { tempo: -3 } },
    ],
  },
  {
    id: 'cm-tem-02', kind: 'choice', aspect: 'tempo', slots: ['commute'],
    text: '자주 보면 정든다는 말,\n너한테는 어때?',
    options: [
      { text: '자주 볼 필요도 없다. 한 번이면 안다', score: { tempo: 3 } },
      { text: '몇 번 보면 대충 정해진다', score: { tempo: 1 } },
      { text: '맞다. 오래 봐야 생긴다', score: { tempo: -1 } },
      { text: '자주 봐도 아닌 건 아니다', score: { tempo: -3 } },
    ],
  },
  {
    id: 'cm-tem-03', kind: 'scale', aspect: 'tempo', slots: ['commute'],
    text: '한번 아니라고 정한 사람은\n나중에도 잘 안 바뀐다.',
    minLabel: '전혀', maxLabel: '완전', steps: 5,
    // 동의할수록 첫 판단이 굳는 쪽 = 금사빠 계열
    weight: { tempo: 3 },
  },
  {
    id: 'cm-tem-04', kind: 'choice', aspect: 'tempo', slots: ['commute'],
    text: '걔한테 애인이 있다는 얘기를 들었다.\n확인된 건 아니다.',
    options: [
      { text: '그 순간 바로 접는다', score: { tempo: 3 } },
      { text: '며칠 안에 정리된다', score: { tempo: 1 } },
      { text: '한동안은 그대로다', score: { tempo: -1 } },
      { text: '확인될 때까지 안 접는다', score: { tempo: -3 } },
    ],
  },
  {
    id: 'cm-tem-05', kind: 'choice', aspect: 'tempo', slots: ['commute'],
    text: '지금 마음이 어느 단계인 것 같아?',
    options: [
      { text: '이미 확실하다', score: { tempo: 3 } },
      { text: '거의 확실한 것 같다', score: { tempo: 1 } },
      { text: '아직 재보는 중이다', score: { tempo: -1 } },
      { text: '이게 뭔지도 모르겠다', score: { tempo: -3 } },
    ],
  },
];
