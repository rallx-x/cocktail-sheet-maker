import {
  BUILTIN_DEFAULTS,
  PROJECT_VERSION,
  SCALE_RANGE,
  createBuiltinPattern,
  createDefaultPattern,
  createFilePattern,
  editorConfig,
  getState,
  normalizeHexColor,
  redo,
  setState,
  subscribe,
  undo,
  updateState,
} from "./state.js";
import { canRedo, canUndo, installGestureTracking, installHistoryShortcuts, subscribeHistory } from "./history.js";
import { renderSheet } from "./renderer.js";
import { downloadProject, readProjectFile } from "./project-io.js";
import { exportPng } from "./export.js";
import { getPatternStatus, loadPatternManifest, reloadPatternLibrary } from "./library.js";
import { BUILTIN_PATTERNS, PATTERN_GROUPS, getBuiltinPattern, minScaleFor } from "./patterns/builtin.js";
import { makeSeed } from "./patterns/prng.js";
import { createColorField } from "./ui/controls.js";
import { ZOOM_RANGE, ZOOM_STEP, getZoom, onZoom, setZoom } from "./editor/view.js";
import { createFigureEditor } from "./editor/figure-editor.js";
import { STRINGS } from "./strings.js";
import { initTesterBuild } from "./tester/tester-notice.js";
import { initTutorial } from "./tutorial/tutorial.js";
import { initCreditOwner } from "./tester/credit-owner.js";

initTesterBuild(); // tester build: app subtitle + one-time entry notice (editor UI only)

const els = {
  canvas: document.querySelector("#sheetCanvas"),
  stage: document.querySelector("#stage"),
  backgroundColorPicker: document.querySelector("#backgroundColorPicker"),
  backgroundColorHex: document.querySelector("#backgroundColorHex"),
  backgroundHexError: document.querySelector("#backgroundHexError"),
  patternSelect: document.querySelector("#patternSelect"),
  patternReloadButton: document.querySelector("#patternReloadButton"),
  patternTint: document.querySelector("#patternTint"),
  builtinControls: document.querySelector("#builtinControls"),
  fileControls: document.querySelector("#fileControls"),
  builtinColorPicker: document.querySelector("#builtinColorPicker"),
  builtinColorHex: document.querySelector("#builtinColorHex"),
  builtinHexError: document.querySelector("#builtinHexError"),
  builtinOpacity: document.querySelector("#builtinOpacity"),
  builtinOpacityValue: document.querySelector("#builtinOpacityValue"),
  builtinScale: document.querySelector("#builtinScale"),
  builtinScaleValue: document.querySelector("#builtinScaleValue"),
  reseedButton: document.querySelector("#reseedButton"),
  tintRow: document.querySelector("#tintRow"),
  tintColorPicker: document.querySelector("#tintColorPicker"),
  tintColorHex: document.querySelector("#tintColorHex"),
  tintHexError: document.querySelector("#tintHexError"),
  patternNotice: document.querySelector("#patternNotice"),
  projectInput: document.querySelector("#projectInput"),
  saveProjectButton: document.querySelector("#saveProjectButton"),
  exportButton: document.querySelector("#exportButton"),
  designSize: document.querySelector("#designSize"),
  designRatio: document.querySelector("#designRatio"),
  previewScale: document.querySelector("#previewScale"),
  projectVersion: document.querySelector("#projectVersion"),
};

let renderTicket = 0;
// A-2: "unsaved" = the current state is not the one last saved / loaded (by reference), so undoing
// back to the saved point clears the warning.
let savedState = getState();
let dirty = false;
let resizeFrame = 0;
let previewCssScale = 1;
let patternList = [];
let patternListError = null;
// Built-in settings survive switching between patterns (editor memory, not saved state).
let lastBuiltinSettings = { ...BUILTIN_DEFAULTS };

els.projectVersion.textContent = String(PROJECT_VERSION);

subscribe((state) => {
  dirty = state !== savedState;
  queueRender();
});

// ---------- Undo / Redo (A-2) ----------

installGestureTracking();
installHistoryShortcuts({ undo, redo });
const historyButton = (text, title, action) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "history-button";
  b.textContent = text;
  b.title = title;
  b.addEventListener("click", action);
  return b;
};
const undoButton = historyButton("↶ 이전", "되돌리기 (Ctrl+Z)", () => undo());
const redoButton = historyButton("↷ 다음", "다시 하기 (Ctrl+Y)", () => redo());
els.saveProjectButton.before(undoButton, redoButton);
const syncHistoryButtons = () => {
  undoButton.disabled = !canUndo();
  redoButton.disabled = !canRedo();
};
subscribeHistory(syncHistoryButtons);
syncHistoryButtons();

window.addEventListener("resize", () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(queueRender);
});

window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = STRINGS.unsaved;
});

