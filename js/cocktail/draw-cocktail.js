import { buildGlass } from "./glasses.js";
import { createRng } from "../patterns/prng.js";

// Cocktail Builder renderer (v15, Phase 1a): liquid → ice → glass → rim, drawn into the Card image slot.
// Pure function of state (+ the palette chips for color refs): preview, thumbnails and export share it.

// Builder colors are { ref, color }: a resolvable palette ref wins (the palette is the source of truth);
// the cached color is the fallback when the chip no longer exists (or ref is null = custom color).
export function resolveColor(c, chips) {
  if (c?.ref) {
    const chip = chips?.find((ch) => ch.id === c.ref);
    if (chip) return chip.hex;
  }
  return c?.color ?? "#FFFFFF";
}

// Glass placement: bottom-center anchor, uniform contain-fit of the glass bounds, then 잔 크기 (scale).
// (1b will add the garnish bounds to this solve.)
// 1b: with garnish, the scale is solved around the FIXED bottom-center anchor so that every garnish's
// circumscribed circle (rotation-independent) fits under the slot top; no garnish → plain contain.
// The rim is horizontal, so this depends on size only — never on u (no "breathing" while sliding).
// Horizontal overflow is handled by stopping the garnish at the slot edge (drawGarnish), not by shrinking
// the glass: the stress check showed up to 38% shrink on wide glasses with an L garnish at a rim end.
export function cocktailFit(builder, slot, geo = buildGlass(builder.glass)) {
  const padX = slot.w * 0.06;
  const padB = slot.h * 0.05;
  const padT = slot.h * 0.05;
  const ox = slot.x + slot.w / 2;
  const oy = slot.y + slot.h - padB;
  let s = Math.min((slot.w - 2 * padX) / geo.bounds.w, (slot.h - padB - padT) / geo.bounds.h) * (builder.scale ?? 1);
  for (const g of builder.garnish ?? []) {
    const c = garnishUnit(g, geo);
    const top = c.y - c.r; // unit space, negative = above the anchor
    if (top < 0) s = Math.min(s, (oy - slot.y - 4) / -top); // may use the top padding (not the frame line)
  }
  return { s, ox, oy, geo, padX };
}

// Garnish: always on the rim; u = 0–1 along the rim; 3 size steps as a fraction of the rim width.
export const GARNISH_SIZES = { S: 0.3, M: 0.42, L: 0.56 };
// The COLOR MONA pixel emoji (declared in css/fonts.css; the glyphs carry their own colors).
export const GARNISH_FONT = '"TDAD Test Color Emoji"';
const GRID = 12; // MONA pixel grid (px per glyph at 1×)
function garnishUnit(g, geo) {
  const size = (GARNISH_SIZES[g.size] ?? GARNISH_SIZES.M) * geo.rim.rx * 2; // glyph height, unit space
  // the garnish straddles the rim (center just above the lip); r = the glyph's real rotation-independent
  // radius (farthest opaque pixel from its center), so the fit reserves only what the art actually needs
  return { x: geo.rim.cx + (g.u * 2 - 1) * geo.rim.rx, y: geo.rim.cy - size * 0.1, r: size * glyphRadius(g.char) * 1.1, size }; // +10%: the size snaps to whole 12px steps
}

