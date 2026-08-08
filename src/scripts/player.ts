import { INTRO } from '../data/intro';
import { SCENES } from '../data/scenes';
import { AXES } from '../data/axes';
import { SURVEY } from '../data/survey';
import { QUESTIONS, resolve, askedQuestions, allAspects } from '../engine/select';
import { compose, slotsOf, optionsFor, HAS_PARTS } from '../engine/character';
import { score, axisPercent } from '../engine/score';
import type {
  Answers, ComposedCharacter, Question, ResolvedBeat, ResolvedScene,
  ScaleQuestion, Traits,
} from '../engine/types';

const SAVE_KEY = 'crushlab.progress.v4';

/**
 * 화면 진행.
 *
 * 단계
 *   intro   시작 질문. 답할 때마다 아바타가 한 겹씩 구체화된다
 *   avatar  아바타 직접 다듬기 (부품이 있을 때만)
 *   scene   본 검사
 *   done    채점 완료
 *
 * ── 장면에서의 진행 방식 ──
 * 터치할 때마다 지문·대사가 **하나씩 쌓인다** (지우고 바꾸는 게 아니라 누적).
 * 앞의 말은 흐려지고 최근 것이 또렷하다.
 * 대사가 다 나온 뒤에야 질문창이 그 위로 은은하게 떠오른다.
 */

type Stage = 'intro' | 'avatar' | 'scene' | 'done';

interface State {
  stage: Stage;
  introIndex: number;
  traits: Traits;
  scenes: ResolvedScene[];
  sceneIndex: number;
  /** 이 장면에서 지금까지 드러난 비트 수 */
  revealed: number;
  answers: Answers;
  /** 슬라이더에서 아직 확정 안 한 값 */
  draft: number | null;
}

const state: State = {
  stage: 'intro', introIndex: 0, traits: {},
  scenes: [], sceneIndex: 0, revealed: 1, answers: {}, draft: null,
};

let root: HTMLElement;

export function mountPlayer(el: HTMLElement) {
  root = el;
  restore();
  render();
}

/* ══ 저장 / 복구 ═════════════════════════════════════════ */

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      stage: state.stage, introIndex: state.introIndex, traits: state.traits,
      sceneIndex: state.sceneIndex, revealed: state.revealed, answers: state.answers,
    }));
  } catch { /* 시크릿 모드 등에서 막히면 저장 안 함 */ }
}

function restore() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return;
    const d = JSON.parse(saved);
    if (!d || typeof d !== 'object') return;
    Object.assign(state, {
      stage: d.stage ?? 'intro', introIndex: d.introIndex ?? 0,
      traits: d.traits ?? {}, sceneIndex: d.sceneIndex ?? 0,
      revealed: d.revealed ?? 1, answers: d.answers ?? {},
    });
    // 장면은 저장하지 않고 특성으로 다시 만든다 (같은 특성 → 같은 문항)
    if (state.stage === 'scene' || state.stage === 'done') {
      state.scenes = resolve(SCENES, state.traits);
    }
  } catch { reset(false); }
}

export function reset(rerender = true) {
  Object.assign(state, {
    stage: 'intro', introIndex: 0, traits: {},
    scenes: [], sceneIndex: 0, revealed: 1, answers: {}, draft: null,
  });
  try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ }
  if (rerender) render();
}

/* ══ 진행 ════════════════════════════════════════════════ */

const scene = () => state.scenes[state.sceneIndex];
/** 지금 화면에 드러나 있는 비트들 */
const shown = (): ResolvedBeat[] => scene()?.beats.slice(0, state.revealed) ?? [];
/** 가장 최근 비트 */
const tip = (): ResolvedBeat | undefined => shown()[state.revealed - 1];

function startScenes() {
  state.scenes = resolve(SCENES, state.traits);
  state.stage = 'scene';
  state.sceneIndex = 0;
  state.revealed = 1;
  save();
  render();
}

