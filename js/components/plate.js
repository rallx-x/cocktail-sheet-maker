import { getBuiltinPattern, minScaleFor } from "../patterns/builtin.js";
import { SCALE_RANGE, normalizeHexColor } from "../state.js";
import { fontCss, normalizeFontId } from "../fonts.js";
import { DECOR_MAX_GRAPHEMES, layoutDecor, splitGraphemes } from "./decor-path.js";

// Procedural "plate": shared by the MD coaster and the SD doily.
// An OUTER zone (silhouette + optional perforations) and an INNER zone (fill + optional
// built-in pattern), split by an inner ring line.
//
//   edge.style = outer SILHOUETTE only; `lace` = perforations only. Independent on purpose.
//   Inner pattern size is relative to the PLATE width (not the sheet), so resizing a plate
//   keeps its look. Randomness comes only from plate.pattern.seed (local rng per render).

export const EDGE_STYLES = ["smooth", "wave", "lace", "zigzag", "petal", "ruffle", "spike", "notch"];

export const PLATE_LIMITS = {
  aspect: [0.2, 1],
  edgeCount: [6, 64],
  edgeDepth: [0, 0.25],
  ringRatio: [0.3, 0.95],
  ringWidth: [0, 0.03],
  decorSize: [0.01, 0.2], // fraction of plate width
  decorOffset: [-0.6, 0.6], // fraction of the plate half-width, outward positive
  decorStart: [-180, 180], // degrees, −90 = top
  decorSpacing: [-0.2, 1], // fraction of glyph size
};

export function createDefaultDecor() {
  return { text: "", font: "system", color: "#C7A4D8", size: 0.07, offset: 0.12, start: -90, spacing: 0.15 };
}

// Pattern cell = baseSize × plate width × scale × this factor (baseSize was tuned for a
// full 4000 px sheet; plates are much smaller, so the factor keeps default cells readable).
const PLATE_PATTERN_FACTOR = 1.6;

export function createCoasterPreset(seed) {
  return {
    aspect: 0.35,
    edge: { style: "smooth", count: 24, depth: 0.06 },
    lace: false,
    ring: { ratio: 0.82, width: 0.012 },
    colors: { outer: "#FAE2BE", inner: "#FAE2BE", line: "#F0A05A" },
    pattern: { id: null, color: "#F0A05A", opacity: 0.35, scale: 1, seed },
    decor: createDefaultDecor(),
  };
}

export function createDoilyPreset(seed) {
  return {
    aspect: 1,
    edge: { style: "lace", count: 28, depth: 0.07 },
    lace: true,
    ring: { ratio: 0.7, width: 0.006 },
    colors: { outer: "#FFFFFF", inner: "#FFFFFF", line: "#E4DCEB" },
    pattern: { id: null, color: "#D9C8E8", opacity: 0.35, scale: 1, seed },
    decor: createDefaultDecor(),
  };
}

// Plate design sync: everything except geometry (aspect) and pattern.seed.
// x / y / width live on the owning component, not on the plate, so they never sync.
export function copyPlateDesign(from, to) {
  to.edge = structuredClone(from.edge);
  to.lace = from.lace;
  to.ring = structuredClone(from.ring);
  to.colors = structuredClone(from.colors);
  to.pattern = { ...structuredClone(from.pattern), seed: to.pattern.seed };
  to.decor = structuredClone(from.decor);
}

// State boundary: every numeric field clamped, every color normalized, unknown ids dropped.
export function normalizePlate(raw, fallback) {
  const base = fallback;
  if (!raw || typeof raw !== "object") return structuredClone(base);
  const num = (value, [min, max], def) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : def;
  };
  const color = (value, def) => normalizeHexColor(value) ?? def;
  const edge = raw.edge ?? {};
  const ring = raw.ring ?? {};
  const colors = raw.colors ?? {};
  const pattern = raw.pattern ?? {};
  const patternId = getBuiltinPattern(pattern.id) ? pattern.id : null;
  const seed = Number(pattern.seed);
  const decor = raw.decor ?? {};
  const decorBase = base.decor ?? createDefaultDecor();

  return {
    aspect: num(raw.aspect, PLATE_LIMITS.aspect, base.aspect),
    edge: {
      style: EDGE_STYLES.includes(edge.style) ? edge.style : base.edge.style,
      count: Math.round(num(edge.count, PLATE_LIMITS.edgeCount, base.edge.count)),
      depth: num(edge.depth, PLATE_LIMITS.edgeDepth, base.edge.depth),
    },
    lace: raw.lace === true,
    ring: {
      ratio: num(ring.ratio, PLATE_LIMITS.ringRatio, base.ring.ratio),
      width: num(ring.width, PLATE_LIMITS.ringWidth, base.ring.width),
    },
    colors: {
      outer: color(colors.outer, base.colors.outer),
      inner: color(colors.inner, base.colors.inner),
      line: color(colors.line, base.colors.line),
    },
    pattern: {
      id: patternId,
      color: color(pattern.color, base.pattern.color),
      opacity: num(pattern.opacity, [0, 1], base.pattern.opacity),
      scale: num(
        pattern.scale,
        [patternId ? minScaleFor(patternId, SCALE_RANGE.min) : SCALE_RANGE.min, SCALE_RANGE.max],
        base.pattern.scale,
      ),
      seed: Number.isInteger(seed) && seed >= 0 && seed <= 0xffffffff ? seed : base.pattern.seed,
    },
    decor: {
      text: typeof decor.text === "string" ? splitGraphemes(decor.text).slice(0, DECOR_MAX_GRAPHEMES).join("") : "",
      font: normalizeFontId(decor.font, "decor"),
      color: color(decor.color, decorBase.color),
      size: num(decor.size, PLATE_LIMITS.decorSize, decorBase.size),
      offset: num(decor.offset, PLATE_LIMITS.decorOffset, decorBase.offset),
      start: num(decor.start, PLATE_LIMITS.decorStart, decorBase.start),
      spacing: num(decor.spacing, PLATE_LIMITS.decorSpacing, decorBase.spacing),
    },
  };
}

