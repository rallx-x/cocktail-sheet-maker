// Auto color for the MD frame / decorations / brand: a deterministic, render-time derivation from
// the sheet background color. No color state is duplicated: stored manual colors stay untouched and
// return when the mode is switched back to manual. Pure module (no DOM).
//
// Constants are PROVISIONAL, tuned against the test matrix in the v11 report
// (dark, light, saturated red/blue, neutral mid, white, black).

export function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s, l];
}

export function hsl(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`.toUpperCase();
}

export function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** Palette derived from a background color. */
export function autoPalette(background) {
  const [h0, s0] = rgbToHsl(hexToRgb(background));
  const neutral = s0 < 0.08;
  const h = neutral ? 40 : h0; // neutral backgrounds get a soft gold accent
  const s = neutral ? 0.45 : clamp(s0, 0.25, 0.55);
  const dark = luminance(background) < 0.3;
  const fill = hsl(h, s * 0.2, 0.985);

  // Line: the preferred tone (l = .40) if it clears both the light frame fill (≥ 3:1) and the
  // background (≥ 1.5:1); otherwise the nearest lightness that does (deterministic search order),
  // else the best compromise. Mid-tone saturated backgrounds need this.
  const lineL = searchLightness(0.4, 0.1, 0.62, (l) => {
    const c = hsl(h, s, l);
    return Math.min(contrast(c, fill) / 3, contrast(c, background) / 1.5);
  });
  // Text placed directly on the background (brand outside the frame): the most readable tint.
  let bestL = 0.9;
  let best = 0;
  for (let l = 0.96; l >= 0.08; l -= 0.02) {
    const c = contrast(hsl(h, 0.25, l), background);
    if (c > best + 1e-9) {
      best = c;
      bestL = l;
    }
  }
  return {
    dark,
    line: hsl(h, s, lineL),
    inner: hsl(h, s * 0.8, Math.min(0.72, lineL + 0.2)),
    fill,
    fill2: hsl(h, s * 0.3, 0.94),
    accent: hsl(h, 0.45, Math.min(0.62, lineL + 0.16)),
    accent2: hsl(h, 0.35, 0.72),
    molding: dark ? hsl(h, s, 0.62) : hsl(h, s, 0.35),
    mat: hsl(h, s * 0.2, 0.97),
    onBackground: hsl(h, 0.25, bestL),
  };
}

// Steps outward from `start` (start, start−.01, start+.01, …) within [lo, hi]; returns the first
// lightness whose score ≥ 1, else the best-scoring one. Deterministic.
function searchLightness(start, lo, hi, score) {
  let bestL = start;
  let best = -Infinity;
  for (let i = 0; i <= 60; i += 1) {
    for (const l of i === 0 ? [start] : [start - i * 0.01, start + i * 0.01]) {
      if (l < lo || l > hi) continue;
      const v = score(l);
      if (v >= 1) return l;
      if (v > best) {
        best = v;
        bestL = l;
      }
    }
  }
  return bestL;
}

/**
 * Effective (render-only) copies of frame + decor with auto colors applied. Inputs are never mutated;
 * when colorMode is not "auto" the originals are returned as-is.
 */
export function resolveFrameColors(frame, decor, background) {
  if (!frame || frame.colorMode !== "auto") return { frame, decor };
  const p = autoPalette(background);
  const f = structuredClone(frame);
  f.fill.colors = [p.fill, p.fill2];
  f.border.color = p.line;
  f.border.multi.innerColor = p.inner;
  f.border.molding.color = p.molding;
  f.border.mat.color = p.mat;
  if (f.border.stitch) f.border.stitch.color = p.fill;
  const d = decor ? structuredClone(decor) : decor;
  if (d) {
    d.corners.color = p.accent;
    d.top.color = p.accent;
    d.top.color2 = p.accent2;
  }
  return { frame: f, decor: d, palette: p };
}
