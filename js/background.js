// Sheet background (v14). SOURCE OF TRUTH for rendering is design.background:
//   { type: "solid" | "linear", direction, stops: [{ pos 0–1, color }] }
// "solid"  → paints design.backgroundColor (the solid color; also the fallback and v13 compat value).
// "linear" → paints the stops; design.backgroundColor is NOT used for painting while linear.
// Everything that needs "the color behind something" (brand, MD frame auto colors, confetti
// suggestion) calls sampleBackground() at a real sheet point, so all three directions agree.

export const BG_DIRECTIONS = ["topToBottom", "leftToRight", "diagonal"];
export const BG_STOP_LIMITS = { min: 2, max: 8 };

export function createDefaultBackground(color = "#FFFFFF") {
  return { type: "solid", direction: "topToBottom", stops: [{ pos: 0, color }, { pos: 1, color }] };
}

export function isGradientBackground(design) {
  const b = design?.background;
  return b?.type === "linear" && Array.isArray(b.stops) && b.stops.length >= BG_STOP_LIMITS.min;
}

// Stops may be unsorted while being dragged in the editor; painting and sampling use a sorted copy.
export function sortedStops(stops) {
  return [...stops].sort((a, b) => a.pos - b.pos);
}

function axis(direction, W, H) {
  if (direction === "leftToRight") return [0, 0, W, 0];
  if (direction === "diagonal") return [0, 0, W, H];
  return [0, 0, 0, H];
}

export function backgroundPaint(ctx, design) {
  if (!isGradientBackground(design)) return design.backgroundColor || "#FFFFFF";
  const [x0, y0, x1, y1] = axis(design.background.direction, design.width, design.height);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const s of sortedStops(design.background.stops)) g.addColorStop(Math.min(1, Math.max(0, s.pos)), s.color);
  return g;
}

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`.toUpperCase();

// Color of a sorted stop list at t (0–1), the same piecewise-linear rule the canvas uses.
export function colorAt(stops, t) {
  const s = sortedStops(stops);
  if (t <= s[0].pos) return s[0].color.toUpperCase();
  const last = s[s.length - 1];
  if (t >= last.pos) return last.color.toUpperCase();
  for (let i = 1; i < s.length; i++) {
    if (t <= s[i].pos) {
      const a = s[i - 1];
      const b = s[i];
      const k = b.pos === a.pos ? 1 : (t - a.pos) / (b.pos - a.pos);
      const ca = hexToRgb(a.color);
      const cb = hexToRgb(b.color);
      return rgbToHex(ca.map((v, j) => v + (cb[j] - v) * k));
    }
  }
  return last.color.toUpperCase();
}

// Background color at a sheet point (design px): projects (x, y) onto the gradient axis.
export function sampleBackground(design, x, y) {
  if (!isGradientBackground(design)) return design.backgroundColor || "#FFFFFF";
  const [x0, y0, x1, y1] = axis(design.background.direction, design.width, design.height);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const t = ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy);
  return colorAt(design.background.stops, Math.min(1, Math.max(0, t)));
}

// CSS preview of the stops for the editor bar (always left → right).
export function stopsCss(stops) {
  return `linear-gradient(90deg, ${sortedStops(stops).map((s) => `${s.color} ${(s.pos * 100).toFixed(2)}%`).join(", ")})`;
}
