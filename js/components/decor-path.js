// Curved decor layout along an ellipse. Pure: no DOM, no randomness.
// Callers measure glyph widths; this module only decides where each glyph goes.

export const DECOR_MAX_GRAPHEMES = 60;
const SAMPLES = 720;

export function splitGraphemes(text) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].map((s) => s.segment);
  }
  return Array.from(text);
}

// Cumulative arc length table for x = a·cosφ, y = b·sinφ, φ ∈ [0, 2π].
function arcTable(a, b) {
  const table = new Float64Array(SAMPLES + 1);
  let prevX = a;
  let prevY = 0;
  for (let i = 1; i <= SAMPLES; i += 1) {
    const phi = (i / SAMPLES) * Math.PI * 2;
    const x = a * Math.cos(phi);
    const y = b * Math.sin(phi);
    table[i] = table[i - 1] + Math.hypot(x - prevX, y - prevY);
    prevX = x;
    prevY = y;
  }
  return table;
}

function lengthAt(table, phi) {
  const t = ((((phi / (Math.PI * 2)) % 1) + 1) % 1) * SAMPLES;
  const i = Math.floor(t);
  return table[i] + (table[Math.min(SAMPLES, i + 1)] - table[i]) * (t - i);
}

function phiAt(table, length) {
  const total = table[SAMPLES];
  const s = ((length % total) + total) % total;
  let lo = 0;
  let hi = SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid] <= s) lo = mid;
    else hi = mid;
  }
  const span = table[hi] - table[lo] || 1;
  return ((lo + (s - table[lo]) / span) / SAMPLES) * Math.PI * 2;
}

/**
 * @param widths   advance width of each glyph (px)
 * @param a, b     ellipse half-axes of the text path (px)
 * @param startDeg center of the run, degrees (−90 = top, 90 = bottom)
 * @param spacing  extra px between glyphs
 * @returns [{ x, y, rotation }] relative to the ellipse center
 *
 * Auto-orientation: a run centered on the lower half is walked the other way and rotated by π,
 * so text always reads left → right and upright. No state needed.
 */
export function layoutDecor(widths, a, b, startDeg, spacing = 0) {
  if (!widths.length || a <= 0 || b <= 0) return [];
  const table = arcTable(a, b);
  const start = (startDeg * Math.PI) / 180;
  const flip = Math.sin(start) > 1e-9;
  const dir = flip ? -1 : 1;
  const advances = widths.map((w) => w + spacing);
  const total = advances.reduce((sum, w) => sum + w, 0) - spacing;
  const center = lengthAt(table, start);

  const placements = [];
  let cursor = -total / 2;
  for (let i = 0; i < widths.length; i += 1) {
    const along = cursor + widths[i] / 2;
    const phi = phiAt(table, center + dir * along);
    const tangent = Math.atan2(b * Math.cos(phi), -a * Math.sin(phi));
    placements.push({
      x: a * Math.cos(phi),
      y: b * Math.sin(phi),
      rotation: tangent + (flip ? Math.PI : 0),
    });
    cursor += advances[i];
  }
  return placements;
}
