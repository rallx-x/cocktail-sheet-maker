import { createDoilyPreset } from "./components/plate.js";
import { FONT_DEFAULTS } from "./fonts.js";
import { THEMES } from "./themes/themes.js";
import { createDefaultBackground } from "./background.js";
import { glassFromPreset } from "./cocktail/glasses.js";
import { applyTheme } from "./themes/apply-theme.js";

// Only used when a NEW barcode is created (new project / migration / explicit regenerate).
export function newSeed() {
  const buffer = new Uint32Array(1);
  (globalThis.crypto ?? { getRandomValues: (b) => ((b[0] = 1), b) }).getRandomValues(buffer);
  return buffer[0];
}

export const PROJECT_VERSION = 15;

// Editor-only values never enter sheet geometry.
export const editorConfig = {
  targetAspectRatio: 4 / 3,
  aspectRatioTolerance: 0.01,
  previewPaddingCssPx: 56,
};

// Sheet geometry uses normalized units, converted to design px only inside the renderer.
// Convention (fixed before Phase 2 so saved transforms stay consistent):
//   - positions / anchors: x as a fraction of design WIDTH, y as a fraction of design HEIGHT (0..1)
//   - sizes / scale / stroke / font size: fractions of design WIDTH only, on BOTH axes,
//     so shapes and images keep their aspect ratio even if a background's ratio differs.
// Future component rectangles/anchors belong here rather than as scattered pixel literals.
export const sheetLayout = {
  safeMargin: { x: 0.03, y: 0.04 },
  // MD character area: an editor/layout guide only (never clips artwork).
  // x/width: fractions of design width; y/height: fractions of design height.
  mdArea: { x: 0.02, y: 0.04, width: 0.38, height: 0.92 },
  // SD area (doily + SD character): center-bottom, as in the first sketch. Guide only.
  sdArea: { x: 0.42, y: 0.33, width: 0.29, height: 0.64 },
  // Cocktail card (top-right, per the user's first sketch). Guide/default only.
  cardArea: { x: 0.41, y: 0.04, width: 0.31, aspect: 0.63 },
  // Receipt board (right column under the card). Guide/default only.
  receiptArea: { x: 0.7275, y: 0.04, width: 0.255, aspect: 1.46 },
  // Color palette card under the receipt.
  paletteArea: { x: 0.7475, y: 0.58, width: 0.215, aspect: 1.25 },
  // Sheet-level branding block (top-left of the text block).
  brand: { x: 0.035, y: 0.045, width: 0.14 },
};

// v10 layout areas, frozen. Migrations that CREATE components (v4→v5 SD, v8→v9 card, v9→v10 receipt)
// must use these, so older files never pick up the v11 new-project composition.
export const LEGACY_LAYOUT_V10 = {
  sdArea: { x: 0.41, y: 0.55, width: 0.23, height: 0.42 },
  cardArea: { x: 0.62, y: 0.04, width: 0.36, aspect: 0.63 },
  receiptArea: { x: 0.66, y: 0.4, width: 0.3, aspect: 1.46 },
};

export function createDefaultBrand(visible = true) {
  return {
    visible,
    lines: ["cocktail", "sheet maker"], // tester build default (the commission brand is not stamped on testers' sheets)
    color: "#3A2E3F",
    font: FONT_DEFAULTS.brand,
    colorMode: "manual", // "auto": frame line color when over the MD frame, else background-derived
    letterSpacing: 0, // em
    lineHeight: 1.05,
    // v14: text outline, drawn outward under the fill. OFF here (the deserialize base); ON for new projects.
    outline: { visible: false, width: 0.07, color: "#FFFFFF" },
    ...sheetLayout.brand,
  };
}

