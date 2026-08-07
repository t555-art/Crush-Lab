import { SCENES } from '../data/scenes';
import { resolveScenes, countQuestions } from '../engine/select';
import { score } from '../engine/score';
import type {
  Answers, IntroAnswers, IntroQuestion, Question, ResolvedScene,
} from '../engine/types';
import introJson from '../data/intro.json';

const INTRO = introJson as IntroQuestion[];
const SAVE_KEY = 'crushlab.progress.v2';

/**
 * 화면 진행 담당.
 *
 * 구조는 일부러 단순하게 뒀다 — 상태 하나(State)와 그리는 함수 하나(render).
 * 상태가 바뀌면 통째로 다시 그린다. 문항 수가 40개 남짓이라
 * 이 정도로 충분하고, 프레임워크를 얹는 것보다 고치기 쉽다.
 *
 * 진행 단계
 *   intro  기본 질문 (성별·학년 등). 서사 없음
 *   scene  하루 서사. 탭하면 다음 비트로
 *   done   채점 끝. 결과 화면으로 넘김
 */

type Stage = 'intro' | 'scene' | 'done';

interface State {
  stage: Stage;
  introIndex: number;
  intro: IntroAnswers;
  scenes: ResolvedScene[];
  sceneIndex: number;
  beatIndex: number;
  answers: Answers;
}

const state: State = {
  stage: 'intro',
  introIndex: 0,
  intro: {},
  scenes: [],
  sceneIndex: 0,
  beatIndex: 0,
  answers: {},
};

let root: HTMLElement;

export function mountPlayer(el: HTMLElement) {
  root = el;
  restore();
  render();
}

/* ── 저장 / 복구 ───────────────────────────────────────
   v1은 새로고침하면 답한 게 전부 날아갔다. 그게 제일 큰 이탈 원인이었다. */
function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      stage: state.stage, introIndex: state.introIndex, intro: state.intro,
      sceneIndex: state.sceneIndex, beatIndex: state.beatIndex, answers: state.answers,
    }));
  } catch { /* 시크릿 모드 등에서 막히면 그냥 저장 안 함 */ }
}

function restore() {
  try {
    const saved = localStorage.getItem(SAVE_KEY);
    if (!saved) return;
    const d = JSON.parse(saved);
    if (!d || typeof d !== 'object') return;
    Object.assign(state, {
      stage: d.stage ?? 'intro',
      introIndex: d.introIndex ?? 0,
      intro: d.intro ?? {},
      sceneIndex: d.sceneIndex ?? 0,
      beatIndex: d.beatIndex ?? 0,
      answers: d.answers ?? {},
    });
    // 장면은 저장하지 않고 자기소개로 다시 만든다 (같은 시드 → 같은 문항)
    if (state.stage !== 'intro') state.scenes = resolveScenes(SCENES, state.intro);
  } catch { reset(false); }
}

export function reset(rerender = true) {
  Object.assign(state, {
    stage: 'intro', introIndex: 0, intro: {},
    scenes: [], sceneIndex: 0, beatIndex: 0, answers: {},
  });
  try { localStorage.removeItem(SAVE_KEY); } catch { /* noop */ }
  if (rerender) render();
}

/* ── 진행 ─────────────────────────────────────────────── */

function currentScene(): ResolvedScene | undefined {
  return state.scenes[state.sceneIndex];
}

function currentBeat() {
  return currentScene()?.beats[state.beatIndex];
}

/** 탭했을 때. 문항이 떠 있으면 무시한다 (선택을 해야 넘어감) */
function advance() {
  if (state.stage !== 'scene') return;
  if (currentBeat()?.kind === 'question') return;
  step();
}

function step() {
  const scene = currentScene();
  if (!scene) return;
  if (state.beatIndex < scene.beats.length - 1) {
    state.beatIndex++;
  } else if (state.sceneIndex < state.scenes.length - 1) {
    state.sceneIndex++;
    state.beatIndex = 0;
  } else {
    state.stage = 'done';
  }
  save();
  render();
}

function answerIntro(value: string) {
  const q = INTRO[state.introIndex];
  state.intro[q.id] = value;
  if (state.introIndex < INTRO.length - 1) {
    state.introIndex++;
  } else {
    state.scenes = resolveScenes(SCENES, state.intro);
    state.stage = 'scene';
    state.sceneIndex = 0;
    state.beatIndex = 0;
  }
  save();
  render();
}

function answerQuestion(q: Question, index: number) {
  state.answers[q.id] = index;
  save();
  step();
}

