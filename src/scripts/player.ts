import { INTRO } from '../data/intro';
import { SCENES } from '../data/scenes';
import { AVATAR_LAYERS } from '../data/avatar';
import { AXES } from '../data/axes';
import { QUESTIONS, resolve, askedQuestions, matches } from '../engine/select';
import { score, axisPercent } from '../engine/score';
import type {
  Answers, Question, ResolvedScene, ScaleQuestion, Traits,
} from '../engine/types';

const SAVE_KEY = 'crushlab.progress.v3';

/**
 * 화면 진행.
 *
 * 상태 하나(State) + 그리는 함수 하나(render). 상태가 바뀌면 통째로 다시 그린다.
 * 프레임워크를 얹는 것보다 고치기 쉬워서 이렇게 뒀다.
 *
 * 단계
 *   intro  시작 질문. 답할 때마다 아바타가 한 겹씩 그려진다
 *   scene  본 검사
 *   done   채점 완료
 *
 * 콘텐츠(문항·장면·축)가 비어 있으면 그 사실을 화면에 그대로 띄운다.
 * 지금이 그 상태다.
 */

type Stage = 'intro' | 'scene' | 'done';

interface State {
  stage: Stage;
  introIndex: number;
  traits: Traits;
  scenes: ResolvedScene[];
  sceneIndex: number;
  beatIndex: number;
  answers: Answers;
  /** 슬라이더 문항에서 아직 확정 안 한 값 */
  draft: number | null;
}

const state: State = {
  stage: 'intro', introIndex: 0, traits: {},
  scenes: [], sceneIndex: 0, beatIndex: 0, answers: {}, draft: null,
};

let root: HTMLElement;

export function mountPlayer(el: HTMLElement) {
  root = el;
  restore();
  render();
}

/* ── 저장 / 복구 ───────────────────────────────────────── */

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      stage: state.stage, introIndex: state.introIndex, traits: state.traits,
      sceneIndex: state.sceneIndex, beatIndex: state.beatIndex, answers: state.answers,
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
      beatIndex: d.beatIndex ?? 0, answers: d.answers ?? {},
    });
    // 장면은 저장하지 않고 특성으로 다시 만든다 (같은 특성 → 같은 문항)
    if (state.stage !== 'intro') state.scenes = resolve(SCENES, state.traits);
  } catch { reset(false); }
}

export function reset(rerender = true) {
  Object.assign(state, {
    stage: 'intro', introIndex: 0, traits: {},
    scenes: [], sceneIndex: 0, beatIndex: 0, answers: {}, draft: null,
  });
  try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ }
  if (rerender) render();
}

/* ── 진행 ─────────────────────────────────────────────── */

const currentScene = () => state.scenes[state.sceneIndex];
const currentBeat = () => currentScene()?.beats[state.beatIndex];

function step() {
  const scene = currentScene();
  if (!scene) { state.stage = 'done'; save(); render(); return; }
  if (state.beatIndex < scene.beats.length - 1) state.beatIndex++;
  else if (state.sceneIndex < state.scenes.length - 1) {
    state.sceneIndex++; state.beatIndex = 0;
  } else state.stage = 'done';
  state.draft = null;
  save();
  render();
}

/** 탭했을 때. 문항이 떠 있으면 무시한다 (답을 해야 넘어감) */
function advance() {
  if (state.stage !== 'scene') return;
  if (currentBeat()?.kind === 'question') return;
  step();
}

function answerIntro(index: number) {
  const q = INTRO[state.introIndex];
  const pick = q.options[index];
  state.answers[q.id] = index;
  if (pick.traits) Object.assign(state.traits, pick.traits);

  if (state.introIndex < INTRO.length - 1) state.introIndex++;
  else {
    state.scenes = resolve(SCENES, state.traits);
    state.stage = 'scene';
    state.sceneIndex = 0; state.beatIndex = 0;
  }
  save();
  render();
}

function answerQuestion(q: Question, value: number) {
  state.answers[q.id] = value;
  step();
}

export function result() {
  return score(askedQuestions(state.scenes), state.answers, state.traits);
}

/* ── 그리기 ───────────────────────────────────────────── */

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const text = (s: string) => esc(s).replace(/\n/g, '<br>');

/**
 * 지금까지 쌓인 특성으로 아바타를 그린다.
 * 조각이 하나도 없으면(지금) 아무것도 안 그린다.
 */
function avatarHtml(): string {
  const on = AVATAR_LAYERS
    .filter(l => matches(l.when, state.traits))
    .sort((a, b) => a.z - b.z);
  if (!on.length) return '';
  return '<div class="avatar">' +
    on.map(l => `<img class="avatar__l" src="${esc(l.src)}" alt="" style="z-index:${l.z}">`).join('') +
    '</div>';
}

function render() {
  // 콘텐츠가 비어 있으면 그 사실을 먼저 알린다
  const missing: string[] = [];
  if (!AXES.length) missing.push('축 (<code>src/data/axes.ts</code>)');
  if (!QUESTIONS.length) missing.push('문항 (<code>src/data/questions.ts</code>)');
  if (!INTRO.length) missing.push('시작 질문 (<code>src/data/intro.ts</code>)');
  if (missing.length) return renderEmpty(missing);

  if (state.stage === 'intro') return renderIntro();
  if (state.stage === 'scene') return renderScene();
  return renderDone();
}

