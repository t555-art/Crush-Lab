import type { Scene } from '../engine/types';

/**
 * 장면 — 문항을 서사 위에 얹는 단위.
 *
 * ⚠️ 비어 있다.
 *
 * 장면이 비어 있으면 플레이어는 문항만 순서대로 낸다.
 * 즉 **서사 없이도 검사는 돌아간다.** 서사를 어떻게 짤지는 완전히 열려 있다.
 *
 * 하루를 따라가든, 계절을 따라가든, 한 학기를 따라가든,
 * 아예 서사 없이 문항만 내든 자유다.
 *
 * ── 모양 ──
 *
 *   {
 *     id: 'classroom',
 *     title: '같은 반이 됐다',
 *     label: '3월 · 교실',              // 화면 상단에 뜨는 부제 (선택)
 *     art: {
 *       src: '/art/scenes/classroom.webp',
 *       alt: '아침 교실',
 *       prompt: '이미지 생성용 지시문',
 *       // 좋아하는 상대 묘사가 갈라져야 하면
 *       variants: [
 *         { when: { crushGender: 'm' }, src: '/art/scenes/classroom-m.webp' },
 *       ],
 *     },
 *     beats: [
 *       { kind: 'narration', text: '교실에 들어선다.' },
 *       { kind: 'line', speaker: '친구', text: '야 저기 봐.' },
 *       { kind: 'question', pick: { tags: 'classroom' } },  // 조건에 맞는 문항 하나
 *       { kind: 'question', id: 'q-001' },                  // 특정 문항 고정
 *     ],
 *   }
 *
 * ── 등장인물 ──
 * 메인 서사에는 안내 캐릭터나 마스코트가 나오지 않는다.
 * 평범한 학생의 실제 하루처럼 간다. `speaker` 는 '친구', '걔' 같은
 * 실제 사람이지 화자 역할의 캐릭터가 아니다.
 */
export const SCENES: Scene[] = [];