// MD background frame: fills the MD area by default. Sizes are fractions of the frame width.
export function createDefaultFrame(visible = true) {
  const a = sheetLayout.mdArea;
  return {
    visible,
    x: a.x + a.width / 2,
    y: a.y + a.height / 2,
    width: a.width,
    aspect: (a.height * DEFAULT_SHEET.height) / (a.width * DEFAULT_SHEET.width),
    colorMode: "manual", // "auto": render-time colors from the sheet background (manual colors kept)
    fit: { on: false, padding: 0.04 }, // follow character ∪ coaster (editor updates stored geometry)
    shape: "arch", // arch | rect | rounded | oval | pill
    radius: 0.04, // rounded corners / arch bottom corners
    fill: { type: "solid", colors: ["#FFFFFF", "#EDE2F5"], angle: 90, stops: [0, 1] }, // stops: gradient start/end (v13)
    border: {
      style: "multi", // line | multi | offset | picture | pictureMat
      color: "#D9CFE0",
      width: 0.006,
      multi: { count: 2, gap: 0.02, dashedInner: false, innerColor: "#E8E0EE", chamfer: 0 },
      offset: { dx: 0.05, dy: 0.04 },
      molding: { width: 0.05, color: "#8B6A8F" },
      mat: { width: 0.045, color: "#FBF6EE" },
      scallop: { count: 22, depth: 0.025 },
      dots: { size: 0.018, spacing: 0.04 },
      stitch: { color: "#FFFFFF", dash: 0.02 },
    },
  };
}

// Confetti layer (v11): a seeded scatter inside a region. Both layers start OFF.
// density = pieces per (design-width units)² → independent of export resolution.
export function createDefaultConfetti(layer) {
  const a = sheetLayout.mdArea;
  return {
    on: false,
    touched: false, // becomes true on the first edit (one-time color suggestion only before that)
    x: a.x + a.width / 2,
    y: layer === "back" ? a.y + a.height * 0.2 : a.y + a.height * 0.35,
    width: layer === "back" ? a.width * 1.05 : a.width * 0.85,
    aspect: layer === "back" ? 0.45 : 0.6,
    size: 0.012,
    density: 180,
    color: "#C7A4D8",
    spread: 0.5,
    kinds: { curl: true, strip: true, dot: true, sparkle: true },
    seed: 1,
  };
}

// Color palette (v11): chips are real color state (unlike order.hex, which is information).
export function createDefaultPalette(visible = true, a = sheetLayout.paletteArea) {
  return {
    visible,
    x: a.x + a.width / 2,
    y: a.y + (a.width * DEFAULT_SHEET.width * a.aspect) / 2 / DEFAULT_SHEET.height,
    width: a.width,
    aspect: a.aspect,
    card: { fill: "#FFFDF8", border: "#D9CFE0", radius: 0.06 },
    title: { text: "COLOR PALETTE", font: FONT_DEFAULTS.receipt, color: "#3A2E3F", size: 0.075, letterSpacing: 0.04 },
    text: { font: FONT_DEFAULTS.receipt, color: "#3A2E3F", size: 0.06, letterSpacing: 0 },
    // v15: stable ids ("c1"…) so Cocktail Builder colors keep pointing at the same chip through reorders
    chips: [
      { id: "c1", name: "Main", hex: "#C7A4D8" },
      { id: "c2", name: "Sub", hex: "#F0A0B8" },
      { id: "c3", name: "Dark", hex: "#2A2A34" },
      { id: "c4", name: "Light", hex: "#FFFFFF" },
      { id: "c5", name: "Point", hex: "#FBE7A6" },
    ],
  };
}

// Cocktail Builder (v15, Phase 1a). Colors are { ref: palette chip id | null, color: cached/custom hex }.
// Seeds change only through an explicit "다시 섞기".
export function createDefaultBuilder(chips = createDefaultPalette().chips) {
  const stop = (chip, fallback, pos) => ({ ref: chip?.id ?? null, color: chip?.hex ?? fallback, pos });
  return {
    glass: glassFromPreset("martini"),
    scale: 0.9, // 잔 크기: scales the finished glass inside the slot; never touches geometry params
    liquid: { level: 0.7, stops: [stop(chips[0], "#C7A4D8", 0), stop(chips[1], "#F0A0B8", 1)] },
    ice: { type: "none", count: 2, seed: newSeed() },
    rim: { type: "none", color: { ref: null, color: "#FFFFFF" }, seed: newSeed() },
    // 1b: rim-attached COLOR MONA pixel emoji (the glyph carries its own colors)
    garnish: [{ char: "🍒", u: 0.8, size: "M", rotation: 0 }],
  };
}

