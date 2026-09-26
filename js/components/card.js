import { drawCocktail } from "../cocktail/draw-cocktail.js";
import { drawBarcode } from "./barcode.js";
import { drawStyledText, measureText, setTextFont } from "./text-style.js";
import { splitGraphemes } from "./decor-path.js";
import { flowColumns, flowParts } from "./card-flow.js";

// Cocktail Card (Layer 2). Geometry (v13): x = center, y = TOP edge, width = fraction of design width.
// sizing "fixed": height = width × aspect with the CARD_LAYOUT template below (pre-v13 cards).
// sizing "content": height follows the recipe (card-flow.js); the card grows downward. The INTERNAL layout is a fixed template (card-normalized units,
// fractions of card width / height) kept in this one table; only the illustration has its own
// scale / dx / dy composition controls. All text sizes are fractions of the card width.

export const CARD_LAYOUT = {
  title: { x: 0.05, y: 0.05, w: 0.72, h: 0.13 },
  image: { x: 0.05, y: 0.22, w: 0.3, h: 0.7 },
  list: { x: 0.4, y: 0.22, w: 0.43, h: 0.48 },
  divider: { x: 0.4, y: 0.745, w: 0.43 },
  name: { x: 0.4, y: 0.78, w: 0.43, h: 0.14 },
  barcode: { x: 0.87, y: 0.3, w: 0.08, h: 0.62 },
  hex: { x: 0.91, y: 0.19 },
};

// v12: the illustration slot width is adjustable (card.image.slot, 0.18–0.45). The list, divider
// and name columns follow it. slot 0.30 returns CARD_LAYOUT itself (today's layout, exactly).
export function cardLayout(card) {
  const slot = card.image?.slot ?? 0.3;
  if (slot === 0.3) return CARD_LAYOUT;
  const d = slot - 0.3;
  return {
    ...CARD_LAYOUT,
    image: { ...CARD_LAYOUT.image, w: slot },
    list: { ...CARD_LAYOUT.list, x: 0.4 + d, w: 0.43 - d },
    divider: { ...CARD_LAYOUT.divider, x: 0.4 + d, w: 0.43 - d },
    name: { ...CARD_LAYOUT.name, x: 0.4 + d, w: 0.43 - d },
  };
}

export const CARD_LIMITS = { items: 12, ingredients: 16, garnish: 6, name: 40, amount: 16 };

let measureCanvas = null;
const measureCtx = () => (measureCanvas ??= document.createElement("canvas").getContext("2d"));

/**
 * The one geometry used by drawing, hit-testing and warnings: card rect, part rects, list geometry
 * and the measured rows (ingredients, then an optional GARNISH heading + garnish rows).
 */
export function cardGeometry(ctx, card, W, H) {
  const w = card.width * W;
  const x = card.x * W - w / 2;
  const y = card.y * H;
  if (card.sizing === "fixed") {
    const rect = { x, y, w, h: w * card.aspect };
    const L = cardLayout(card);
    const parts = {
      title: sub(rect, CARD_LAYOUT.title),
      image: sub(rect, L.image),
      list: sub(rect, L.list),
      divider: sub(rect, L.divider),
      name: sub(rect, L.name),
      barcode: sub(rect, CARD_LAYOUT.barcode),
      hex: sub(rect, CARD_LAYOUT.hex),
    };
    const g = listGeometry(card, rect, parts.list);
    return { rect, parts, g, ...layoutRows(ctx, card, g) };
  }
  const cols = flowColumns(card, x, y, w);
  const g0 = listGeometry(card, { w }, { ...cols.list, h: 0 });
  const rows = layoutRows(ctx, card, g0);
  const { rect, parts } = flowParts(card, x, y, w, rows.bottom + g0.pad - cols.list.y);
  return { rect, parts, g: { ...g0, box: parts.list }, ...rows };
}

export function cardRect(card, W, H) {
  return cardGeometry(measureCtx(), card, W, H).rect;
}

function sub(rect, part) {
  return {
    x: rect.x + part.x * rect.w,
    y: rect.y + part.y * rect.h,
    w: (part.w ?? 0) * rect.w,
    h: (part.h ?? 0) * rect.h,
  };
}

