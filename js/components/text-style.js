import { fontCss } from "../fonts.js";

// Styled single-line text for "title-type" texts (card title, cocktail name) and plain texts.
// style = { font, color, letterSpacing (em), effect: "normal" | "neon" | "comic", effectColor }
// px = font size in design px. Canvas shadows are in DEVICE pixels and ignore the transform,
// so every shadow value is multiplied by renderScale → preview and export match.

export const TEXT_EFFECTS = ["normal", "neon", "comic"];

export function setTextFont(ctx, style, px, weight = "regular") {
  ctx.font = fontCss(style.font, px, weight);
  ctx.letterSpacing = `${(style.letterSpacing ?? 0) * px}px`;
}

export function measureText(ctx, text, style, px, weight = "regular") {
  ctx.save();
  setTextFont(ctx, style, px, weight);
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

export function drawStyledText(ctx, text, x, y, style, px, renderScale, { align = "left", baseline = "middle" } = {}) {
  if (!text) return;
  ctx.save();
  setTextFont(ctx, style, px);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  const effect = style.effect ?? "normal";

  if (effect === "neon") {
    ctx.shadowColor = style.effectColor;
    ctx.fillStyle = style.effectColor;
    for (const blur of [0.55, 0.28, 0.1]) {
      ctx.shadowBlur = blur * px * renderScale;
      ctx.fillText(text, x, y);
    }
    ctx.shadowBlur = 0;
    ctx.shadowColor = "transparent";
    ctx.fillStyle = style.color; // light core
    ctx.fillText(text, x, y);
  } else if (effect === "comic") {
    ctx.lineJoin = "round";
    ctx.lineWidth = px * 0.14;
    ctx.strokeStyle = style.effectColor;
    ctx.shadowColor = style.effectColor;
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = px * 0.07 * renderScale;
    ctx.shadowOffsetY = px * 0.07 * renderScale;
    ctx.strokeText(text, x, y);
    ctx.shadowColor = "transparent";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = style.color;
    ctx.fillText(text, x, y);
  } else {
    ctx.fillStyle = style.color;
    ctx.fillText(text, x, y);
  }
  ctx.restore();
}
