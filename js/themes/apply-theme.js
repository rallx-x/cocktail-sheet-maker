import { COLOR_ROLES, getTheme } from "./themes.js";
import { contrast } from "../decor/auto-color.js";
import { brandRect } from "../components/brand.js";
import { boxRect } from "../components/boxes.js";
import { sampleBackground } from "../background.js";

// Sheet Colors (v13). design.colors holds 10 editable roles. ONE mapping table (ROLE_TARGETS) is used
// two ways, always at EDIT time and always writing concrete values into existing component fields:
//   applyTheme(draft, id)       → fill all 10 roles from the recipe, then propagate every role
//   applyRole(draft, role, hex) → set one role, then propagate only that role
// The renderer and export never read design.colors or the theme id. Excluded by design: MD coaster
// and SD doily plates, receipt paper, palette chips, MD fill top (#FFFFFF), and all non-color state.

const mix = (hex, toward, t) => {
  const a = parseInt(hex.slice(1), 16);
  const b = parseInt(toward.slice(1), 16);
  const ch = (s) => Math.round(((a >> s) & 255) * (1 - t) + ((b >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
};

// Brand color, decided by what the brand actually sits on (same bbox rule as the v11 brand auto color):
// over the visible MD frame → ink (the frame surface is light); otherwise on the sheet background →
// ink if it reads there (≥ 3:1, large display text), else the light card base (dark themes).
export function brandColorFor(draft) {
  const colors = draft.design.colors;
  const brand = draft.components.brand;
  const frame = draft.components.md?.frame;
  if (brand && frame?.visible) {
    const W = draft.design.width;
    const H = draft.design.height;
    const a = brandRect(brand, W, H);
    const b = boxRect(frame, W, H);
    if (a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) return colors.ink;
  }
  // v14: the actual background behind the brand center (any gradient direction), not the bg role
  const r = brandRect(brand, draft.design.width, draft.design.height);
  const under = sampleBackground(draft.design, r.x + r.w / 2, r.y + r.h / 2);
  return contrast(colors.ink, under) >= 3 ? colors.ink : colors.cardBase;
}

const frameEdit = (c, fn) => {
  const f = c.md?.frame;
  if (!f) return;
  fn(f);
  f.colorMode = "manual"; // a Sheet Color written here must be visible (auto mode would override it)
};
const card = (c, fn) => c.card && fn(c.card);
const receipt = (c, fn) => c.receipt && fn(c.receipt);
const decor = (c, fn) => c.md?.decor && fn(c.md.decor);
const stickersWith = (c, role, v) => {
  for (const st of c.stickers ?? []) if (st.source === "builtin" && (st.themeRole ?? "accent") === role) st.color = v;
};

// role → writers(draft, value). Each writer only sets color fields.
export const ROLE_TARGETS = {
  bg: [(d, v) => (d.design.backgroundColor = v)], // solid color / fallback only; a theme's gradient is written by applyTheme
  pattern: [
    (d, v) => {
      if (d.design.pattern?.source === "builtin") d.design.pattern.color = v; // kind/opacity/scale/seed kept
    },
  ],
  gradient: [
    (d, v) => frameEdit(d.components, (f) => (f.fill.colors[1] = v)), // MD bottom (top stays #FFFFFF)
    (d, v) => card(d.components, (k) => (k.fill.colors[1] = v)),
  ],
  cardBase: [(d, v) => card(d.components, (k) => (k.fill.colors[0] = v))],
  ink: [
    (d, v) => frameEdit(d.components, (f) => (f.border.color = v)),
    (d, v) =>
      card(d.components, (k) => {
        k.title.color = v;
        k.name.color = v;
        k.list.color = v;
        k.list.brackets.color = v;
        k.barcode.color = v;
        k.hex.color = v;
      }),
    (d, v) =>
      receipt(d.components, (r) => {
        for (const key of ["title", "subtitle", "body", "code", "footer"]) r[key].color = v;
        r.barcode.color = v;
      }),
    (d, v) => decor(d.components, (m) => (m.outline.color = v)),
    (d, v) => {
      const p = d.components.palette;
      if (p) p.title.color = p.text.color = v;
    },
    (d, v) => stickersWith(d.components, "ink", v),
  ],
  inkSoft: [
    (d, v) =>
      frameEdit(d.components, (f) => {
        f.border.multi.innerColor = v;
        f.border.molding.color = v;
      }),
    (d, v) =>
      card(d.components, (k) => {
        k.border.color = v;
        k.list.leader.color = v;
        k.divider.color = v;
        k.image.frame.color = v;
      }),
    (d, v) =>
      receipt(d.components, (r) => {
        r.paper.lineColor = v;
        r.body.leaderColor = v;
      }),
    (d, v) => {
      const t = d.components.sd?.tray;
      if (t) t.colors.border = v;
    },
    (d, v) => {
      const p = d.components.palette;
      if (p) p.card.border = v;
    },
    (d, v) => decor(d.components, (m) => (m.banner.back = v)),
  ],
  accent: [
    (d, v) =>
      decor(d.components, (m) => {
        m.corners.color = v;
        m.top.color = v;
        m.banner.color = v;
        m.swirls.color = v;
      }),
    (d, v) => {
      const cf = d.components.md?.confetti;
      if (!cf) return;
      for (const layer of [cf.back, cf.front]) {
        layer.color = v;
        layer.touched = true; // deliberately colored: no later one-time suggestion
      }
    },
    (d, v) =>
      card(d.components, (k) => {
        k.title.effectColor = v;
        k.name.effectColor = v;
      }),
    (d, v) => stickersWith(d.components, "accent", v),
  ],
  accent2: [
    (d, v) =>
      decor(d.components, (m) => {
        m.top.color2 = v;
        m.swirls.color2 = v;
      }),
    (d, v) => stickersWith(d.components, "accent2", v),
  ],
  tray: [
    (d, v) => {
      const t = d.components.sd?.tray;
      if (t) {
        t.colors.fill = v;
        if (t.rim) t.rim.light = mix(v, "#FFFFFF", 0.8); // custom tray: a light of its own color (theme may override)
      }
    },
  ],
  board: [
    (d, v) =>
      receipt(d.components, (r) => {
        r.board.color = v;
        r.board.clipColor = mix(v, "#FFFFFF", 0.55); // clip derives from the board
      }),
  ],
};

// Roles that the brand rule depends on.
const BRAND_ROLES = new Set(["ink", "bg", "cardBase"]);
// Mat and stitch sit on the frame's light surface: they follow the card base.
const EXTRA = {
  cardBase: [
    (d, v) =>
      frameEdit(d.components, (f) => {
        f.border.mat.color = v;
        f.border.stitch.color = v;
      }),
    (d, v) => decor(d.components, (m) => (m.banner.textColor = v)),
  ],
};

function propagate(draft, role) {
  const v = draft.design.colors[role];
  for (const write of ROLE_TARGETS[role] ?? []) write(draft, v);
  for (const write of EXTRA[role] ?? []) write(draft, v);
  if (BRAND_ROLES.has(role) && draft.components.brand) {
    const brand = draft.components.brand;
    brand.color = brandColorFor(draft);
    brand.colorMode = "manual";
    // v14: the outline is always the opposite of the fill (dark text → light outline and vice versa)
    const c = draft.design.colors;
    if (brand.outline) brand.outline.color = brand.color === c.ink ? c.cardBase : c.ink;
  }
}

export function applyRole(draft, role, hex) {
  if (!COLOR_ROLES.includes(role)) return;
  draft.design.colors[role] = hex;
  propagate(draft, role);
}

export function applyTheme(draft, id) {
  const theme = getTheme(id);
  if (!theme) return;
  draft.design.theme = { id };
  for (const role of COLOR_ROLES) draft.design.colors[role] = theme.colors[role];
  // v14: the sheet background gradient, exactly the theme's own stops (count kept, nothing interpolated).
  // Written BEFORE propagation so the brand rule samples the new background.
  if (theme.background) {
    draft.design.background = {
      type: "linear",
      direction: theme.background.direction,
      stops: theme.background.stops.map((st) => ({ pos: st.pos, color: st.color })),
    };
  }
  for (const role of COLOR_ROLES) propagate(draft, role);
  if (theme.cardEnd && draft.components.card) draft.components.card.fill.colors[1] = theme.cardEnd; // card end differs from MD
  const tray = draft.components.sd?.tray;
  if (theme.trayRimLight && tray?.rim) tray.rim.light = theme.trayRimLight;
}