// ---------- Color fields (picker + HEX text, kept in sync) ----------

const backgroundColorField = createColorField({
  getState,
  updateState,
  picker: els.backgroundColorPicker,
  hex: els.backgroundColorHex,
  error: els.backgroundHexError,
  read: (state) => state.design.backgroundColor,
  write: (draft, hex) => {
    draft.design.backgroundColor = hex;
  },
});

const tintColorField = createColorField({
  getState,
  updateState,
  picker: els.tintColorPicker,
  hex: els.tintColorHex,
  error: els.tintHexError,
  read: (state) => state.design.pattern.tintColor ?? "#000000",
  write: (draft, hex) => {
    if (draft.design.pattern.source === "file") draft.design.pattern.tintColor = hex;
  },
});

const builtinColorField = createColorField({
  getState,
  updateState,
  picker: els.builtinColorPicker,
  hex: els.builtinColorHex,
  error: els.builtinHexError,
  read: (state) => state.design.pattern.color ?? BUILTIN_DEFAULTS.color,
  write: (draft, hex) => {
    if (draft.design.pattern.source === "builtin") draft.design.pattern.color = hex;
  },
});

// ---------- MD + SD figure editor ----------

const mdEditor = createFigureEditor({
  getState,
  updateState,
  getPreviewScale: () => previewCssScale,
  reportError,
});

initTutorial(); // tester build: "? 사용 방법" guided tour (editor UI only)
initCreditOwner(); // tester build: "커미션주 표기" input for the sheet credit

// ---------- Pattern library ----------

els.patternSelect.addEventListener("change", (event) => {
  const [kind, ...rest] = event.target.value.split(":");
  const key = rest.join(":");
  const current = getState().design.pattern;
  if (current.source === "builtin") rememberBuiltin(current);

  let next;
  if (kind === "builtin" && getBuiltinPattern(key)) {
    const keepSeed = current.source === "builtin" ? current.seed : undefined;
    // v13: coming from "no pattern", the pattern takes the Sheet Color "pattern" role
    const color = current.source === "builtin" ? lastBuiltinSettings.color : getState().design.colors?.pattern ?? lastBuiltinSettings.color;
    next = createBuiltinPattern(key, makeSeed(), { ...lastBuiltinSettings, color, seed: keepSeed });
    next.scale = Math.max(next.scale, minScaleFor(key, SCALE_RANGE.min));
  } else if (kind === "file" && key) {
    next = current.source === "file" ? { ...current, file: key } : createFilePattern(key);
  } else {
    next = createDefaultPattern();
  }
  updateState((draft) => {
    draft.design.pattern = next;
  });
});

function rememberBuiltin(pattern) {
  lastBuiltinSettings = { color: pattern.color, opacity: pattern.opacity, scale: pattern.scale };
}

els.builtinOpacity.addEventListener("input", (event) => {
  const opacity = Number(event.target.value) / 100;
  updateState((draft) => {
    if (draft.design.pattern.source === "builtin") draft.design.pattern.opacity = opacity;
  });
});

els.builtinScale.addEventListener("input", (event) => {
  const requested = Number(event.target.value) / 100;
  updateState((draft) => {
    const pattern = draft.design.pattern;
    if (pattern.source === "builtin") pattern.scale = Math.max(requested, minScaleFor(pattern.id, SCALE_RANGE.min));
  });
});

// The only place a new seed is made: an explicit user action.
els.reseedButton.addEventListener("click", () => {
  const seed = makeSeed();
  updateState((draft) => {
    if (draft.design.pattern.source === "builtin") draft.design.pattern.seed = seed;
  });
});

els.patternTint.addEventListener("change", (event) => {
  updateState((draft) => {
    if (draft.design.pattern.source === "file") draft.design.pattern.tint = event.target.checked;
  });
});

els.patternReloadButton.addEventListener("click", async () => {
  els.patternReloadButton.disabled = true;
  try {
    await refreshPatternList(reloadPatternLibrary());
    queueRender();
  } finally {
    els.patternReloadButton.disabled = false;
  }
});

async function refreshPatternList(promise = loadPatternManifest()) {
  try {
    patternList = await promise;
    patternListError = null;
  } catch (error) {
    patternList = [];
    patternListError = error.message;
  }
  renderPatternOptions(getState());
  updateUi(getState());
}

function patternValue(pattern) {
  if (pattern.source === "builtin") return `builtin:${pattern.id}`;
  if (pattern.source === "file") return `file:${pattern.file}`;
  return "none";
}