function roundedPath(ctx, r, radius) {
  const rr = Math.max(0, Math.min(radius, r.w / 2, r.h / 2));
  ctx.beginPath();
  ctx.moveTo(r.x + rr, r.y);
  ctx.arcTo(r.x + r.w, r.y, r.x + r.w, r.y + r.h, rr);
  ctx.arcTo(r.x + r.w, r.y + r.h, r.x, r.y + r.h, rr);
  ctx.arcTo(r.x, r.y + r.h, r.x, r.y, rr);
  ctx.arcTo(r.x, r.y, r.x + r.w, r.y, rr);
  ctx.closePath();
}

function cardFill(ctx, fill, r) {
  if (fill.type !== "linear") return fill.colors[0];
  const a = (fill.angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const half = (Math.abs(r.w * dx) + Math.abs(r.h * dy)) / 2;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const g = ctx.createLinearGradient(cx - dx * half, cy - dy * half, cx + dx * half, cy + dy * half);
  g.addColorStop(0, fill.colors[0]);
  g.addColorStop(1, fill.colors[1]);
  return g;
}

// Row geometry for the ingredient list (shared by drawing and the overflow check).
function listGeometry(card, rect, box) {
  const px = card.list.size * rect.w;
  const rowH = px * 1.55;
  const pad = px * 0.95; // inside the brackets
  const check = card.list.checkboxes ? px * 0.8 : 0;
  const nameX = box.x + pad + (check ? check + px * 0.45 : 0);
  const amountRight = box.x + box.w - pad;
  return { box, px, rowH, pad, check, nameX, amountRight, top: box.y + pad + rowH / 2 };
}

// Row layout shared by drawing and the overflow check (single source of truth).
// Each row first tries today's single line "name … leader … amount". Only if that does not fit
// and list.wrap is on, the NAME wraps to at most two lines (word boundaries; one over-long token
// breaks by grapheme). Line 2 holds the rest of the name + leader + amount on the shared edge.
// Returns rows [{ item, index, lines: [{ text, y, last }], fits }] and the bottom of the last line.
function layoutRows(ctx, card, g) {
  const style = { font: card.list.font, letterSpacing: card.list.letterSpacing };
  const width = (t) => measureText(ctx, t, style, g.px);
  const full = g.amountRight - g.nameX;
  const rows = [];
  let line = 0;
  const entries = card.ingredients.map((item, index) => ({ item, index, kind: "ingredient" }));
  if (card.garnish?.length) {
    entries.push({ kind: "heading", index: -1 });
    card.garnish.forEach((item, index) => entries.push({ item: { ...item, amount: "" }, index, kind: "garnish" }));
  }
  entries.forEach(({ item, index, kind }) => {
    if (kind === "heading") {
      if (line > 0) line += 0.35; // small gap above GARNISH
      rows.push({ kind, index, item: null, lines: [{ text: "GARNISH", y: g.top + line * g.rowH, last: true }], fits: true });
      line += 1;
      return;
    }
    const amountW = width(item.amount);
    const fitsWith = (t) => g.nameX + width(t) + g.px * 0.6 + amountW <= g.amountRight + 0.5;
    if (fitsWith(item.name) || !card.list.wrap) {
      rows.push({ kind, item, index, lines: [{ text: item.name, y: g.top + line * g.rowH, last: true }], fits: fitsWith(item.name) });
      line += 1;
      return;
    }
    // line 1: the longest word prefix that fits the full width
    const words = item.name.split(" ");
    let k = 0;
    while (k < words.length && width(words.slice(0, k + 1).join(" ")) <= full) k += 1;
    let first;
    let rest;
    if (k === 0) {
      // a single over-long token: break by grapheme
      const g1 = splitGraphemes(words[0]);
      let n = 0;
      while (n < g1.length && width(g1.slice(0, n + 1).join("")) <= full) n += 1;
      n = Math.max(1, n);
      first = g1.slice(0, n).join("");
      rest = [g1.slice(n).join(""), ...words.slice(1)].join(" ").trim();
    } else {
      if (k === words.length && words.length > 1) k -= 1; // keep a word with the amount
      first = words.slice(0, k).join(" ");
      rest = words.slice(k).join(" ");
    }
    rows.push({
      kind,
      item,
      index,
      lines: [
        { text: first, y: g.top + line * g.rowH, last: false },
        { text: rest, y: g.top + (line + 1) * g.rowH, last: true },
      ],
      fits: width(first) <= full + 0.5 && fitsWith(rest),
    });
    line += 2;
  });
  return { rows, bottom: g.top - g.rowH / 2 + line * g.rowH };
}

/**
 * Warnings for the editor (never change the drawing). Uses the same geometry as drawing.
 *   fixed card:   rows beyond the list box (tooMany)
 *   content card: card bottom beyond the sheet (pastSheet); the list itself grows
 *   both:         rows whose text + amount cannot fit even after wrapping (tooLong / garnishTooLong)
 */
export function cardOverflow(ctx, card, W, H) {
  const geo = cardGeometry(ctx, card, W, H);
  const g = geo.g;
  const of = (kind, pick) => geo.rows.filter((r) => r.kind === kind && pick(r)).map((r) => r.index);
  return {
    tooMany: card.sizing === "fixed" && geo.bottom > g.box.y + g.box.h - g.pad + 0.5,
    pastSheet: card.sizing !== "fixed" && geo.rect.y + geo.rect.h > H + 0.5,
    tooLong: of("ingredient", (r) => !r.fits),
    garnishTooLong: of("garnish", (r) => !r.fits),
    wrapped: of("ingredient", (r) => r.lines.length > 1),
  };
}

function drawCheckbox(ctx, x, y, s, checked, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(s * 0.1, 0.5);
  ctx.strokeRect(x, y - s / 2, s, s);
  if (checked) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(s * 0.14, 0.5);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.2, y);
    ctx.lineTo(x + s * 0.42, y + s * 0.25);
    ctx.lineTo(x + s * 0.82, y - s * 0.28);
    ctx.stroke();
  }
  ctx.restore();
}

