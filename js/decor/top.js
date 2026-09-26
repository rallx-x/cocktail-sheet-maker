import { drawGlyph } from "./glyphs.js";
import { topArc } from "../components/shapes.js";

// Top decorations and bottom swirls for the MD frame. All geometry derives from the frame
// box (w = frame width) and the shape's own top arc; no randomness.
//   top.type: none | sparkleCluster | bow | valance | moon | bigSparkle
//   outline: optional thin outline around filled pieces (sticker look)

export const TOP_TYPES = ["none", "sparkleCluster", "bow", "valance", "moon", "bigSparkle", "medallion"];
// Kept for old projects (render + normalize unchanged) but hidden from pickers (v11).
export const LEGACY_TOP_TYPES = ["bow", "valance"];

function withOutline(ctx, outline, lw, fillFn) {
  fillFn();
  if (outline?.on) {
    ctx.lineWidth = lw;
    ctx.strokeStyle = outline.color;
    ctx.stroke();
  }
}

// Sparkle cluster: a fixed arrangement (tuned on a 400 px frame) scaled by frame width × size.
const CLUSTER = [
  ["astroid", 0, -6, 22, 0], ["diamond", -62, 12, 15, 1], ["diamond", 62, 12, 15, 1],
  ["star5", -110, 48, 12, 1], ["star5", 110, 48, 12, 1], ["asterisk", -34, -18, 9, 1], ["asterisk", 34, -18, 9, 1],
  ["asterisk", -88, 22, 7, 1], ["asterisk", 88, 22, 7, 1], ["sparkle", -138, 86, 10, 1], ["sparkle", 138, 86, 10, 1],
];

function diamond(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x + s * 0.62, y);
  ctx.lineTo(x, y + s);
  ctx.lineTo(x - s * 0.62, y);
  ctx.closePath();
}

function bowPath(ctx, cx, cy, s) {
  // wings, knot and V-cut tails, as separate sub-paths
  for (const sg of [-1, 1]) {
    ctx.moveTo(cx + sg * s * 0.12, cy + s * 0.1);
    ctx.lineTo(cx + sg * s * 0.75, cy + s * 1.15);
    ctx.lineTo(cx + sg * s * 0.5, cy + s * 1.0);
    ctx.lineTo(cx + sg * s * 0.42, cy + s * 1.22);
    ctx.lineTo(cx - sg * s * 0.05, cy + s * 0.2);
    ctx.closePath();
  }
  for (const sg of [-1, 1]) {
    ctx.moveTo(cx + sg * s * 0.1, cy - s * 0.08);
    ctx.lineTo(cx + sg * s * 0.6, cy - s * 0.62);
    const ox = cx + sg * s * 0.88;
    const oy = cy - s * 0.12;
    for (let i = 0; i <= 24; i += 1) {
      const a = -Math.PI / 2 + (Math.PI * i) / 24;
      ctx.lineTo(ox + sg * s * 0.32 * Math.cos(a), oy + s * 0.48 * Math.sin(a));
    }
    ctx.lineTo(cx + sg * s * 0.55, cy + s * 0.3);
    ctx.lineTo(cx + sg * s * 0.1, cy + s * 0.1);
    ctx.closePath();
  }
  ctx.moveTo(cx - s * 0.17, cy - s * 0.22);
  ctx.lineTo(cx + s * 0.17, cy - s * 0.22);
  ctx.lineTo(cx + s * 0.15, cy + s * 0.22);
  ctx.lineTo(cx - s * 0.15, cy + s * 0.22);
  ctx.closePath();
}

