import { registerDraftFinalizer } from "../state.js";
import { characterRect, coasterRect, viewportOf, visibleCharacterRect } from "../components/md.js";
import { coasterLibrary } from "../library.js";

// "캐릭터에 맞춤" (frame.fit). ONE draft finalizer covers every path that changes the MD character /
// coaster bbox — drag, Ctrl+wheel, sliders, reset, image replace/remove, coaster source change,
// linked movement — because it compares against the previous committed state instead of hooking
// each path. It only edits the draft (never calls updateState) and does not run on project load.
// A manual frame move/resize (canvas or slider) while fit is on turns fit off.

function coasterSize(coaster) {
  if (coaster.source !== "file") return null;
  const s = coasterLibrary.status(coaster.file);
  return s.state === "ready" ? { width: s.width, height: s.height } : null;
}

// Everything the fitted geometry depends on.
function inputsKey(state) {
  const md = state.components.md;
  const c = md.character;
  const k = md.coaster;
  return JSON.stringify([
    state.design.width, state.design.height, md.frame.shape, md.frame.fit.padding,
    c.asset ? [c.asset.width, c.asset.height, c.x, c.y, c.width] : null,
    viewportOf(md), // v16: the visible (clipped) character rect depends on the viewport + clip
    k.source, k.x, k.y, k.width, k.file ?? null, k.plate?.aspect ?? null, coasterSize(k),
  ]);
}

const geometryKey = (f) => JSON.stringify([f.x, f.y, f.width, f.aspect]);

export function fittedGeometry(state) {
  const W = state.design.width;
  const H = state.design.height;
  const md = state.components.md;
  // v16: while clipping, fit the VISIBLE character (rect ∩ viewport). A character that exists but is
  // entirely clipped away → keep the stored frame (never expand to the whole viewport).
  const visible = visibleCharacterRect(md, W, H);
  if (characterRect(md.character, W, H) && !visible) return null;
  const rects = [visible, coasterRect(md.coaster, coasterSize(md.coaster), W, H)].filter(Boolean);
  if (!rects.length) return null; // nothing to fit: keep the stored geometry
  const x0 = Math.min(...rects.map((r) => r.x));
  const y0 = Math.min(...rects.map((r) => r.y));
  const x1 = Math.max(...rects.map((r) => r.x + r.w));
  const y1 = Math.max(...rects.map((r) => r.y + r.h));
  const pad = md.frame.fit.padding * W;
  const w = Math.max(W * 0.05, x1 - x0 + pad * 2);
  // curved tops need headroom so the subject is not cut by the arc
  const head = ["arch", "pill", "oval"].includes(md.frame.shape) ? w * 0.22 : 0;
  const top = y0 - pad - head;
  const h = Math.max(W * 0.05, y1 + pad - top);
  return { x: (x0 + x1) / 2 / W, y: (top + h / 2) / H, width: w / W, aspect: h / w };
}

registerDraftFinalizer((draft, prev) => {
  const f = draft.components?.md?.frame;
  const pf = prev.components?.md?.frame;
  if (!f?.fit?.on || !pf) return;
  const inputsChanged = !pf.fit?.on || inputsKey(draft) !== inputsKey(prev);
  if (!inputsChanged) {
    // fit inputs untouched but the frame geometry changed → a manual frame edit: fit turns off
    if (geometryKey(f) !== geometryKey(pf)) f.fit.on = false;
    return;
  }
  const g = fittedGeometry(draft);
  if (g) Object.assign(f, g);
});
