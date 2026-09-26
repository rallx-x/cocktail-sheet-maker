import { boxRect } from "./boxes.js";
import { drawStyledText } from "./text-style.js";

// Color palette card (v11). Only the card box is manipulated on the sheet; the internal layout is
// this fixed table (fractions of the card width / height). Chip hex values are real color state.

export const PALETTE_LAYOUT = {
  pad: 0.08, // of card width
  titleH: 0.14, // of card height
  rule: 0.19, // y of the rule under the title (of card height)
  rows: { top: 0.23, bottom: 0.95 }, // chip rows area (of card height)
  chip: 0.24, // chip square size (of card width)
};

export function paletteRect(p, W, H) {
  return boxRect(p, W, H);
}

function rounded(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawPalette(ctx, p, W, H, renderScale) {
  if (!p?.visible) return;
  const L = PALETTE_LAYOUT;
  const r = paletteRect(p, W, H);
  const pad = L.pad * r.w;
  const lw = Math.max(r.w * 0.006, 0.5);
  ctx.save();
  rounded(ctx, r.x, r.y, r.w, r.h, p.card.radius * r.w);
  ctx.fillStyle = p.card.fill;
  ctx.fill();
  ctx.lineWidth = lw;
  ctx.strokeStyle = p.card.border;
  ctx.stroke();

  drawStyledText(ctx, p.title.text, r.x + pad, r.y + (L.titleH * r.h) / 2 + pad * 0.4, { ...p.title, effect: "normal" }, p.title.size * r.w, renderScale);
  ctx.beginPath();
  ctx.moveTo(r.x + pad, r.y + L.rule * r.h);
  ctx.lineTo(r.x + r.w - pad, r.y + L.rule * r.h);
  ctx.strokeStyle = p.card.border;
  ctx.stroke();

  const top = r.y + L.rows.top * r.h;
  const rowH = ((L.rows.bottom - L.rows.top) * r.h) / p.chips.length;
  const chip = Math.min(L.chip * r.w, rowH * 0.78);
  const px = p.text.size * r.w;
  p.chips.forEach((c, i) => {
    const cy = top + rowH * i + rowH / 2;
    rounded(ctx, r.x + pad, cy - chip / 2, chip, chip, chip * 0.14);
    ctx.fillStyle = c.hex;
    ctx.fill();
    ctx.lineWidth = lw;
    ctx.strokeStyle = p.card.border;
    ctx.stroke();
    const tx = r.x + pad + chip + pad * 0.7;
    drawStyledText(ctx, c.name, tx, cy - px * 0.55, { ...p.text, effect: "normal" }, px, renderScale);
    drawStyledText(ctx, c.hex, tx, cy + px * 0.6, { ...p.text, color: p.text.color, effect: "normal" }, px * 0.88, renderScale);
  });
  ctx.restore();
}
