import {
  commitStagedAssets,
  discardStagedAssets,
  exportAssetsAsDataUrls,
  stageAssetsFromDataUrls,
} from "./assets.js";
import {
  DEFAULT_SHEET,
  PROJECT_VERSION,
  BUILTIN_DEFAULTS,
  MD_WIDTH_RANGE,
  VIEWPORT_MIN,
  createDefaultViewport,
  SCALE_RANGE,
  collectAssetIds,
  createDefaultBrand,
  createDefaultFrame,
  createDefaultMd,
  LEGACY_LAYOUT_V10,
  createDefaultCard,
  normalizeCreditOwner,
  createDefaultBuilder,
  createDefaultSheetColors,
  createDefaultConfetti,
  createDefaultPalette,
  createDefaultReceipt,
  createDefaultMdDecor,
  newSeed,
  createDefaultSd,
  createDefaultTray,
  createDefaultPattern,
  createInitialState,
  normalizeHexColor,
} from "./state.js";
import { getBuiltinPattern, minScaleFor } from "./patterns/builtin.js";
import { createCoasterPreset, createDefaultDecor, normalizePlate } from "./components/plate.js";
import { TRAY_SHAPES } from "./components/boxes.js";
import { FRAME_SHAPES } from "./components/shapes.js";
import { BORDER_STYLES, FRAME_FILLS } from "./components/frame.js";
import { TOP_TYPES } from "./decor/top.js";
import { CORNER_GLYPHS } from "./decor/md-decor.js";
import { CORNER_ORNAMENTS } from "./decor/corners.js";
import { getBuiltinSticker } from "./stickers/builtin.js";
import { TEXT_EFFECTS } from "./components/text-style.js";
import { COLOR_ROLES, getTheme } from "./themes/themes.js";
import { BG_DIRECTIONS, BG_STOP_LIMITS, createDefaultBackground } from "./background.js";
import { BOWL_TYPES, GLASS_FAMILIES, HEIGHT_RANGE, PARAM_SCHEMA, PRESETS, glassFromPreset } from "./cocktail/glasses.js";
import { CARD_LIMITS } from "./components/card.js";
import { RECEIPT_LIMITS, isValidAnniversary } from "./components/receipt.js";
import { normalizeFontId } from "./fonts.js";
import { STRINGS } from "./strings.js";