// Center-anchored rect in design px. width = plate width / design width (R5).
export function plateRect(item, designWidth, designHeight) {
  const w = item.width * designWidth;
  const h = w * item.plate.aspect;
  return { x: item.x * designWidth - w / 2, y: item.y * designHeight - h / 2, w, h };
}

// Unit radius of the silhouette at angle θ (1 = outermost point).
export function edgeRadius(edge, theta) {
  const { style, count, depth } = edge;
  if (style === "wave") return 1 - depth * (0.5 - 0.5 * Math.cos(count * theta));
  if (style === "lace") return 1 - depth * (1 - Math.abs(Math.cos((count * theta) / 2))); // round scallops
  const t = (count * theta) / (Math.PI * 2);
  const frac = t - Math.floor(t); // 0..1 within one repeat
  if (style === "zigzag") return 1 - depth * Math.abs(2 * frac - 1);
  // Broad rounded lobes with sharp valleys.
  if (style === "petal") return 1 - depth * (1 - Math.abs(Math.cos((count * theta) / 2)) ** 0.45);
  // Two fixed harmonics (no rng): gathered-fabric look. Normalized to [0, 1].
  if (style === "ruffle") {
    const v = 0.5 + 0.3 * Math.cos(count * theta) + 0.2 * Math.cos(2 * count * theta + 1.3);
    return 1 - depth * (1 - Math.min(1, Math.max(0, v)));
  }
  // Thin outward spikes, flat valleys.
  if (style === "spike") return 1 - depth * (1 - (1 - Math.abs(2 * frac - 1)) ** 4);
  // Ticket-style semicircular bites centered on each repeat; smooth elsewhere.
  if (style === "notch") {
    const d = Math.abs(frac - 0.5) / 0.18;
    return d >= 1 ? 1 : 1 - depth * Math.sqrt(1 - d * d);
  }
  return 1;
}

function tracePlateEdge(ctx, plate, cx, cy, rx, ry) {
  const steps = plate.edge.style === "smooth" ? 180 : Math.max(360, plate.edge.count * 32);
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const theta = (i / steps) * Math.PI * 2;
    const r = edgeRadius(plate.edge, theta);
    const x = cx + rx * r * Math.cos(theta);
    const y = cy + ry * r * Math.sin(theta);
    if (i) ctx.lineTo(x, y);
    else ctx.moveTo(x, y);
  }
  ctx.closePath();
}

// The inner ring sits inside the silhouette's deepest point, so it never crosses the edge.
function innerRadii(plate, rx, ry) {
  const k = plate.ring.ratio * (1 - plate.edge.depth);
  return { irx: rx * k, iry: ry * k };
}

function traceLaceHoles(ctx, plate, cx, cy, rx, ry) {
  const { irx } = innerRadii(plate, rx, ry);
  const inner = irx / rx; // unit radius of the ring
  const outer = 1 - plate.edge.depth; // deepest point of the silhouette
  const band = outer - inner;
  if (band <= 0.02) return;
  const rows = [
    { at: inner + band * 0.32, size: band * 0.16, count: plate.edge.count * 2, phase: 0.5 },
    { at: inner + band * 0.7, size: band * 0.22, count: plate.edge.count, phase: 0 },
  ];
  for (const row of rows) {
    for (let i = 0; i < row.count; i += 1) {
      const theta = ((i + row.phase) / row.count) * Math.PI * 2;
      const hx = cx + rx * row.at * Math.cos(theta);
      const hy = cy + ry * row.at * Math.sin(theta);
      ctx.moveTo(hx + rx * row.size, hy);
      ctx.ellipse(hx, hy, rx * row.size, ry * row.size, 0, 0, Math.PI * 2);
    }
  }
}

