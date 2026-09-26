import { fontCss } from "../fonts.js";

// Sheet-level branding ("three dots / & a dash"). Owned by the sheet, not by MD.
// Text, color and font ID live in state (default font: FONT_DEFAULTS.brand).
// x / y = top-left of the text block (fractions of design width / height);
// width = block width as a fraction of design width (font size is derived from it).

const REF_PX = 100;
let measureCtx = null;

// letterSpacing is in em; the width fit includes it so `width` stays the block width.
function measure(ctx, lines, font, letterSpacing) {
  ctx.font = fontCss(font, REF_PX);
  ctx.letterSpacing = `${letterSpacing * REF_PX}px`;
  const widest = Math.max(1, ...lines.map((line) => ctx.measureText(line).width));
  ctx.letterSpacing = "0px";
  return widest;
}

function layout(brand, designWidth, designHeight, ctx) {
  if (!measureCtx) measureCtx = document.createElement("canvas").getContext("2d");
  const lines = brand.lines.filter((line) => line.length);
  const widest = measure(ctx ?? measureCtx, lines.length ? lines : [" "], brand.font, brand.letterSpacing ?? 0);
  const w = brand.width * designWidth;
  const px = (REF_PX * w) / widest;
  const lineHeight = brand.lineHeight ?? 1.05;
  return { lines, px, lineHeight, x: brand.x * designWidth, y: brand.y * designHeight, w, h: px * lineHeight * Math.max(1, lines.length) };
}

export function brandRect(brand, designWidth, designHeight) {
  const l = layout(brand, designWidth, designHeight);
  return { x: l.x, y: l.y, w: l.w, h: l.h };
}

// color: resolved color (auto mode); defaults to the stored manual color.
export function drawBrand(ctx, brand, designWidth, designHeight, color = brand.color) {
  const l = layout(brand, designWidth, designHeight);
  ctx.save();
  ctx.font = fontCss(brand.font, l.px);
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.letterSpacing = `${(brand.letterSpacing ?? 0) * l.px}px`;
  const o = brand.outline;
  if (o?.visible && o.width > 0) {
    // stroke first, twice the outline width: only the outer half shows, so letter shapes stay intact
    ctx.strokeStyle = o.color;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.lineWidth = o.width * 2 * l.px;
    l.lines.forEach((line, i) => ctx.strokeText(line, l.x, l.y + i * l.px * l.lineHeight));
  }
  l.lines.forEach((line, i) => ctx.fillText(line, l.x, l.y + i * l.px * l.lineHeight));
  ctx.restore();
}