const migrations = new Map([
  // v1 → v2: the uploaded Main Background Image was replaced by
  // color base + folder pattern. The uploaded image is dropped (and not re-embedded).
  [
    1,
    (project) => {
      const design = project.design ?? {};
      const droppedId = design.background?.assetId;
      if (droppedId && project.assets) delete project.assets[droppedId];
      delete design.background;
      design.width = DEFAULT_SHEET.width;
      design.height = DEFAULT_SHEET.height;
      design.pattern = { file: null, tint: false, tintColor: "#000000" }; // v2 shape
      project.design = design;
      project.projectVersion = 2;
      return project;
    },
  ],
  // v2 → v3: pattern becomes a discriminated union (none | file | builtin).
  [
    2,
    (project) => {
      const design = project.design ?? {};
      const old = design.pattern ?? {};
      design.pattern =
        typeof old.file === "string" && old.file
          ? { source: "file", file: old.file, tint: old.tint === true, tintColor: old.tintColor }
          : { source: "none" };
      project.design = design;
      project.projectVersion = 3;
      return project;
    },
  ],
  // v3 → v4: MD component (character + coaster) added.
  [
    3,
    (project) => {
      project.components = { ...(project.components ?? {}), md: createDefaultMd() };
      project.projectVersion = 4;
      return project;
    },
  ],
  // v4 → v5: coaster becomes none | file | plate; SD component (doily, decor, character) added.
  [
    4,
    (project) => {
      const md = project.components?.md ?? {};
      const old = md.coaster ?? {};
      md.coaster =
        typeof old.file === "string" && old.file
          ? { source: "file", file: old.file, x: old.x, y: old.y, width: old.width }
          : { source: "none" };
      project.components = { ...(project.components ?? {}), md, sd: createDefaultSd(LEGACY_LAYOUT_V10.sdArea) };
      project.projectVersion = 5;
      return project;
    },
  ],
  // v5 → v6: straight SD decor → curved plate decor; frame / tray / brand added (hidden for
  // migrated files so their exports stay the same); plate design sync added (off).
  // The old straight offsetY is NOT reinterpreted: only text / color / size carry over.
  [
    5,
    (project) => {
      const components = project.components ?? {};
      const sd = components.sd ?? createDefaultSd(LEGACY_LAYOUT_V10.sdArea);
      const old = sd.decor ?? {};
      const doilyWidth = Number(sd.doily?.width) > 0 ? Number(sd.doily.width) : 0.2;
      if (sd.doily?.plate) {
        sd.doily.plate.decor = {
          ...createDefaultDecor(),
          ...(typeof old.text === "string" ? { text: old.text } : {}),
          ...(typeof old.color === "string" ? { color: old.color } : {}),
          // design-width units → plate-width units (a straightforward rescale)
          ...(Number(old.size) > 0 ? { size: Number(old.size) / doilyWidth } : {}),
        };
      }
      delete sd.decor;
      sd.tray = createDefaultTray(sd.doily ?? createDefaultSd(LEGACY_LAYOUT_V10.sdArea).doily, false);
      const md = components.md ?? createDefaultMd();
      if (md.coaster?.source === "plate") md.coaster.plate.decor = createDefaultDecor();
      md.frame = createDefaultFrame(false);
      project.components = { ...components, md, sd, brand: createDefaultBrand(false), plateSync: false };
      project.projectVersion = 6;
      return project;
    },
  ],
  // v6 → v7: fonts are stable IDs. Old role names on plate decor map to font IDs;
  // brand gets an explicit font (its previous typeface).
  [
    6,
    (project) => {
      const roleToId = { system: "system", brand: "puzzle", script: "lovingu", receipt: "mona" };
      const plates = [project.components?.sd?.doily?.plate, project.components?.md?.coaster?.plate];
      for (const plate of plates) if (plate?.decor) plate.decor.font = roleToId[plate.decor.font] ?? "system";
      if (project.components?.brand) project.components.brand.font = "puzzle";
      project.projectVersion = 7;
      return project;
    },
  ],
  // v7 → v8: MD frame becomes { shape, fill, border{…} } and its ornaments move into the
  // separate MD decor; sheet stickers and brand spacing added. Output stays identical:
  // old "rect" (rounded by radius) → "rounded"; inset double line → border "multi" (count 2,
  // same gap and inner color); ornament → decor.corners with the same size / inset formula.
  [
    7,
    (project) => {
      const md = project.components?.md;
      const f = md?.frame;
      if (md && f) {
        const colors = f.colors ?? {};
        const base = createDefaultFrame(false);
        const gap = Number.isFinite(f.inset?.gap) ? f.inset.gap : 0.02;
        md.frame = {
          ...base,
          visible: f.visible === true,
          x: f.x, y: f.y, width: f.width, aspect: f.aspect,
          shape: f.shape === "rect" ? "rounded" : "arch",
          radius: f.radius,
          fill: { ...base.fill, colors: [colors.fill ?? "#FFFFFF", base.fill.colors[1]] },
          border: {
            ...base.border,
            style: f.inset?.on === false ? "line" : "multi",
            color: colors.border ?? base.border.color,
            width: Number.isFinite(f.border) ? f.border : base.border.width,
            multi: { count: 2, gap, dashedInner: false, innerColor: colors.inset ?? base.border.multi.innerColor },
          },
        };
        const decor = createDefaultMdDecor();
        decor.corners = { type: f.ornament ?? "sparkle", color: colors.ornament ?? decor.corners.color, size: 0.03, inset: gap };
        md.decor = decor;
      }
      if (project.components?.brand) Object.assign(project.components.brand, { letterSpacing: 0, lineHeight: 1.05 });
      if (project.components) project.components.stickers = [];
      project.projectVersion = 8;
      return project;
    },
  ],
  // v8 → v9: Cocktail Card (hidden for migrated files → identical export), one shared barcode
  // seed (created once here), shared order information (HEX) empty.
  [
    8,
    (project) => {
      project.components = project.components ?? {};
      project.components.card = legacyCardV12(LEGACY_LAYOUT_V10.cardArea); // pre-v13 shape (frozen)
      project.components.barcode = { seed: newSeed() };
      project.components.order = { hex: "" };
      project.projectVersion = 9;
      return project;
    },
  ],
  // v9 → v10: Receipt (hidden for migrated files → identical export). Its persistent 8-digit
  // code is generated once here and stored as a string.
  [
    9,
    (project) => {
      project.components = project.components ?? {};
      project.components.receipt = createDefaultReceipt(false, LEGACY_LAYOUT_V10.receiptArea); // fresh random code inside
      project.projectVersion = 10;
      return project;
    },
  ],
  // v10 → v11: decoration polish + composition. Everything new is OFF / manual for migrated files,
  // and no stored geometry is recomputed → identical exports.
  [
    10,
    (project) => {
      const c = (project.components = project.components ?? {});
      if (c.md?.frame) {
        c.md.frame.colorMode = "manual";
        c.md.frame.fit = { on: false, padding: 0.04 };
      }
      if (c.md) c.md.confetti = { back: createDefaultConfetti("back"), front: createDefaultConfetti("front") };
      if (c.brand) c.brand.colorMode = "manual";
      c.palette = createDefaultPalette(false);
      project.projectVersion = 11;
      return project;
    },
  ],
  // v11 → v12: card ingredient wrap (off for migrated files) and the illustration slot width
  // (0.30 = the previous fixed layout) → identical exports.
  [
    11,
    (project) => {
      const card = project.components?.card;
      if (card?.list) card.list.wrap = false;
      if (card?.image) card.image.slot = 0.3;
      project.projectVersion = 12;
      return project;
    },
  ],
  // v12 → v13: Sheet Colors are STORED from the project's current values (never propagated), the card
  // becomes top-anchored with separate ingredient / garnish lists and keeps its fixed layout
  // (sizing "fixed"). Built-in stickers get the default theme role. → identical exports.
  [
    12,
    (project) => {
      const c = (project.components = project.components ?? {});
      const d = (project.design = project.design ?? {});
      const base = createDefaultSheetColors();
      const pick = (v, fb) => (typeof v === "string" ? v : fb);
      d.colors = {
        bg: pick(d.backgroundColor, base.bg),
        pattern: d.pattern?.source === "builtin" ? pick(d.pattern.color, base.pattern) : base.pattern,
        gradient: pick(c.md?.frame?.fill?.colors?.[1], base.gradient),
        cardBase: pick(c.card?.fill?.colors?.[0], base.cardBase),
        ink: pick(c.card?.title?.color, base.ink),
        inkSoft: pick(c.card?.divider?.color, base.inkSoft),
        accent: pick(c.md?.decor?.corners?.color, base.accent),
        accent2: pick(c.md?.decor?.top?.color2, base.accent2),
        tray: pick(c.sd?.tray?.colors?.fill, base.tray),
        board: pick(c.receipt?.board?.color, base.board),
      };
      d.theme = { id: null };
      if (c.md?.frame?.fill) c.md.frame.fill.stops = [0, 1];
      const card = c.card;
      if (card) {
        const W = Number(d.width) || 4000;
        const H = Number(d.height) || 3000;
        // center → top edge (same rectangle)
        card.y = card.y - (card.width * W * card.aspect) / 2 / H;
        card.sizing = "fixed";
        card.ingredients = Array.isArray(card.list?.items) ? card.list.items : [];
        card.garnish = [];
        if (card.list) delete card.list.items;
      }
      for (const st of c.stickers ?? []) st.themeRole = "accent";
      project.projectVersion = 13;
      return project;
    },
  ],
  // v13 → v14: the sheet background becomes design.background. Migrated files get a SOLID background
  // (painted from backgroundColor exactly as before) → identical exports.
  [
    13,
    (project) => {
      const d = (project.design = project.design ?? {});
      const color = typeof d.backgroundColor === "string" ? d.backgroundColor : DEFAULT_SHEET.backgroundColor;
      d.background = createDefaultBackground(color);
      project.projectVersion = 14;
      return project;
    },
  ],
  // v14 → v15: palette chips get stable ids (c1… in current order); the card image keeps "upload" and a
  // default Cocktail Builder is added (not drawn while the source is "upload") → identical exports.
  [
    14,
    (project) => {
      const chips = project.components?.palette?.chips;
      if (Array.isArray(chips)) chips.forEach((ch, i) => ch && typeof ch === "object" && (ch.id = `c${i + 1}`));
      const card = project.components?.card;
      if (card?.image) card.image.source = "upload";
      project.projectVersion = 15;
      return project;
    },
  ],
  // v15 → v16: md.viewport (the MD area, persisted). Migrated files get clip:false → nothing is cut and
  // frame fit keeps the full character rect → identical exports. Clipping is an explicit opt-in.
  [
    15,
    (project) => {
      const md = project.components?.md;
      if (md && typeof md === "object") md.viewport = createDefaultViewport(false);
      project.projectVersion = 16;
      return project;
    },
  ],
]);