// Cocktail Card (Phase 4). Text sizes are fractions of the card width.
// Cocktail Card. v13: y is the TOP edge (the card grows downward); sizing "content" = height from
// the recipe (card-flow.js), "fixed" = the pre-v13 layout with width × aspect (migrated cards).
// Ingredients and garnish are separate lists. Text sizes are fractions of the card width.
export function createDefaultCard(visible = true, a = sheetLayout.cardArea) {
  const text = (font, color, size, extra = {}) => ({ font, color, size, letterSpacing: 0, ...extra });
  return {
    visible,
    x: a.x + a.width / 2,
    y: a.y,
    width: a.width,
    aspect: a.aspect, // used only when sizing is "fixed"
    sizing: "content",
    radius: 0.035,
    border: { color: "#D9CFE0", width: 0.004 },
    fill: { type: "linear", colors: ["#FFFFFF", "#F3E9F7"], angle: 90 },
    coating: { on: true, strength: 0.25 },
    title: { text: "CUSTOM COCKTAIL", ...text(FONT_DEFAULTS.brand, "#3A2E3F", 0.055, { letterSpacing: 0.04 }), effect: "normal", effectColor: "#F2B8C9" },
    // v15: source "upload" (the uploaded image) or "builder" (card.builder); both sides are always kept
    image: { asset: null, scale: 1, dx: 0, dy: 0, slot: 0.3, frame: { on: true, color: "#E3D6EC" }, source: "upload" },
    builder: createDefaultBuilder(),
    ingredients: [
      { name: "Gin", amount: "1½ oz", checked: false },
      { name: "Dry Vermouth", amount: "½ oz", checked: false },
    ],
    garnish: [{ name: "Cherry", checked: false }],
    list: {
      ...text(FONT_DEFAULTS.receipt, "#3A2E3F", 0.031),
      leader: { on: true, color: "#B7A8C4" },
      checkboxes: true,
      wrap: true, // v12: wrap a long name to 2 lines only when the single line does not fit
      brackets: { on: true, color: "#3A2E3F" },
    },
    divider: { on: true, color: "#CDBFD9", dashed: false },
    name: { text: "Martini", ...text(FONT_DEFAULTS.cocktailName, "#3A2E3F", 0.07), effect: "normal", effectColor: "#F2B8C9" },
    barcode: { on: true, color: "#3A2E3F" },
    hex: { font: FONT_DEFAULTS.receipt, color: "#3A2E3F", size: 0.026 },
  };
}

// Sheet Colors (v13): 10 editable roles; values here match the pre-theme component defaults.
export function createDefaultSheetColors() {
  return {
    bg: "#FFFFFF",
    pattern: "#000000",
    gradient: "#EDE2F5",
    cardBase: "#FFFFFF",
    ink: "#3A2E3F",
    inkSoft: "#CDBFD9",
    accent: "#C7A4D8",
    accent2: "#F2B8C9",
    tray: "#EFE6DA",
    board: "#8E86A6",
  };
}

// 8-digit persistent receipt code, kept as a STRING (leading zeros are valid).
export function newReceiptCode() {
  return String(newSeed() % 100000000).padStart(8, "0");
}

// Receipt (Phase 5). Board geometry is fixed; the paper grows with content.
// New projects start with NO sections: the receipt only holds what the client supplied.
export function createDefaultReceipt(visible = true, a = sheetLayout.receiptArea) {
  const h = a.width * DEFAULT_SHEET.width * a.aspect;
  const text = (t, font, size, extra = {}) => ({ text: t, font, color: "#3A2E3F", size, letterSpacing: 0, ...extra });
  return {
    visible,
    x: a.x + a.width / 2,
    y: a.y + h / 2 / DEFAULT_SHEET.height,
    width: a.width,
    aspect: a.aspect,
    board: { style: "clipboard", color: "#8E86A6", border: 0.006, clipColor: "#C9C3D6" },
    paper: { color: "#FFFDF8", inset: 0.06, top: 0.08, edge: "zigzag", lineColor: "#CFC6D8" },
    title: text("RECEIPT", FONT_DEFAULTS.brand, 0.075, { letterSpacing: 0.18 }),
    subtitle: text("TESTER BUILD", FONT_DEFAULTS.receipt, 0.027, { letterSpacing: 0.08 }),
    header: { date: "2026.10.01", client: "GUEST", server: "SHEET MAKER" },
    body: { font: FONT_DEFAULTS.receipt, color: "#3A2E3F", size: 0.032, letterSpacing: 0, leaderColor: "#B7A8C4" },
    sections: [],
    barcode: { on: true, color: "#3A2E3F" },
    code: { anniversary: "", random: newReceiptCode(), font: FONT_DEFAULTS.receipt, color: "#3A2E3F", size: 0.04 },
    footer: text("THANK YOU FOR TESTING!", FONT_DEFAULTS.receipt, 0.027, { letterSpacing: 0.04 }),
  };
}

