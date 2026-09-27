import { MD_WIDTH_RANGE, sheetLayout } from "../state.js";
import { drawPlate, plateRect } from "./plate.js";
import { boxRect } from "./boxes.js";
import { drawFrame } from "./frame.js";
import { drawMdDecor } from "../decor/md-decor.js";
import { drawConfetti } from "./confetti.js";

// Geometry for the MD area, shared by the renderer, the editor overlay and hit-testing,
// so what you drag is exactly what gets drawn. Everything returns design px.

export function mdAreaRect(width, height) {
  const a = sheetLayout.mdArea;
  return { x: a.x * width, y: a.y * height, w: a.width * width, h: a.height * height };
}

// v16: the persisted MD viewport (fractions). Falls back to the layout's MD area for callers that
// only have a bare md object without one (never the case after load / migration).
export function viewportOf(md) {
  return md?.viewport ?? { ...sheetLayout.mdArea, clip: false };
}

export function viewportRect(md, width, height) {
  const v = viewportOf(md);
  return { x: v.x * width, y: v.y * height, w: v.width * width, h: v.height * height };
}

export function intersectRect(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.w, b.x + b.w);
  const y1 = Math.min(a.y + a.h, b.y + b.h);
  return x1 > x0 && y1 > y0 ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } : null;
}

// What is actually visible of the character: the full rect, or rect ∩ viewport while clipping.
// null = no character, or nothing of it is visible.
export function visibleCharacterRect(md, width, height) {
  const r = characterRect(md?.character, width, height);
  if (!r || !viewportOf(md).clip) return r;
  return intersectRect(r, viewportRect(md, width, height));
}

// Character: anchor = bottom-center.
export function characterRect(character, width, height) {
  if (!character?.asset) return null;
  const w = character.width * width;
  const h = (w * character.asset.height) / character.asset.width;
  return { x: character.x * width - w / 2, y: character.y * height - h, w, h };
}

// Coaster: anchor = center. File coasters need the image's intrinsic size;
// plate coasters get their height from plate.aspect.
export function coasterRect(coaster, imageSize, width, height) {
  if (coaster?.source === "plate") return plateRect(coaster, width, height);
  if (coaster?.source !== "file" || !imageSize) return null;
  const w = coaster.width * width;
  const h = (w * imageSize.height) / imageSize.width;
  return { x: coaster.x * width - w / 2, y: coaster.y * height - h / 2, w, h };
}

export function clampWidth(value) {
  return Math.min(MD_WIDTH_RANGE.max, Math.max(MD_WIDTH_RANGE.min, value));
}

// Default placement for a newly added character: feet at the area's bottom-center,
// fitted to 85% of the area height (and never wider than 90% of the area).
// v16: the area is the project's viewport when given (else the layout MD area).
export function defaultCharacterPlacement(assetSize, width, height, viewport = null) {
  const a = viewport ?? sheetLayout.mdArea;
  const areaW = a.width * width;
  const areaH = a.height * height;
  const aspect = assetSize.height / assetSize.width;
  const fitW = Math.min((areaH * 0.85) / aspect, areaW * 0.9);
  return {
    x: a.x + a.width / 2,
    y: a.y + a.height * 0.94,
    width: clampWidth(fitW / width),
  };
}

// Default placement for a newly chosen coaster: centered under the character's feet
// if there is a character, else at the area's bottom-center; 80% of the area width.
export function defaultCoasterPlacement(character, viewport = null) {
  const a = viewport ?? sheetLayout.mdArea;
  return {
    x: character?.asset ? character.x : a.x + a.width / 2,
    y: character?.asset ? character.y : a.y + a.height * 0.94,
    width: clampWidth(a.width * 0.8),
  };
}

// v16 one-shot composition actions. They only return character { x, y, width } (sheet space);
// the caller writes them like any other character move (linked coaster follows the feet).
export const FLOOR_MARGIN = 0.06; // same floor gap as the default placement (feet at 94%)
export const FILL_ALIGN = "top"; // tuning: "top" | "center" (see the comparison sheet)

// Fit (contain): the whole image inside the viewport, centered, feet on the floor line.
export function fitCharacterPlacement(assetSize, width, height, viewport) {
  const v = viewport;
  const vw = v.width * width;
  const vh = v.height * height * (1 - FLOOR_MARGIN);
  const aspect = assetSize.height / assetSize.width;
  const w = Math.min(vw, vh / aspect);
  return { x: v.x + v.width / 2, y: v.y + v.height * (1 - FLOOR_MARGIN), width: clampWidth(w / width) };
}

// Fill (cover): the viewport fully covered, centered horizontally. align "top" keeps the top edge
// (heads) and cuts at the bottom; "center" cuts evenly.
export function fillCharacterPlacement(assetSize, width, height, viewport, align = FILL_ALIGN) {
  const v = viewport;
  const vw = v.width * width;
  const vh = v.height * height;
  const aspect = assetSize.height / assetSize.width;
  const w = clampWidth(Math.max(vw, vh / aspect) / width) * width;
  const h = w * aspect;
  const top = align === "center" ? v.y * height + (vh - h) / 2 : v.y * height;
  return { x: v.x + v.width / 2, y: (top + h) / height, width: w / width };
}
// Layer 1 — MD: coaster first, character on top. Images are pre-resolved by the renderer.
export function drawMd(ctx, md, images, width, height, renderScale) {
  // v11 order: back confetti → frame → decor → coaster → FRONT confetti → character
  drawConfetti(ctx, md.confetti?.back, width, height);

  // MD background frame, then MD decorations (behind coaster and character)
  if (md.frame?.visible) {
    const rect = boxRect(md.frame, width, height);
    drawFrame(ctx, md.frame, rect);
    drawMdDecor(ctx, md.decor, md.frame.shape, rect, images, width, height);
  } else if (md.decor?.banner?.visible) {
    drawMdDecor(ctx, { banner: md.decor.banner, outline: md.decor.outline }, "rect", { x: 0, y: 0, w: 0, h: 0 }, images, width, height);
  }

  if (md.coaster.source === "plate") {
    drawPlate(ctx, md.coaster.plate, plateRect(md.coaster, width, height), renderScale);
  } else {
    const coaster = coasterRect(md.coaster, images.coaster, width, height);
    if (coaster && images.coaster) ctx.drawImage(images.coaster, coaster.x, coaster.y, coaster.w, coaster.h);
  }

  drawConfetti(ctx, md.confetti?.front, width, height);

  const character = characterRect(md.character, width, height);
  if (!character || !images.character) return;
  // v16: only the character artwork is cut at the viewport (frame / decor / coaster / confetti never)
  const clip = viewportOf(md).clip;
  if (clip) {
    const v = viewportRect(md, width, height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(v.x, v.y, v.w, v.h);
    ctx.clip();
  }
  ctx.drawImage(images.character, character.x, character.y, character.w, character.h);
  if (clip) ctx.restore();
}
