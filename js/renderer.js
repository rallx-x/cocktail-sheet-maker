import { GARNISH_FONT } from "./cocktail/draw-cocktail.js";
import { backgroundPaint, sampleBackground } from "./background.js";
import { getDecodedAsset } from "./assets.js";
import { coasterLibrary, getPatternImage, stickerLibrary } from "./library.js";
import { drawSticker } from "./components/stickers.js";
import { drawCard } from "./components/card.js";
import { drawMemo } from "./components/memo.js";
import { drawReceipt } from "./components/receipt.js";
import { drawPalette } from "./components/palette.js";
import { autoPalette, contrast, resolveFrameColors } from "./decor/auto-color.js";
import { brandRect } from "./components/brand.js";
import { boxRect } from "./components/boxes.js";
import { drawMd } from "./components/md.js";
import { drawSd } from "./components/sd.js";
import { drawBrand } from "./components/brand.js";
import { fontCss, loadFonts } from "./fonts.js";
import { getBuiltinPattern, minScaleFor } from "./patterns/builtin.js";
import { SCALE_RANGE, normalizeCreditOwner } from "./state.js";

// Every font ID the current state actually renders with, plus the text to load glyphs for.
export function fontNeeds(state) {
  const ids = [];
  let sample = "";
  const c = state.components ?? {};
  if (c.brand?.visible) {
    ids.push(c.brand.font);
    sample += c.brand.lines.join("");
  }
  const card = c.card;
  if (card?.visible) {
    for (const t of [card.title, card.name]) {
      ids.push(t.font);
      sample += t.text;
    }
    ids.push(card.list.font, card.hex.font);
    sample += [...card.ingredients, ...card.garnish].map((it) => it.name + (it.amount ?? "")).join("") + "GARNISH" + (c.order?.hex ?? "") + ".";
  }
  if (c.palette?.visible) {
    ids.push(c.palette.title.font, c.palette.text.font);
    sample += c.palette.title.text + c.palette.chips.map((x) => x.name + x.hex).join("");
  }
  const receipt = c.receipt;
  if (receipt?.visible) {
    ids.push(receipt.title.font, receipt.subtitle.font, receipt.body.font, receipt.code.font, receipt.footer.font);
    sample += [receipt.title.text, receipt.subtitle.text, receipt.footer.text, ...Object.values(receipt.header)].join("");
    for (const s of receipt.sections) sample += s.title + s.items.map((it) => Object.values(it).join("")).join("");
    sample += "DATEORDERCLIENTSERVER0123456789.";
  }
  if (c.memo?.visible && c.memo.text) {
    ids.push(c.memo.font);
    sample += c.memo.text + "…";
  }
  const banner = c.md?.decor?.banner;
  if (banner?.visible && banner.text) {
    ids.push(banner.font);
    sample += banner.text;
  }
  const plates = [c.sd?.doily?.plate, c.md?.coaster?.source === "plate" ? c.md.coaster.plate : null];
  for (const plate of plates) {
    if (plate?.decor?.text) {
      ids.push(plate.decor.font);
      sample += plate.decor.text;
    }
  }
  return { ids, sample };
}

export async function waitForFonts(state) {
  if (typeof document === "undefined" || !document.fonts) return;
  const { ids, sample } = fontNeeds(state);
  ids.push(CREDIT.font); // tester-build credit (always drawn)
  await loadFonts(ids, sample + creditText(state));
  // Cocktail Builder garnish: the color MONA emoji face (not a selectable text font, so loaded here)
  const garnish = state.components?.card?.image?.source === "builder" ? state.components.card.builder?.garnish ?? [] : [];
  if (garnish.length) await document.fonts.load(`32px ${GARNISH_FONT}`, garnish.map((g) => g.char).join("")).catch(() => []);
  await document.fonts.ready;
}

/**
 * Single source of truth for sheet rendering.
 * renderScale controls only raster resolution; all geometry remains in design-space pixels.
 * Preview and export therefore share the exact same layer renderer.
 */