// Procedural corner brackets (⌜ at top-left, ⌟ at bottom-right) — line geometry, not glyphs.
function drawBrackets(ctx, box, arm, lw, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + arm);
  ctx.lineTo(box.x, box.y);
  ctx.lineTo(box.x + arm, box.y);
  ctx.moveTo(box.x + box.w, box.y + box.h - arm);
  ctx.lineTo(box.x + box.w, box.y + box.h);
  ctx.lineTo(box.x + box.w - arm, box.y + box.h);
  ctx.stroke();
  ctx.restore();
}

function drawList(ctx, card, geo) {
  const list = card.list;
  const g = geo.g;
  const style = { font: list.font, letterSpacing: list.letterSpacing };
  if (list.brackets.on) drawBrackets(ctx, g.box, g.px * 1.1, Math.max(g.px * 0.09, 0.5), list.brackets.color);

  ctx.save();
  setTextFont(ctx, style, g.px);
  ctx.textBaseline = "middle";
  ctx.fillStyle = list.color;
  const dot = ".";
  const dotW = Math.max(0.5, ctx.measureText(dot).width);
  const { rows } = geo;
  setTextFont(ctx, style, g.px);
  for (const row of rows) {
    if (row.kind === "heading") {
      ctx.save();
      setTextFont(ctx, style, g.px, "bold");
      ctx.textAlign = "left";
      ctx.fillStyle = list.color;
      ctx.fillText(row.lines[0].text, g.box.x + g.pad, row.lines[0].y);
      ctx.restore();
      continue;
    }
    const item = row.item;
    if (list.checkboxes) drawCheckbox(ctx, g.box.x + g.pad, row.lines[0].y, g.check, item.checked, list.color);
    for (const ln of row.lines) {
      const y = ln.y;
      ctx.textAlign = "left";
      ctx.fillStyle = list.color;
      ctx.fillText(ln.text, g.nameX, y);
      if (!ln.last) continue;
      const nameW = ctx.measureText(ln.text).width;
      ctx.textAlign = "right";
      ctx.fillText(item.amount, g.amountRight, y);
      const amountW = ctx.measureText(item.amount).width;
      if (list.leader.on && !(row.kind === "garnish" && !item.amount)) {
        // Leader fills the measured gap; amounts all share g.amountRight.
        const start = g.nameX + nameW + g.px * 0.3;
        const end = g.amountRight - amountW - g.px * 0.3;
        const count = Math.floor((end - start) / dotW);
        if (count > 0) {
          ctx.fillStyle = list.leader.color;
          ctx.fillText(dot.repeat(count), end, y);
        }
      }
    }
  }
  ctx.restore();
}

