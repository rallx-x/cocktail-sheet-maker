import A from "./patterns-set-a.js";
import B from "./patterns-set-b.js";
import C from "./patterns-set-c.js";

// Built-in procedural patterns.
// Every draw() works in design px on a full-opacity scratch layer, in the pattern's
// color; the renderer applies the user's opacity once when compositing, so crossings
// (e.g. grid lines) never get darker than the rest.
//
// cell: the pattern's repeat size in design px = baseSize × design WIDTH × user scale (R5).
// Adding a pattern = adding one entry here.

// The 28 pattern definitions live in patterns-set-a/b/c.js (split for smaller files), drawing
// helpers in pattern-helpers.js. Order is preserved exactly.
export const BUILTIN_PATTERNS = [...A, ...B, ...C];

export const PATTERN_GROUPS = [
  { id: "dots", name: "점" },
  { id: "lines", name: "선 · 격자" },
  { id: "tiles", name: "타일" },
  { id: "shapes", name: "도형" },
  { id: "scatter", name: "흩뿌리기" },
];

const byId = new Map(BUILTIN_PATTERNS.map((pattern) => [pattern.id, pattern]));

export function getBuiltinPattern(id) {
  return byId.get(id) ?? null;
}

// Smallest allowed scale for a pattern (complex shapes get a higher floor for speed).
export function minScaleFor(id, globalMin) {
  return Math.max(globalMin, getBuiltinPattern(id)?.minScale ?? 0);
}