function renderPatternOptions(state) {
  const pattern = state.design.pattern;
  const makeOption = (value, label) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    return option;
  };
  const makeGroup = (label, options) => {
    const group = document.createElement("optgroup");
    group.label = label;
    group.append(...options);
    return group;
  };

  const builtinGroups = PATTERN_GROUPS.map((group) => {
    const options = BUILTIN_PATTERNS.filter((def) => def.group === group.id).map((def) =>
      makeOption(`builtin:${def.id}`, def.name),
    );
    return options.length ? makeGroup(`${STRINGS.patternGroupBuiltin} · ${group.name}`, options) : null;
  }).filter(Boolean);
  const fileOptions = patternList.map((entry) => makeOption(`file:${entry.file}`, entry.name));
  // A project may reference a folder pattern that is no longer listed; keep it visible and selected.
  if (pattern.source === "file" && !patternList.some((entry) => entry.file === pattern.file)) {
    fileOptions.push(makeOption(`file:${pattern.file}`, STRINGS.patternNotListed(pattern.file)));
  }

  const children = [makeOption("none", STRINGS.patternNone), ...builtinGroups];
  if (fileOptions.length) children.push(makeGroup(STRINGS.patternGroupFile, fileOptions));
  els.patternSelect.replaceChildren(...children);
  els.patternSelect.value = patternValue(pattern);
}

// ---------- Project / export ----------

els.saveProjectButton.addEventListener("click", async () => {
  try {
    els.saveProjectButton.disabled = true;
    const saving = getState();
    await downloadProject(saving, "three-dots-project.tdad.json");
    savedState = saving;
    dirty = getState() !== savedState;
  } catch (error) {
    reportError(error);
  } finally {
    els.saveProjectButton.disabled = false;
  }
});

els.projectInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const { state: restored, commit } = await readProjectFile(file);
    commit();
    savedState = restored;
    setState(restored); // also resets undo history (the loaded state is the new baseline)
    dirty = false;
    renderPatternOptions(restored);
  } catch (error) {
    reportError(error);
  } finally {
    event.target.value = "";
  }
});

els.exportButton.addEventListener("click", async () => {
  try {
    els.exportButton.disabled = true;
    await exportPng(getState(), "three-dots-sheet.png");
  } catch (error) {
    reportError(error);
  } finally {
    updateUi(getState());
  }
});

// ---------- Rendering ----------

async function queueRender() {
  const ticket = ++renderTicket;
  const state = getState();
  const isCurrent = () => ticket === renderTicket;

  try {
    const preview = calculatePreviewRender(state);
    applyPreviewSize(preview);

    await renderSheet(els.canvas, state, {
      renderScale: preview.renderScale,
      isCurrent,
    });

    if (!isCurrent()) return;
    previewCssScale = preview.cssScale;
    updateUi(state, preview.cssScale);
    mdEditor.drawOverlay(state);
  } catch (error) {
    if (isCurrent()) reportError(error);
  }
}

function calculatePreviewRender(state) {
  const { width, height } = state.design;
  if (!width || !height) return { renderScale: 1, cssScale: 1, cssWidth: 0, cssHeight: 0 };

  // Measure the stage (the area above the status bar), not the preview frame:
  // the frame shrink-wraps the canvas and would lock the preview to its old size.
  // offsetWidth/Height include the stage's own scrollbars, so zooming in never changes "fit".
  const availableWidth = Math.max(1, els.stage.offsetWidth);
  const availableHeight = Math.max(1, els.stage.offsetHeight);
  const fitScale = Math.min(1, availableWidth / width, availableHeight / height);
  // v17 view zoom (editor only): 100% = fit. The bitmap never exceeds export resolution;
  // beyond that the browser upscales exactly what the PNG contains.
  const cssScale = fitScale * getZoom();
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  return {
    cssScale,
    renderScale: Math.min(cssScale * dpr, 1),
    cssWidth: Math.round(width * cssScale),
    cssHeight: Math.round(height * cssScale),
  };
}

// Applies the preview CSS size right away (the bitmap re-render follows asynchronously).
function applyPreviewSize(preview) {
  els.canvas.style.width = preview.cssWidth ? `${preview.cssWidth}px` : "";
  els.canvas.style.height = preview.cssHeight ? `${preview.cssHeight}px` : "";
  els.canvas.classList.toggle("is-upscaled", preview.cssScale * Math.max(1, window.devicePixelRatio || 1) > 1.001);
  els.stage.classList.toggle("is-zoomed", getZoom() > 1);
}

// ---------- View zoom (editor camera; never touches the project state) ----------

onZoom((zoom, anchor) => {
  const stage = els.stage;
  const before = els.canvas.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  const ax = anchor ? anchor.clientX : sr.left + stage.clientWidth / 2;
  const ay = anchor ? anchor.clientY : sr.top + stage.clientHeight / 2;
  const fx = (ax - before.left) / Math.max(1, before.width);
  const fy = (ay - before.top) / Math.max(1, before.height);
  const preview = calculatePreviewRender(getState());
  applyPreviewSize(preview);
  previewCssScale = preview.cssScale;
  const after = els.canvas.getBoundingClientRect();
  // keep the sheet point that was under the anchor under it
  stage.scrollLeft += after.left + fx * after.width - ax;
  stage.scrollTop += after.top + fy * after.height - ay;
  mdEditor.drawOverlay(getState());
  syncZoomBar();
  queueRender();
});

