import { fontCss } from "../fonts.js";
import { cardRect } from "./card.js";

// v17 sheet memo (TIP): a small bar-table note on the card layer — a cocktail napkin (default) or a
// sticky note with a strip of tape. Pure function of state; preview and export share it.
// Geometry: x/y = center (fractions of W/H), width = fraction of W, aspect = h/w, rotation in degrees.

export const MEMO_STYLES = ["napkin", "note"];

export function memoRect(memo, width, height) {
  const w = memo.width * width;
  const h = w * memo.aspect;
  return { x: memo.x * width - w / 2, y: memo.y * height - h / 2, w, h };
}

// Axis-aligned bounds of the rotated memo (hit-testing / selection outline).
export function memoBounds(memo, width, height) {
  const r = memoRect(memo, width, height);
  const a = ((memo.rotation ?? 0) * Math.PI) / 180;
  const bw = Math.abs(r.w * Math.cos(a)) + Math.abs(r.h * Math.sin(a));
  const bh = Math.abs(r.w * Math.sin(a)) + Math.abs(r.h * Math.cos(a));
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  return { x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh };
}

// Scalloped napkin outline: small half-round bumps along all four edges (centered at the origin).
function napkinPath(ctx, w, h) {
  const bump = Math.max(2, w * 0.022);
  const side = (x0, y0, x1, y1, nx, ny) => {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(3, Math.round(len / (bump * 2)));
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const mx = x0 + (x1 - x0) * ((t0 + t1) / 2) + nx * bump;
      const my = y0 + (y1 - y0) * ((t0 + t1) / 2) + ny * bump;
      ctx.quadraticCurveTo(mx, my, x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1);
    }
  };
  const x0 = -w / 2;
  const y0 = -h / 2;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  side(x0, y0, x0 + w, y0, 0, -1);
  side(x0 + w, y0, x0 + w, y0 + h, 1, 0);
  side(x0 + w, y0 + h, x0, y0 + h, 0, 1);
  side(x0, y0 + h, x0, y0, -1, 0);
  ctx.closePath();
}

// Greedy wrap: explicit newlines, then words; a word longer than the line (e.g. unspaced Hangul) breaks
// by grapheme.
function wrap(ctx, text, maxW) {
  const out = [];
  const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("ko", { granularity: "grapheme" }) : null;
  const chars = (s) => (seg ? [...seg.segment(s)].map((x) => x.segment) : [...s]);
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/(\s+)/)) {
      if (!word) continue;
      const tryLine = line + word;
      if (ctx.measureText(tryLine).width <= maxW) {
        line = tryLine;
        continue;
      }
      if (line.trim()) out.push(line.trimEnd());
      line = "";
      if (/^\s+$/.test(word)) continue;
      for (const ch of chars(word)) {
        if (ctx.measureText(line + ch).width > maxW && line) {
          out.push(line);
          line = "";
        }
        line += ch;
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

// Fit: shrink the font down to 60% until the text fits the inner box; otherwise ellipsize the last line.
export function layoutMemoText(ctx, memo, w, h) {
  const padX = w * 0.12;
  const padY = h * 0.16;
  const innerW = Math.max(1, w - padX * 2);
  const innerH = Math.max(1, h - padY * 2);
  let px = memo.size * w;
  let lines = [];
  let lh = 0;
  let overflow = false;
  for (let k = 0; k < 9; k++) {
    ctx.font = fontCss(memo.font, px);
    lh = px * 1.35;
    lines = memo.text ? wrap(ctx, memo.text, innerW) : [];
    if (lines.length * lh <= innerH || k === 8) break;
    px *= 0.95;
  }
  const max = Math.max(1, Math.floor(innerH / lh));
  if (lines.length > max) {
    overflow = true;
    lines = lines.slice(0, max);
    let last = lines[max - 1];
    while (last && ctx.measureText(`${last}…`).width > innerW) last = [...last].slice(0, -1).join("");
    lines[max - 1] = `${last}…`;
  }
  return { lines, px, lh, innerW, padX, overflow };
}

export function drawMemo(ctx, memo, width, height) {
  const r = memoRect(memo, width, height);
  const { w, h } = r;
  ctx.save();
  ctx.translate(r.x + w / 2, r.y + h / 2);
  ctx.rotate(((memo.rotation ?? 0) * Math.PI) / 180);

  // soft drop shadow (paper lifted off the table)
  ctx.save();
  ctx.shadowColor = "rgba(40, 30, 50, 0.22)";
  ctx.shadowBlur = w * 0.035;
  ctx.shadowOffsetY = w * 0.012;
  ctx.fillStyle = memo.paper;
  if (memo.style === "note") {
    ctx.beginPath();
    ctx.rect(-w / 2, -h / 2, w, h);
  } else napkinPath(ctx, w, h);
  ctx.fill();
  ctx.restore();

  const line = Math.max(1, w * 0.006);
  if (memo.style === "note") {
    // a curled bottom-right corner + a strip of translucent tape across the top
    const c = Math.min(w, h) * 0.16;
    ctx.beginPath();
    ctx.moveTo(w / 2 - c, h / 2);
    ctx.lineTo(w / 2, h / 2 - c);
    ctx.lineTo(w / 2 - c * 0.9, h / 2 - c * 0.9);
    ctx.closePath();
    ctx.fillStyle = "rgba(40, 30, 50, 0.10)";
    ctx.fill();
    ctx.save();
    ctx.translate(0, -h / 2);
    ctx.rotate(-0.06);
    ctx.globalAlpha = 0.62;
    ctx.fillStyle = memo.tape;
    const tw = w * 0.34;
    const th = Math.max(4, h * 0.2);
    ctx.fillRect(-tw / 2, -th / 2, tw, th);
    ctx.restore();
  } else {
    // embossed inner border (dashed) — the pressed pattern of a paper cocktail napkin
    ctx.save();
    ctx.strokeStyle = memo.edge;
    ctx.lineWidth = line;
    ctx.setLineDash([line * 3, line * 2.2]);
    const inset = Math.min(w, h) * 0.08;
    ctx.strokeRect(-w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2);
    ctx.restore();
  }

  if (memo.text) {
    const { lines, px, lh, innerW } = layoutMemoText(ctx, memo, w, h);
    ctx.font = fontCss(memo.font, px);
    ctx.fillStyle = memo.color;
    ctx.textBaseline = "middle";
    ctx.textAlign = memo.align;
    const x = memo.align === "left" ? -innerW / 2 : memo.align === "right" ? innerW / 2 : 0;
    const top = -((lines.length - 1) * lh) / 2;
    lines.forEach((t, i) => ctx.fillText(t, x, top + i * lh));
  }
  ctx.restore();
}

// Place the memo just under the (content-sized) card, keeping its x — used when Random writes the memo
// and when a memo is first shown while it would cover the card. Returns the new y (fraction of H).
export function memoYBelowCard(memo, card, width, height) {
  const c = cardRect(card, width, height);
  const h = memo.width * width * memo.aspect;
  const gap = width * 0.012;
  return Math.min(1, (c.y + c.h + gap + h / 2) / height);
}
export function memoOverlapsCard(memo, card, width, height) {
  if (!card?.visible) return false;
  const a = memoBounds(memo, width, height);
  const b = cardRect(card, width, height);
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}
