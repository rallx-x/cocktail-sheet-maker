// Shared drawing helpers for the built-in patterns (split out of builtin.js; code unchanged).
// Shade levels (alpha within the pattern) for tile patterns, [alpha, weight].
export const TILE_SHADES = [
  [0, 30],
  [0.12, 16],
  [0.22, 16],
  [0.36, 14],
  [0.55, 12],
  [0.8, 7],
  [1, 5],
];

// Quincunx ("angled dots"): a square lattice plus the centers of each square.
export function forQuincunx(width, height, cell, callback) {
  const reach = cell * 0.25;
  for (let y = 0; y <= height + reach; y += cell) {
    for (let x = 0; x <= width + reach; x += cell) {
      callback(x, y);
      callback(x + cell / 2, y + cell / 2);
    }
  }
}

// 45° parallel lines covering the sheet; direction 1 = "/", -1 = "\".
// Perpendicular spacing between lines = cell / √2, horizontal spacing = cell.
export function diagonalLines(ctx, width, height, cell, direction) {
  const span = width + height;
  for (let c = -height; c <= span; c += cell) {
    if (direction === 1) {
      ctx.moveTo(c, height);
      ctx.lineTo(c + height, 0);
    } else {
      ctx.moveTo(c, 0);
      ctx.lineTo(c + height, height);
    }
  }
}

export function forGrid(width, height, cell, reachFactor, callback) {
  const reach = cell * reachFactor;
  for (let y = cell / 2; y < height + reach; y += cell) {
    for (let x = cell / 2; x < width + reach; x += cell) callback(x, y);
  }
}

export function forHexCenters(width, height, cell, callback) {
  const r = cell / Math.sqrt(3);
  for (let row = -1, y = -r; y < height + r * 2; row += 1, y = row * r * 1.5) {
    const offset = row % 2 ? cell / 2 : 0;
    for (let x = -cell + offset; x < width + cell; x += cell) callback(x, y);
  }
}

// Random positions, spread evenly: the area is split into equal cells and each cell
// gets one point at a random spot inside it (no clumps, no big empty holes).
// Output depends only on sheet size, cell, density and the rng (never on render order);
// the number of points is capped so small scales stay fast.
export function scatter(rng, width, height, cell, density, cap, callback) {
  const margin = cell * 0.6;
  const spanX = width + margin * 2;
  const spanY = height + margin * 2;
  let step = cell / Math.sqrt(density);
  const count = Math.ceil(spanX / step) * Math.ceil(spanY / step);
  if (count > cap) step *= Math.sqrt(count / cap);
  for (let y = -margin; y < height + margin; y += step) {
    for (let x = -margin; x < width + margin; x += step) {
      callback(x + rng() * step, y + rng() * step);
    }
  }
}

export function jitteredLattice(rng, width, height, cell, jitter) {
  const rows = [];
  for (let y = -cell; y <= height + cell; y += cell) {
    const row = [];
    for (let x = -cell; x <= width + cell; x += cell) {
      row.push([x + (rng() - 0.5) * 2 * jitter * cell, y + (rng() - 0.5) * 2 * jitter * cell]);
    }
    rows.push(row);
  }
  return rows;
}

export function eachQuad(points, callback) {
  for (let row = 0; row < points.length - 1; row += 1) {
    for (let col = 0; col < points[row].length - 1; col += 1) {
      callback(points[row][col], points[row][col + 1], points[row + 1][col], points[row + 1][col + 1]);
    }
  }
}

export function hexagon(ctx, x, y, r) {
  for (let k = 0; k < 6; k += 1) {
    const angle = Math.PI / 6 + (k * Math.PI) / 3;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    if (k) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

// size = overall width of the heart.
export function heart(ctx, x, y, size) {
  const s = size;
  ctx.moveTo(x, y + s * 0.38);
  ctx.bezierCurveTo(x - s * 0.62, y - s * 0.02, x - s * 0.36, y - s * 0.62, x, y - s * 0.22);
  ctx.bezierCurveTo(x + s * 0.36, y - s * 0.62, x + s * 0.62, y - s * 0.02, x, y + s * 0.38);
  ctx.closePath();
}

export function star(ctx, x, y, outer, inner, rotation) {
  for (let k = 0; k < 10; k += 1) {
    const r = k % 2 ? inner : outer;
    const angle = rotation - Math.PI / 2 + (k * Math.PI) / 5;
    const px = x + r * Math.cos(angle);
    const py = y + r * Math.sin(angle);
    if (k) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.closePath();
}

export function gear(ctx, x, y, outer, root, teeth) {
  const step = (Math.PI * 2) / teeth;
  for (let k = 0; k < teeth; k += 1) {
    const a = k * step;
    const points = [
      [root, a],
      [outer, a + step * 0.12],
      [outer, a + step * 0.45],
      [root, a + step * 0.57],
    ];
    points.forEach(([r, angle], i) => {
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (k === 0 && i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
  }
  ctx.closePath();
}

// Capsule outline centred at (x, y), rotated by angle, without changing the transform.
export function capsule(ctx, x, y, length, radius, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const half = length / 2 - radius;
  const ax = x - cos * half;
  const ay = y - sin * half;
  const bx = x + cos * half;
  const by = y + sin * half;
  ctx.moveTo(ax + Math.cos(angle + Math.PI / 2) * radius, ay + Math.sin(angle + Math.PI / 2) * radius);
  ctx.arc(ax, ay, radius, angle + Math.PI / 2, angle + (Math.PI * 3) / 2);
  ctx.arc(bx, by, radius, angle - Math.PI / 2, angle + Math.PI / 2);
  ctx.closePath();
}

export function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