export async function renderSheet(canvas, state, options = {}) {
  const {
    renderScale = 1,
    isCurrent = () => true,
  } = options;

  const { width, height, pattern } = state.design;
  if (!width || !height) {
    canvas.width = 1;
    canvas.height = 1;
    canvas.getContext("2d").clearRect(0, 0, 1, 1);
    return false;
  }

  await waitForFonts(state);
  if (!isCurrent()) return false;

  const md = state.components?.md;
  const sd = state.components?.sd;
  const cardComp = state.components?.card;
  const cardAsset = cardComp?.visible && cardComp.image.source !== "builder" ? cardComp.image.asset : null; // kept in state either way
  const [patternImage, coasterImage, characterImage, sdCharacterImage, cardImage] = await Promise.all([
    pattern?.source === "file" ? getPatternImage(pattern.file) : null,
    md?.coaster?.source === "file" ? coasterLibrary.getImage(md.coaster.file) : null,
    md?.character?.asset ? getDecodedAsset(md.character.asset.assetId) : null,
    sd?.character?.asset ? getDecodedAsset(sd.character.asset.assetId) : null,
    cardAsset ? getDecodedAsset(cardAsset.assetId) : null,
  ]);
  if (!isCurrent()) return false;

  // Folder images used by stickers and by a folder corner ornament (built-ins need none).
  const stickers = state.components?.stickers ?? [];
  const cornerType = md?.decor?.corners?.type ?? "";
  const files = new Set(stickers.filter((st) => st.source === "file").map((st) => st.file));
  if (cornerType.startsWith("file:")) files.add(cornerType.slice(5));
  const fileImages = new Map();
  await Promise.all([...files].map(async (file) => fileImages.set(file, await stickerLibrary.getImage(file))));
  if (!isCurrent()) return false;

  const rasterWidth = Math.max(1, Math.round(width * renderScale));
  const rasterHeight = Math.max(1, Math.round(height * renderScale));
  if (canvas.width !== rasterWidth) canvas.width = rasterWidth;
  if (canvas.height !== rasterHeight) canvas.height = rasterHeight;
  if (!isCurrent()) return false;

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, rasterWidth, rasterHeight);
  ctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Layer 0a — v14: design.background decides (solid → backgroundColor, linear → its stops)
  ctx.fillStyle = backgroundPaint(ctx, state.design);
  ctx.fillRect(0, 0, width, height);

  // Layer 0b — Pattern (optional): folder PNG (stretched, optionally tinted) or built-in
  if (pattern?.source === "file" && patternImage) {
    drawFilePattern(ctx, patternImage, pattern, width, height, rasterWidth, rasterHeight);
  } else if (pattern?.source === "builtin") {
    drawBuiltinPattern(ctx, pattern, width, height, rasterWidth, rasterHeight, renderScale);
  }

  // Layer 1 — MD area: coaster → character (no clipping; the MD area is a guide only)
  // Stickers behind MD / SD
  for (const st of stickers) if (st.layer === "back") drawSticker(ctx, st, fileImages.get(st.file), width, height, renderScale);

  if (md) {
    const cornerSticker = cornerType.startsWith("file:") ? fileImages.get(cornerType.slice(5)) : null;
    // auto colors → render-only copies; stored manual colors are never touched
    const eff = resolveFrameColors(md.frame, md.decor, backgroundUnder(state, boxRect(md.frame, width, height)));
    const effMd = eff.frame === md.frame ? md : { ...md, frame: eff.frame, decor: eff.decor };
    drawMd(ctx, effMd, { coaster: coasterImage, character: characterImage, cornerSticker }, width, height, renderScale);
  }

  // Layer 2 — Cocktail Card
  const comps = state.components ?? {};
  if (comps.card?.visible) {
    drawCard(ctx, comps.card, { barcodeSeed: comps.barcode?.seed ?? 1, hex: comps.order?.hex ?? "", paletteChips: comps.palette?.chips ?? [] }, { cardImage }, width, height, renderScale);
  }

  // v17 sheet memo: card layer (above MD, below SD — the SD tray may overlap it)
  if (comps.memo?.visible) drawMemo(ctx, comps.memo, width, height);

  // Layer 3 — SD area: doily → decor text → SD character
  if (sd) drawSd(ctx, sd, { character: sdCharacterImage }, width, height, renderScale);

  // Layer 4 — Receipt (before front stickers and the brand, so stickers may decorate it)
  if (comps.receipt?.visible) {
    drawReceipt(ctx, comps.receipt, { barcodeSeed: comps.barcode?.seed ?? 1, orderHex: comps.order?.hex ?? "" }, width, height, renderScale);
  }

  // Color palette (with the receipt group)
  if (comps.palette?.visible) drawPalette(ctx, comps.palette, width, height, renderScale);

  // Stickers in front of MD / SD / receipt (branding still on top)
  for (const st of stickers) if (st.layer !== "back") drawSticker(ctx, st, fileImages.get(st.file), width, height, renderScale);

  // Sheet-level branding: above MD / SD so an overlapping frame never hides it.
  if (state.components?.brand?.visible) drawBrand(ctx, state.components.brand, width, height, brandColor(state, width, height));

  // Tester build: fixed creator credit, the topmost layer (no state, no toggle, never part of layout).
  drawCredit(ctx, state, width, height);


  // Later phases append layers here in strict bottom→top order.
  // Component transforms are stored normalized, then converted to design px here.
  return true;
}

