// Cocktail Builder glass registry (v15, Phase 1a).
// TWO generators build every glass: tumbler(p) and stemmed(p). They are pure functions of their params and
// return unit-space geometry (x right, y DOWN, origin = bottom-center of the foot; widths ≈ 1).
// PRESETS are only starting shapes: choosing one copies a params SNAPSHOT into state, and the renderer
// draws from the saved params (never from PRESETS), so later preset tuning never changes saved sheets.
// The 9 presets are the initial tuning set, not a closed catalog.

export const GLASS_FAMILIES = ["tumbler", "stemmed"];
export const BOWL_TYPES = ["cone", "round", "tulip"];
export const HEIGHT_RANGE = { min: 0.7, max: 1.5 };

// Param schemas: [min, max, default] — used by normalization (project-io) and for clamping here.
export const PARAM_SCHEMA = {
  tumbler: {
    height: [0.3, 5, 1], topW: [0.2, 1.6, 1], bottomW: [0.2, 1.6, 1],
    baseThick: [0, 0.4, 0.12], wall: [0.01, 0.1, 0.04], facetLines: [0, 6, 0],
  },
  stemmed: {
    bowlW: [0.2, 1.6, 1], bowlDepth: [0.1, 3, 0.6], floor: [0, 0.9, 0], curve: [0, 1, 1], belly: [1, 1.5, 1.2],
    stemH: [0.05, 3, 0.75], footW: [0.2, 1.4, 0.6], wall: [0.01, 0.1, 0.035],
  },
};

export const PRESETS = {
  rocks: { label: "락", family: "tumbler", heightMap: null, params: { height: 0.95, topW: 1, bottomW: 1, baseThick: 0.13, wall: 0.04, facetLines: 0 } },
  oldFashioned: { label: "올드패션드", family: "tumbler", heightMap: null, params: { height: 0.86, topW: 1, bottomW: 0.8, baseThick: 0.15, wall: 0.045, facetLines: 3 } },
  highball: { label: "하이볼", family: "tumbler", heightMap: null, params: { height: 2.4, topW: 0.72, bottomW: 0.72, baseThick: 0.14, wall: 0.035, facetLines: 0 } },
  collins: { label: "콜린스", family: "tumbler", heightMap: null, params: { height: 2.3, topW: 0.92, bottomW: 0.84, baseThick: 0.16, wall: 0.04, facetLines: 0 } },
  martini: { label: "마티니", family: "stemmed", heightMap: { bowl: 0.8, stem: 0.2 }, params: { bowl: "cone", bowlW: 1, bowlDepth: 0.62, floor: 0, curve: 0, belly: 1, stemH: 0.75, footW: 0.62, wall: 0.035 } },
  coupe: { label: "쿠페", family: "stemmed", heightMap: { bowl: 0.3, stem: 0.7 }, params: { bowl: "round", bowlW: 1, bowlDepth: 0.34, floor: 0, curve: 1, belly: 1, stemH: 0.8, footW: 0.6, wall: 0.035 } },
  nickNora: { label: "닉앤노라", family: "stemmed", heightMap: { bowl: 0.4, stem: 0.6 }, params: { bowl: "round", bowlW: 0.84, bowlDepth: 0.42, floor: 0.45, curve: 0.3, belly: 1, stemH: 0.8, footW: 0.58, wall: 0.035 } },
  tulip: { label: "튤립", family: "stemmed", heightMap: { bowl: 0.6, stem: 0.4 }, params: { bowl: "tulip", bowlW: 0.7, bowlDepth: 0.95, floor: 0, curve: 1, belly: 1.22, stemH: 0.55, footW: 0.6, wall: 0.035 } },
  flute: { label: "플루트", family: "stemmed", heightMap: { bowl: 0.7, stem: 0.3 }, params: { bowl: "tulip", bowlW: 0.42, bowlDepth: 1.35, floor: 0, curve: 1, belly: 1.08, stemH: 0.7, footW: 0.5, wall: 0.03 } },
};
export const PRESET_ORDER = ["rocks", "oldFashioned", "highball", "collins", "martini", "coupe", "nickNora", "tulip", "flute"];

