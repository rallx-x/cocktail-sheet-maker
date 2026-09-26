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
export function defaultCharacterPlacement(assetSize, width, height) {
  const a = sheetLayout.mdArea;
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
export function defaultCoasterPlacement(character) {
  const a = sheetLayout.mdArea;
  return {
    x: character?.asset ? character.x : a.x + a.width / 2,
    y: character?.asset ? character.y : a.y + a.height * 0.94,
    width: clampWidth(a.width * 0.8),
  };
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
  if (character && images.character) ctx.drawImage(images.character, character.x, character.y, character.w, character.h);
}
