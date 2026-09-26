import { coasterLibrary, stickerLibrary } from "../library.js";
import { bannerRect } from "../decor/banner.js";
import { stickerRect } from "../components/stickers.js";
import { sheetLayout } from "../state.js";
import {
  characterRect,
  coasterRect,
  defaultCharacterPlacement,
  defaultCoasterPlacement,
  mdAreaRect,
} from "../components/md.js";
import {
  defaultDoilyPlacement,
  defaultSdCharacterPlacement,
  defaultTrayPlacement,
  doilyRect,
  sdAreaRect,
  sdCharacterRect,
  trayRect,
} from "../components/sd.js";
import { boxRect } from "../components/boxes.js";
import { brandRect } from "../components/brand.js";
import { cardRect } from "../components/card.js";
import { receiptBounds } from "../components/receipt.js";
import { confettiRect } from "../components/confetti.js";
import { paletteRect } from "../components/palette.js";

// Receipt bounds depend on measured text (paper height), so the adapter measures with this ctx.
const measureCtx = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;

// Component adapters for the interaction controller: geometry, state paths, linked movement
// and "위치 초기화" per draggable item.
//
// Linking is hierarchical: in a chain [a, b, c], moving a also moves b and c, moving b also
// moves c, moving c moves only c — only while the section is linked. Resizing never propagates,
// and relinking never snaps anything.

export function coasterSize(coaster) {
  if (coaster.source !== "file") return null;
  const status = coasterLibrary.status(coaster.file);
  return status.state === "ready" ? { width: status.width, height: status.height } : null;
}

const W = (s) => s.design.width;
const H = (s) => s.design.height;

// item = { id, get(state), exists(state), has(state), rect(state), anchor?(state), home(draft) }
//   exists: has position state (moves as a follower);  has: visible / editable (hit-testable)
function makeChain(section, linked, items) {
  return items.map((item, index) => {
    const followers = items.slice(index + 1);
    const snapshot = (state) => {
      const snap = { [item.id]: { x: item.get(state).x, y: item.get(state).y } };
      for (const f of followers) if (f.exists(state)) snap[f.id] = { x: f.get(state).x, y: f.get(state).y };
      return snap;
    };
    const moveBy = (draft, snap, dx, dy) => {
      const own = item.get(draft);
      own.x = snap[item.id].x + dx;
      own.y = snap[item.id].y + dy;
      if (!linked(draft)) return;
      for (const f of followers) {
        if (!f.exists(draft) || !snap[f.id]) continue;
        const target = f.get(draft);
        target.x = snap[f.id].x + dx;
        target.y = snap[f.id].y + dy;
      }
    };
    return {
      id: item.id,
      section,
      backdrop: item.backdrop === true, // large supports (frame, tray) never claim overlap priority
      has: item.has,
      rect: item.rect,
      anchor: item.anchor ?? ((s) => ({ x: item.get(s).x * W(s), y: item.get(s).y * H(s) })),
      getWidth: (s) => item.get(s).width,
      setWidth: (draft, w) => {
        item.get(draft).width = w;
      },
      snapshot,
      applyMove: moveBy,
      // Reset is a movement of this item, so the same linked rule applies to its followers.
      reset(draft) {
        const own = item.get(draft);
        const home = item.home(draft);
        moveBy(draft, snapshot(draft), home.x - own.x, home.y - own.y);
      },
    };
  });
}

