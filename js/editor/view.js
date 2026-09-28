// View zoom (editor camera only). Runtime state: never part of the project state, so it is never
// saved, never in history, and never read by the renderer or export.
// zoom is relative to the default "fit" view: 1 = 100% = the sheet fitted to the stage.

export const ZOOM_RANGE = { min: 1, max: 5 };
export const ZOOM_STEP = 1.25; // − / + buttons

let zoom = 1;
const listeners = new Set();

const clampZoom = (z) => Math.min(ZOOM_RANGE.max, Math.max(ZOOM_RANGE.min, z));

export function getZoom() {
  return zoom;
}

// anchor: { clientX, clientY } keeps that screen point over the same sheet point (wheel zoom);
// null = zoom around the visible center.
export function setZoom(next, anchor = null) {
  const z = clampZoom(Number(next) || 1);
  if (Math.abs(z - zoom) < 1e-6) return;
  zoom = z;
  for (const fn of listeners) fn(zoom, anchor);
}

export function onZoom(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