export function drawCocktail(ctx, builder, slot, { ink = "#3A2E3F", chips = [] } = {}) {
  const { s, ox, oy, geo, padX } = cocktailFit(builder, slot);
  const lw = Math.max(slot.w * 0.012, 0.5) / s; // line width in unit space
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(s, s);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // glass body tint
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fill(geo.shell);
  if (geo.stemShell) ctx.fill(geo.stemShell);

  const { bottom, top } = geo.fillRange;
  const level = Math.min(1, Math.max(0, builder.liquid.level));
  const surface = bottom - level * (bottom - top);

  ctx.save();
  ctx.clip(geo.interior);
  // liquid: gradient over the LIQUID body (pos 0 = 바닥, 1 = 표면)
  if (level > 0) {
    const stops = [...builder.liquid.stops].sort((a, b) => a.pos - b.pos);
    let fill;
    if (stops.length === 1) fill = resolveColor(stops[0], chips);
    else {
      fill = ctx.createLinearGradient(0, bottom, 0, surface);
      for (const st of stops) fill.addColorStop(Math.min(1, Math.max(0, st.pos)), resolveColor(st, chips));
    }
    ctx.fillStyle = fill;
    ctx.fillRect(-10, surface, 20, bottom - surface + 1);
    ctx.strokeStyle = "rgba(255,255,255,0.5)"; // surface line
    ctx.lineWidth = lw * 0.8;
    ctx.beginPath();
    ctx.moveTo(-10, surface);
    ctx.lineTo(10, surface);
    ctx.stroke();
  }
  if (builder.ice.type === "cubes") drawIce(ctx, builder.ice, geo, surface, level, lw);
  // soft glass highlight
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = lw * 1.4;
  const hx = -geo.rim.rx * 0.55;
  ctx.beginPath();
  ctx.moveTo(hx, geo.rim.cy + (bottom - geo.rim.cy) * 0.15);
  ctx.lineTo(hx * 0.85, geo.rim.cy + (bottom - geo.rim.cy) * 0.55);
  ctx.stroke();
  ctx.restore();

  // glass lines in the card ink
  ctx.strokeStyle = ink;
  ctx.lineWidth = lw;
  if (geo.facets.length) {
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = lw * 0.6;
    for (const [x0, y0, x1, y1] of geo.facets) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.stroke(geo.outline);
  ctx.stroke(geo.extras);
  if (geo.stemHighlight) {
    // a glass-rod reflection on the stem
    const h = geo.stemHighlight;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = lw * 0.7;
    ctx.beginPath();
    ctx.moveTo(h.x, h.y0);
    ctx.lineTo(h.x, h.y1);
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.ellipse(geo.rim.cx, geo.rim.cy, geo.rim.rx, geo.rim.ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (builder.rim.type !== "none") drawRim(ctx, builder.rim, geo, lw, resolveColor(builder.rim.color, chips));
  ctx.restore();

  // garnish: topmost layer, drawn in design px so the MONA pixels stay crisp
  const xRange = [slot.x + padX, slot.x + slot.w - padX];
  for (const g of builder.garnish ?? []) drawGarnish(ctx, g, geo, s, ox, oy, xRange);
}

// A MONA color glyph rasterized once at its native 12px grid, cached per char.
// Only cached once the font is actually available, so an early render never poisons the cache.
const glyphCache = new Map();
function glyph(char) {
  const key = char;
  if (glyphCache.has(key)) return glyphCache.get(key);
  const c = document.createElement("canvas");
  c.width = c.height = GRID + 4;
  const x = c.getContext("2d");
  x.font = `${GRID}px ${GARNISH_FONT}, sans-serif`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillStyle = "#3A2E3F"; // only used by a glyph without color layers
  x.fillText(char, c.width / 2, c.height / 2);
  if (typeof document !== "undefined" && document.fonts?.check(`${GRID}px ${GARNISH_FONT}`, char)) glyphCache.set(key, c);
  return c;
}

// Farthest opaque pixel from the glyph box center, in glyph heights (12px = 1). Rotation-independent.
const radiusCache = new Map();
function glyphRadius(char) {
  if (radiusCache.has(char)) return radiusCache.get(char);
  if (typeof document === "undefined") return 0.71;
  const img = glyph(char);
  const d = img.getContext("2d").getImageData(0, 0, img.width, img.height).data;
  const c = img.width / 2;
  let r2 = 0;
  for (let y = 0; y < img.height; y++)
    for (let x = 0; x < img.width; x++) {
      if (d[(y * img.width + x) * 4 + 3] > 16) r2 = Math.max(r2, (x + 0.5 - c) ** 2 + (y + 0.5 - c) ** 2);
    }
  const r = r2 ? Math.sqrt(r2) / GRID : 0.71;
  if (glyphCache.has(char)) radiusCache.set(char, r); // only cache once the font is really in use
  return r;
}

function drawGarnish(ctx, g, geo, s, ox, oy, [left, right]) {
  if (!g.char) return;
  const u = garnishUnit(g, geo);
  const m = Math.max(1, Math.round((u.size * s) / GRID)); // integer multiple of the pixel grid
  const img = glyph(g.char);
  const box = img.width * m;
  const r = GRID * m * glyphRadius(g.char); // real glyph radius, px
  let cx = ox + u.x * s;
  cx = right - left > 2 * r ? Math.min(right - r, Math.max(left + r, cx)) : (left + right) / 2; // stop at the slot edge
  ctx.save();
  ctx.translate(Math.round(cx), Math.round(oy + u.y * s));
  ctx.rotate(((g.rotation ?? 0) * Math.PI) / 180);
  ctx.imageSmoothingEnabled = false; // nearest-neighbour: stair-stepped pixels at any angle
  ctx.drawImage(img, -box / 2, -box / 2, box, box);
  ctx.restore();
}

function roundSquare(ctx, x, y, size, r) {
  const h = size / 2;
  ctx.beginPath();
  ctx.roundRect(x - h, y - h, size, size, r);
}

function drawIce(ctx, ice, geo, surface, level, lw) {
  const rng = createRng(ice.seed >>> 0);
  const { bottom } = geo.fillRange;
  const refY = level > 0 ? surface : bottom;
  const halfW = Math.max(0.05, geo.innerHalfWidth(refY));
  const n = Math.max(1, Math.min(8, Math.round(ice.count)));
  // cubes shrink to fit narrow interiors (e.g. flute)
  const size = Math.min(halfW * 2 * 0.38, (halfW * 2 * 0.92) / n, (bottom - geo.fillRange.top) * 0.45);
  for (let i = 0; i < n; i++) {
    const slotX = n === 1 ? 0 : -halfW + size / 2 + ((halfW * 2 - size) * i) / (n - 1);
    const x = slotX + (rng() - 0.5) * size * 0.3;
    const floating = surface + size * (0.1 + rng() * 0.15);
    const y = Math.min(bottom - size / 2, level > 0 ? floating : bottom - size / 2) - (i % 2) * size * 0.12;
    const rot = (rng() - 0.5) * 0.6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    roundSquare(ctx, 0, 0, size, size * 0.18);
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.fill();
    ctx.strokeStyle = "rgba(40,30,50,0.28)"; // 1b polish: a faint dark edge so cubes read on light liquids
    ctx.lineWidth = lw * 1.3;
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = lw * 0.7;
    ctx.stroke();
    ctx.beginPath(); // highlight
    ctx.moveTo(-size * 0.28, -size * 0.12);
    ctx.lineTo(-size * 0.28, -size * 0.3);
    ctx.lineTo(-size * 0.1, -size * 0.3);
    ctx.stroke();
    ctx.restore();
  }
}

// Salt: fewer, larger, irregular grains in an uneven band. Sugar: finer, denser, uniform + a few sparkles.
function drawRim(ctx, rim, geo, lw, color) {
  const rng = createRng((rim.seed >>> 0) ^ 0x5bd1e995);
  const { cy, rx } = geo.rim;
  const salt = rim.type === "salt";
  const band = rx * (salt ? 0.16 : 0.12);
  const n = Math.round(rx * (salt ? 70 : 170));
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = lw * 0.25;
  for (let i = 0; i < n; i++) {
    const depth = salt ? band * rng() * (0.55 + 0.45 * rng()) : band * rng();
    const y = cy + depth;
    const half = Math.max(0.02, geo.innerHalfWidth(y) + lw * 1.2);
    const x = (rng() * 2 - 1) * half;
    const size = salt ? lw * (1.5 + rng() * 1.3) : lw * (0.8 + rng() * 0.4);
    ctx.save();
    ctx.translate(x, y);
    if (salt) ctx.rotate(rng() * Math.PI);
    ctx.beginPath();
    ctx.rect(-size / 2, -size / 2, size, size);
    ctx.fill();
    if (salt) ctx.stroke();
    ctx.restore();
  }
  if (!salt) {
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = lw * 0.5;
    for (let i = 0; i < 5; i++) {
      const x = (rng() * 2 - 1) * rx * 0.9;
      const y = cy + band * rng();
      const k = lw * 1.6;
      ctx.beginPath();
      ctx.moveTo(x - k, y);
      ctx.lineTo(x + k, y);
      ctx.moveTo(x, y - k);
      ctx.lineTo(x, y + k);
      ctx.stroke();
    }
  }
  ctx.restore();
}
