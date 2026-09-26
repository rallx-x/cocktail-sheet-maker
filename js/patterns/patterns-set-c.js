import { createRng, pickWeighted } from "./prng.js";
import { TILE_SHADES, forQuincunx, diagonalLines, forGrid, forHexCenters, scatter, jitteredLattice, eachQuad, hexagon, heart, star, gear, capsule, hexToRgb } from "./pattern-helpers.js";

// Built-in patterns 20–28 (moved from builtin.js unchanged; order preserved).
export default [
  {
    id: "heart-outlines",
    minScale: 0.5, // smaller would make the preview sluggish
    group: "shapes",
    name: "하트 테두리",
    baseSize: 0.05,
    draw(ctx, { width, height, cell }) {
      ctx.lineWidth = cell * 0.05;
      ctx.lineJoin = "round";
      forQuincunx(width, height, cell, (x, y) => heart(ctx, x, y, cell * 0.34));
      ctx.stroke();
    },
  },
  {
    id: "stars",
    group: "scatter",
    name: "별",
    baseSize: 0.07,
    random: true,
    draw(ctx, { width, height, cell, seed }) {
      const rng = createRng(seed);
      scatter(rng, width, height, cell, 1.3, 1600, (x, y) => {
        const r = cell * (0.06 + rng() * 0.2);
        star(ctx, x, y, r, r * 0.45, rng() * Math.PI * 2);
      });
      ctx.fill();
    },
  },
  {
    id: "gears",
    minScale: 0.5, // smaller would make the preview sluggish
    group: "shapes",
    name: "톱니바퀴",
    baseSize: 0.06,
    draw(ctx, { width, height, cell }) {
      ctx.lineWidth = cell * 0.035;
      ctx.lineJoin = "round";
      forGrid(width, height, cell, 0.5, (x, y) => {
        gear(ctx, x, y, cell * 0.4, cell * 0.32, 10);
        ctx.moveTo(x + cell * 0.12, y);
        ctx.arc(x, y, cell * 0.12, 0, Math.PI * 2);
      });
      ctx.stroke();
    },
  },
  {
    id: "diamonds",
    minScale: 0.4, // smaller would make the preview sluggish
    group: "shapes",
    name: "다이아몬드",
    baseSize: 0.045,
    draw(ctx, { width, height, cell }) {
      const w = cell * 0.2;
      const h = cell * 0.3;
      forQuincunx(width, height, cell, (x, y) => {
        ctx.moveTo(x, y - h);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x, y + h);
        ctx.lineTo(x - w, y);
        ctx.closePath();
      });
      ctx.fill();
    },
  },
  {
    id: "hexagon-lines",
    minScale: 0.4, // smaller would make the preview sluggish
    group: "lines",
    name: "벌집 (선)",
    baseSize: 0.06,
    draw(ctx, { width, height, cell }) {
      ctx.lineWidth = cell * 0.06;
      ctx.lineJoin = "round";
      const r = cell / Math.sqrt(3);
      forHexCenters(width, height, cell, (x, y) => hexagon(ctx, x, y, r * 0.82));
      ctx.stroke();
      ctx.lineWidth = cell * 0.03;
      ctx.beginPath();
      forHexCenters(width, height, cell, (x, y) => hexagon(ctx, x, y, r * 0.55));
      ctx.stroke();
    },
  },
  {
    id: "glass",
    group: "tiles",
    name: "유리 조각",
    baseSize: 0.14,
    random: true,
    draw(ctx, { width, height, cell, seed }) {
      const rng = createRng(seed);
      const points = jitteredLattice(rng, width, height, cell, 0.42);
      const shades = [[0, 14], [0.1, 16], [0.2, 18], [0.32, 16], [0.46, 12], [0.62, 8], [0.8, 4]];
      eachQuad(points, (a, b, c, d) => {
        const tris = rng() < 0.5 ? [[a, b, d], [a, d, c]] : [[a, b, c], [b, d, c]];
        for (const tri of tris) {
          const alpha = pickWeighted(rng, shades);
          if (!alpha) continue;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.moveTo(tri[0][0], tri[0][1]);
          ctx.lineTo(tri[1][0], tri[1][1]);
          ctx.lineTo(tri[2][0], tri[2][1]);
          ctx.closePath();
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
    },
  },
  {
    id: "irregular",
    group: "lines",
    name: "불규칙 타일",
    baseSize: 0.07,
    random: true,
    draw(ctx, { width, height, cell, seed }) {
      const rng = createRng(seed);
      const points = jitteredLattice(rng, width, height, cell, 0.28);
      ctx.lineWidth = cell * 0.045;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (let row = 0; row < points.length; row += 1) {
        for (let col = 0; col < points[row].length; col += 1) {
          const p = points[row][col];
          const right = points[row][col + 1];
          const down = points[row + 1]?.[col];
          if (right) {
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(right[0], right[1]);
          }
          if (down) {
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(down[0], down[1]);
          }
        }
      }
      ctx.stroke();
    },
  },
  {
    id: "bokeh",
    group: "scatter",
    name: "보케 (흐린 원)",
    baseSize: 0.1,
    random: true,
    draw(ctx, { width, height, cell, seed, color }) {
      const rng = createRng(seed);
      const [r, g, b] = hexToRgb(color);
      scatter(rng, width, height, cell, 1.6, 700, (x, y) => {
        const radius = cell * (0.12 + rng() * 0.38);
        const alpha = 0.25 + rng() * 0.6;
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(${r},${g},${b},${alpha})`);
        gradient.addColorStop(0.6, `rgba(${r},${g},${b},${alpha * 0.85})`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    },
  },
  {
    id: "confetti",
    group: "scatter",
    name: "컨페티",
    baseSize: 0.05,
    random: true,
    draw(ctx, { width, height, cell, seed }) {
      const rng = createRng(seed);
      ctx.lineWidth = cell * 0.07;
      ctx.lineCap = "round";
      scatter(rng, width, height, cell, 1.3, 2500, (x, y) => {
        const len = rng() < 0.2 ? 0 : cell * (0.08 + rng() * 0.32);
        const angle = rng() * Math.PI;
        const dx = (Math.cos(angle) * len) / 2;
        const dy = (Math.sin(angle) * len) / 2;
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
      });
      ctx.stroke();
    },
  },
];
