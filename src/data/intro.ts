import type { ChoiceQuestion } from '../engine/types';

/**
 * 시작 질문 — 성향을 재는 게 아니라 **뒤에 쓸 정보를 모으는 곳**이다.
 * 그래서 선택지에 `score` 가 없고 `traits` 만 있다.
 *
 * ── 이 아홉 개가 짊어지는 일 ──
 * 엔진은 검사 **도중에는** 특성을 안 쌓는다. `resolve()` 가 스토리 시작 전에
 * 한 번만 돌고, 스토리 문항의 `traits` 는 반영되지 않는다.
 * 그래서 **모든 분기가 여기서 결정된다.** 문항 300~400개 중
 * 누구에게 무엇이 나갈지가 이 아홉 개의 답으로 갈린다.
 *
 * ── 순서 ──
 * 아바타가 눈에 띄게 변하는 것부터 (성별 → 체형 → 머리 → 분위기).
 * 첫 질문에 답했는데 그림이 그대로면 "답할수록 그려진다" 가 첫판부터 죽는다.
 * 뒤쪽 다섯 개는 그림이 아니라 **분기**를 위한 것이다.
 *
 * ── 조합 수 ──  ★ 여기 손댈 때 반드시 계산할 것
 * check-coverage 가 모든 선택지 조합을 전수로 돈다. 상한이 20,000이고
 * 넘으면 앞에서부터 잘라서 검사하는데, 조합이 중첩 곱으로 만들어지기 때문에
 * 잘린 표본은 **앞쪽 질문의 답이 전부 같다** — 남자 분기만 검사하고
 * 여자 분기는 한 번도 안 보는 상태가 된다.
 *
 *   2 × 3 × 3 × 3 × 3 × 2 × 4 × 5 × 3 = 19,440   ← 지금. 상한 아슬아슬
 *
 * 여유가 없다. 분기를 더 늘리려면 코드 쪽에 요청해둔 두 가지 중 하나가 필요하다
 * (docs/PROGRESS.md 참고) — 무작위 표본으로 바꾸거나,
 * show/when 에 실제로 쓰이는 키만 곱하거나. 후자면 720조합으로 떨어진다.
 */
export const INTRO: ChoiceQuestion[] = [
  /* ── 아바타가 그려지는 구간 ─────────────────────────── */
  {
    id: 'i-gender',
    kind: 'choice',
    text: '너는?',
    options: [
      { text: '남자', traits: { gender: 'm' } },
      { text: '여자', traits: { gender: 'f' } },
    ],
  },
  {
    id: 'i-build',
    kind: 'choice',
    text: '체형은 어느 쪽에 가까워?',
    options: [
      { text: '마른 편', traits: { build: 'slim' } },
      { text: '보통', traits: { build: 'mid' } },
      { text: '덩치 있는 편', traits: { build: 'big' } },
    ],
  },
  {
    id: 'i-hair',
    kind: 'choice',
    text: '머리는?',
    options: [
      { text: '짧아', traits: { hair: 'short' } },
      { text: '어깨쯤', traits: { hair: 'mid' } },
      { text: '길어', traits: { hair: 'long' } },
    ],
  },
  {
    id: 'i-vibe',
    kind: 'choice',
    text: '남들이 너를 처음 봤을 때 하는 말에 제일 가까운 건?',
    options: [
      { text: '"밝다" / "말 많다"', traits: { vibe: 'bright' } },
      { text: '"조용하다" / "차분하다"', traits: { vibe: 'quiet' } },
      { text: '"무슨 생각인지 모르겠다"', traits: { vibe: 'blank' } },
    ],
  },

  /* ── 분기를 만드는 구간 ─────────────────────────────── */
  {
    id: 'i-school',
    kind: 'choice',
    text: '학교는 어떤 곳이야?',
    options: [
      { text: '남녀공학', traits: { school: 'co' } },
      { text: '남고', traits: { school: 'boys' } },
      { text: '여고', traits: { school: 'girls' } },
    ],
  },
  {
    id: 'i-crush-gender',
    kind: 'choice',
    // 지금 좋아하는 사람이 없어도 답할 수 있게 '마음이 가는 쪽' 으로 물어본다
    text: '마음이 가는 쪽은?',
    options: [
      { text: '남자', traits: { 'crush.gender': 'm' } },
      { text: '여자', traits: { 'crush.gender': 'f' } },
    ],
  },
  {
    id: 'i-meet',
    kind: 'choice',
    /*
     * 이 문항이 장면을 좌우한다.
     * "우리 학교에 그 사람이 있는가" 는 school 과 crush.gender 를 조합해야 알 수 있는데
     * Condition 은 키를 AND 로만 묶어서 그런 OR 조건을 못 쓴다.
     * 그래서 유도하지 않고 직접 물어본다. 이쪽이 더 정확하기도 하다 —
     * 공학이어도 학원에서 만난 사람일 수 있다.
     */
    text: '그 사람은 어디서 마주치는 사이야?\n(아직 없으면, 생긴다면 어디일 것 같아?)',
    options: [
      { text: '같은 반', traits: { meet: 'class' } },
      { text: '같은 학교 다른 반', traits: { meet: 'school' } },
      { text: '학원이나 동아리', traits: { meet: 'academy' } },
      { text: '학교 밖 · 온라인', traits: { meet: 'outside' } },
    ],
  },
  {
    id: 'i-status',
    kind: 'choice',
    text: '지금은 어떤 상태야?',
    options: [
      { text: '좋아하는 사람이 있어', traits: { status: 'crush' } },
      { text: '썸 타는 중', traits: { status: 'some' } },
      { text: '사귀는 중', traits: { status: 'dating' } },
      { text: '헤어진 지 얼마 안 됐어', traits: { status: 'broke' } },
      { text: '아무도 없어', traits: { status: 'none' } },
    ],
  },
  {
    id: 'i-exp',
    kind: 'choice',
    text: '지금까지 연애는?',
    options: [
      { text: '해본 적 없어', traits: { exp: 'none' } },
      { text: '한두 번', traits: { exp: 'few' } },
      { text: '여러 번', traits: { exp: 'many' } },
    ],
  },
];
