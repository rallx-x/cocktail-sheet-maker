// One path generator per frame shape + generic inset + anchor points.
// Every frame border style and every decoration is built from these, so all styles work on
// all five shapes. Units: design px. radius (rounded / arch bottom corners) in px.

export const FRAME_SHAPES = ["arch", "rect", "rounded", "oval", "pill"];

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Arch = semicircular top on a rect; bottom corners rounded by r.
function archPath(ctx, x, y, w, h, r) {
  const top = Math.min(w / 2, h);
  const rr = Math.max(0, Math.min(r, w / 2, (h - top) / 2));
  ctx.moveTo(x, y + top);
  ctx.arc(x + w / 2, y + top, w / 2, Math.PI, Math.PI * 2);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.closePath();
}

// Adds the shape outline as a sub-path (caller does beginPath / fill / stroke).
export function traceShape(ctx, shape, box, r = 0) {
  const { x, y, w, h } = box;
  if (w <= 0 || h <= 0) return;
  if (shape === "arch") archPath(ctx, x, y, w, h, r);
  else if (shape === "oval") {
    ctx.moveTo(x + w, y + h / 2);
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shape === "pill") roundedRect(ctx, x, y, w, h, Math.min(w, h) / 2);
  else if (shape === "rounded") roundedRect(ctx, x, y, w, h, r);
  else roundedRect(ctx, x, y, w, h, 0);
}

export function shapePath(ctx, shape, box, r = 0) {
  ctx.beginPath();
  traceShape(ctx, shape, box, r);
}

export function insetBox(box, d) {
  return { x: box.x + d, y: box.y + d, w: box.w - d * 2, h: box.h - d * 2 };
}

// Curved top of the shape as an ellipse arc (for decorations that follow the top):
// { cx, cy, rx, ry } with the top half spanning angles π…2π, or null for flat tops.
export function topArc(shape, box) {
  const { x, y, w, h } = box;
  if (shape === "arch") {
    const top = Math.min(w / 2, h);
    return { cx: x + w / 2, cy: y + top, rx: w / 2, ry: top };
  }
  if (shape === "pill") {
    const r = Math.min(w, h) / 2;
    return { cx: x + w / 2, cy: y + r, rx: w / 2, ry: r };
  }
  if (shape === "oval") return { cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2 };
  return null;
}

/**
 * Four anchor points, each with the mirror signs of that corner (sx, sy), in the order
 * top-left, top-right, bottom-left, bottom-right. `m` = distance in from the outline.
 *   rect / rounded: inner corners · arch: shoulders at 215° / 325° + bottom corners ·
 *   oval / pill: ±45° / ±135° on the inner outline.
 */
export function shapeAnchors(shape, box, m) {
  const { x, y, w, h } = box;
  const signs = [[1, 1], [-1, 1], [1, -1], [-1, -1]];
  let points;
  const onCircle = (cx, cy, rx, ry, deg) => [cx + rx * Math.cos((deg * Math.PI) / 180), cy + ry * Math.sin((deg * Math.PI) / 180)];
  if (shape === "arch") {
    const top = Math.min(w / 2, h);
    const cr = w / 2 - m;
    points = [onCircle(x + w / 2, y + top, cr, cr, 215), onCircle(x + w / 2, y + top, cr, cr, 325), [x + m, y + h - m], [x + w - m, y + h - m]];
  } else if (shape === "oval") {
    const rx = w / 2 - m;
    const ry = h / 2 - m;
    points = [225, 315, 135, 45].map((deg) => onCircle(x + w / 2, y + h / 2, rx, ry, deg));
  } else if (shape === "pill") {
    const r = Math.min(w, h) / 2;
    const cr = r - m;
    const topC = y + r;
    const botC = y + h - r;
    points = [
      onCircle(x + w / 2, topC, cr, cr, 225),
      onCircle(x + w / 2, topC, cr, cr, 315),
      onCircle(x + w / 2, botC, cr, cr, 135),
      onCircle(x + w / 2, botC, cr, cr, 45),
    ];
  } else {
    points = [[x + m, y + m], [x + w - m, y + m], [x + m, y + h - m], [x + w - m, y + h - m]];
  }
  return points.map(([px, py], i) => ({ x: px, y: py, sx: signs[i][0], sy: signs[i][1] }));
}