// The card exactly as createDefaultCard produced it up to v12 (center-anchored, one `items` list).
// Only the v8 → v9 migration uses it; later migrations then upgrade it like any stored v12 card.
function legacyCardV12(a) {
  const h = a.width * 4000 * a.aspect;
  const text = (font, color, size, extra = {}) => ({ font, color, size, letterSpacing: 0, ...extra });
  return {
    visible: false,
    x: a.x + a.width / 2,
    y: a.y + h / 2 / 3000,
    width: a.width,
    aspect: a.aspect,
    radius: 0.035,
    border: { color: "#D9CFE0", width: 0.004 },
    fill: { type: "solid", colors: ["#FFFFFF", "#F3E9F7"], angle: 90 },
    coating: { on: true, strength: 0.25 },
    title: { text: "CUSTOM COCKTAIL", ...text("puzzle", "#3A2E3F", 0.055, { letterSpacing: 0.04 }), effect: "normal", effectColor: "#F2B8C9" },
    image: { asset: null, scale: 1, dx: 0, dy: 0, slot: 0.3, frame: { on: true, color: "#E3D6EC" } },
    list: {
      items: [
        { name: "Gin", amount: "1½ oz", checked: false },
        { name: "Dry Vermouth", amount: "½ oz", checked: false },
        { name: "Garnish", amount: "Cherry", checked: false },
      ],
      ...text("mona", "#3A2E3F", 0.031),
      leader: { on: true, color: "#B7A8C4" },
      checkboxes: true,
      wrap: true,
      brackets: { on: true, color: "#3A2E3F" },
    },
    divider: { on: true, color: "#CDBFD9", dashed: false },
    name: { text: "Martini", ...text("ahnchangho", "#3A2E3F", 0.07), effect: "normal", effectColor: "#F2B8C9" },
    barcode: { on: true, color: "#3A2E3F" },
    hex: { font: "mona", color: "#3A2E3F", size: 0.026 },
  };
}

export async function serializeProject(state) {
  const payload = {
    ...state,
    projectVersion: PROJECT_VERSION,
    meta: {
      ...state.meta,
      savedAt: new Date().toISOString(),
    },
    // Only assets referenced by state are embedded.
    assets: await exportAssetsAsDataUrls([...collectAssetIds(state)]),
  };
  return JSON.stringify(payload, null, 2);
}

export async function downloadProject(state, filename = "three-dots-project.json") {
  const blob = new Blob([await serializeProject(state)], { type: "application/json" });
  downloadBlob(blob, filename);
}

export async function readProjectFile(file) {
  const text = await file.text();
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(STRINGS.errors.invalidProject);
  }
  return deserializeProject(raw);
}

/**
 * Returns { state, commit }. Nothing global changes until the caller runs commit(),
 * so a project that fails validation leaves the current editor work untouched.
 * Usage: const { state, commit } = await readProjectFile(file); commit(); setState(state);
 */
export async function deserializeProject(raw) {
  if (!raw || typeof raw !== "object") throw new Error(STRINGS.errors.invalidProject);
  const migrated = migrateToCurrent(raw);

  const base = createInitialState();
  const restored = {
    ...base,
    ...migrated,
    meta: { ...base.meta, ...(migrated.meta ?? {}) },
    design: { ...base.design, ...(migrated.design ?? {}) },
    layout: { ...base.layout, ...(migrated.layout ?? {}) },
    components: { ...base.components, ...(migrated.components ?? {}) },
    random: { ...base.random, ...(migrated.random ?? {}) },
  };
  delete restored.assets;
  restored.design.backgroundColor =
    normalizeHexColor(restored.design.backgroundColor) ?? DEFAULT_SHEET.backgroundColor;
  restored.design.background = normalizeBackground(migrated.design?.background, restored.design.backgroundColor);
  restored.design.pattern = normalizePattern(restored.design.pattern);
  restored.design.colors = normalizeSheetColors(migrated.design?.colors);
  const themeId = migrated.design?.theme?.id;
  restored.design.theme = { id: typeof themeId === "string" && getTheme(themeId) ? themeId : null };
  restored.design.creditOwner = normalizeCreditOwner(migrated.design?.creditOwner); // tester build
  restored.components.md = normalizeMd(migrated.components?.md);
  restored.components.sd = normalizeSd(migrated.components?.sd);
  restored.components.brand = normalizeBrand(migrated.components?.brand);
  restored.components.plateSync = migrated.components?.plateSync === true;
  restored.components.stickers = normalizeStickers(migrated.components?.stickers);
  restored.components.palette = normalizePalette(migrated.components?.palette);
  restored.components.card = normalizeCard(migrated.components?.card, restored.components.palette.chips);
  const seed = Number(migrated.components?.barcode?.seed);
  restored.components.barcode = { seed: Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff ? seed : 1 };
  restored.components.order = { hex: normalizeHexColor(migrated.components?.order?.hex) ?? "" };
  restored.components.receipt = normalizeReceipt(migrated.components?.receipt, restored.components.barcode.seed);
  // (palette is normalized before the card: builder colors reference chip ids)
  validateDesign(restored.design);

  const staged = await stageAssetsFromDataUrls(migrated.assets ?? {});
  for (const assetId of collectAssetIds(restored)) {
    if (!staged.has(assetId)) {
      discardStagedAssets(staged);
      throw new Error(STRINGS.errors.projectMissingAsset);
    }
  }

  let committed = false;
  return {
    state: restored,
    commit() {
      if (committed) return;
      committed = true;
      commitStagedAssets(staged);
    },
  };
}

