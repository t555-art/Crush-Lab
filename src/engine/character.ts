import type {
  CastMember, CastRole, ComposedCharacter, Condition, PartOption, Traits,
} from './types';
import { PARTS } from '../data/parts';

/**
 * 캐릭터 조립.
 *
 * 완성된 그림 한 장을 넣는 게 아니라 부품을 겹쳐서 만든다.
 * 응답자 아바타와 스토리 속 상대가 같은 시스템을 쓴다.
 *
 *   슬롯 'body'  → 체형 부품 하나
 *   슬롯 'hair'  → 머리 부품 하나
 *   슬롯 'face'  → 얼굴 부품 하나
 *   …을 z 순서로 겹친다
 *
 * 부품이 하나도 없으면(지금) 아무것도 안 그린다. 그림이 생기면 바로 켜진다.
 */

/** 조건이 특성과 맞는지. 값 앞의 `!` 는 부정 */
export function matches(cond: Condition | undefined, traits: Traits): boolean {
  if (!cond) return true;
  for (const [key, want] of Object.entries(cond)) {
    if (key === 'tags') continue;          // 문항 태그는 별도로 본다
    const have = traits[key];
    const list = Array.isArray(want) ? want : [want];
    const ok = list.some(w =>
      typeof w === 'string' && w.startsWith('!') ? have !== w.slice(1) : have === w);
    if (!ok) return false;
  }
  return true;
}

/**
 * 인물에게 해당하는 특성만 뽑아낸다.
 *
 *   self  → { gender:'f', hair:'long' }        (그대로)
 *   crush → { 'crush.gender':'m' } 에서 gender:'m' 로
 *
 * 이렇게 해두면 같은 부품 카탈로그로 두 인물을 따로 조립할 수 있다.
 */
export function traitsFor(traits: Traits, who: CastRole): Traits {
  if (who === 'self') return traits;
  const prefix = `${who}.`;
  const out: Traits = {};
  for (const [k, v] of Object.entries(traits)) {
    if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
  }
  return out;
}

/** 이 부품을 이 인물에게 쓸 수 있는지 */
function usableBy(part: PartOption, who: CastRole): boolean {
  const f = part.for ?? 'both';
  return f === 'both' || f === who;
}

/** 슬롯 목록 (부품 카탈로그에 등장하는 순서대로) */
export function slotsOf(who: CastRole): string[] {
  const out: string[] = [];
  for (const p of PARTS) {
    if (usableBy(p, who) && !out.includes(p.slot)) out.push(p.slot);
  }
  return out;
}

/** 한 슬롯에서 고를 수 있는 부품들 */
export function optionsFor(slot: string, who: CastRole): PartOption[] {
  return PARTS.filter(p => p.slot === slot && usableBy(p, who));
}

/**
 * 인물 하나를 조립한다.
 *
 * 슬롯마다 하나씩 고른다. 우선순위:
 *   1. 사용자가 직접 고른 것   `self.hair` = 부품 id
 *   2. 조건(when)이 맞는 것 중 마지막 것
 *   3. 조건이 없는 것 (그 슬롯의 기본값)
 */
export function compose(traits: Traits, who: CastRole): ComposedCharacter {
  const mine = traitsFor(traits, who);
  const layers: ComposedCharacter['layers'] = [];

  for (const slot of slotsOf(who)) {
    const candidates = optionsFor(slot, who);

    // 1. 직접 고른 것이 있으면 그것
    const overrideId = traits[`${who}.${slot}`];
    const picked = overrideId
      ? candidates.find(p => p.id === overrideId)
      // 2. 조건이 맞는 것 (뒤에 있는 것이 이긴다 — 더 구체적인 규칙을 아래에 두면 된다)
      ?? [...candidates].reverse().find(p => p.when && matches(p.when, mine))
      // 3. 조건 없는 기본값
      ?? candidates.find(p => !p.when)
      : [...candidates].reverse().find(p => p.when && matches(p.when, mine))
        ?? candidates.find(p => !p.when);

    if (picked) layers.push({ id: picked.id, slot: picked.slot, src: picked.src, z: picked.z });
  }

  layers.sort((a, b) => a.z - b.z);
  return { who, layers };
}

/** 장면에 세워질 인물들을 조립한다 */
export function composeCast(cast: CastMember[] | undefined, traits: Traits) {
  return (cast ?? [])
    .filter(c => matches(c.when, traits))
    .map(({ when: _when, ...rest }) => ({ ...rest, character: compose(traits, rest.who) }));
}

/** 부품이 하나라도 있는지 — 없으면 아바타 화면 자체를 건너뛴다 */
export const HAS_PARTS = PARTS.length > 0;
