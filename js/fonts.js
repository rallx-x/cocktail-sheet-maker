// Central font registry. State stores stable font IDs only; the family aliases ("TDAD …")
// are declared solely in css/fonts.css, pointing at the user's local files (never bundled).
//
// A font ID is one visual face. Genuine weight variants of the same family (Mona R/B,
// Mulgyeol R/B) are `weights` of ONE ID, not separate choices. Visually distinct faces
// (Puzzle vs Puzzle Outline) are separate IDs.

export const FONTS = {
  system: { label: "기본 글꼴", families: [], fallback: 'system-ui, "Segoe UI Symbol", "Segoe UI Emoji", sans-serif' },
  puzzle: { label: "학교안심 퍼즐", families: ["TDAD Puzzle"], fallback: 'Georgia, "Times New Roman", serif' },
  puzzleOutline: { label: "학교안심 퍼즐 (외곽선)", families: ["TDAD Puzzle Outline"], fallback: 'Georgia, "Times New Roman", serif' },
  lovingu: { label: "Cafe24 Loving U (영문)", families: ["TDAD Loving U"], fallback: '"Segoe Script", cursive' },
  goun: { label: "Cafe24 고운밤", families: ["TDAD Goun"], fallback: "sans-serif" },
  mulgyeol: { label: "학교안심 물결", families: ["TDAD Mulgyeol"], weights: ["regular", "bold"], fallback: "sans-serif" },
  moirai: { label: "Moirai One (컬러 폰트)", families: ["TDAD Moirai"], color: true, fallback: "sans-serif" },
  // Pixel emoji only in this stack (never appended globally).
    mona: { label: "Mona12 (도트)", families: ["TDAD Mona", "TDAD Test Color Emoji", "TDAD Mona Emoji"], weights: ["regular", "bold"], fallback: "ui-monospace, Consolas, monospace" },
  ahnchangho: { label: "KCC 안창호체", families: ["TDAD Ahnchangho"], fallback: "serif" },
};

// Picker order.
export const FONT_ORDER = ["system", "puzzle", "puzzleOutline", "lovingu", "goun", "mulgyeol", "moirai", "mona", "ahnchangho"];

// Default font per usage. Every text element starts from one of these.
export const FONT_DEFAULTS = {
  brand: "puzzle",
  cocktailName: "ahnchangho",
  receipt: "mona",
  script: "lovingu",
  decor: "system",
  memo: "goun", // v17 sheet memo: a Korean handwriting-feel face
};

export function isFontId(id) {
  return Object.prototype.hasOwnProperty.call(FONTS, id);
}

// Unknown / removed IDs fall back to the element's default.
export function normalizeFontId(id, usage) {
  return isFontId(id) ? id : FONT_DEFAULTS[usage] ?? "system";
}

export function fontStack(id) {
  const def = FONTS[id] ?? FONTS.system;
  return [...def.families.map((family) => `"${family}"`), def.fallback].join(", ");
}

// weight: "regular" | "bold". Bold is only requested from families that really have it.
export function fontCss(id, px, weight = "regular") {
  const def = FONTS[id] ?? FONTS.system;
  const bold = weight === "bold" && (def.weights?.includes("bold") || !def.families.length);
  return `${bold ? "bold " : ""}${Math.max(1, px)}px ${fontStack(id)}`;
}

function declaredFaces(family) {
  const faces = [];
  if (typeof document === "undefined" || !document.fonts) return faces;
  for (const face of document.fonts) if (face.family.replace(/["']/g, "") === family) faces.push(face);
  return faces;
}

// Loads every declared face (all weights) of the given font IDs before rendering / export.
// Missing or broken files never throw: rendering falls back to the stack.
export async function loadFonts(ids, sampleText = "") {
  const tasks = [];
  for (const id of new Set(ids)) {
    const def = FONTS[id];
    if (!def) continue;
    for (const family of def.families) {
      if (!declaredFaces(family).length) continue;
      for (const weight of def.weights ?? ["regular"]) {
        const w = weight === "bold" ? "bold " : "";
        tasks.push(document.fonts.load(`${w}32px "${family}"`, sampleText || "A").catch(() => []));
      }
    }
  }
  await Promise.all(tasks);
}

// "ready" | "missing" (no usable file for the primary family) | "system".
export function fontStatus(id) {
  const families = FONTS[id]?.families ?? [];
  if (!families.length) return "system";
  const primary = declaredFaces(families[0]);
  if (!primary.length || primary.every((face) => face.status === "error")) return "missing";
  return "ready";
}