// A fresh glass state (params snapshot) from a preset.
export function glassFromPreset(id, height = 1) {
  const p = PRESETS[id] ?? PRESETS.martini;
  return {
    preset: PRESETS[id] ? id : "martini",
    family: p.family,
    baseParams: { ...p.params },
    heightMap: p.heightMap ? { ...p.heightMap } : null,
    height,
  };
}

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// "잔 높이": height changes GEOMETRY (not an image stretch). Stemmed glasses split the extra height between
// bowl and stem by the preset's heightMap; the foot never scales. Tumblers scale their height only.
export function resolveParams(glass) {
  const p = { ...glass.baseParams };
  const h = clamp(glass.height ?? 1, HEIGHT_RANGE.min, HEIGHT_RANGE.max);
  if (glass.family === "tumbler") {
    p.height = p.height * h;
  } else {
    const w = glass.heightMap ?? { bowl: 0.5, stem: 0.5 };
    const extra = (h - 1) * (p.bowlDepth + p.stemH);
    p.bowlDepth = Math.max(0.1, p.bowlDepth + extra * w.bowl);
    p.stemH = Math.max(0.05, p.stemH + extra * w.stem);
  }
  return p;
}

// --- profile helpers: right-half segments from the bottom center up to the rim, mirrored for the left ---
function tracePath(path, right, closeTop) {
  // left side: rim → bottom (mirrored + reversed), then right side: bottom → rim
  const start = right[right.length - 1];
  path.moveTo(-start.x, start.y);
  for (let i = right.length - 1; i >= 1; i--) {
    const seg = right[i];
    const prev = right[i - 1];
    if (seg.c1) path.bezierCurveTo(-seg.c2.x, seg.c2.y, -seg.c1.x, seg.c1.y, -prev.x, prev.y);
    else path.lineTo(-prev.x, prev.y);
  }
  for (let i = 1; i < right.length; i++) {
    const seg = right[i];
    if (seg.c1) path.bezierCurveTo(seg.c1.x, seg.c1.y, seg.c2.x, seg.c2.y, seg.x, seg.y);
    else path.lineTo(seg.x, seg.y);
  }
  if (closeTop) path.closePath();
  return path;
}

function bowlProfile(p, yb, yr, inset) {
  const R = p.bowlW / 2 - inset;
  const bottom = yb - inset * 1.8; // the inner floor sits above the outer bottom
  const D = bottom - yr;
  const pts = [{ x: 0, y: bottom }];
  if (p.bowl === "cone") {
    pts.push({ x: R, y: yr });
  } else if (p.bowl === "round") {
    const rf = R * p.floor;
    if (rf > 0) pts.push({ x: rf, y: bottom });
    // blend a straight wall (curve 0) with a rounded bowl (curve 1)
    const s1 = { x: lerp(rf, R, 1 / 3), y: lerp(bottom, yr, 1 / 3) };
    const s2 = { x: lerp(rf, R, 2 / 3), y: lerp(bottom, yr, 2 / 3) };
    const r1 = { x: lerp(rf, R, 0.95), y: bottom };
    const r2 = { x: R, y: bottom - D * 0.5 };
    pts.push({ x: R, y: yr, c1: { x: lerp(s1.x, r1.x, p.curve), y: lerp(s1.y, r1.y, p.curve) }, c2: { x: lerp(s2.x, r2.x, p.curve), y: lerp(s2.y, r2.y, p.curve) } });
  } else {
    // tulip: a belly wider than the rim, closing slightly toward the top
    pts.push({ x: R, y: yr, c1: { x: R * p.belly * 0.95, y: bottom }, c2: { x: R * p.belly * 1.02, y: bottom - D * 0.78 } });
  }
  return pts;
}

// Half-width of a right profile at height y (sampled; used for fitting ice / rim particles).
function widthAt(profile, y) {
  let best = 0;
  let prev = profile[0];
  for (let i = 1; i < profile.length; i++) {
    const seg = profile[i];
    for (let k = 0; k <= 24; k++) {
      const t = k / 24;
      let x;
      let yy;
      if (seg.c1) {
        const u = 1 - t;
        x = u * u * u * prev.x + 3 * u * u * t * seg.c1.x + 3 * u * t * t * seg.c2.x + t * t * t * seg.x;
        yy = u * u * u * prev.y + 3 * u * u * t * seg.c1.y + 3 * u * t * t * seg.c2.y + t * t * t * seg.y;
      } else {
        x = lerp(prev.x, seg.x, t);
        yy = lerp(prev.y, seg.y, t);
      }
      if (Math.abs(yy - y) < Math.abs(best.dy ?? Infinity)) best = { x, dy: yy - y };
    }
    prev = seg;
  }
  return best.x ?? 0;
}