/** 터치했을 때. 질문이 떠 있으면 무시한다 (답을 해야 넘어감) */
function advance() {
  if (state.stage !== 'scene') return;
  if (tip()?.kind === 'question') return;
  const s = scene();
  if (!s) return;
  if (state.revealed < s.beats.length) state.revealed++;
  else if (state.sceneIndex < state.scenes.length - 1) {
    state.sceneIndex++; state.revealed = 1;
  } else { state.stage = 'done'; }
  state.draft = null;
  save();
  render();
}

function answerIntro(index: number) {
  const q = INTRO[state.introIndex];
  state.answers[q.id] = index;
  const pick = q.options[index];
  if (pick.traits) Object.assign(state.traits, pick.traits);

  if (state.introIndex < INTRO.length - 1) { state.introIndex++; save(); render(); return; }
  // 시작 질문이 끝나면, 부품이 있을 때만 아바타 다듬기로
  state.stage = HAS_PARTS ? 'avatar' : 'scene';
  if (state.stage === 'avatar') { save(); render(); } else startScenes();
}

function answerQuestion(q: Question, value: number) {
  state.answers[q.id] = value;
  advanceAfterAnswer();
}

function advanceAfterAnswer() {
  const s = scene();
  if (!s) { state.stage = 'done'; save(); render(); return; }
  if (state.revealed < s.beats.length) state.revealed++;
  else if (state.sceneIndex < state.scenes.length - 1) {
    state.sceneIndex++; state.revealed = 1;
  } else state.stage = 'done';
  state.draft = null;
  save();
  render();
}

export function result() {
  return score(askedQuestions(state.scenes), state.answers, state.traits);
}

/* ══ 그리기 ══════════════════════════════════════════════ */

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const text = (s: string) => esc(s).replace(/\n/g, '<br>');

/** 조립된 인물 하나를 겹쳐 그린다 */
function figureHtml(c: ComposedCharacter, cls = 'figure'): string {
  if (!c.layers.length) return '';
  return `<div class="${cls}">` +
    c.layers.map(l =>
      `<img class="figure__p" src="${esc(l.src)}" alt="" style="z-index:${l.z}">`).join('') +
    '</div>';
}

function render() {
  const missing: string[] = [];
  if (!AXES.length) missing.push('축 (<code>src/data/axes.ts</code>)');
  if (!QUESTIONS.length) missing.push('문항 (<code>src/data/questions.ts</code>)');
  if (!INTRO.length) missing.push('시작 질문 (<code>src/data/intro.ts</code>)');
  if (missing.length) return renderEmpty(missing);

  if (state.stage === 'intro') return renderIntro();
  if (state.stage === 'avatar') return renderAvatar();
  if (state.stage === 'scene') return renderScene();
  return renderDone();
}

function renderEmpty(missing: string[]) {
  root.className = 'stage stage--form';
  root.innerHTML = `
    <div class="form">
      <p class="step">아직 콘텐츠가 없음</p>
      <h1 class="ask">검사할 내용이 비어 있어</h1>
      <p class="note">화면·채점·연출은 다 돌아가는데, 들어갈 내용이 아직 없어.</p>
      <ul class="note" style="padding-left:18px;display:flex;flex-direction:column;gap:6px">
        ${missing.map(m => `<li>${m}</li>`).join('')}
      </ul>
      <p class="note">채우는 방법은 <code>docs/HANDOFF.md</code> 에 있어.</p>
      <div class="choices"><a class="choice" href="/">처음으로</a></div>
    </div>`;
}

/* ── 시작 질문 — 답할수록 아바타가 구체화된다 ──────────── */
function renderIntro() {
  const q = INTRO[state.introIndex];
  const pct = (state.introIndex / INTRO.length) * 100;
  const me = compose(state.traits, 'self');

  root.className = 'stage stage--form';
  root.innerHTML = `
    <div class="form form--intro">
      <div class="bar"><div class="bar__fill" style="width:${pct}%"></div></div>
      <p class="step">${state.introIndex + 1} / ${INTRO.length}</p>
      <div class="mecanvas">${figureHtml(me, 'figure figure--me')}</div>
      <h1 class="ask">${text(q.text)}</h1>
      <div class="choices">
        ${q.options.map((o, i) => `<button class="choice" data-i="${i}">${esc(o.text)}</button>`).join('')}
      </div>
    </div>`;
  root.querySelectorAll<HTMLButtonElement>('.choice').forEach(b => {
    b.addEventListener('click', () => answerIntro(Number(b.dataset.i)));
  });
}