export function createAdapters() {
  const c = (s) => s.components;

  const sdChain = makeChain("sd", (s) => c(s).sd.linked, [
    {
      id: "sd.character",
      get: (s) => c(s).sd.character,
      exists: (s) => Boolean(c(s).sd.character.asset),
      has: (s) => Boolean(c(s).sd.character.asset),
      rect: (s) => sdCharacterRect(c(s).sd.character, W(s), H(s)),
      home: (s) => defaultSdCharacterPlacement(c(s).sd.character.asset, c(s).sd.doily, W(s), H(s)),
    },
    {
      id: "sd.doily",
      get: (s) => c(s).sd.doily,
      exists: () => true,
      has: () => true,
      rect: (s) => doilyRect(c(s).sd.doily, W(s), H(s)),
      home: (s) => defaultDoilyPlacement(c(s).sd.doily.plate, W(s), H(s)),
    },
    {
      id: "sd.tray",
      backdrop: true,
      get: (s) => c(s).sd.tray,
      exists: () => true, // keeps following while hidden, so showing it later still lines up
      has: (s) => c(s).sd.tray.visible,
      rect: (s) => trayRect(c(s).sd.tray, W(s), H(s)),
      home: (s) => defaultTrayPlacement(c(s).sd.doily, W(s), H(s)),
    },
  ]);

  const mdChain = makeChain("md", (s) => c(s).md.linked, [
    {
      id: "md.character",
      get: (s) => c(s).md.character,
      exists: (s) => Boolean(c(s).md.character.asset),
      has: (s) => Boolean(c(s).md.character.asset),
      rect: (s) => characterRect(c(s).md.character, W(s), H(s)),
      home: (s) => defaultCharacterPlacement(c(s).md.character.asset, W(s), H(s)),
    },
    {
      id: "md.coaster",
      get: (s) => c(s).md.coaster,
      exists: (s) => c(s).md.coaster.source !== "none",
      has: (s) => c(s).md.coaster.source !== "none",
      rect: (s) => coasterRect(c(s).md.coaster, coasterSize(c(s).md.coaster), W(s), H(s)),
      home: (s) => defaultCoasterPlacement(c(s).md.character),
    },
  ]);

  // Standalone items (never linked): MD frame and sheet-level branding.
  const [mdFrame] = makeChain("md", () => false, [
    {
      id: "md.frame",
      backdrop: true,
      get: (s) => c(s).md.frame,
      exists: () => true,
      has: (s) => c(s).md.frame.visible,
      rect: (s) => boxRect(c(s).md.frame, W(s), H(s)),
      home: () => {
        const a = sheetLayout.mdArea;
        return { x: a.x + a.width / 2, y: a.y + a.height / 2 };
      },
    },
  ]);
  const [brand] = makeChain("background", () => false, [
    {
      id: "brand",
      get: (s) => c(s).brand,
      exists: () => true,
      has: (s) => c(s).brand.visible,
      rect: (s) => brandRect(c(s).brand, W(s), H(s)),
      anchor: (s) => ({ x: c(s).brand.x * W(s), y: c(s).brand.y * H(s) }), // top-left
      home: () => ({ x: sheetLayout.brand.x, y: sheetLayout.brand.y }),
    },
  ]);

  const [mdBanner] = makeChain("md", () => false, [
    {
      id: "md.banner",
      get: (s) => c(s).md.decor.banner,
      exists: () => true,
      has: (s) => c(s).md.decor.banner.visible,
      rect: (s) => bannerRect(c(s).md.decor.banner, W(s), H(s)),
      home: () => {
        const a = sheetLayout.mdArea;
        return { x: a.x + a.width / 2, y: a.y + a.height * 0.9 };
      },
    },
  ]);

  const [card] = makeChain("card", () => false, [
    {
      id: "card",
      get: (s) => c(s).card,
      exists: () => true,
      has: (s) => c(s).card.visible,
      rect: (s) => cardRect(c(s).card, W(s), H(s)),
      home: () => {
        const a = sheetLayout.cardArea;
        return { x: a.x + a.width / 2, y: a.y }; // v13: card.y is the top edge
      },
    },
  ]);

  const [receipt] = makeChain("receipt", () => false, [
    {
      id: "receipt",
      get: (s) => c(s).receipt,
      exists: () => true,
      has: (s) => c(s).receipt.visible,
      rect: (s) => receiptBounds(measureCtx, c(s).receipt, { orderHex: c(s).order.hex }, W(s), H(s)),
      home: (s) => {
        const a = sheetLayout.receiptArea;
        return { x: a.x + a.width / 2, y: a.y + (a.width * W(s) * c(s).receipt.aspect) / 2 / H(s) };
      },
    },
  ]);

  // v11: confetti regions (backdrops: never block the character / coaster) and the palette card.
  const confettiAdapters = ["front", "back"].map((layer) => {
    const [adapter] = makeChain("md", () => false, [
      {
        id: `md.confetti.${layer}`,
        backdrop: true,
        get: (s) => c(s).md.confetti[layer],
        exists: () => true,
        has: (s) => c(s).md.confetti[layer].on,
        rect: (s) => confettiRect(c(s).md.confetti[layer], W(s), H(s)),
        home: () => {
          const a = sheetLayout.mdArea;
          return { x: a.x + a.width / 2, y: a.y + a.height * (layer === "back" ? 0.2 : 0.35) };
        },
      },
    ]);
    return adapter;
  });
  const [palette] = makeChain("palette", () => false, [
    {
      id: "palette",
      get: (s) => c(s).palette,
      exists: () => true,
      has: (s) => c(s).palette.visible,
      rect: (s) => paletteRect(c(s).palette, W(s), H(s)),
      home: (s) => {
        const a = sheetLayout.paletteArea;
        return { x: a.x + a.width / 2, y: a.y + (a.width * W(s) * c(s).palette.aspect) / 2 / H(s) };
      },
    },
  ]);

  const imageSize = (st) => {
    if (st.source !== "file") return null;
    const status = stickerLibrary.status(st.file);
    return status.state === "ready" ? { width: status.width, height: status.height } : null;
  };
  const stickerAdapters = (state, layer) => {
    const list = c(state).stickers.filter((st) => (layer === "back" ? st.layer === "back" : st.layer !== "back"));
    // Later stickers are drawn on top → hit first.
    return list.reverse().map((st) => {
      const id = st.id;
      const [adapter] = makeChain("stickers", () => false, [
        {
          id: `sticker:${id}`,
          backdrop: layer === "back",
          get: (s) => c(s).stickers.find((x) => x.id === id),
          exists: (s) => Boolean(c(s).stickers.find((x) => x.id === id)),
          has: (s) => Boolean(c(s).stickers.find((x) => x.id === id)),
          rect: (s) => {
            const x = c(s).stickers.find((y) => y.id === id);
            return x ? stickerRect(x, imageSize(x), W(s), H(s)) : null;
          },
          home: () => ({ x: 0.5, y: 0.5 }),
        },
      ]);
      return adapter;
    });
  };

  return {
    // Top-most first, matching draw order: brand → front stickers → SD → MD (banner above frame)
    // → back stickers. Back stickers and big supports are backdrops.
    getAdapters: (state) => [
      brand,
      ...stickerAdapters(state, "front"),
      palette, // drawn right after the receipt
      receipt, // Layer 4: below front stickers and brand, above SD
      ...sdChain,
      card, // Layer 2: above MD, below SD
      ...mdChain,
      mdBanner,
      mdFrame,
      ...confettiAdapters,
      ...stickerAdapters(state, "back"),
    ],
    guides: [(s) => mdAreaRect(W(s), H(s)), (s) => sdAreaRect(W(s), H(s))],
  };
}