function renderEmpty(missing: string[]) {
  root.className = 'stage stage--form';
  root.innerHTML = `
    <div class="form">
      <p class="step">아직 콘텐츠가 없음</p>
      <h1 class="ask">검사할 내용이 비어 있어</h1>
      <p class="note">
        화면과 채점 엔진은 다 돌아가는데, 들어갈 내용이 아직 없어.
        아래 파일을 채우면 바로 동작해.
      </p>
      <ul class="note" style="padding-left:18px;display:flex;flex-direction:column;gap:6px">
        ${missing.map(m => `<li>${m}</li>`).join('')}
      </ul>
      <p class="note">자세한 건 <code>docs/HANDOFF.md</code> 를 볼 것.</p>
      <div class="choices"><a class="choice" href="/">처음으로</a></div>
    </div>`;
}

function renderIntro() {
  const q = INTRO[state.introIndex];
  const pct = (state.introIndex / INTRO.length) * 100;
  root.className = 'stage stage--form';
  root.innerHTML = `
    <div class="form">
      <div class="bar"><div class="bar__fill" style="width:${pct}%"></div></div>
      <p class="step">${state.introIndex + 1} / ${INTRO.length}</p>
      ${avatarHtml()}
      <h1 class="ask">${text(q.text)}</h1>
      <div class="choices">
        ${q.options.map((o, i) => `<button class="choice" data-i="${i}">${esc(o.text)}</button>`).join('')}
      </div>
    </div>`;
  root.querySelectorAll<HTMLButtonElement>('.choice').forEach(b => {
    b.addEventListener('click', () => answerIntro(Number(b.dataset.i)));
  });
}

function renderScene() {
  const scene = currentScene();
  const beat = currentBeat();
  if (!scene || !beat) { state.stage = 'done'; return render(); }

  const total = askedQuestions(state.scenes).length;
  const done = Object.keys(state.answers).filter(id => QUESTIONS.some(q => q.id === id)).length;
  const q = beat.kind === 'question' ? beat.question : undefined;

  root.className = 'stage stage--scene';
  root.innerHTML = `
    <div class="scene">
      ${scene.art ? `<img class="scene__art" src="${esc(scene.art.src)}" alt="${esc(scene.art.alt)}">` : ''}
      <div class="scene__veil"></div>
      <header class="scene__head">
        ${scene.label ? `<span class="place">${esc(scene.label)}</span>` : ''}
        <span class="tally">${done} / ${total}</span>
      </header>
      <div class="box ${q ? 'box--ask' : ''}">
        ${beat.kind === 'line' && beat.speaker ? `<p class="who">${esc(beat.speaker)}</p>` : ''}
        ${q ? questionHtml(q) : `<p class="line">${text(beat.text ?? '')}</p><span class="next"></span>`}
      </div>
      ${q ? '' : '<button class="tapzone" aria-label="다음"></button>'}
    </div>`;

  if (q) wireQuestion(q);
  else root.querySelector<HTMLButtonElement>('.tapzone')?.addEventListener('click', advance);
}

function questionHtml(q: Question): string {
  if (q.kind === 'choice') {
    return `<p class="line">${text(q.text)}</p>
      <div class="choices">
        ${q.options.map((o, i) => `<button class="choice" data-i="${i}">${esc(o.text)}</button>`).join('')}
      </div>`;
  }
  return scaleHtml(q);
}

/**
 * 슬라이더 문항.
 * 손가락으로 끌고 → 확인. 선택지 여러 개보다 화면이 짧다.
 * 실제로 써보고 조작이 불편하면 단계별 버튼 한 줄로 바꾸는 것도 방법이다.
 */
function scaleHtml(q: ScaleQuestion): string {
  const mid = Math.floor(q.steps / 2);
  const v = state.draft ?? mid;
  return `<p class="line">${text(q.text)}</p>
    <div class="scale">
      <input class="scale__input" type="range" min="0" max="${q.steps - 1}" step="1" value="${v}"
             aria-label="${esc(q.text)}">
      <div class="scale__ends">
        <span>${esc(q.minLabel)}</span>
        <span>${esc(q.maxLabel)}</span>
      </div>
      <div class="scale__ticks">
        ${Array.from({ length: q.steps }, (_, i) =>
          `<span class="scale__tick${i === v ? ' on' : ''}"></span>`).join('')}
      </div>
    </div>
    <div class="choices"><button class="choice scale__ok">다음</button></div>`;
}

function wireQuestion(q: Question) {
  if (q.kind === 'choice') {
    root.querySelectorAll<HTMLButtonElement>('.choice').forEach(b => {
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

function renderDone() {
  const r = result();
  root.className = 'stage stage--form';
  root.innerHTML = `
    <div class="form">
      <p class="step">검사 완료</p>
      <h1 class="ask">${r.answered}개 문항에 답했어</h1>
      <p class="note">결과 화면은 아직 만드는 중이야.</p>
      ${AXES.length ? `<div class="gauges">${AXES.map(a => {
        const pct = axisPercent(r.norm[a.id] ?? 0);
        return `<div class="gauge">
          <span class="gauge__k">${esc(a.name)}</span>
          <div class="gauge__track"><div class="gauge__fill"
            style="left:${Math.min(50, pct)}%;width:${Math.abs(pct - 50)}%"></div></div>
          <span class="gauge__v">${pct}</span>
        </div>`;
      }).join('')}</div>` : ''}
      <div class="choices"><button class="choice" id="again">처음부터 다시</button></div>
    </div>`;
  root.querySelector('#again')?.addEventListener('click', () => reset());
}

/* 키보드로도 넘길 수 있게 */
document.addEventListener('keydown', e => {
  if ((e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight')
      && state.stage === 'scene' && currentBeat()?.kind !== 'question') {
    e.preventDefault();
    advance();
  }
});