/* ── 아바타 직접 다듬기 ────────────────────────────────
   자동으로 정해진 것 위에, 마음에 안 드는 부분만 사용자가 바꾼다.
   고른 값은 traits 에 `self.<슬롯>` 으로 저장되어 자동 선택보다 우선한다. */
function renderAvatar() {
  const me = compose(state.traits, 'self');
  const slots = slotsOf('self').filter(s => optionsFor(s, 'self').length > 1);

  root.className = 'stage stage--form';
  root.innerHTML = `
    <div class="form">
      <p class="step">내 모습</p>
      <div class="mecanvas">${figureHtml(me, 'figure figure--me')}</div>
      <h1 class="ask">이게 너야</h1>
      <p class="note">바꾸고 싶은 게 있으면 골라. 그냥 넘어가도 돼.</p>
      ${slots.map(slot => {
        const opts = optionsFor(slot, 'self');
        const cur = me.layers.find(l => l.slot === slot)?.id;
        return `<div class="picker">
          <p class="picker__k">${esc(opts[0].label ? slot : slot)}</p>
          <div class="picker__row">
            ${opts.map(o => `<button class="picker__b${o.id === cur ? ' on' : ''}"
              data-slot="${esc(slot)}" data-id="${esc(o.id)}">${esc(o.label ?? o.id)}</button>`).join('')}
          </div>
        </div>`;
      }).join('')}
      <div class="choices"><button class="choice" id="go">이대로 시작</button></div>
    </div>`;

  root.querySelectorAll<HTMLButtonElement>('.picker__b').forEach(b => {
    b.addEventListener('click', () => {
      state.traits[`self.${b.dataset.slot}`] = b.dataset.id!;
      save(); renderAvatar();
    });
  });
  root.querySelector('#go')?.addEventListener('click', startScenes);
}

/* ── 장면 ──────────────────────────────────────────────
   터치하면 대사가 하나씩 쌓이고, 다 나온 뒤 질문창이 위로 떠오른다. */