function drawFilePattern(ctx, image, pattern, width, height, rasterWidth, rasterHeight) {
  if (!pattern.tint) {
    ctx.drawImage(image, 0, 0, width, height);
    return;
  }

  // Tint: keep the pattern's alpha, replace its colors with one color.
  const layer = createLayer(rasterWidth, rasterHeight);
  layer.ctx.drawImage(image, 0, 0, rasterWidth, rasterHeight);
  layer.ctx.globalCompositeOperation = "source-in";
  layer.ctx.fillStyle = pattern.tintColor;
  layer.ctx.fillRect(0, 0, rasterWidth, rasterHeight);
  compositeLayer(ctx, layer.canvas, 1);
}

function drawBuiltinPattern(ctx, pattern, width, height, rasterWidth, rasterHeight, renderScale) {
  const def = getBuiltinPattern(pattern.id);
  if (!def || pattern.opacity <= 0) return;

  // Drawn at full opacity on its own layer in design px (same transform as the sheet),
  // then composited once with the user's opacity, so overlaps never darken.
  const layer = createLayer(rasterWidth, rasterHeight);
  const lctx = layer.ctx;
  lctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
  lctx.beginPath();
  lctx.rect(0, 0, width, height);
  lctx.clip();
  lctx.fillStyle = pattern.color;
  lctx.strokeStyle = pattern.color;
  lctx.lineCap = "butt";
  lctx.beginPath();

  def.draw(lctx, {
    width,
    height,
    cell: def.baseSize * width * Math.max(pattern.scale, minScaleFor(def.id, SCALE_RANGE.min)),
    seed: pattern.seed,
    color: pattern.color,
  });

  compositeLayer(ctx, layer.canvas, pattern.opacity);
}

// No await between creating, drawing and compositing a layer, so preview and export
// produce the same result, each at its own resolution.
function createLayer(rasterWidth, rasterHeight) {
  const canvas = document.createElement("canvas");
  canvas.width = rasterWidth;
  canvas.height = rasterHeight;
  const layerCtx = canvas.getContext("2d");
  layerCtx.imageSmoothingEnabled = true;
  layerCtx.imageSmoothingQuality = "high";
  return { canvas, ctx: layerCtx };
}

function compositeLayer(ctx, layerCanvas, alpha) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.drawImage(layerCanvas, 0, 0);
  ctx.restore();
}

// Brand auto color: bbox overlap with the visible MD frame → the frame's resolved line color;
// otherwise a background-derived readable tint. Manual mode → the stored color.
function brandColor(state, width, height) {
  const brand = state.components.brand;
  if (brand.colorMode !== "auto") return brand.color;
  const bg = backgroundUnder(state, brandRect(brand, width, height));
  const frame = state.components.md?.frame;
  if (frame?.visible) {
    const a = brandRect(brand, width, height);
    const b = boxRect(frame, width, height);
    const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
    if (overlap) return resolveFrameColors(frame, null, backgroundUnder(state, b)).frame.border.color; // same input as the frame itself
  }
  return autoPalette(bg).onBackground;
}

// Sheet background color behind a rect (its center), in any gradient direction.
function backgroundUnder(state, r) {
  return sampleBackground(state.design, r.x + r.w / 2, r.y + r.h / 2);
}

// Tester build creator credit: bottom-right corner of the SHEET, Mona text, reduced opacity, and a
// light/dark color chosen from the actual background behind it (sampleBackground, any gradient direction).
const CREDIT = { text: "@Sueyoiwife", font: "mona", size: 0.011, margin: 0.015, alpha: 0.6 };
// "© {owner} · @Sueyoiwife" — right-aligned, so the handle's position is fixed and the owner grows leftward.
function creditText(state) {
  const owner = normalizeCreditOwner(state.design?.creditOwner);
  return owner ? `\u00A9 ${owner} \u00B7 ${CREDIT.text}` : CREDIT.text;
}
function drawCredit(ctx, state, width, height) {
  const px = CREDIT.size * width;
  const m = CREDIT.margin * width;
  ctx.save();
  ctx.font = fontCss(CREDIT.font, px);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  const text = creditText(state);
  const w = ctx.measureText(text).width;
  const x = width - m;
  const y = height - m;
  const bg = sampleBackground(state.design, x - w / 2, y - px / 2);
  const dark = "#2A2330";
  const light = "#FFFFFF";
  ctx.fillStyle = contrast(dark, bg) >= contrast(light, bg) ? dark : light;
  ctx.globalAlpha = CREDIT.alpha;
  ctx.fillText(text, x, y);
  ctx.restore();
}
