// Three Dots & a Dash — editor tutorial (Jamong draft)
// Editor UI only. No project state, renderer, export, storage, or index.html changes.
// Integration: import { initTutorial } from "./tutorial/tutorial.js"; then call initTutorial()
// after createFigureEditor(...) has created the JS-built theme strip + mode navigation.

const STEPS = [
  {
    mode: "background",
    target: '.mode-button[role="tab"]',
    targetLabel: "시트",
    title: "시트부터 정해요",
    body: "먼저 전체 시트의 분위기를 정해요. 위의 하트 테마를 고르거나, 시트 색과 배경을 직접 바꿀 수 있어요. 테마는 배치가 아니라 색 구성만 바꿔요.",
  },
  {
    mode: "md",
    target: '.mode-button[role="tab"]',
    targetLabel: "MD",
    title: "메인 캐릭터를 올려요",
    body: "MD에서 메인 캐릭터 이미지를 올리고 위치와 크기를 맞춰요. 미리보기에서 직접 드래그할 수 있고, 캐릭터·코스터·프레임 중 편집할 대상을 바꿀 수 있어요.",
  },
  {
    mode: "card",
    target: '.mode-button[role="tab"]',
    targetLabel: "카드",
    title: "칵테일 카드를 만들어요",
    body: "완성된 칵테일 그림이 있다면 이미지를 올리고, 도구 안에서 만들고 싶다면 ‘직접 만들기’를 눌러요. 잔 → 음료 → 얼음 → 림 → 가니쉬 순서로 꾸밀 수 있어요.",
  },
  {
    mode: "sd",
    target: '.mode-button[role="tab"]',
    targetLabel: "SD",
    title: "SD와 받침을 맞춰요",
    body: "SD 캐릭터를 올리고 도일리와 트레이를 조정해요. 기본적으로 SD를 움직이면 도일리와 트레이가 함께 따라가요.",
  },
  {
    mode: "receipt",
    target: '.mode-button[role="tab"]',
    targetLabel: "영수증",
    title: "신청 내용을 영수증에 담아요",
    body: "키워드, 분위기, 플레이리스트처럼 결과 시트에 보여줄 내용을 입력해요. 항목 수에 따라 영수증 종이가 아래로 늘어나요.",
  },
  {
    mode: "palette",
    target: '.mode-button[role="tab"]',
    targetLabel: "팔레트",
    title: "캐릭터 색을 정리해요",
    body: "대표색을 3–6개 등록해요. 이 팔레트는 결과 시트에 표시되고, ‘직접 만들기’의 음료·림 색으로도 가져다 쓸 수 있어요. 팔레트 색을 바꾸면 칵테일 색도 같이 바뀌어요.",
  },
  {
    mode: "stickers",
    target: '.mode-button[role="tab"]',
    targetLabel: "장식",
    title: "마지막으로 장식해요",
    body: "필요하다면 스티커와 장식을 더해요. 필수 단계는 아니니, 결과를 보면서 마지막에 가볍게 손보면 돼요.",
  },
  {
    target: ".panel-footer",
    title: "저장과 PNG는 달라요",
    body: "저장은 나중에 다시 수정할 수 있는 프로젝트 파일을 만들고, PNG 내보내기는 완성된 결과 이미지를 만들어요. 다시 수정할 가능성이 있다면 프로젝트도 함께 저장해 주세요.",
    note: "사용하면서 어디를 눌러야 할지 모르겠거나, 설명 없이 이해하기 어려웠던 부분도 UI/UX 제보 대상이에요.",
  },
];

const STYLE_ID = "tdad-tutorial-style";

