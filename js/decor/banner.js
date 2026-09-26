import { fontCss } from "../fonts.js";
import { splitGraphemes } from "../components/decor-path.js";

// Banner ribbon: an arc band (circle center far below → gentle upward curve), folded tabs
// behind each end, V-cut tails, and text following the band's center arc.
// State: { visible, text, font, letterSpacing, color, back, textColor, bend, thickness, x, y, width }
//   x / y = center of the band (fractions of design width / height)
//   width = band chord (fraction of design width); bend, thickness = fractions of that width.

function geometry(banner, W, H) {
  const width = banner.width * W;
  const h = Math.max(1, banner.thickness * width);
  const bend = Math.max(0.5, banner.bend * width);
  const R = (width * width) / (8 * bend) + bend / 2;
  const cx = banner.x * W;
  const cy = banner.y * H - h / 2 + bend / 2; // keep (x, y) near the visual center
  const ox = cx;
  const oy = cy + R;
  const span = Math.asin(Math.min(1, width / 2 / R));
  return { width, h, R, ox, oy, span, cx, cy };
}

export function bannerRect(banner, W, H) {
  const g = geometry(banner, W, H);
  const tail = g.h * 1.35;
  const x = g.cx - g.width / 2 - tail;
  const top = g.oy - g.R;
  const bottom = g.oy - (g.R - g.h) * Math.cos(g.span) + g.h * 0.6;
  return { x, y: top, w: g.width + tail * 2, h: bottom - top };
}

export function drawBanner(ctx, banner, outline, W, H) {
  if (!banner?.visible) return;
  const g = geometry(banner, W, H);
  const pt = (r, a) => [g.ox + r * Math.sin(a), g.oy - r * Math.cos(a)];
  const lw = Math.max(g.width * 0.006, 0.5);
  const finish = (fill) => {
    ctx.fillStyle = fill;
    ctx.fill();
    if (outline?.on) {
      ctx.lineWidth = lw;
      ctx.strokeStyle = outline.color;
      ctx.stroke();
    }
  };
  ctx.save();
  ctx.lineJoin = "round";

  for (const sg of [-1, 1]) {
    const a = sg * g.span;
    const t = [Math.cos(a), Math.sin(a)];
    const n = [Math.sin(a), -Math.cos(a)];
    const base = pt(g.R - g.h * 0.5, a);
    const p0 = [base[0] + sg * t[0] * (-g.h * 0.2) - n[0] * g.h * 0.45, base[1] + sg * t[1] * (-g.h * 0.2) - n[1] * g.h * 0.45];
    const off = (p, u, v) => [p[0] + sg * t[0] * u + n[0] * v, p[1] + sg * t[1] * u + n[1] * v];
    const tl = g.h * 1.35;
    const tail = [off(p0, 0, g.h / 2), off(p0, tl, g.h / 2), off(p0, tl - g.h * 0.35, 0), off(p0, tl, -g.h / 2), off(p0, 0, -g.h / 2)];
    ctx.beginPath();
    tail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    finish(banner.color);
    const fold = [pt(g.R - g.h, a), off(p0, 0, -g.h / 2), off(p0, 0, g.h * 0.1)];
    ctx.beginPath();
    fold.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    finish(banner.back);
  }

  ctx.beginPath();
  for (let i = 0; i <= 80; i += 1) {
    const [x, y] = pt(g.R, -g.span + (2 * g.span * i) / 80);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  for (let i = 0; i <= 80; i += 1) {
    const [x, y] = pt(g.R - g.h, g.span - (2 * g.span * i) / 80);
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  finish(banner.color);

  if (banner.text) {
    const size = g.h * 0.52;
    ctx.font = fontCss(banner.font, size);
    ctx.fillStyle = banner.textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const glyphs = splitGraphemes(banner.text);
    const spacing = banner.letterSpacing * size;
    const widths = glyphs.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((s, w) => s + w, 0) + spacing * (glyphs.length - 1);
    const r = g.R - g.h / 2;
    let cursor = -total / 2;
    glyphs.forEach((c, i) => {
      const a = (cursor + widths[i] / 2) / r;
      cursor += widths[i] + spacing;
      const [x, y] = pt(r, a);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillText(c, 0, 0);
      ctx.restore();
    });
  }
  ctx.restore();
}