function migrateToCurrent(raw) {
  let current = structuredClone(raw);
  let version = Number(current.projectVersion ?? 1);

  while (version < PROJECT_VERSION) {
    const migrate = migrations.get(version);
    if (!migrate) throw new Error(STRINGS.errors.unsupportedVersion(version));
    current = migrate(current);
    version = Number(current.projectVersion);
  }

  if (version !== PROJECT_VERSION) throw new Error(STRINGS.errors.unsupportedVersion(version));
  return current;
}

function normalizePattern(raw) {
  if (!raw || typeof raw !== "object") return createDefaultPattern();

  if (raw.source === "file" && typeof raw.file === "string" && raw.file) {
    return {
      source: "file",
      file: raw.file,
      tint: raw.tint === true,
      tintColor: normalizeHexColor(raw.tintColor) ?? "#000000",
    };
  }

  if (raw.source === "builtin" && getBuiltinPattern(raw.id)) {
    const opacity = Number(raw.opacity);
    const scale = Number(raw.scale);
    const seed = Number(raw.seed);
    return {
      source: "builtin",
      id: raw.id,
      color: normalizeHexColor(raw.color) ?? BUILTIN_DEFAULTS.color,
      opacity: Number.isFinite(opacity) ? clamp(opacity, 0, 1) : BUILTIN_DEFAULTS.opacity,
      scale: Number.isFinite(scale)
        ? clamp(scale, minScaleFor(raw.id, SCALE_RANGE.min), SCALE_RANGE.max)
        : BUILTIN_DEFAULTS.scale,
      seed: Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff ? seed : 1,
    };
  }

  return createDefaultPattern();
}

const finite = (value, fallback) => (Number.isFinite(Number(value)) ? Number(value) : fallback);
const mdWidth = (value) => clamp(finite(value, MD_WIDTH_RANGE.min), MD_WIDTH_RANGE.min, MD_WIDTH_RANGE.max);

function normalizeCharacter(c = {}) {
  const a = c.asset;
  const asset =
    a && typeof a.assetId === "string" && Number(a.width) > 0 && Number(a.height) > 0
      ? { assetId: a.assetId, name: String(a.name ?? "character"), type: String(a.type ?? ""), width: Number(a.width), height: Number(a.height) }
      : null;
  return asset
    ? { asset, x: finite(c.x, 0.2), y: finite(c.y, 0.9), width: mdWidth(c.width) }
    : { asset: null, x: 0, y: 0, width: 0 };
}

function normalizeMd(raw) {
  const base = createDefaultMd();
  if (!raw || typeof raw !== "object") return base;
  const k = raw.coaster ?? {};
  const placement = { x: finite(k.x, 0.2), y: finite(k.y, 0.9), width: mdWidth(k.width) };
  let coaster = { source: "none" };
  if (k.source === "file" && typeof k.file === "string" && k.file) coaster = { source: "file", file: k.file, ...placement };
  if (k.source === "plate") coaster = { source: "plate", plate: normalizePlate(k.plate, createCoasterPreset(1)), ...placement };
  return {
    character: normalizeCharacter(raw.character),
    coaster,
    viewport: normalizeViewport(raw.viewport),
    frame: normalizeFrame(raw.frame),
    decor: normalizeMdDecor(raw.decor),
    confetti: { back: normalizeConfetti(raw.confetti?.back, "back"), front: normalizeConfetti(raw.confetti?.front, "front") },
    linked: raw.linked !== false,
  };
}

function normalizeViewport(raw) {
  const base = createDefaultViewport();
  if (!raw || typeof raw !== "object") return base;
  const width = clamp(finite(raw.width, base.width), VIEWPORT_MIN, 1);
  const height = clamp(finite(raw.height, base.height), VIEWPORT_MIN, 1);
  return {
    x: clamp(finite(raw.x, base.x), 0, 1 - width),
    y: clamp(finite(raw.y, base.y), 0, 1 - height),
    width,
    height,
    clip: typeof raw.clip === "boolean" ? raw.clip : base.clip,
  };
}

function normalizeSd(raw) {
  const base = createDefaultSd();
  if (!raw || typeof raw !== "object") return base;
  const d = raw.doily ?? {};
  const doily = {
    plate: normalizePlate(d.plate, base.doily.plate),
    x: finite(d.x, base.doily.x),
    y: finite(d.y, base.doily.y),
    width: mdWidth(finite(d.width, base.doily.width)),
  };
  return {
    character: normalizeCharacter(raw.character),
    doily,
    tray: normalizeTray(raw.tray, createDefaultTray(doily)),
    linked: raw.linked !== false,
  };
}

const hex = (value, fallback) => normalizeHexColor(value) ?? fallback;
const within = (value, min, max, fallback) => clamp(finite(value, fallback), min, max);

const oneOf = (value, list, fallback) => (list.includes(value) ? value : fallback);
const safeFile = (value) => typeof value === "string" && value.length > 0 && !/[\\/]/.test(value) && value !== "." && value !== "..";