// MD decorations (separate from the frame; drawn on top of it).
export function createDefaultMdDecor() {
  const a = sheetLayout.mdArea;
  return {
    corners: { type: "sparkle", color: "#C7A4D8", size: 0.03, inset: 0.02 },
    top: { type: "none", color: "#C7A4D8", color2: "#F2B8C9", size: 1 },
    swirls: { visible: false, color: "#F2B8C9", color2: "#FBE7A6" },
    banner: {
      visible: false,
      text: "CHARACTER",
      font: FONT_DEFAULTS.brand,
      letterSpacing: 0.12,
      color: "#F2B8C9",
      back: "#C9798F",
      textColor: "#FFFFFF",
      bend: 0.07,
      thickness: 0.13,
      x: a.x + a.width / 2,
      y: a.y + a.height * 0.9,
      width: a.width * 0.85,
    },
    outline: { on: true, color: "#6E5578" },
  };
}

export function createDefaultTray(doily, visible = true) {
  return {
    visible,
    x: doily.x,
    y: doily.y, // centered under the doily
    width: doily.width * 1.14,
    aspect: 0.9,
    shape: "rounded",
    radius: 0.14,
    colors: { fill: "#EFE6DA", border: "#D8C8B6" },
    border: 0.008,
    // v14: "reflect" = light rim at the top-left fading into the fill. "solid" (the base) = v13 border.
    rim: { style: "solid", strength: 0.8, light: "#FFFFFF" },
  };
}

// MD component (Phase 2). All values follow R5:
//   x = anchor x / design width, y = anchor y / design height,
//   width = rendered image width / design width (height follows the image's aspect ratio).
// Anchors: character = bottom-center (feet), coaster = center.
export const MD_WIDTH_RANGE = { min: 0.02, max: 1.5 };

// coaster: { source: "none" } | { source: "file", file, x, y, width } | { source: "plate", plate, x, y, width }
export function createDefaultMd() {
  return {
    character: { asset: null, x: 0, y: 0, width: 0 }, // asset: { assetId, name, type, width, height }
    coaster: { source: "none" },
    frame: createDefaultFrame(),
    decor: createDefaultMdDecor(),
    confetti: { back: createDefaultConfetti("back"), front: createDefaultConfetti("front") },
    linked: true, // character movement also moves the coaster (never the reverse)
  };
}

// SD: the doily is always procedural (source-less). Placement is filled in from sdArea.
export function createDefaultSd(a = sheetLayout.sdArea) {
  const plate = createDoilyPreset(1);
  const w = Math.min(a.width * DEFAULT_SHEET.width, (a.height * DEFAULT_SHEET.height) / plate.aspect) * 0.95;
  const doily = { plate, x: a.x + a.width / 2, y: a.y + a.height / 2, width: w / DEFAULT_SHEET.width };
  return {
    character: { asset: null, x: 0, y: 0, width: 0 },
    doily,
    tray: createDefaultTray(doily),
    // Hierarchical when linked: SD moves doily + tray; doily moves tray; tray moves alone.
    linked: true,
  };
}

// The sheet: a 4:3 color base with an optional folder pattern on top.
export const DEFAULT_SHEET = {
  width: 4000,
  height: 3000,
  backgroundColor: "#FFFFFF",
};

// Layer 0b is one of:
//   { source: "none" }
//   { source: "file", file, tint, tintColor }             — PNG from assets/backgrounds/
//   { source: "builtin", id, color, opacity, scale, seed } — drawn by js/patterns/builtin.js
export const BUILTIN_DEFAULTS = {
  color: "#000000",
  opacity: 0.15, // 0..1, applied once to the whole pattern layer
  scale: 1, // multiplier on the pattern's base size (design-width-relative, R5)
};
export const SCALE_RANGE = { min: 0.25, max: 3 };

export function createDefaultPattern() {
  return { source: "none" };
}

export function createFilePattern(file) {
  return { source: "file", file, tint: false, tintColor: "#000000" };
}

