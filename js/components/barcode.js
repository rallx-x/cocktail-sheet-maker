import { createRng } from "../patterns/prng.js";

// Visual barcode (not scannable). ONE persistent seed (components.barcode.seed) is shared by the
// Cocktail Card and the Receipt; each renders its own geometry from the same seed in its own
// orientation and bounds. Only an explicit regenerate changes the seed.

const MODULES_GUARD = [1, 1, 1];

// Returns the bar/space pattern in modules: [bar, space, bar, space, …]. Deterministic.
export function barcodePattern(seed, bars = 34) {
  const rng = createRng(seed);
  const pattern = [...MODULES_GUARD];
  for (let i = 0; i < bars * 2; i += 1) pattern.push(1 + Math.floor(rng() * 3)); // 1–3 modules
  pattern.push(...MODULES_GUARD);
  return pattern;
}

// orientation "vertical": bars are horizontal lines stacked down the strip (card edge);
// "horizontal": vertical bars across the width (receipt).
export function drawBarcode(ctx, rect, seed, color, orientation = "vertical") {
  const pattern = barcodePattern(seed);
  const total = pattern.reduce((sum, m) => sum + m, 0);
  const length = orientation === "vertical" ? rect.h : rect.w;
  const unit = length / total;
  ctx.save();
  ctx.fillStyle = color;
  let at = 0;
  pattern.forEach((modules, i) => {
    const size = modules * unit;
    if (i % 2 === 0) {
      if (orientation === "vertical") ctx.fillRect(rect.x, rect.y + at, rect.w, size);
      else ctx.fillRect(rect.x + at, rect.y, size, rect.h);
    }
    at += size;
  });
  ctx.restore();
}
