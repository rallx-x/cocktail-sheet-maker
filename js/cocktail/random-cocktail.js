import { CATALOG } from "./catalog.js";
import { glassFromPreset, PRESETS } from "./glasses.js";
import { newSeed } from "../state.js";
import { fontCss } from "../fonts.js";
import { cardLayout } from "../components/card.js";
import { memoYBelowCard } from "../components/memo.js";

// Random Cocktail (v17): catalog → color-family filter → random pick → one-shot apply.
// The whole apply is ONE updateState (= one undo step); afterwards everything is ordinary editable state.

export const FAMILIES = [
  { id: "all", label: "전체", heart: "🎲" },
  { id: "red", label: "빨강", heart: "❤️" },
  { id: "pink", label: "분홍", heart: "🩷" },
  { id: "orange", label: "주황", heart: "🧡" },
  { id: "yellow", label: "노랑", heart: "💛" },
  { id: "green", label: "초록", heart: "💚" },
  { id: "blue", label: "파랑", heart: "💙" },
  { id: "lightBlue", label: "하늘", heart: "🩵" },
  { id: "purple", label: "보라", heart: "💜" },
  { id: "brown", label: "갈색", heart: "🤎" },
  { id: "black", label: "검정", heart: "🖤" },
  { id: "gray", label: "회색", heart: "🩶" },
  { id: "white", label: "흰색", heart: "🤍" },
];
export const THIN_POOL = 8; // at or below this many entries the caution line shows

export function poolFor(family) {
  return family === "all" ? CATALOG : CATALOG.filter((e) => e.colorFamilies.includes(family));
}
export const entryById = (id) => CATALOG.find((e) => e.id === id) ?? null;

// Uniform pick; never the current cocktail again when there is any alternative.
export function pickEntry(pool, currentId, rnd = Math.random) {
  const choices = pool.length > 1 ? pool.filter((e) => e.id !== currentId) : pool;
  return choices.length ? choices[Math.floor(rnd() * choices.length)] : null;
}

// --- card amount strings (the catalog stays numeric/lossless; the card stores editable text) ---
const FR = [[0, ""], [1 / 8, "⅛"], [1 / 6, "⅙"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"], [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"], [1, ""]];
function num(q) {
  const w = Math.floor(q);
  const f = q - w;
  for (const [v, s] of FR) {
    if (Math.abs(f - v) <= 0.02) {
      if (v === 1) return String(w + 1);
      return s ? `${w || ""}${s}` : String(w);
    }
  }
  return String(Math.round(q * 100) / 100);
}
export function formatAmount({ qty, unit }) {
  const n = typeof qty === "number" && Number.isFinite(qty) ? qty : null;
  const pl = (one, many) => (n === 1 ? one : many);
  switch (unit) {
    case "oz": return n === null ? "" : `${num(n)} oz`;
    case "dash": return n === null ? "Dash" : `${num(n)} ${pl("dash", "dashes")}`;
    case "drop": return n === null ? "Few drops" : `${num(n)} ${pl("drop", "drops")}`;
    case "tsp": return n === null ? "Tsp" : `${num(n)} tsp`;
    case "barspoon": return n === null ? "Barspoon" : `${num(n)} barspoon`;
    case "part": return n === null ? "Part" : `${num(n)} ${pl("part", "parts")}`;
    case "egg": return n === null ? "1" : num(n);
    case "top": return "Top";
    case "splash": return "Splash";
    case "asNeeded": return "As needed";
    case "leaves": return n === null ? "Few leaves" : `${num(n)} leaves`;
    case "piece": return n === null ? "1" : num(n);
    case "wedge": return n === null ? "Wedges" : `${num(n)} ${pl("wedge", "wedges")}`;
    case "pinch": return "Pinch";
    case "spray": return n === null ? "Spray" : `${num(n)} ${pl("spray", "sprays")}`;
    default: return n === null ? "" : `${num(n)}`;
  }
}

// One-shot apply into a draft (the caller wraps it in ONE updateState).
export function applyEntry(draft, entry) {
  const card = draft.components.card;
  const b = card.builder;
  const chips = draft.components.palette.chips;
  const v = entry.visual;
  card.image.source = "builder"; // the uploaded image stays stored (the source toggle can bring it back)
  card.name.text = entry.name; // the sheet shows the English name
  card.name.size = fitNameSize(card, entry.name); // long names shrink to the name box (never grow past the default)
  card.ingredients = entry.recipe.ingredients.slice(0, 16).map((i) => ({ name: i.name, amount: formatAmount(i), checked: false }));
  card.garnish = entry.recipe.garnish.slice(0, 6).map((name) => ({ name, checked: false }));
  const preset = PRESETS[v.glass.preset] ? v.glass.preset : "martini";
  b.glass = glassFromPreset(preset, v.glass.height ?? 1); // builder scale (잔 크기) is kept
  // Jamong UX decision A: a Random cocktail first shows its CURATED catalog colors. The link is switched
  // OFF; stops are paired with chips in palette order (refs kept), so turning 캐릭터 컬러 팔레트와 연결 back
  // ON recolors the cocktail with the character palette (lastEdited = palette → the chips win).
  b.liquid = {
    level: v.liquid.level,
    blend: v.liquid.blend === "layers" ? "layers" : "smooth",
    stops: v.liquid.stops.slice(0, 6).map((st, i) => ({ ref: chips[i]?.id ?? null, color: st.color, pos: st.pos })),
  };
  b.paletteLink = { on: false, lastEdited: "palette" };
  b.ice = v.ice.type === "cubes" ? { type: "cubes", count: v.ice.count ?? 2, seed: newSeed() } : { type: "none", count: b.ice.count ?? 2, seed: newSeed() };
  b.rim = { type: v.rim.type ?? "none", coverage: v.rim.coverage === "half" ? "half" : "full", color: { ref: null, color: "#FFFFFF" }, seed: newSeed() };
  b.garnish = (v.garnish ?? []).map((g) => ({ char: g.char, u: g.u, size: g.size, rotation: g.rotation }));
  b.presetId = entry.id;
  // memo: replaced only while empty or still exactly what Random wrote last (a hand-written note is kept)
  const memo = draft.components.memo;
  if (memo && (memo.auto || !memo.text.trim())) {
    if (entry.memo) {
      memo.text = entry.memo;
      memo.auto = true;
      memo.visible = true;
      if (card.visible) memo.y = memoYBelowCard(memo, card, draft.design.width, draft.design.height); // never over the card
    } else if (memo.auto) {
      memo.text = ""; // the previous cocktail's auto text must not stay under a new cocktail
      memo.auto = false;
      memo.visible = false;
    }
  }
}

// Card name size for a Random name: the default size, or smaller so the name fits its box (5% margin).
// Measured against a 1000px card; px = size × card width, so the result is resolution independent.
export const CARD_NAME_SIZE = 0.07;
let nameCtx = null;
export function fitNameSize(card, text) {
  if (typeof document === "undefined") return CARD_NAME_SIZE;
  nameCtx ??= document.createElement("canvas").getContext("2d");
  const boxW = cardLayout(card).name.w * 1000 * 0.95;
  nameCtx.font = fontCss(card.name.font, CARD_NAME_SIZE * 1000);
  const w = nameCtx.measureText(text).width;
  return w > boxW ? Math.max(0.03, Math.floor((CARD_NAME_SIZE * boxW * 1000) / w) / 1000) : CARD_NAME_SIZE;
}
