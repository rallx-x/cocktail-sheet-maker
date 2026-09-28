import { registerDraftFinalizer } from "../state.js";

// v17 Palette Link ON/OFF (user rule: "the side edited last wins").
//   ON  → a stop's / the rim's live chip ref wins (the pre-v17 behavior).
//   OFF → every stop and the rim draw their own stored color; refs are KEPT so relinking knows the pairs.
// While OFF, editing either side records lastEdited; relinking then copies that side onto the other.
// Every action here is one updateState → one undo step.

const liveRef = (c, chips) => c?.ref && chips.some((ch) => ch.id === c.ref);

// ON → OFF: freeze what is visible right now (stored colors := current chip colors), refs kept.
export function unlink(draft) {
  const b = draft.components.card.builder;
  const chips = draft.components.palette.chips;
  for (const c of [...b.liquid.stops, b.rim.color]) {
    const chip = chips.find((ch) => ch.id === c.ref);
    if (chip) c.color = chip.hex;
  }
  b.paletteLink = { on: false, lastEdited: "palette" };
}

// OFF → ON. Stops without a live ref are paired with unused chips in palette order (never creating chips);
// stops beyond the chip count stay unlinked (ref null → own color). Then the last-edited side is copied.
export function relink(draft) {
  const b = draft.components.card.builder;
  const chips = draft.components.palette.chips;
  const used = new Set(b.liquid.stops.filter((st) => liveRef(st, chips)).map((st) => st.ref));
  const free = chips.filter((ch) => !used.has(ch.id));
  for (const st of b.liquid.stops) {
    if (liveRef(st, chips)) continue;
    const chip = free.shift();
    st.ref = chip ? chip.id : null;
  }
  const cocktailWins = b.paletteLink?.lastEdited === "cocktail";
  for (const c of [...b.liquid.stops, b.rim.color]) {
    const chip = chips.find((ch) => ch.id === c.ref);
    if (!chip) continue;
    if (cocktailWins) chip.hex = c.color; // cocktail colors go into the Character Color Palette
    else c.color = chip.hex;
  }
  b.paletteLink = { on: true, lastEdited: "palette" };
}

// Would relinking now overwrite palette colors? (drives the contextual hint)
export function relinkOverwritesPalette(state) {
  const b = state.components.card.builder;
  if (b.paletteLink?.on !== false || b.paletteLink.lastEdited !== "cocktail") return false;
  const chips = state.components.palette.chips;
  return [...b.liquid.stops, b.rim.color].some((c) => {
    const chip = chips.find((ch) => ch.id === c.ref);
    return chip && chip.hex.toUpperCase() !== String(c.color).toUpperCase();
  }) || b.liquid.stops.some((st) => !liveRef(st, chips));
}

// While OFF: record which side changed last. Palette = any chip hex; cocktail = any stop / rim color.
const cocktailSig = (b) => JSON.stringify([b.liquid.stops.map((s) => s.color), b.rim.color.color]);
const paletteSig = (p) => JSON.stringify(p.chips.map((c) => [c.id, c.hex]));
registerDraftFinalizer((draft, prev) => {
  const b = draft.components?.card?.builder;
  const pb = prev.components?.card?.builder;
  if (!b || !pb || b.paletteLink?.on !== false || pb.paletteLink?.on !== false) return; // only while it stays OFF
  if (b.presetId !== pb.presetId) return; // a Random apply sets its own lastEdited ("palette")
  if (cocktailSig(b) !== cocktailSig(pb)) b.paletteLink.lastEdited = "cocktail";
  else if (paletteSig(draft.components.palette) !== paletteSig(prev.components.palette)) b.paletteLink.lastEdited = "palette";
});
