import { clampWidth } from "../components/md.js";

// One interaction controller for the whole workspace: it owns pointer, wheel and the single
// active selection. Component knowledge (geometry, state paths, linked movement) lives in
// adapters, so MD / SD logic stays separate while there is only one owner of the pointer.
//
// adapter = { id, section, has(state), rect(state), anchor(state), getWidth(state),
//             setWidth(draft, w), snapshot(state), applyMove(draft, snapshot, dx, dy), reset(draft) }
// getAdapters(state) lists adapters TOP-MOST FIRST (hit-test order). It is called fresh each
// time, because sticker adapters come and go with the sticker list.
export function createInteraction({ overlay, sheet, getAdapters, guides, getState, updateState, getPreviewScale, onSelect, cssVar }) {
  const DEFAULT = "md.character";
  let selection = DEFAULT;
  let drag = null;

  const find = (id, state = getState()) => getAdapters(state).find((a) => a.id === id) ?? null;
  // A selection whose object disappeared (e.g. a deleted sticker) falls back to the default.
  const current = (state = getState()) => find(selection, state) ?? find(DEFAULT, state);

  function select(id) {
    if (!find(id)) return;
    const changed = id !== selection;
    selection = id;
    onSelect(id, changed);
    draw(getState());
  }

  function toDesign(event, state) {
    const rect = sheet.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * state.design.width,
      y: ((event.clientY - rect.top) / rect.height) * state.design.height,
    };
  }

  // Overlap rule (Phase 2 rule, refined for backdrops): the current selection wins where items
  // overlap, so a selected coaster / doily stays grabbable under the character on top of it.
  // Backdrop items (MD frame, SD tray) never claim that priority, so a selected frame never
  // blocks clicking what is drawn on top of it. Otherwise the top-most item wins.
  // Empty space keeps the selection (and dragging there moves the selection).
  function hitTest(state, point) {
    const inside = (r) => r && point.x >= r.x && point.x <= r.x + r.w && point.y >= r.y && point.y <= r.y + r.h;
    const sel = current(state);
    if (!sel.backdrop && sel.has(state) && inside(sel.rect(state))) return sel.id;
    for (const adapter of getAdapters(state)) if (adapter.has(state) && inside(adapter.rect(state))) return adapter.id;
    return null;
  }

  overlay.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const state = getState();
    const hit = hitTest(state, toDesign(event, state));
    if (hit && hit !== selection) select(hit);
    const adapter = current(state);
    if (!adapter.has(state)) return;
    drag = {
      pointerId: event.pointerId,
      adapter,
      startX: event.clientX,
      startY: event.clientY,
      rect: sheet.getBoundingClientRect(),
      snapshot: adapter.snapshot(state),
      pending: null,
      frame: 0,
    };
    overlay.setPointerCapture(event.pointerId);
    overlay.classList.add("is-dragging");
    event.preventDefault();
  });

  overlay.addEventListener("pointermove", (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.pending = { x: event.clientX, y: event.clientY };
    if (!drag.frame) drag.frame = requestAnimationFrame(applyDrag); // one update per frame
  });

  const endDrag = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (drag.frame) cancelAnimationFrame(drag.frame);
    if (drag.pending) applyDrag();
    drag = null;
    overlay.classList.remove("is-dragging");
  };
  overlay.addEventListener("pointerup", endDrag);
  overlay.addEventListener("pointercancel", endDrag);

  function applyDrag() {
    if (!drag?.pending) return;
    drag.frame = 0;
    // Normalized delta = screen delta / displayed sheet size (zoom / DPR independent),
    // always measured from the drag start (no drift).
    const dx = (drag.pending.x - drag.startX) / drag.rect.width;
    const dy = (drag.pending.y - drag.startY) / drag.rect.height;
    const { adapter, snapshot } = drag;
    drag.pending = null;
    updateState((draft) => adapter.applyMove(draft, snapshot, dx, dy));
  }

  // Ctrl/⌘ + wheel resizes the selection around its anchor. Browser zoom is prevented only
  // over the canvas AND only when the selection exists.
  overlay.addEventListener(
    "wheel",
    (event) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      const state = getState();
      const adapter = current(state);
      if (!adapter.has(state)) return;
      event.preventDefault();
      const next = clampWidth(adapter.getWidth(state) * Math.exp(-event.deltaY * 0.0015));
      updateState((draft) => adapter.setWidth(draft, next));
    },
    { passive: false },
  );

  function draw(state) {
    const scale = getPreviewScale();
    const cssWidth = Math.round(state.design.width * scale);
    const cssHeight = Math.round(state.design.height * scale);
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    overlay.style.width = `${cssWidth}px`;
    overlay.style.height = `${cssHeight}px`;
    if (overlay.width !== Math.round(cssWidth * dpr)) overlay.width = Math.round(cssWidth * dpr);
    if (overlay.height !== Math.round(cssHeight * dpr)) overlay.height = Math.round(cssHeight * dpr);
    overlay.classList.toggle("is-editable", current(state).has(state));

    const ctx = overlay.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0); // design px → overlay px
    const px = 1 / scale;

    // Two-tone strokes: visible on any background.
    const stroke = (r, color, width, dash) => {
      ctx.setLineDash(dash.map((d) => d * px));
      ctx.lineWidth = (width + 1.5) * px;
      ctx.strokeStyle = cssVar("--guide-shadow");
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.lineWidth = width * px;
      ctx.strokeStyle = color;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    };

    for (const guide of guides) stroke(guide(state), cssVar("--guide-faint"), 1, [6, 5]);
    const sel = current(state);
    for (const adapter of getAdapters(state)) {
      if (adapter.id === sel.id || !adapter.has(state)) continue;
      const r = adapter.rect(state);
      if (r) stroke(r, cssVar("--guide-faint"), 1, [3, 3]);
    }
    const r = sel.has(state) ? sel.rect(state) : null;
    if (r) {
      stroke(r, cssVar("--accent"), 1.5, []);
      const a = sel.anchor(state);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.arc(a.x, a.y, 4 * px, 0, Math.PI * 2);
      ctx.fillStyle = cssVar("--accent");
      ctx.fill();
      ctx.lineWidth = 1.5 * px;
      ctx.strokeStyle = cssVar("--guide-shadow");
      ctx.stroke();
    }
  }

  return { select, draw, getSelection: () => current().id, get: (id) => find(id) };
}