const FOOT_T = 0.035;
const STEM_W = 0.045;

// Pure geometry for a glass state. All values in unit space (see header).
export function buildGlass(glass) {
  const p = resolveParams(glass);
  if (glass.family === "tumbler") {
    const H = p.height;
    const tw = p.topW / 2;
    const bw = p.bottomW / 2;
    const half = (y) => lerp(bw, tw, -y / H); // outer half-width at y (y ≤ 0)
    const outer = [{ x: 0, y: 0 }, { x: bw, y: 0 }, { x: tw, y: -H }];
    const floorY = -p.baseThick;
    const inner = [{ x: 0, y: floorY }, { x: half(floorY) - p.wall, y: floorY }, { x: tw - p.wall, y: -H }];
    const extras = new Path2D();
    extras.moveTo(-(half(floorY) - p.wall), floorY); // the top of the thick base
    extras.lineTo(half(floorY) - p.wall, floorY);
    const facets = [];
    for (let i = 1; i <= p.facetLines; i++) {
      const fx = lerp(-0.6, 0.6, i / (p.facetLines + 1));
      facets.push([fx * half(floorY), floorY, fx * tw, -H * 0.9]);
    }
    return {
      shell: tracePath(new Path2D(), outer, true),
      outline: tracePath(new Path2D(), outer, false),
      interior: tracePath(new Path2D(), inner, true),
      extras,
      facets,
      rim: { cx: 0, cy: -H, rx: tw, ry: tw * 0.1 },
      fillRange: { bottom: floorY, top: -H + H * 0.07 },
      innerHalfWidth: (y) => half(y) - p.wall,
      bounds: { w: Math.max(p.topW, p.bottomW), h: H + tw * 0.1 },
    };
  }
  // stemmed
  const yb = -(FOOT_T + p.stemH); // bottom of the bowl
  const yr = yb - p.bowlDepth; // rim
  const outer = bowlProfile(p, yb, yr, 0);
  const inner = bowlProfile(p, yb, yr, p.wall);
  // Stem + foot as ONE continuous silhouette (mirrored profile): a small knob under the bowl, a straight stem,
  // a curved flare into the foot, and a softly rounded foot edge. No overlapping pieces, no hard corners.
  const sw = STEM_W / 2;
  const F = p.footW / 2;
  const footTop = -FOOT_T;
  const flare = Math.min(0.14, p.stemH * 0.3);
  const knob = Math.min(0.05, p.stemH * 0.12);
  const stem = [
    { x: 0, y: 0 },
    { x: F * 0.96, y: 0 },
    { x: F, y: footTop * 0.55, c1: { x: F * 1.005, y: 0 }, c2: { x: F * 1.01, y: footTop * 0.3 } },
    { x: F * 0.9, y: footTop, c1: { x: F * 0.99, y: footTop * 0.8 }, c2: { x: F * 0.96, y: footTop } },
    { x: sw, y: footTop - flare, c1: { x: F * 0.35, y: footTop }, c2: { x: sw, y: footTop - flare * 0.45 } },
    { x: sw, y: yb + knob },
    { x: sw * 1.25, y: yb, c1: { x: sw, y: yb + knob * 0.45 }, c2: { x: sw * 1.1, y: yb + knob * 0.12 } }, // gentle widening into the bowl
  ];
  const extras = tracePath(new Path2D(), stem, false); // stroke: open at the top, where it meets the bowl
  const stemShell = tracePath(new Path2D(), stem, true); // fill
  const R = p.bowlW / 2;
  const belly = p.bowl === "tulip" ? R * p.belly * 0.93 : R;
  const innerBottom = yb - p.wall * 1.8;
  return {
    shell: tracePath(new Path2D(), outer, true),
    outline: tracePath(new Path2D(), outer, false),
    interior: tracePath(new Path2D(), inner, true),
    extras,
    stemShell,
    stemHighlight: { x: -sw * 0.25, y0: yb + knob, y1: footTop - flare * 0.6 },
    facets: [],
    rim: { cx: 0, cy: yr, rx: R, ry: R * 0.1 },
    fillRange: { bottom: innerBottom, top: yr + (innerBottom - yr) * 0.07 },
    innerHalfWidth: (y) => widthAt(inner, y),
    bounds: { w: Math.max(belly * 2, p.footW, p.bowlW), h: -yr + R * 0.1 },
  };
}