function normalizeFrame(raw) {
  const base = createDefaultFrame();
  if (!raw || typeof raw !== "object") return base;
  const fill = raw.fill ?? {};
  const b = raw.border ?? {};
  const bb = base.border;
  const fillColors = Array.isArray(fill.colors) ? fill.colors : [];
  return {
    visible: raw.visible === true,
    x: finite(raw.x, base.x),
    y: finite(raw.y, base.y),
    width: mdWidth(finite(raw.width, base.width)),
    aspect: within(raw.aspect, 0.2, 4, base.aspect),
    colorMode: raw.colorMode === "auto" ? "auto" : "manual",
    fit: { on: raw.fit?.on === true, padding: within(raw.fit?.padding, 0, 0.3, base.fit.padding) },
    shape: oneOf(raw.shape, FRAME_SHAPES, base.shape),
    radius: within(raw.radius, 0, 0.5, base.radius),
    fill: {
      type: oneOf(fill.type, FRAME_FILLS, base.fill.type),
      colors: [hex(fillColors[0], base.fill.colors[0]), hex(fillColors[1], base.fill.colors[1])],
      angle: within(fill.angle, -360, 360, base.fill.angle),
      stops: [within(fill.stops?.[0], 0, 1, 0), within(fill.stops?.[1], 0, 1, 1)],
    },
    border: {
      style: oneOf(b.style, BORDER_STYLES, bb.style),
      color: hex(b.color, bb.color),
      width: within(b.width, 0, 0.05, bb.width),
      multi: {
        count: Math.round(within(b.multi?.count, 1, 3, bb.multi.count)),
        gap: within(b.multi?.gap, 0, 0.2, bb.multi.gap),
        dashedInner: b.multi?.dashedInner === true,
        innerColor: hex(b.multi?.innerColor, bb.multi.innerColor),
        chamfer: within(b.multi?.chamfer, 0, 0.2, 0),
      },
      offset: { dx: within(b.offset?.dx, -0.3, 0.3, bb.offset.dx), dy: within(b.offset?.dy, -0.3, 0.3, bb.offset.dy) },
      molding: { width: within(b.molding?.width, 0, 0.2, bb.molding.width), color: hex(b.molding?.color, bb.molding.color) },
      mat: { width: within(b.mat?.width, 0, 0.2, bb.mat.width), color: hex(b.mat?.color, bb.mat.color) },
      scallop: { count: Math.round(within(b.scallop?.count, 6, 80, bb.scallop.count)), depth: within(b.scallop?.depth, 0, 0.1, bb.scallop.depth) },
      dots: { size: within(b.dots?.size, 0.002, 0.08, bb.dots.size), spacing: within(b.dots?.spacing, 0.005, 0.2, bb.dots.spacing) },
      stitch: { color: hex(b.stitch?.color, bb.stitch.color), dash: within(b.stitch?.dash, 0.002, 0.1, bb.stitch.dash) },
    },
  };
}

function normalizeConfetti(raw, layer) {
  const base = createDefaultConfetti(layer);
  if (!raw || typeof raw !== "object") return base;
  const k = raw.kinds ?? {};
  const seed = Number(raw.seed);
  return {
    on: raw.on === true,
    touched: raw.touched === true,
    x: finite(raw.x, base.x),
    y: finite(raw.y, base.y),
    width: mdWidth(finite(raw.width, base.width)),
    aspect: within(raw.aspect, 0.05, 4, base.aspect),
    size: within(raw.size, 0.002, 0.06, base.size),
    density: within(raw.density, 0, 2000, base.density),
    color: hex(raw.color, base.color),
    spread: within(raw.spread, 0, 1, base.spread),
    kinds: { curl: k.curl !== false, strip: k.strip !== false, dot: k.dot !== false, sparkle: k.sparkle !== false },
    seed: Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff ? seed : 1,
  };
}

function normalizePalette(raw) {
  const base = createDefaultPalette();
  if (!raw || typeof raw !== "object") return { ...base, visible: false };
  const chips = (Array.isArray(raw.chips) ? raw.chips : base.chips)
    .slice(0, 6)
    .map((c) => ({ id: typeof c?.id === "string" ? c.id.slice(0, 12) : "", name: typeof c?.name === "string" ? c.name.slice(0, 16) : "", hex: normalizeHexColor(c?.hex) ?? "#FFFFFF" }));
  while (chips.length < 3) chips.push({ id: "", name: "", hex: "#FFFFFF" });
  // v15: ids unique and present; missing / duplicate ones get the next free "c<n>"
  const used = new Set();
  let next = 1 + Math.max(0, ...chips.map((c) => (/^c\d+$/.test(c.id) ? Number(c.id.slice(1)) : 0)));
  for (const c of chips) {
    if (!/^c\d+$/.test(c.id) || used.has(c.id)) c.id = `c${next++}`;
    used.add(c.id);
  }
  return {
    visible: raw.visible === true,
    x: finite(raw.x, base.x),
    y: finite(raw.y, base.y),
    width: mdWidth(finite(raw.width, base.width)),
    aspect: within(raw.aspect, 0.3, 4, base.aspect),
    card: {
      fill: hex(raw.card?.fill, base.card.fill),
      border: hex(raw.card?.border, base.card.border),
      radius: within(raw.card?.radius, 0, 0.5, base.card.radius),
    },
    title: { ...normalizeText(raw.title, base.title, "receipt", false), text: typeof raw.title?.text === "string" ? raw.title.text.slice(0, 30) : base.title.text },
    text: normalizeText(raw.text, base.text, "receipt", false),
    chips,
  };
}

function normalizeMdDecor(raw) {
  const base = createDefaultMdDecor();
  if (!raw || typeof raw !== "object") return base;
  const c = raw.corners ?? {};
  const cornerType =
    c.type === "none" || CORNER_GLYPHS.includes(c.type) ||
    (typeof c.type === "string" && c.type.startsWith("builtin:") && CORNER_ORNAMENTS[c.type.slice(8)]) ||
    (typeof c.type === "string" && c.type.startsWith("file:") && safeFile(c.type.slice(5)))
      ? c.type
      : base.corners.type;
  const t = raw.top ?? {};
  const sw = raw.swirls ?? {};
  const bn = raw.banner ?? {};
  const bb = base.banner;
  return {
    corners: {
      type: cornerType,
      color: hex(c.color, base.corners.color),
      size: within(c.size, 0.005, 0.15, base.corners.size),
      inset: within(c.inset, -0.2, 0.2, base.corners.inset), // negative = outward (v11 presets)
    },
    top: {
      type: oneOf(t.type, TOP_TYPES, base.top.type),
      color: hex(t.color, base.top.color),
      color2: hex(t.color2, base.top.color2),
      size: within(t.size, 0.2, 3, base.top.size),
    },
    swirls: { visible: sw.visible === true, color: hex(sw.color, base.swirls.color), color2: hex(sw.color2, base.swirls.color2) },
    banner: {
      visible: bn.visible === true,
      text: typeof bn.text === "string" ? bn.text.slice(0, 40) : bb.text,
      font: normalizeFontId(bn.font, "brand"),
      letterSpacing: within(bn.letterSpacing, -0.2, 1, bb.letterSpacing),
      color: hex(bn.color, bb.color),
      back: hex(bn.back, bb.back),
      textColor: hex(bn.textColor, bb.textColor),
      bend: within(bn.bend, 0, 0.3, bb.bend),
      thickness: within(bn.thickness, 0.04, 0.3, bb.thickness),
      x: finite(bn.x, bb.x),
      y: finite(bn.y, bb.y),
      width: mdWidth(finite(bn.width, bb.width)),
    },
    outline: { on: raw.outline?.on !== false, color: hex(raw.outline?.color, base.outline.color) },
  };
}