/**
 * Draws a plate into `ctx` (which carries the sheet transform: design px × renderScale).
 * Works on a bbox-sized scratch layer (padded by the ring stroke and an anti-alias margin),
 * so perforations cut only the plate and export memory stays bounded. No await inside.
 */
export function drawPlate(ctx, plate, rect, renderScale) {
  const decor = plate.decor;
  const hasDecor = Boolean(decor?.text);
  const decorPad = hasDecor ? Math.max(0, decor.offset) * (rect.w / 2) + decor.size * rect.w * 1.5 : 0;
  const pad = plate.ring.width * rect.w + decorPad + 4 / renderScale;
  const bx = rect.x - pad;
  const by = rect.y - pad;
  const bw = rect.w + pad * 2;
  const bh = rect.h + pad * 2;
  const layer = createLayer(bw * renderScale, bh * renderScale);
  const lctx = layer.ctx;
  // Layer coordinates = design px (same as the sheet), offset to the bbox.
  lctx.setTransform(renderScale, 0, 0, renderScale, -bx * renderScale, -by * renderScale);

  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const rx = rect.w / 2;
  const ry = rect.h / 2;
  const { irx, iry } = innerRadii(plate, rx, ry);

  // Outer zone
  tracePlateEdge(lctx, plate, cx, cy, rx, ry);
  lctx.fillStyle = plate.colors.outer;
  lctx.fill();

  // Inner zone
  lctx.beginPath();
  lctx.ellipse(cx, cy, irx, iry, 0, 0, Math.PI * 2);
  lctx.fillStyle = plate.colors.inner;
  lctx.fill();

  // Inner pattern, clipped to the inner zone, composited once with its opacity
  const def = plate.pattern.id ? getBuiltinPattern(plate.pattern.id) : null;
  if (def && plate.pattern.opacity > 0) {
    const pw = irx * 2;
    const ph = iry * 2;
    const patternLayer = createLayer(pw * renderScale, ph * renderScale);
    const pctx = patternLayer.ctx;
    pctx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
    pctx.fillStyle = plate.pattern.color;
    pctx.strokeStyle = plate.pattern.color;
    pctx.lineCap = "butt";
    pctx.beginPath();
    const scale = Math.max(plate.pattern.scale, minScaleFor(def.id, SCALE_RANGE.min));
    def.draw(pctx, {
      width: pw,
      height: ph,
      cell: def.baseSize * rect.w * scale * PLATE_PATTERN_FACTOR,
      seed: plate.pattern.seed,
      color: plate.pattern.color,
    });

    lctx.save();
    lctx.beginPath();
    lctx.ellipse(cx, cy, irx, iry, 0, 0, Math.PI * 2);
    lctx.clip();
    lctx.globalAlpha = plate.pattern.opacity;
    lctx.drawImage(patternLayer.canvas, cx - irx, cy - iry, pw, ph);
    lctx.restore();
  }

  // Ring line
  if (plate.ring.width > 0) {
    lctx.beginPath();
    lctx.ellipse(cx, cy, irx, iry, 0, 0, Math.PI * 2);
    lctx.lineWidth = plate.ring.width * rect.w;
    lctx.strokeStyle = plate.colors.line;
    lctx.stroke();
  }

  // Perforations (outer zone only)
  if (plate.lace) {
    lctx.save();
    lctx.globalCompositeOperation = "destination-out";
    lctx.beginPath();
    traceLaceHoles(lctx, plate, cx, cy, rx, ry);
    lctx.fill();
    lctx.restore();
  }

  // Curved decor: follows THIS plate's own ellipse; drawn after perforations so holes never cut it.
  if (hasDecor) drawDecor(lctx, decor, cx, cy, rx, ry, rect.w);

  ctx.drawImage(layer.canvas, bx, by, bw, bh);
}

function drawDecor(ctx, decor, cx, cy, rx, ry, plateWidth) {
  const size = decor.size * plateWidth;
  const glyphs = splitGraphemes(decor.text);
  ctx.save();
  ctx.font = fontCss(decor.font, size);
  ctx.fillStyle = decor.color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const widths = glyphs.map((g) => ctx.measureText(g).width);
  const d = decor.offset * rx; // same absolute gap on both axes ≈ parallel curve
  const placements = layoutDecor(widths, rx + d, ry + d, decor.start, decor.spacing * size);
  placements.forEach((p, i) => {
    ctx.save();
    ctx.translate(cx + p.x, cy + p.y);
    ctx.rotate(p.rotation);
    ctx.fillText(glyphs[i], 0, 0);
    ctx.restore();
  });
  ctx.restore();
}

function createLayer(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  const layerCtx = canvas.getContext("2d");
  layerCtx.imageSmoothingEnabled = true;
  layerCtx.imageSmoothingQuality = "high";
  return { canvas, ctx: layerCtx };
}