function renderScene() {
  const s = scene();
  if (!s) { state.stage = 'done'; return render(); }
  const beats = shown();
  const last = tip();
  if (!last) { state.stage = 'done'; return render(); }

  const q = last.kind === 'question' ? last.question : undefined;
  const total = askedQuestions(state.scenes).length;
  const done = Object.keys(state.answers).filter(id => QUESTIONS.some(x => x.id === id)).length;

  // 대사는 최근 3개까지만 보인다. 그 이상은 화면을 먹는다
  const talk = beats.filter(b => b.kind !== 'question').slice(-3);

  root.className = 'stage stage--scene';
  root.innerHTML = `
    <div class="scene">
      ${s.background ? `<img class="scene__art" src="${esc(s.background.src)}" alt="${esc(s.background.alt)}">` : ''}
      <div class="scene__veil"></div>

      ${s.cast.map(c => `<div class="cast" style="
          left:${c.x}%; top:${c.y}%;
          --s:${c.scale ?? 1}; ${c.flip ? '--flip:-1;' : ''}
        ">${figureHtml(c.character)}</div>`).join('')}

      <header class="scene__head">
        ${s.label ? `<span class="place">${esc(s.label)}</span>` : ''}
        <span class="tally">${done} / ${total}</span>
      </header>

      ${q ? `<div class="askcard">${questionHtml(q)}</div>` : ''}

      <div class="talk">
        ${talk.map((b, i) => `<div class="talk__l${i === talk.length - 1 && !q ? ' talk__l--now' : ''}">
          ${b.kind === 'line' && b.speaker ? `<p class="who">${esc(b.speaker)}</p>` : ''}
          <p class="line">${text(b.text ?? '')}</p>
        </div>`).join('')}
        ${q ? '' : '<span class="next"></span>'}
      </div>

      ${q ? '' : '<button class="tapzone" aria-label="다음"></button>'}
    </div>`;

  if (q) wireQuestion(q);
  else root.querySelector<HTMLButtonElement>('.tapzone')?.addEventListener('click', advance);
}

function questionHtml(q: Question): string {
  if (q.kind === 'choice') {
    return `<p class="askcard__q">${text(q.text)}</p>
      <div class="choices">
        ${q.options.map((o, i) => `<button class="choice" data-i="${i}">${esc(o.text)}</button>`).join('')}
      </div>`;
  }
  return scaleHtml(q);
}

/**
 * 슬라이더 문항.
 * 트랙 전체가 48px 높이라 끌기·탭 둘 다 편하다.
 */
function scaleHtml(q: ScaleQuestion): string {
  const v = state.draft ?? Math.floor(q.steps / 2);
  return `<p class="askcard__q">${text(q.text)}</p>
    <div class="scale">
      <div class="scale__ends"><span>${esc(q.minLabel)}</span><span>${esc(q.maxLabel)}</span></div>
      <div class="scale__track">
        <div class="scale__ticks">
          ${Array.from({ length: q.steps }, (_, i) =>
            `<span class="scale__tick${i === v ? ' on' : ''}"></span>`).join('')}
        </div>
        <input class="scale__input" type="range" min="0" max="${q.steps - 1}" step="1" value="${v}"
               aria-label="${esc(q.text)}"
               aria-valuetext="${esc(q.minLabel)} ~ ${esc(q.maxLabel)} 중 ${v + 1}단계">
      </div>
    </div>
    <div class="choices"><button class="choice scale__ok">다음</button></div>`;
}

function wireQuestion(q: Question) {
  if (q.kind === 'choice') {
    root.querySelectorAll<HTMLButtonElement>('.askcard .choice').forEach(b => {
      b.addEventListener('click', () => answerQuestion(q, Number(b.dataset.i)));
    });
    return;
  }
  const input = root.querySelector<HTMLInputElement>('.scale__input');
  const ticks = [...root.querySelectorAll<HTMLElement>('.scale__tick')];
  input?.addEventListener('input', () => {
    state.draft = Number(input.value);
    ticks.forEach((t, i) => t.classList.toggle('on', i === state.draft));
  });
  root.querySelector<HTMLButtonElement>('.scale__ok')?.addEventListener('click', () => {
    answerQuestion(q, state.draft ?? Math.floor(q.steps / 2));
  });
}

/* ── 결과 ─────────────────────────────────────────────── */
function renderDone() {
  const r = result();
  const aspects = allAspects();
  root.className = 'stage stage--form';
  root.innerHTML = `
    <div class="form">
      <p class="step">검사 완료</p>
      <h1 class="ask">${r.answered}개 문항에 답했어</h1>
      <p class="note">결과 화면은 아직 만드는 중이야. (유형·설명은 내용 작업 대기)</p>

      ${AXES.length ? `<div class="gauges">${AXES.map(a => {
        const pct = axisPercent(r.norm[a.id] ?? 0);
        return `<div class="gauge">
          <span class="gauge__k">${esc(a.name)}</span>
          <div class="gauge__track"><div class="gauge__fill"
            style="left:${Math.min(50, pct)}%;width:${Math.abs(pct - 50)}%"></div></div>
          <span class="gauge__v">${pct}</span>
        </div>`;
      }).join('')}</div>` : ''}

      ${aspects.length ? `<p class="step" style="margin-top:8px">항목별 문항 수</p>
        <div class="gauges">${aspects.map(a => {
          const n = r.perAspect[a] ?? 0;
          const ok = n >= SURVEY.minPerAspect;
          return `<div class="gauge">
            <span class="gauge__k">${esc(a)}</span>
            <span class="gauge__v" style="width:auto">${n}문항${ok ? '' : ' (부족)'}</span>
          </div>`;
        }).join('')}</div>` : ''}

      <div class="choices"><button class="choice" id="again">처음부터 다시</button></div>
    </div>`;
  root.querySelector('#again')?.addEventListener('click', () => reset());
}

/* 키보드로도 넘길 수 있게 */
document.addEventListener('keydown', e => {
  if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight')
      && state.stage === 'scene' && tip()?.kind !== 'question') {
    e.preventDefault();
    advance();
  }
});