function normalizeText(raw, base, usage, withEffect) {
  const r = raw ?? {};
  const out = {
    ...(Object.prototype.hasOwnProperty.call(base, "text") ? { text: typeof r.text === "string" ? r.text.slice(0, 40) : base.text } : {}),
    font: normalizeFontId(r.font ?? base.font, usage),
    color: hex(r.color, base.color),
    size: within(r.size, 0.005, 0.2, base.size),
    letterSpacing: within(r.letterSpacing, -0.2, 1, base.letterSpacing ?? 0),
  };
  if (withEffect) {
    out.effect = oneOf(r.effect, TEXT_EFFECTS, base.effect);
    out.effectColor = hex(r.effectColor, base.effectColor);
  }
  return out;
}

function normalizeCard(raw, chips) {
  const base = createDefaultCard();
  if (!raw || typeof raw !== "object") return base;
  const fill = raw.fill ?? {};
  const fillColors = Array.isArray(fill.colors) ? fill.colors : [];
  const img = raw.image ?? {};
  const a = img.asset;
  const asset =
    a && typeof a.assetId === "string" && Number(a.width) > 0 && Number(a.height) > 0
      ? { assetId: a.assetId, name: String(a.name ?? "cocktail"), type: String(a.type ?? ""), width: Number(a.width), height: Number(a.height) }
      : null;
  const list = raw.list ?? {};
  const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
  const ingredients = (Array.isArray(raw.ingredients) ? raw.ingredients : base.ingredients).slice(0, CARD_LIMITS.ingredients).map((it) => ({
    name: str(it?.name, CARD_LIMITS.name),
    amount: str(it?.amount, CARD_LIMITS.amount),
    checked: it?.checked === true, // user-controlled only; never inferred
  }));
  const garnish = (Array.isArray(raw.garnish) ? raw.garnish : []).slice(0, CARD_LIMITS.garnish).map((it) => ({
    name: str(it?.name, CARD_LIMITS.name),
    checked: it?.checked === true,
  }));
  return {
    visible: raw.visible === true,
    x: finite(raw.x, base.x),
    y: finite(raw.y, base.y),
    width: mdWidth(finite(raw.width, base.width)),
    aspect: within(raw.aspect, 0.3, 1.2, base.aspect),
    sizing: raw.sizing === "fixed" ? "fixed" : "content",
    radius: within(raw.radius, 0, 0.3, base.radius),
    border: { color: hex(raw.border?.color, base.border.color), width: within(raw.border?.width, 0, 0.03, base.border.width) },
    fill: {
      type: oneOf(fill.type, FRAME_FILLS, base.fill.type),
      colors: [hex(fillColors[0], base.fill.colors[0]), hex(fillColors[1], base.fill.colors[1])],
      angle: within(fill.angle, -360, 360, base.fill.angle),
    },
    coating: { on: raw.coating?.on !== false, strength: within(raw.coating?.strength, 0, 1, base.coating.strength) },
    title: normalizeText(raw.title, base.title, "brand", true),
    image: {
      asset,
      scale: within(img.scale, 0.1, 5, 1),
      slot: within(img.slot, 0.18, 0.45, 0.3),
      dx: within(img.dx, -1, 1, 0),
      dy: within(img.dy, -1, 1, 0),
      frame: { on: img.frame?.on !== false, color: hex(img.frame?.color, base.image.frame.color) },
      source: img.source === "builder" ? "builder" : "upload",
    },
    builder: normalizeBuilder(raw.builder, chips),
    ingredients,
    garnish,
    list: {
      ...normalizeText(list, { font: base.list.font, color: base.list.color, size: base.list.size, letterSpacing: 0 }, "receipt", false),
      leader: { on: list.leader?.on !== false, color: hex(list.leader?.color, base.list.leader.color) },
      checkboxes: list.checkboxes !== false,
      wrap: list.wrap === true,
      brackets: { on: list.brackets?.on !== false, color: hex(list.brackets?.color, base.list.brackets.color) },
    },
    divider: { on: raw.divider?.on !== false, color: hex(raw.divider?.color, base.divider.color), dashed: raw.divider?.dashed === true },
    name: normalizeText(raw.name, base.name, "cocktailName", true),
    barcode: { on: raw.barcode?.on !== false, color: hex(raw.barcode?.color, base.barcode.color) },
    hex: {
      font: normalizeFontId(raw.hex?.font ?? base.hex.font, "receipt"),
      color: hex(raw.hex?.color, base.hex.color),
      size: within(raw.hex?.size, 0.005, 0.1, base.hex.size),
    },
  };
}