export function createBuiltinPattern(id, seed, carry = {}) {
  return {
    source: "builtin",
    id,
    color: carry.color ?? BUILTIN_DEFAULTS.color,
    opacity: carry.opacity ?? BUILTIN_DEFAULTS.opacity,
    scale: carry.scale ?? BUILTIN_DEFAULTS.scale,
    seed: carry.seed ?? seed,
  };
}

export function normalizeHexColor(value) {
  if (typeof value !== "string") return null;
  let hex = value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split("").map((c) => c + c).join("");
  return /^[0-9a-f]{6}$/i.test(hex) ? `#${hex.toUpperCase()}` : null;
}

export function createInitialState() {
  return {
    projectVersion: PROJECT_VERSION,
    meta: {
      name: "Untitled Commission",
      updatedAt: null,
    },
    design: {
      width: DEFAULT_SHEET.width,
      height: DEFAULT_SHEET.height,
      backgroundColor: DEFAULT_SHEET.backgroundColor, // solid color / fallback (painted when background.type is "solid")
      background: createDefaultBackground(DEFAULT_SHEET.backgroundColor), // v14 Layer 0a source of truth
      pattern: createDefaultPattern(), // Layer 0b: optional, drawn over the color
      colors: createDefaultSheetColors(), // v13 Sheet Colors (edit-time propagation only)
      theme: { id: null }, // display only; the renderer never reads it
      creditOwner: "", // tester build: commissioner name for the sheet credit ("© {owner} · @Sueyoiwife")
    },
    layout: {}, // normalized component transforms are added from Phase 2 onward
    components: {
      brand: createDefaultBrand(),
      md: createDefaultMd(),
      sd: createDefaultSd(),
      plateSync: false,
      stickers: [], // sheet-level stickers (built-in or folder), see components/stickers.js
      card: createDefaultCard(),
      receipt: createDefaultReceipt(),
      palette: createDefaultPalette(),
      barcode: { seed: newSeed() }, // ONE persistent barcode shared by card and receipt
      order: { hex: "" }, // order information text (card HEX + receipt ORDER); not a color binding
    },
    random: {},
  };
}

// A GENUINELY new project (page start): the MD background and card use the white → theme gradient,
// and one theme is chosen exactly once and applied. Loading a file never comes through here, so
// render / save / load / export never re-randomize.
export function createNewProjectState() {
  const next = createInitialState();
  next.components.md.frame.fill.type = "linear";
  next.components.md.frame.fill.angle = 90;
  next.components.brand.outline.visible = true; // v14: new sheets start with the brand outline on
  next.components.sd.tray.rim.style = "reflect"; // v14: and the reflection rim on the tray
  next.components.sd.tray.border = 0.014; // a rim wide enough to read as light
  applyTheme(next, THEMES[newSeed() % THEMES.length].id);
  return next;
}

let state = createNewProjectState();
const listeners = new Set();

export function getState() {
  return state;
}

export function setState(nextState) {
  state = nextState;
  emit();
}

// Draft finalizers run ONCE inside updateState, after the updater and before commit, with the
// previous committed state for comparison. They must only edit the draft (never call updateState);
// setState (project load) does not run them, so loading never recomputes stored geometry.
const draftFinalizers = [];
export function registerDraftFinalizer(fn) {
  draftFinalizers.push(fn);
}

export function updateState(updater) {
  // Live state contains metadata and scalar/editor values only; image binaries live in assets.js.
  const draft = structuredClone(state);
  updater(draft);
  for (const fn of draftFinalizers) fn(draft, state);
  draft.meta.updatedAt = new Date().toISOString();
  state = draft;
  emit();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit() {
  for (const listener of listeners) listener(state);
}

// Every asset referenced by state, found by walking for `assetId` fields.
// Used by serialization (save only what is referenced) and hydration validation,
// so future components need no registration step to be saved correctly.
export function collectAssetIds(value, found = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectAssetIds(item, found);
  } else if (value && typeof value === "object") {
    if (typeof value.assetId === "string") found.add(value.assetId);
    for (const child of Object.values(value)) collectAssetIds(child, found);
  }
  return found;
}

// Tester build: the commissioner credit name, enforced at every boundary (UI + load).
export const CREDIT_OWNER_MAX = 40;
export function normalizeCreditOwner(value) {
  if (typeof value !== "string") return "";
  return [...value.replace(/[\r\n\t\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim()].slice(0, CREDIT_OWNER_MAX).join("").trim();
}
