// Content-driven Cocktail Card layout (v13, card.sizing = "content"). Pure geometry, in design px.
// The card keeps its top edge and grows downward. Proportions reproduce the fixed card at its default
// aspect (0.63) for a short recipe, so a default card looks the same in both modes; the recipe
// column then grows with its rows. The illustration slot's height depends only on its width, so the
// picture never jumps while ingredients are typed.

const H0 = 0.63; // reference aspect of the fixed card: all vertical constants below are × (w × H0)

// Columns needed before the rows can be measured: the recipe (list) box position and width.
export function flowColumns(card, x, y, w) {
  const slot = card.image?.slot ?? 0.3;
  const d = slot - 0.3;
  const h0 = w * H0;
  return { list: { x: x + (0.4 + d) * w, y: y + 0.22 * h0, w: (0.43 - d) * w }, slot };
}

// All part rects once the list box height is known (listContentH = pads + rows).
export function flowParts(card, x, y, w, listContentH) {
  const h0 = w * H0;
  const { list, slot } = flowColumns(card, x, y, w);
  const listH = Math.max(listContentH, 0.48 * h0); // never shorter than the fixed card's list box
  const bodyTop = y + 0.22 * h0;
  const image = { x: x + 0.05 * w, y: bodyTop, w: slot * w, h: slot * w * ((0.7 * H0) / 0.3) };
  const listBox = { ...list, h: listH };
  const dividerY = listBox.y + listH + 0.045 * h0;
  const divider = { x: list.x, y: dividerY, w: list.w, h: 0 };
  const name = { x: list.x, y: dividerY + 0.035 * h0, w: list.w, h: 0.14 * h0 };
  const bodyBottom = Math.max(image.y + image.h, name.y + name.h);
  const rect = { x, y, w, h: bodyBottom + 0.08 * h0 - y };
  return {
    rect,
    parts: {
      title: { x: x + 0.05 * w, y: y + 0.05 * h0, w: 0.72 * w, h: 0.13 * h0 },
      image,
      list: listBox,
      divider,
      name,
      barcode: { x: x + 0.87 * w, y: y + 0.3 * h0, w: 0.08 * w, h: bodyBottom - (y + 0.3 * h0) },
      hex: { x: x + 0.91 * w, y: y + 0.19 * h0, w: 0, h: 0 },
    },
  };
}