function normalizeReceipt(raw, barcodeSeed) {
  const base = createDefaultReceipt();
  if (!raw || typeof raw !== "object") return { ...base, visible: false };
  const str = (v, max, fallback = "") => (typeof v === "string" ? v.slice(0, max) : fallback);
  const block = (r, b, usage) => ({ ...normalizeText(r, b, usage, false), text: str(r?.text, 60, b.text) });
  const code = raw.code ?? {};
  // 8-digit STRING (leading zeros kept). Invalid → deterministic fallback from the barcode seed.
  const random = typeof code.random === "string" && /^\d{8}$/.test(code.random)
    ? code.random
    : String((barcodeSeed >>> 0) % 100000000).padStart(8, "0");
  const anniversary = typeof code.anniversary === "string" && isValidAnniversary(code.anniversary) ? code.anniversary : "";
  const sections = (Array.isArray(raw.sections) ? raw.sections : []).slice(0, RECEIPT_LIMITS.sections).map((s, i) => {
    const kind = s?.kind === "playlist" ? "playlist" : "list";
    const items = Array.isArray(s?.items) ? s.items : [];
    return {
      id: typeof s?.id === "string" && /^[\w-]{1,40}$/.test(s.id) ? s.id : `sec-${i}`,
      kind,
      title: str(s?.title, RECEIPT_LIMITS.text),
      items:
        kind === "playlist"
          ? items.slice(0, RECEIPT_LIMITS.playlist).map((it) => ({
              artist: str(it?.artist, RECEIPT_LIMITS.text),
              song: str(it?.song, RECEIPT_LIMITS.text),
              duration: str(it?.duration, RECEIPT_LIMITS.value),
            }))
          : items.slice(0, RECEIPT_LIMITS.items).map((it) => ({ text: str(it?.text, RECEIPT_LIMITS.text), value: str(it?.value, RECEIPT_LIMITS.value) })),
    };
  });
  const board = raw.board ?? {};
  const paper = raw.paper ?? {};
  const body = raw.body ?? {};
  return {
    visible: raw.visible === true,
    x: finite(raw.x, base.x),
    y: finite(raw.y, base.y),
    width: mdWidth(finite(raw.width, base.width)),
    aspect: within(raw.aspect, 0.5, 4, base.aspect),
    board: {
      style: board.style === "none" ? "none" : "clipboard",
      color: hex(board.color, base.board.color),
      border: within(board.border, 0, 0.05, base.board.border),
      clipColor: hex(board.clipColor, base.board.clipColor),
    },
    paper: {
      color: hex(paper.color, base.paper.color),
      inset: within(paper.inset, 0, 0.3, base.paper.inset),
      top: within(paper.top, 0, 0.5, base.paper.top),
      edge: paper.edge === "straight" ? "straight" : "zigzag",
      lineColor: hex(paper.lineColor, base.paper.lineColor),
    },
    title: block(raw.title, base.title, "brand"),
    subtitle: block(raw.subtitle, base.subtitle, "receipt"),
    header: {
      date: str(raw.header?.date, 20, base.header.date),
      client: str(raw.header?.client, 30, base.header.client),
      server: str(raw.header?.server, 30, base.header.server),
    },
    body: {
      ...normalizeText(body, { font: base.body.font, color: base.body.color, size: base.body.size, letterSpacing: 0 }, "receipt", false),
      leaderColor: hex(body.leaderColor, base.body.leaderColor),
    },
    sections,
    barcode: { on: raw.barcode?.on !== false, color: hex(raw.barcode?.color, base.barcode.color) },
    code: {
      anniversary,
      random,
      font: normalizeFontId(code.font ?? base.code.font, "receipt"),
      color: hex(code.color, base.code.color),
      size: within(code.size, 0.005, 0.2, base.code.size),
    },
    footer: block(raw.footer, base.footer, "receipt"),
  };
}

function normalizeSheetColors(raw) {
  const base = createDefaultSheetColors();
  const out = {};
  for (const role of COLOR_ROLES) out[role] = hex(raw?.[role], base[role]);
  return out;
}

function normalizeStickers(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const out = [];
  for (const st of raw.slice(0, 200)) {
    if (!st || typeof st !== "object") continue;
    const source = st.source === "file" ? "file" : "builtin";
    if (source === "builtin" && !getBuiltinSticker(st.builtin)) continue;
    if (source === "file" && !safeFile(st.file)) continue;
    let id = typeof st.id === "string" && /^[\w-]{1,40}$/.test(st.id) ? st.id : null;
    for (let n = out.length; !id || seen.has(id); n += 1) id = `sticker-${n}`; // deterministic repair
    seen.add(id);
    out.push({
      id,
      source,
      builtin: source === "builtin" ? st.builtin : null,
      file: source === "file" ? st.file : null,
      x: finite(st.x, 0.5),
      y: finite(st.y, 0.5),
      width: mdWidth(finite(st.width, 0.08)),
      rotation: within(st.rotation, -180, 180, 0),
      flipX: st.flipX === true,
      opacity: within(st.opacity, 0, 1, 1),
      color: hex(st.color, "#C7A4D8"),
      tint: st.tint === true,
      layer: st.layer === "back" ? "back" : "front",
      themeRole: ["accent", "accent2", "ink"].includes(st.themeRole) ? st.themeRole : "accent",
    });
  }
  return out;
}

function normalizeTray(raw, base) {
  if (!raw || typeof raw !== "object") return base;
  const colors = raw.colors ?? {};
  return {
    visible: raw.visible === true,
    x: finite(raw.x, base.x),
    y: finite(raw.y, base.y),
    width: mdWidth(finite(raw.width, base.width)),
    aspect: within(raw.aspect, 0.2, 2, base.aspect),
    shape: TRAY_SHAPES.includes(raw.shape) ? raw.shape : base.shape,
    radius: within(raw.radius, 0, 0.5, base.radius),
    colors: { fill: hex(colors.fill, base.colors.fill), border: hex(colors.border, base.colors.border) },
    border: within(raw.border, 0, 0.05, base.border),
    rim: {
      style: raw.rim?.style === "reflect" ? "reflect" : "solid",
      strength: within(raw.rim?.strength, 0, 1, base.rim.strength),
      light: hex(raw.rim?.light, base.rim.light),
    },
  };
}