export function initTutorial() {
  const header = document.querySelector(".panel-header");
  if (!header || document.querySelector(".tutorial-help-button")) return null;

  installStyles();

  const help = document.createElement("button");
  help.type = "button";
  help.className = "tutorial-help-button";
  help.textContent = "? 사용 방법";
  help.setAttribute("aria-label", "사용 방법 튜토리얼 열기");
  header.append(help);

  let index = -1;
  let active = false;
  let target = null;
  let previousFocus = null;

  const root = document.createElement("div");
  root.className = "tutorial-layer";
  root.dataset.modalLayer = ""; // A-2: while shown, global Undo/Redo shortcuts are ignored
  root.hidden = true;
  root.innerHTML = `
    <div class="tutorial-shade tutorial-shade-top"></div>
    <div class="tutorial-shade tutorial-shade-left"></div>
    <div class="tutorial-shade tutorial-shade-right"></div>
    <div class="tutorial-shade tutorial-shade-bottom"></div>
    <div class="tutorial-focus-ring" aria-hidden="true"></div>
    <section class="tutorial-card" role="dialog" aria-modal="false" aria-labelledby="tutorial-title">
      <div class="tutorial-card-head">
        <span class="tutorial-progress"></span>
        <button class="tutorial-close" type="button" aria-label="튜토리얼 닫기">×</button>
      </div>
      <h2 id="tutorial-title"></h2>
      <p class="tutorial-body"></p>
      <p class="tutorial-note" hidden></p>
      <div class="tutorial-actions">
        <button class="tutorial-prev" type="button">← 이전</button>
        <button class="tutorial-next" type="button">다음 →</button>
      </div>
    </section>`;
  document.body.append(root);

  const $ = (s) => root.querySelector(s);
  const ring = $(".tutorial-focus-ring");
  const card = $(".tutorial-card");
  const progress = $(".tutorial-progress");
  const title = $("#tutorial-title");
  const body = $(".tutorial-body");
  const note = $(".tutorial-note");
  const prev = $(".tutorial-prev");
  const next = $(".tutorial-next");
  const close = $(".tutorial-close");
  const shades = {
    top: $(".tutorial-shade-top"),
    left: $(".tutorial-shade-left"),
    right: $(".tutorial-shade-right"),
    bottom: $(".tutorial-shade-bottom"),
  };

  help.addEventListener("click", start);
  close.addEventListener("click", stop);
  prev.addEventListener("click", () => show(index - 1));
  next.addEventListener("click", () => (index === STEPS.length - 1 ? stop() : show(index + 1)));
  window.addEventListener("resize", reposition);
  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("click", onTutorialModeClick, true);

  function start() {
    previousFocus = document.activeElement;
    active = true;
    root.hidden = false;
    show(0);
  }

  function stop() {
    if (!active) return;
    active = false;
    index = -1;
    target = null;
    root.hidden = true;
    previousFocus?.focus?.();
  }

  function show(nextIndex) {
    if (!active) return;
    index = Math.max(0, Math.min(STEPS.length - 1, nextIndex));
    const step = STEPS[index];

    if (step.mode) openMode(step.mode);
    target = resolveTarget(step);

    progress.textContent = `${index + 1} / ${STEPS.length}`;
    title.textContent = step.title;
    body.textContent = step.body;
    note.textContent = step.note || "";
    note.hidden = !step.note;
    prev.disabled = index === 0;
    next.textContent = index === STEPS.length - 1 ? "완료" : "다음 →";

    // Let mode-nav finish its synchronous show(), then measure the real target.
    requestAnimationFrame(() => {
      target = resolveTarget(step);
      target?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
      requestAnimationFrame(reposition);
    });
  }

  function openMode(section) {
    const button = [...document.querySelectorAll('.mode-button[role="tab"]')]
      .find((b) => modeForLabel(b.textContent) === section);
    if (button && button.getAttribute("aria-selected") !== "true") button.click();
  }

  function resolveTarget(step) {
    if (step.targetLabel) {
      return [...document.querySelectorAll(step.target)].find((el) => el.textContent.trim() === step.targetLabel) || null;
    }
    return document.querySelector(step.target);
  }

  function reposition() {
    if (!active || !target?.isConnected) return;
    const r = target.getBoundingClientRect();
    const pad = 7;
    const x = Math.max(0, r.left - pad);
    const y = Math.max(0, r.top - pad);
    const right = Math.min(innerWidth, r.right + pad);
    const bottom = Math.min(innerHeight, r.bottom + pad);
    const w = Math.max(0, right - x);
    const h = Math.max(0, bottom - y);

    Object.assign(ring.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
    setRect(shades.top, 0, 0, innerWidth, y);
    setRect(shades.left, 0, y, x, h);
    setRect(shades.right, right, y, Math.max(0, innerWidth - right), h);
    setRect(shades.bottom, 0, bottom, innerWidth, Math.max(0, innerHeight - bottom));

    // Prefer the workspace side so the 320px editor remains visible; fall back to the roomiest side.
    const gap = 14;
    const cardW = Math.min(360, innerWidth - 24);
    card.style.width = `${cardW}px`;
    card.style.left = "12px";
    card.style.top = "12px";
    const cardH = card.offsetHeight;
    const candidates = [
      { x: right + gap, y, room: innerWidth - right - gap, kind: "right" },
      { x: x - gap - cardW, y, room: x - gap, kind: "left" },
      { x: Math.min(Math.max(12, x), innerWidth - cardW - 12), y: bottom + gap, room: innerHeight - bottom - gap, kind: "bottom" },
      { x: Math.min(Math.max(12, x), innerWidth - cardW - 12), y: y - gap - cardH, room: y - gap, kind: "top" },
    ];
    let c = candidates.find((v) => (v.kind === "right" || v.kind === "left") ? v.room >= cardW : v.room >= cardH);
    if (!c) c = candidates.sort((a, b) => b.room - a.room)[0];
    card.style.left = `${clamp(c.x, 12, innerWidth - cardW - 12)}px`;
    card.style.top = `${clamp(c.y, 12, innerHeight - cardH - 12)}px`;
  }

  function onTutorialModeClick(event) {
    const tab = active && event.target.closest?.('.mode-button[role="tab"]');
    if (tab && tab.getAttribute("aria-selected") === "true") {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  function onKeyDown(event) {
    if (!active) return;
    if (event.key === "Escape") {
      stop();
      return;
    }
    if ((event.key === "ArrowRight" || event.key === "ArrowLeft") &&
        event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return;
    if (event.key === "ArrowRight") next.click();
    if (event.key === "ArrowLeft" && index > 0) prev.click();
  }

  return { start, stop, isActive: () => active };
}

function modeForLabel(label) {
  return ({ 시트: "background", MD: "md", 카드: "card", SD: "sd", 영수증: "receipt", 팔레트: "palette", 장식: "stickers" })[label.trim()] || null;
}

function setRect(el, x, y, w, h) {
  Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` });
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function installStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .panel-header { position: relative; }
    .tutorial-help-button {
      position: absolute; right: 14px; top: 12px; bottom: auto; min-height: 26px; padding: 3px 8px;
      border-radius: 999px; font-size: 10px; color: var(--muted); background: transparent;
    }
    .tutorial-help-button:hover { color: var(--text); background: var(--panel-2); }
    .tutorial-layer { position: fixed; inset: 0; z-index: 10000; pointer-events: none; }
    .tutorial-shade { position: fixed; background: rgb(8 7 11 / .68); pointer-events: auto; }
    .tutorial-focus-ring {
      position: fixed; border: 2px solid var(--accent); border-radius: 10px;
      box-shadow: 0 0 0 3px rgb(215 181 255 / .18); pointer-events: none;
      transition: left .18s ease, top .18s ease, width .18s ease, height .18s ease;
    }
    .tutorial-card {
      position: fixed; max-width: calc(100vw - 24px); padding: 16px; border: 1px solid var(--line-hover);
      border-radius: 14px; background: #1e1b26; color: var(--text); box-shadow: 0 18px 60px rgb(0 0 0 / .5);
      pointer-events: auto;
    }
    .tutorial-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
    .tutorial-progress { color: var(--accent); font-size: 11px; font-weight: 700; letter-spacing: .12em; }
    .tutorial-close { min-height: 26px; width: 26px; padding: 0; border: 0; background: transparent; font-size: 20px; color: var(--muted); }
    .tutorial-card h2 { margin: 0 0 8px; font-size: 16px; }
    .tutorial-body, .tutorial-note { margin: 0; font-size: 12px; line-height: 1.65; color: var(--text); }
    .tutorial-note { margin-top: 9px; padding-top: 9px; border-top: 1px solid var(--line); color: var(--accent); }
    .tutorial-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
    .tutorial-actions button { min-height: 34px; padding: 6px 9px; }
    .tutorial-next { border-color: var(--primary-line); background: var(--primary-bg); }
    @media (max-width: 800px) {
      .tutorial-card { width: min(360px, calc(100vw - 24px)) !important; }
    }
  `;
  document.head.append(style);
}