export function drawTop(ctx, top, outline, shape, box) {
  if (!top || top.type === "none") return;
  const w = box.w;
  const k = (w / 400) * top.size;
  const cx = box.x + box.w / 2;
  const lw = Math.max(w * 0.004, 0.5);
  ctx.save();

  if (top.type === "sparkleCluster") {
    const y0 = box.y + 22 * k;
    for (const [kind, ox, oy, s, alt] of CLUSTER) {
      ctx.fillStyle = alt ? top.color2 : top.color;
      const x = cx + ox * k;
      const y = y0 + oy * k;
      if (kind === "diamond") {
        diamond(ctx, x, y, s * k);
        withOutline(ctx, outline, lw, () => ctx.fill());
      } else {
        drawGlyph(ctx, kind, x, y, s * k);
      }
    }
  }

  if (top.type === "bow") {
    ctx.beginPath();
    bowPath(ctx, cx, box.y + 18 * k, 62 * k);
    ctx.fillStyle = top.color;
    withOutline(ctx, outline, lw, () => ctx.fill("nonzero"));
  }

  if (top.type === "moon" || top.type === "bigSparkle") {
    ctx.fillStyle = top.color;
    if (top.type === "moon") {
      drawGlyph(ctx, "moon", cx, box.y - 4 * k, 20 * k);
      ctx.fillStyle = top.color2;
      drawGlyph(ctx, "sparkle", cx - 40 * k, box.y + 6 * k, 8 * k);
      drawGlyph(ctx, "sparkle", cx + 40 * k, box.y + 6 * k, 8 * k);
    } else {
      drawGlyph(ctx, "starburst", cx, box.y, 26 * k);
    }
  }

  if (top.type === "medallion") {
    // circle medallion sitting on the top edge, double ring + inner 4-point sparkle
    const r = 34 * k;
    const cy = box.y + r * 1.15;
    ctx.lineWidth = Math.max(w * 0.004, 0.5);
    ctx.strokeStyle = top.color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = top.color2;
    drawGlyph(ctx, "astroid", cx, cy, r * 0.62);
  }

  if (top.type === "valance") {
    // Striped awning following the shape's curved top; flat tops use a straight band.
    const arc = topArc(shape, box);
    const depth = 46 * k;
    const bulge = 16 * k;
    const n = 12;
    for (let i = 0; i < n; i += 1) {
      ctx.beginPath();
      if (arc) {
        const s0 = Math.PI + (Math.PI * i) / n;
        const e0 = Math.PI + (Math.PI * (i + 1)) / n;
        for (let j = 0; j <= 12; j += 1) {
          const a = s0 + ((e0 - s0) * j) / 12;
          ctx.lineTo(arc.cx + arc.rx * Math.cos(a), arc.cy + arc.ry * Math.sin(a));
        }
        for (let j = 0; j <= 24; j += 1) {
          const t = j / 24;
          const a = e0 + (s0 - e0) * t;
          const inset = depth + bulge * Math.sin(Math.PI * t);
          ctx.lineTo(arc.cx + (arc.rx - inset) * Math.cos(a), arc.cy + (arc.ry - inset) * Math.sin(a));
        }
      } else {
        const x0 = box.x + (box.w * i) / n;
        const x1 = box.x + (box.w * (i + 1)) / n;
        ctx.moveTo(x0, box.y);
        ctx.lineTo(x1, box.y);
        for (let j = 0; j <= 24; j += 1) {
          const t = j / 24;
          ctx.lineTo(x1 + (x0 - x1) * t, box.y + depth + bulge * Math.sin(Math.PI * t));
        }
      }
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? top.color : top.color2;
      withOutline(ctx, outline, lw, () => ctx.fill());
    }
  }
  ctx.restore();
}

// Bottom-corner curled ribbons + small side stars.
export function drawSwirls(ctx, swirls, outline, box) {
  if (!swirls?.visible) return;
  const w = box.w;
  const k = w / 400;
  const lw = 7 * k;
  ctx.save();
  for (const sg of [-1, 1]) {
    const px = sg < 0 ? box.x : box.x + box.w;
    const x0 = px - sg * 6 * k;
    const y0 = box.y + box.h - 70 * k;
    const dx = sg * 60 * k;
    const dy = 50 * k;
    const L = Math.hypot(dx, dy);
    const ux = dx / L;
    const uy = dy / L;
    const amp = 13 * k;
    ctx.beginPath();
    for (let i = 0; i <= 200; i += 1) {
      const t = (i / 200) * 1.3 * Math.PI * 2;
      const a = (L * i) / 200 - amp * 2.8 * Math.sin(t);
      const b = amp * Math.cos(t) - amp;
      const x = x0 + ux * a - uy * b;
      const y = y0 + uy * a + ux * b;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (outline?.on) {
      ctx.lineWidth = lw + Math.max(w * 0.008, 1);
      ctx.strokeStyle = outline.color;
      ctx.stroke();
    }
    ctx.lineWidth = lw;
    ctx.strokeStyle = swirls.color;
    ctx.stroke();
    ctx.fillStyle = swirls.color2;
    drawGlyph(ctx, "star5", px + sg * 4 * k, box.y + box.h - 190 * k, 11 * k);
  }
  ctx.restore();
}