function normalizeBrand(raw) {
  const base = createDefaultBrand();
  if (!raw || typeof raw !== "object") return base;
  const lines = Array.isArray(raw.lines) ? raw.lines.slice(0, 2).map((l) => String(l ?? "").slice(0, 40)) : base.lines;
  while (lines.length < 2) lines.push("");
  return {
    visible: raw.visible === true,
    lines,
    color: hex(raw.color, base.color),
    font: normalizeFontId(raw.font, "brand"),
    colorMode: raw.colorMode === "auto" ? "auto" : "manual",
    letterSpacing: within(raw.letterSpacing, -0.2, 1, base.letterSpacing),
    lineHeight: within(raw.lineHeight, 0.6, 2.5, base.lineHeight),
    outline: {
      visible: raw.outline?.visible === true,
      width: within(raw.outline?.width, 0, 0.2, base.outline.width),
      color: hex(raw.outline?.color, base.outline.color),
    },
    x: finite(raw.x, base.x),
    y: finite(raw.y, base.y),
    width: mdWidth(finite(raw.width, base.width)),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function validateDesign(design) {
  if (!Number.isInteger(design.width) || design.width <= 0) throw new Error(STRINGS.errors.invalidWidth);
  if (!Number.isInteger(design.height) || design.height <= 0) throw new Error(STRINGS.errors.invalidHeight);
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// v14 sheet background: type / direction validated, 2–8 stops, pos clamped to 0–1 and sorted,
// colors normalized. Anything unusable falls back to a solid background of backgroundColor.
function normalizeBackground(raw, solidColor) {
  const fallback = createDefaultBackground(solidColor);
  if (!raw || typeof raw !== "object") return fallback;
  const stops = (Array.isArray(raw.stops) ? raw.stops : [])
    .map((st) => ({ pos: Number(st?.pos), color: normalizeHexColor(st?.color) }))
    .filter((st) => Number.isFinite(st.pos) && st.color)
    .map((st) => ({ pos: Math.min(1, Math.max(0, st.pos)), color: st.color }))
    .sort((a, b) => a.pos - b.pos)
    .slice(0, BG_STOP_LIMITS.max);
  return {
    type: raw.type === "linear" && stops.length >= BG_STOP_LIMITS.min ? "linear" : "solid",
    direction: BG_DIRECTIONS.includes(raw.direction) ? raw.direction : "topToBottom",
    stops: stops.length >= BG_STOP_LIMITS.min ? stops : fallback.stops,
  };
}

// v15 Cocktail Builder. Glass params are a SNAPSHOT: validated against the family schema, never replaced
// by the live preset. Colors keep { ref, color }; stops 1–3 sorted; seeds kept (integers).
function normalizeBuilder(raw, chips) {
  const base = createDefaultBuilder(chips);
  if (!raw || typeof raw !== "object") return base;
  const color = (c, fb) => ({ ref: typeof c?.ref === "string" ? c.ref.slice(0, 12) : null, color: hex(c?.color, fb) });
  const g = raw.glass ?? {};
  const family = GLASS_FAMILIES.includes(g.family) ? g.family : null;
  let glass = base.glass;
  if (family) {
    const src = g.baseParams ?? {};
    const baseParams = {};
    for (const [k, [lo, hi, def]] of Object.entries(PARAM_SCHEMA[family])) baseParams[k] = within(src[k], lo, hi, def);
    if (family === "tumbler") baseParams.facetLines = Math.round(baseParams.facetLines);
    else baseParams.bowl = BOWL_TYPES.includes(src.bowl) ? src.bowl : "cone";
    let heightMap = null;
    if (family === "stemmed") {
      const b = within(g.heightMap?.bowl, 0, 1, 0.5);
      const st = within(g.heightMap?.stem, 0, 1, 0.5);
      const sum = b + st || 1;
      heightMap = { bowl: b / sum, stem: st / sum };
    }
    glass = {
      preset: typeof g.preset === "string" && PRESETS[g.preset] ? g.preset : null,
      family,
      baseParams,
      heightMap,
      height: within(g.height, HEIGHT_RANGE.min, HEIGHT_RANGE.max, 1),
    };
  } else if (typeof g.preset === "string" && PRESETS[g.preset]) {
    glass = glassFromPreset(g.preset, within(g.height, HEIGHT_RANGE.min, HEIGHT_RANGE.max, 1));
  }
  const stops = (Array.isArray(raw.liquid?.stops) ? raw.liquid.stops : [])
    .slice(0, 3)
    .map((st) => ({ ...color(st, "#FFFFFF"), pos: within(st?.pos, 0, 1, 0) }))
    .sort((a, b) => a.pos - b.pos);
  const seed = (v, fb) => (Number.isInteger(v) && v >= 0 ? v >>> 0 : fb);
  return {
    glass,
    scale: within(raw.scale, 0.5, 1, base.scale),
    liquid: { level: within(raw.liquid?.level, 0, 1, base.liquid.level), stops: stops.length ? stops : base.liquid.stops },
    ice: {
      type: raw.ice?.type === "cubes" ? "cubes" : "none",
      count: Math.round(within(raw.ice?.count, 1, 4, base.ice.count)),
      seed: seed(raw.ice?.seed, base.ice.seed),
    },
    rim: {
      type: ["salt", "sugar"].includes(raw.rim?.type) ? raw.rim.type : "none",
      color: color(raw.rim?.color, "#FFFFFF"),
      seed: seed(raw.rim?.seed, base.rim.seed),
    },
    // 1b. A 1a file has no garnish → [] (unchanged look). Defensive guard only (12), not a product cap.
    garnish: (Array.isArray(raw.garnish) ? raw.garnish : []).slice(0, 12).map((g) => ({
      char: firstGrapheme(g?.char),
      u: within(g?.u, 0, 1, 0.5),
      size: ["S", "M", "L"].includes(g?.size) ? g.size : "M",
      rotation: within(g?.rotation, -180, 180, 0),
    })).filter((g) => g.char),
  };
}

function firstGrapheme(value) {
  if (typeof value !== "string" || !value) return "";
  const seg = typeof Intl !== "undefined" && Intl.Segmenter ? new Intl.Segmenter("ko", { granularity: "grapheme" }) : null;
  const first = seg ? seg.segment(value)[Symbol.iterator]().next().value?.segment : [...value][0];
  return (first ?? "").slice(0, 16);
}