const zoomLabel = document.createElement("b");
const zoomButton = (text, title, onClick) => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "zoom-button";
  b.textContent = text;
  b.title = title;
  b.setAttribute("aria-label", title);
  b.addEventListener("click", onClick);
  return b;
};
const zoomOut = zoomButton("−", "축소", () => setZoom(getZoom() / ZOOM_STEP));
const zoomIn = zoomButton("+", "확대", () => setZoom(getZoom() * ZOOM_STEP));
const zoomReset = zoomButton("100%", "원래 크기로 (화면 맞춤)", () => setZoom(1));
const zoomBar = document.createElement("span");
zoomBar.className = "zoom-bar";
zoomBar.title = "휠로 확대·축소 (Ctrl + 휠은 선택한 요소 크기)";
zoomBar.append("확대 ", zoomOut, zoomLabel, zoomIn, zoomReset);
document.querySelector(".status-bar").prepend(zoomBar);
function syncZoomBar() {
  const z = getZoom();
  zoomLabel.textContent = `${Math.round(z * 100)}%`;
  zoomOut.disabled = z <= ZOOM_RANGE.min + 1e-6;
  zoomIn.disabled = z >= ZOOM_RANGE.max - 1e-6;
  zoomReset.disabled = z === 1;
}
syncZoomBar();

function updateUi(state, previewCssScale = null) {
  const { width, height, pattern } = state.design;
  const hasSheet = Boolean(width && height);

  els.canvas.hidden = !hasSheet;
  els.exportButton.disabled = !hasSheet;

  backgroundColorField.sync(state);
  mdEditor.sync(state);

  if (els.patternSelect.value !== patternValue(pattern)) renderPatternOptions(state);

  const isBuiltin = pattern.source === "builtin";
  const isFile = pattern.source === "file";
  els.builtinControls.hidden = !isBuiltin;
  els.fileControls.hidden = !isFile;

  if (isBuiltin) {
    builtinColorField.sync(state);
    const opacityPct = Math.round(pattern.opacity * 100);
    const scalePct = Math.round(pattern.scale * 100);
    if (document.activeElement !== els.builtinOpacity) els.builtinOpacity.value = String(opacityPct);
    els.builtinScale.min = String(Math.round(minScaleFor(pattern.id, SCALE_RANGE.min) * 100));
    if (document.activeElement !== els.builtinScale) els.builtinScale.value = String(scalePct);
    els.builtinOpacityValue.textContent = `${opacityPct}%`;
    els.builtinScaleValue.textContent = `${scalePct}%`;
    els.reseedButton.hidden = !getBuiltinPattern(pattern.id)?.random;
  }

  if (isFile) {
    tintColorField.sync(state);
    els.patternTint.checked = pattern.tint;
    els.tintRow.classList.toggle("is-disabled", !pattern.tint);
    els.tintColorPicker.disabled = !pattern.tint;
    els.tintColorHex.disabled = !pattern.tint;
  }

  const notice = patternNoticeText(state);
  els.patternNotice.hidden = !notice;
  els.patternNotice.textContent = notice;

  if (!hasSheet) {
    els.designSize.textContent = "—";
    els.designRatio.textContent = "—";
    els.previewScale.textContent = "—";
    return;
  }

  els.designSize.textContent = `${width} × ${height}px`;
  els.designRatio.textContent = reducedRatio(width, height);

  const scale = previewCssScale ?? calculatePreviewRender(state).cssScale;
  els.previewScale.textContent = `${(scale * 100).toFixed(1)}%`;
}

function patternNoticeText(state) {
  if (patternListError) return patternListError;
  const { pattern, width, height } = state.design;
  if (pattern.source !== "file") return "";

  const status = getPatternStatus(pattern.file);
  if (status.state === "missing") return STRINGS.patternMissing(pattern.file);
  if (status.state === "ready") {
    const patternRatio = status.width / status.height;
    const sheetRatio = width / height;
    const sameSize = status.width === width && status.height === height;
    if (!sameSize && Math.abs(patternRatio - sheetRatio) > editorConfig.aspectRatioTolerance) {
      return STRINGS.patternSizeNotice(status.width, status.height, width, height);
    }
  }
  return "";
}

function reducedRatio(width, height) {
  const divisor = gcd(width, height);
  return `${width / divisor}:${height / divisor}`;
}

function gcd(a, b) {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y) [x, y] = [y, x % y];
  return x || 1;
}

function reportError(error) {
  console.error(error);
  window.alert(error instanceof Error ? error.message : String(error));
}

refreshPatternList();
queueRender();
