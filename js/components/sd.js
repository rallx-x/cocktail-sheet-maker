import { MD_WIDTH_RANGE, sheetLayout } from "../state.js";
import { characterRect } from "./md.js";
import { drawPlate, plateRect } from "./plate.js";
import { boxRect, drawTray } from "./boxes.js";

// SD area: doily (always procedural) → decor text → SD character.
// Same R5 units and anchors as MD: character bottom-center, doily center.

export function sdAreaRect(width, height) {
  const a = sheetLayout.sdArea;
  return { x: a.x * width, y: a.y * height, w: a.width * width, h: a.height * height };
}

export const sdCharacterRect = characterRect;

export function doilyRect(doily, width, height) {
  return plateRect(doily, width, height);
}

const clampWidth = (value) => Math.min(MD_WIDTH_RANGE.max, Math.max(MD_WIDTH_RANGE.min, value));

// Doily fills the SD area (95%) at its own aspect, centered.
export function defaultDoilyPlacement(plate, width, height) {
  const a = sheetLayout.sdArea;
  const areaW = a.width * width;
  const areaH = a.height * height;
  const w = Math.min(areaW, areaH / plate.aspect) * 0.95;
  return { x: a.x + a.width / 2, y: a.y + a.height / 2, width: clampWidth(w / width) };
}

// SD character stands inside the doily: 62% of the doily height, feet 32% below its center.
export function defaultSdCharacterPlacement(assetSize, doily, width, height) {
  const d = doilyRect(doily, width, height);
  const aspect = assetSize.height / assetSize.width;
  const targetH = d.h * 0.62;
  return {
    x: doily.x,
    y: (d.y + d.h / 2 + d.h * 0.32) / height,
    width: clampWidth(targetH / aspect / width),
  };
}

export function trayRect(tray, width, height) {
  return boxRect(tray, width, height);
}

// Tray default: a little wider than the doily, centered under it.
export function defaultTrayPlacement(doily, width, height) {
  const d = doilyRect(doily, width, height);
  return { x: doily.x, y: (d.y + d.h / 2) / height, width: clampWidth(doily.width * 1.14) };
}

// SD layer: tray → doily (+ curved decor inside drawPlate) → SD character.
export function drawSd(ctx, sd, images, width, height, renderScale) {
  if (sd.tray?.visible) drawTray(ctx, sd.tray, trayRect(sd.tray, width, height));
  drawPlate(ctx, sd.doily.plate, doilyRect(sd.doily, width, height), renderScale);

  const character = sdCharacterRect(sd.character, width, height);
  if (character && images.character) ctx.drawImage(images.character, character.x, character.y, character.w, character.h);
}