function drawImage(ctx, card, rect, image, slot, chips) {
  if (card.image.source === "builder" && card.builder) {
    // v15 Cocktail Builder: procedural cocktail in the slot (clipped); glass lines in the card ink
    ctx.save();
    ctx.beginPath();
    ctx.rect(slot.x, slot.y, slot.w, slot.h);
    ctx.clip();
    drawCocktail(ctx, card.builder, slot, { ink: card.title.color, chips });
    ctx.restore();
  } else if (image) {
    // contain-fit inside the slot, then the user's multiplier and slot-relative offsets
    const fit = Math.min(slot.w / image.width, slot.h / image.height);
    const w = image.width * fit * card.image.scale;
    const h = image.height * fit * card.image.scale;
    const cx = slot.x + slot.w / 2 + card.image.dx * slot.w;
    const cy = slot.y + slot.h / 2 + card.image.dy * slot.h;
    ctx.save();
    ctx.beginPath();
    ctx.rect(slot.x, slot.y, slot.w, slot.h);
    ctx.clip();
    ctx.drawImage(image, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }
  if (card.image.frame.on) {
    ctx.save();
    ctx.strokeStyle = card.image.frame.color;
    ctx.lineWidth = Math.max(rect.w * 0.003, 0.5);
    ctx.strokeRect(slot.x, slot.y, slot.w, slot.h);
    ctx.restore();
  }
}

function drawCoating(ctx, card, rect) {
  if (!card.coating.on || card.coating.strength <= 0) return;
  const s = card.coating.strength;
  ctx.save();
  // faint overall lift from the top-left, plus one soft diagonal highlight band
  const lift = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  lift.addColorStop(0, `rgba(255,255,255,${0.16 * s})`);
  lift.addColorStop(0.5, "rgba(255,255,255,0)");
  lift.addColorStop(1, `rgba(255,255,255,${0.06 * s})`);
  ctx.fillStyle = lift;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const band = ctx.createLinearGradient(rect.x + rect.w * 0.15, rect.y, rect.x + rect.w * 0.55, rect.y + rect.h);
  band.addColorStop(0.35, "rgba(255,255,255,0)");
  band.addColorStop(0.48, `rgba(255,255,255,${0.32 * s})`);
  band.addColorStop(0.52, `rgba(255,255,255,${0.32 * s})`);
  band.addColorStop(0.65, "rgba(255,255,255,0)");
  ctx.fillStyle = band;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

export function drawCard(ctx, card, shared, images, W, H, renderScale) {
  if (!card?.visible) return;
  const geo = cardGeometry(ctx, card, W, H);
  const { rect, parts } = geo;
  const radius = card.radius * rect.w;

  ctx.save();
  roundedPath(ctx, rect, radius);
  ctx.fillStyle = cardFill(ctx, card.fill, rect);
  ctx.fill();
  roundedPath(ctx, rect, radius);
  ctx.clip();

  drawImage(ctx, card, rect, images.cardImage, parts.image, shared.paletteChips);
  drawList(ctx, card, geo);

  if (card.divider.on) {
    const d = parts.divider;
    ctx.save();
    ctx.strokeStyle = card.divider.color;
    ctx.lineWidth = Math.max(rect.w * 0.0025, 0.5);
    if (card.divider.dashed) ctx.setLineDash([rect.w * 0.008, rect.w * 0.006]);
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x + d.w, d.y);
    ctx.stroke();
    ctx.restore();
  }

  const nameBox = parts.name;
  drawStyledText(ctx, card.name.text, nameBox.x + nameBox.w / 2, nameBox.y + nameBox.h / 2, card.name, card.name.size * rect.w, renderScale, { align: "center" });

  const titleBox = parts.title;
  drawStyledText(ctx, card.title.text, titleBox.x, titleBox.y + titleBox.h / 2, card.title, card.title.size * rect.w, renderScale);

  if (card.barcode.on) drawBarcode(ctx, parts.barcode, shared.barcodeSeed, card.barcode.color, "vertical");
  if (shared.hex) {
    const p = parts.hex;
    drawStyledText(ctx, shared.hex, p.x, p.y, { font: card.hex.font, color: card.hex.color, letterSpacing: 0 }, card.hex.size * rect.w, renderScale, { align: "center" });
  }

  drawCoating(ctx, card, rect); // lamination over the printed contents
  ctx.restore();

  if (card.border.width > 0) {
    ctx.save();
    roundedPath(ctx, rect, radius);
    ctx.lineWidth = card.border.width * rect.w;
    ctx.strokeStyle = card.border.color;
    ctx.stroke();
    ctx.restore();
  }
}