/** 답한 문항만 모아서 채점한다 */
export function result() {
  const asked: Question[] = [];
  for (const s of state.scenes) {
    for (const b of s.beats) if (b.kind === 'question' && b.question) asked.push(b.question);
  }
  return { ...score(asked, state.answers), intro: state.intro };
}

/* ── 그리기 ───────────────────────────────────────────── */

const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));

/** 줄바꿈을 살린 텍스트 */
const text = (s: string) => esc(s).replace(/\n/g, '<br>');

function render() {
  if (state.stage === 'intro') return renderIntro();
  if (state.stage === 'scene') return renderScene();
  return renderDone();
}

function renderIntro() {
  const q = INTRO[state.introIndex];
  const pct = (state.introIndex / INTRO.length) * 100;
  root.className = 'stage stage--form';
  root.innerHTML = `
    <div class="form">
      <div class="bar" role="progressbar" aria-valuenow="${state.introIndex + 1}" aria-valuemin="1" aria-valuemax="${INTRO.length}">
        <div class="bar__fill" style="width:${pct}%"></div>
      </div>
      <p class="step">기본 질문 ${state.introIndex + 1} / ${INTRO.length}</p>
      <h1 class="ask">${esc(q.q)}</h1>
      <div class="choices">
        ${q.opts.map(o => `<button class="choice" data-v="${esc(o.v)}">${esc(o.t)}</button>`).join('')}
      </div>
    </div>`;
  root.querySelectorAll<HTMLButtonElement>('.choice').forEach(b => {
    b.addEventListener('click', () => answerIntro(b.dataset.v!));
  });
}

function renderScene() {
  const scene = currentScene();
  const beat = currentBeat();
  if (!scene || !beat) { state.stage = 'done'; return render(); }

  const total = countQuestions(state.scenes);
  const done = Object.keys(state.answers).length;
  const isQuestion = beat.kind === 'question' && beat.question;

  root.className = 'stage stage--scene';
  root.innerHTML = `
    <div class="scene">
      <img class="scene__art" src="${esc(scene.art.src)}" alt="${esc(scene.art.alt)}" fetchpriority="high">
      <div class="scene__veil"></div>

      <header class="scene__head">
        <span class="clock">${esc(scene.time)}</span>
        <span class="place">${esc(scene.place)}</span>
        <span class="tally">${done} / ${total}</span>
      </header>

      <div class="box ${isQuestion ? 'box--ask' : ''}">
        ${beat.kind === 'line' && beat.speaker
          ? `<p class="who">${esc(beat.speaker)}</p>` : ''}
        ${isQuestion
          ? `<p class="line">${text(beat.question!.q)}</p>
             <div class="choices">
               ${beat.question!.o.map((o, i) =>
                 `<button class="choice" data-i="${i}">${esc(o.t)}</button>`).join('')}
             </div>`
          : `<p class="line">${text(beat.text ?? '')}</p>
             <span class="next" aria-hidden="true"></span>`}
      </div>

      ${isQuestion ? '' : '<button class="tapzone" aria-label="다음"></button>'}
    </div>`;

  if (isQuestion) {
    root.querySelectorAll<HTMLButtonElement>('.choice').forEach(b => {
      b.addEventListener('click', () => answerQuestion(beat.question!, Number(b.dataset.i)));
    });
  } else {
    root.querySelector<HTMLButtonElement>('.tapzone')?.addEventListener('click', advance);
  }
}

function renderDone() {
  const r = result();
  root.className = 'stage stage--form';
  root.innerHTML = `
    <div class="form">
      <p class="step">검사 완료</p>
      <h1 class="ask">${esc(r.code)}</h1>
      <p class="note">문항 ${r.answered}개에 답했어. 결과 화면은 아직 만드는 중이야.</p>
      <div class="gauges">
        ${(['sp','ex','st','iv'] as const).map(k => {
          const pct = Math.round(50 + r.norm[k] * 50);
          return `<div class="gauge">
            <span class="gauge__k">${k}</span>
            <div class="gauge__track"><div class="gauge__fill" style="left:${Math.min(50,pct)}%;width:${Math.abs(pct-50)}%"></div></div>
            <span class="gauge__v">${pct}</span>
          </div>`;
        }).join('')}
      </div>
      <div class="choices">
        <a class="choice" href="/type/${esc(r.code)}">이 유형 페이지 보기</a>
        <button class="choice" id="again">처음부터 다시</button>
      </div>
    </div>`;
  root.querySelector('#again')?.addEventListener('click', () => reset());
}

/* 키보드로도 넘길 수 있게 (접근성 + 데스크톱 확인용) */
document.addEventListener('keydown', e => {
  if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
    if (state.stage === 'scene' && currentBeat()?.kind !== 'question') {
      e.preventDefault();
      advance();
    }
  }
});
