// Session editing history (Undo / Redo). Runtime only: never serialized, reset on load / new project.
//
// Entries are REFERENCES to immutable state snapshots. updateState() already builds a fresh state
// object per change (structuredClone of a small, binary-free state; images live in assets.js), so
// history never clones anything and never touches base64.
//
// One meaningful user action = one step. Continuous input is grouped into "gestures":
//   pointer gesture  pointerdown … pointerup (canvas drags, slider drags, gradient pins, builder bars)
//   input gesture    first `input` on a field … its `change` / focusout (typing, color pickers)
//   timed gesture    Ctrl+wheel resize (400 ms idle), arrow keys on a slider (500 ms idle)
//   transaction(fn)  explicit grouping for multi-call actions
// Every update inside an open gesture merges into that gesture's single step.

export const HISTORY_LIMIT = 100;
const TIMED = { wheel: 400, key: 500 };

let past = [];
let future = [];
let present = null;
const listeners = new Set();
let onDropStates = () => {};

// gesture bookkeeping
let pointerGesture = null; // { id, recorded }
let inputGesture = null; // { el, recorded }
let txDepth = 0;
let txGesture = null;
let timed = null; // { key, until, recorded }
let gestureSeq = 0;

const notify = () => {
  for (const fn of listeners) fn();
};

export function subscribeHistory(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export const canUndo = () => past.length > 0;
export const canRedo = () => future.length > 0;
export const allHistoryStates = () => [...past, present, ...future].filter(Boolean);

// Called with the states that just left history (trim / redo invalidation / reset), so assets that no
// state references any more can be released.
export function setHistoryDropHandler(fn) {
  onDropStates = fn;
}

export function resetHistory(state) {
  const dropped = [...past, ...future];
  past = [];
  future = [];
  present = state;
  closeAllGestures();
  if (dropped.length) onDropStates(dropped);
  notify();
}

// Content equality without meta (updatedAt changes on every update).
function sameContent(a, b) {
  if (a === b) return true;
  const strip = (s) => JSON.stringify({ ...s, meta: { ...s.meta, updatedAt: null } });
  return strip(a) === strip(b);
}

function activeGesture() {
  if (txGesture) return txGesture;
  // an open text edit wins: clicking elsewhere blurs the field (its change-time write) right after
  // pointerdown, and that write must stay in the field's step, not start the drag's step
  if (inputGesture) return inputGesture;
  if (pointerGesture) return pointerGesture;
  if (timed && performance.now() <= timed.until) return timed;
  return null;
}

// Called by updateState after the draft finalizers. Returns false when nothing meaningful changed
// (then the caller keeps the previous state object: no step, no dirty, same reference).
export function isSameContent(prev, next) {
  return sameContent(prev, next);
}
export function recordHistory(prev, next) {
  if (present === null) present = prev;
  const g = activeGesture();
  if (g && g.recorded) {
    present = next; // merge into the gesture's step
  } else {
    past.push(prev);
    const dropped = future;
    future = [];
    if (g) g.recorded = true;
    if (past.length > HISTORY_LIMIT) dropped.push(...past.splice(0, past.length - HISTORY_LIMIT));
    present = next;
    if (dropped.length) onDropStates(dropped);
  }
  notify();
}

// Returns the state to restore (the caller restores it WITHOUT finalizers / recording), or null.
export function undoState() {
  if (!past.length) return null;
  closeAllGestures();
  future.push(present);
  present = past.pop();
  notify();
  return present;
}
export function redoState() {
  if (!future.length) return null;
  closeAllGestures();
  past.push(present);
  present = future.pop();
  notify();
  return present;
}

// Explicit grouping: every updateState inside fn becomes one step (nesting allowed).
export function transaction(fn) {
  if (txDepth === 0) txGesture = { id: ++gestureSeq, recorded: false };
  txDepth += 1;
  try {
    return fn();
  } finally {
    txDepth -= 1;
    if (txDepth === 0) txGesture = null;
  }
}

function closeAllGestures() {
  pointerGesture = null;
  inputGesture = null;
  timed = null;
}

const isRange = (el) => el instanceof HTMLInputElement && el.type === "range";

// Document-level listeners: capture to OPEN a gesture before any handler writes state, window
// bubble to CLOSE it after the target's own handlers ran (so a change-time write still merges).
export function installGestureTracking(win = window) {
  const doc = win.document;
  doc.addEventListener(
    "pointerdown",
    (e) => {
      if (e.button !== 0) return;
      pointerGesture = { id: ++gestureSeq, recorded: false };
    },
    true,
  );
  const endPointer = () => {
    pointerGesture = null;
  };
  win.addEventListener("pointerup", endPointer);
  win.addEventListener("pointercancel", endPointer);

  doc.addEventListener(
    "input",
    (e) => {
      const el = e.target;
      if (pointerGesture || isRange(el)) return; // slider input belongs to the pointer / key gesture
      if (!inputGesture || inputGesture.el !== el) inputGesture = { el, recorded: false };
    },
    true,
  );
  const endInput = (e) => {
    if (inputGesture && inputGesture.el === e.target) inputGesture = null;
  };
  win.addEventListener("change", endInput);
  win.addEventListener("focusout", endInput);

  doc.addEventListener(
    "wheel",
    (e) => {
      if (!(e.ctrlKey || e.metaKey)) return; // plain wheel = view zoom, never a state change
      const now = performance.now();
      if (!timed || timed.key !== "wheel" || now > timed.until) timed = { key: "wheel", recorded: false, until: 0 };
      timed.until = now + TIMED.wheel;
    },
    { capture: true, passive: true },
  );
  doc.addEventListener(
    "keydown",
    (e) => {
      if (!isRange(e.target)) return;
      const now = performance.now();
      const key = e.target;
      if (!timed || timed.key !== key || now > timed.until) timed = { key, recorded: false, until: 0 };
      timed.until = now + TIMED.key;
    },
    true,
  );
}

// Ctrl+Z / Ctrl+Y / Ctrl+Shift+Z (⌘ on Mac). Native text undo is left alone inside text fields, and
// shortcuts are ignored while a modal layer ([data-modal-layer] or an open <dialog>) is shown.
const TEXT_TYPES = new Set(["text", "number", "search", "email", "url", "tel", "password"]);
export function isTextEditing(el) {
  if (!el) return false;
  if (el.isContentEditable) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  return el instanceof HTMLInputElement && TEXT_TYPES.has(el.type);
}
export function installHistoryShortcuts({ undo, redo }, win = window) {
  const doc = win.document;
  doc.addEventListener("keydown", (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    const isUndo = k === "z" && !e.shiftKey;
    const isRedo = k === "y" || (k === "z" && e.shiftKey);
    if (!isUndo && !isRedo) return;
    if (isTextEditing(doc.activeElement)) return; // native text undo
    if (doc.querySelector("dialog[open], [data-modal-layer]:not([hidden])")) return;
    e.preventDefault();
    if (isUndo) undo();
    else redo();
  });
}
