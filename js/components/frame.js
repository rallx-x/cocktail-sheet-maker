import { insetBox, shapePath, traceShape } from "./shapes.js";

// MD background frame: structural presentation surface.
// Geometry (x, y, width, aspect) is the component's; all sizes below are fractions of the
// frame width. Border styles are insets / offsets of the same shape path.

export const FRAME_FILLS = ["solid", "linear"];
export const BORDER_STYLES = ["line", "multi", "offset", "picture", "pictureMat", "scallop", "dotted", "stitch"];

function artFill(ctx, fill, box) {
  if (fill.type !== "linear") return fill.colors[0];
  const a = (fill.angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const half = (Math.abs(box.w * dx) + Math.abs(box.h * dy)) / 2;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const g = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  // v13: adjustable start / end (defaults 0 / 1 = the previous gradient exactly)
  const [s0, s1] = fill.stops ?? [0, 1];
  g.addColorStop(Math.min(s0, s1), fill.colors[0]);
  g.addColorStop(Math.max(s0, s1), fill.colors[1]);
  return g;
}

// Returns the artwork box (inside molding / mat) so decorations can use it.
export function drawFrame(ctx, frame, rect) {
  const w = rect.w;
  const r = frame.radius * w;
  const b = frame.border;
  const bw = b.width * w;
  const shape = frame.shape;
  let art = rect;
  let artR = r;
  let matBox = null;

  // scallop: bumped outer band behind a normal art area
  if (b.style === "scallop") {
    const outline = scallopOutline(shape, rect, r, b.scallop.count, b.scallop.depth * w);
    polyPath(ctx, outline);
    ctx.fillStyle = b.molding.color;
    ctx.fill();
    if (bw > 0) {
      ctx.lineWidth = bw;
      ctx.strokeStyle = b.color;
      ctx.stroke();
    }
    const mw = b.molding.width * w;
    art = insetBox(rect, mw);
    artR = Math.max(0, r - mw);
  }

  if (b.style === "stitch") {
    shapePath(ctx, shape, rect, r);
    ctx.fillStyle = b.molding.color;
    ctx.fill();
    const mw = b.molding.width * w;
    art = insetBox(rect, mw);
    artR = Math.max(0, r - mw);
  }

  if (b.style === "picture" || b.style === "pictureMat") {
    shapePath(ctx, shape, rect, r);
    ctx.fillStyle = b.molding.color;
    ctx.fill();
    const mw = b.molding.width * w;
    art = insetBox(rect, mw);
    artR = Math.max(0, r - mw);
    if (b.style === "pictureMat") {
      shapePath(ctx, shape, art, artR);
      ctx.fillStyle = b.mat.color;
      ctx.fill();
      const matW = b.mat.width * w;
      matBox = art;
      art = insetBox(art, matW);
      artR = Math.max(0, artR - matW);
    }
  }

  if (art.w > 0 && art.h > 0) {
    shapePath(ctx, shape, art, artR);
    ctx.fillStyle = artFill(ctx, frame.fill, art);
    ctx.fill();
  }

  const stroke = (box, radius, width, color, dash = null) => {
    if (width <= 0 || box.w <= 0 || box.h <= 0) return;
    shapePath(ctx, shape, box, radius);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.setLineDash(dash ?? []);
    ctx.stroke();
    ctx.setLineDash([]);
  };
  const innerWidth = Math.max(b.width * 0.6, 0.0015) * w;

  if (b.style === "line") stroke(rect, r, bw, b.color);

  if (b.style === "scallop") stroke(art, artR, innerWidth, b.multi.innerColor);

  if (b.style === "stitch") {
    const mw = b.molding.width * w;
    const mid = insetBox(rect, mw / 2);
    stroke(mid, Math.max(0, r - mw / 2), Math.max(bw * 0.8, innerWidth), b.stitch.color, [b.stitch.dash * w, b.stitch.dash * w * 0.7]);
  }

  if (b.style === "dotted") {
    stroke(rect, r, innerWidth, b.multi.innerColor);
    const size = b.dots.size * w;
    const around = { x: rect.x - size, y: rect.y - size, w: rect.w + size * 2, h: rect.h + size * 2 };
    ctx.fillStyle = b.color;
    for (const [px, py] of evenPoints(shapePolyline(shape, around, r + size), b.dots.spacing * w)) {
      ctx.beginPath();
      ctx.arc(px, py, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (b.style === "multi") {
    stroke(rect, r, bw, b.color);
    const gap = b.multi.gap * w;
    for (let i = 1; i < b.multi.count; i += 1) {
      const d = gap * i;
      if (!(rect.w > d * 2 && rect.h > d * 2)) continue;
      const innermost = i === b.multi.count - 1;
      if (innermost && b.multi.chamfer > 0 && (shape === "rect" || shape === "rounded" || shape === "arch")) {
        polyPath(ctx, chamferOutline(shape, insetBox(rect, d), b.multi.chamfer * w));
        ctx.lineWidth = innerWidth;
        ctx.strokeStyle = b.multi.innerColor;
        ctx.stroke();
      } else {
        stroke(insetBox(rect, d), Math.max(0, r - d), innerWidth, b.multi.innerColor);
      }
    }
    if (b.multi.dashedInner) {
      const d = gap * b.multi.count;
      if (rect.w > d * 2 && rect.h > d * 2) stroke(insetBox(rect, d), Math.max(0, r - d), innerWidth, b.multi.innerColor, [innerWidth * 4, innerWidth * 3]);
    }
  }

  if (b.style === "offset") {
    stroke(rect, r, bw, b.color);
    const moved = { ...rect, x: rect.x + b.offset.dx * w, y: rect.y + b.offset.dy * w };
    stroke(moved, r, bw, b.color);
    if (b.multi.dashedInner) {
      const d = b.multi.gap * w;
      stroke(insetBox(moved, d), Math.max(0, r - d), innerWidth, b.multi.innerColor, [innerWidth * 4, innerWidth * 3]);
    }
  }

  if (b.style === "picture") {
    stroke(rect, r, bw, b.color);
    stroke(art, artR, bw, b.color);
  }
  if (b.style === "pictureMat") {
    stroke(rect, r, bw, b.color);
    if (matBox) stroke(matBox, Math.max(0, r - b.molding.width * w), innerWidth, b.color);
    stroke(art, artR, innerWidth, b.multi.innerColor);
  }
  return { art, artR };
}

// v16: the area the MD character is cut to when clipping is on and the frame is shown: the frame's
// artwork area (inside molding / mat, same insets as drawFrame) minus half the border line, so the
// character never crosses the frame edge. Geometry only; drawFrame itself is unchanged.
export function frameClipArea(frame, rect) {
  const w = rect.w;
  const b = frame.border;
  let art = rect;
  let artR = frame.radius * w;
  if (["scallop", "stitch", "picture", "pictureMat"].includes(b.style)) {
    const mw = b.molding.width * w;
    art = insetBox(art, mw);
    artR = Math.max(0, artR - mw);
    if (b.style === "pictureMat") {
      const matW = b.mat.width * w;
      art = insetBox(art, matW);
      artR = Math.max(0, artR - matW);
    }
  }
  const half = (b.width * w) / 2;
  return { shape: frame.shape, box: insetBox(art, half), r: Math.max(0, artR - half) };
}

// Clip helper for decorations that must stay inside the artwork area (e.g. valance).
export function clipToShape(ctx, shape, box, r) {
  ctx.beginPath();
  traceShape(ctx, shape, box, r);
  ctx.clip();
}

// ---- polyline helpers (v11 styles) ----

// Closed polyline of a shape, clockwise from the top-left, sampled finely.
export function shapePolyline(shape, box, r = 0, steps = 24) {
  const { x, y, w, h } = box;
  const pts = [];
  const arc = (cx, cy, rx, ry, a0, a1, n) => {
    for (let i = 0; i <= n; i += 1) {
      const a = a0 + ((a1 - a0) * i) / n;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    }
  };
  if (shape === "oval") {
    arc(x + w / 2, y + h / 2, w / 2, h / 2, Math.PI, Math.PI * 3, steps * 8);
    return pts;
  }
  if (shape === "arch") {
    const top = Math.min(w / 2, h);
    const rr = Math.max(0, Math.min(r, w / 2, (h - top) / 2));
    arc(x + w / 2, y + top, w / 2, top === w / 2 ? w / 2 : top, Math.PI, Math.PI * 2, steps * 4);
    arc(x + w - rr, y + h - rr, rr, rr, 0, Math.PI / 2, steps);
    arc(x + rr, y + h - rr, rr, rr, Math.PI / 2, Math.PI, steps);
    return pts;
  }
  const rr = shape === "pill" ? Math.min(w, h) / 2 : shape === "rounded" ? Math.max(0, Math.min(r, w / 2, h / 2)) : 0;
  arc(x + rr, y + rr, rr, rr, Math.PI, Math.PI * 1.5, steps);
  arc(x + w - rr, y + rr, rr, rr, Math.PI * 1.5, Math.PI * 2, steps);
  arc(x + w - rr, y + h - rr, rr, rr, 0, Math.PI / 2, steps);
  arc(x + rr, y + h - rr, rr, rr, Math.PI / 2, Math.PI, steps);
  return pts;
}

function polyPath(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
}

// Points spaced evenly by arc length along a closed polyline (spacing adjusted to divide it exactly).
function evenPoints(pts, spacing) {
  const lens = [0];
  for (let i = 1; i <= pts.length; i += 1) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i % pts.length];
    lens.push(lens[i - 1] + Math.hypot(bx - ax, by - ay));
  }
  const total = lens[lens.length - 1];
  const n = Math.max(3, Math.round(total / Math.max(spacing, 1)));
  const out = [];
  let k = 0;
  for (let i = 0; i < n; i += 1) {
    const s = (total * i) / n;
    while (lens[k + 1] < s) k += 1;
    const t = (s - lens[k]) / ((lens[k + 1] - lens[k]) || 1);
    const [ax, ay] = pts[k];
    const [bx, by] = pts[(k + 1) % pts.length];
    out.push([ax + (bx - ax) * t, ay + (by - ay) * t, bx - ax, by - ay]);
  }
  return out;
}

// Outline pushed outward into `count` even bumps around the whole perimeter (arc-length based).
function scallopOutline(shape, box, r, count, depth) {
  const base = shapePolyline(shape, box, r, 32);
  let perimeter = 0;
  for (let i = 0; i < base.length; i += 1) {
    const [ax, ay] = base[i];
    const [bx, by] = base[(i + 1) % base.length];
    perimeter += Math.hypot(bx - ax, by - ay);
  }
  const samples = evenPoints(base, perimeter / (count * 16));
  const n = samples.length;
  return samples.map(([px, py, dx, dy], i) => {
    const len = Math.hypot(dx, dy) || 1;
    const bump = depth * Math.abs(Math.sin((Math.PI * i * count) / n));
    return [px + (dy / len) * bump, py + (-dx / len) * bump];
  });
}

// Innermost multi line with chamfered corners (arch keeps its round top).
function chamferOutline(shape, box, c) {
  const { x, y, w, h } = box;
  const cc = Math.max(0, Math.min(c, w / 2, h / 2));
  if (shape === "arch") {
    const top = Math.min(w / 2, h);
    const pts = [];
    for (let i = 0; i <= 96; i += 1) {
      const a = Math.PI + (Math.PI * i) / 96;
      pts.push([x + w / 2 + (w / 2) * Math.cos(a), y + top + top * Math.sin(a)]);
    }
    pts.push([x + w, y + h - cc], [x + w - cc, y + h], [x + cc, y + h], [x, y + h - cc]);
    return pts;
  }
  return [[x + cc, y], [x + w - cc, y], [x + w, y + cc], [x + w, y + h - cc], [x + w - cc, y + h], [x + cc, y + h], [x, y + h - cc], [x, y + cc]];
}
