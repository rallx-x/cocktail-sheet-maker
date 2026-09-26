import { createRng, pickWeighted } from "./prng.js";
import { TILE_SHADES, forQuincunx, diagonalLines, forGrid, forHexCenters, scatter, jitteredLattice, eachQuad, hexagon, heart, star, gear, capsule, hexToRgb } from "./pattern-helpers.js";

// Built-in patterns 11–19 (moved from builtin.js unchanged; order preserved).
export default [
  {
    id: "triangles",
    group: "tiles",
    name: "삼각형 격자",
    baseSize: 0.115,
    random: true,
    draw(ctx, { width, height, cell, seed }) {
      const rng = createRng(seed);
      const h = (cell * Math.sqrt(3)) / 2;
      for (let row = 0; row * h < height; row += 1) {
        const y0 = row * h;
        const y1 = y0 + h;
        for (let col = -2; (col * cell) / 2 < width + cell; col += 1) {
          const x = (col * cell) / 2;
          const alpha = pickWeighted(rng, TILE_SHADES);
          if (!alpha) continue;
          const up = (row + col) % 2 === 0;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          if (up) {
            ctx.moveTo(x, y1);
            ctx.lineTo(x + cell / 2, y0);
            ctx.lineTo(x + cell, y1);
          } else {
            ctx.moveTo(x, y0);
            ctx.lineTo(x + cell / 2, y1);
            ctx.lineTo(x + cell, y0);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  },
  // ----- Batch 2 -----
  {
    id: "plaid",
    group: "tiles",
    name: "플래드 (타탄 체크)",
    baseSize: 0.09,
    draw(ctx, { width, height, cell }) {
      // Bands overlap on purpose: crossings get darker, like woven fabric.
      const bands = [
        [0, 0.38, 0.45],
        [0.56, 0.62, 0.8],
        [0.7, 0.74, 0.35],
      ];
      for (const [from, to, alpha] of bands) {
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        for (let x = 0; x < width; x += cell) ctx.rect(x + from * cell, 0, (to - from) * cell, height);
        ctx.fill();
        ctx.beginPath();
        for (let y = 0; y < height; y += cell) ctx.rect(0, y + from * cell, width, (to - from) * cell);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    id: "brick",
    group: "tiles",
    name: "벽돌",
    baseSize: 0.05,
    draw(ctx, { width, height, cell }) {
      const rowH = cell * 0.5;
      const t = cell * 0.045;
      for (let row = 0, y = 0; y <= height + t; row += 1, y += rowH) {
        ctx.rect(0, y - t / 2, width, t);
        const offset = row % 2 ? cell / 2 : 0;
        for (let x = offset; x <= width + t; x += cell) ctx.rect(x - t / 2, y, t, rowH);
      }
      ctx.fill("nonzero");
    },
  },
  {
    id: "chevrons",
    group: "lines",
    name: "셰브론 (지그재그)",
    baseSize: 0.045,
    draw(ctx, { width, height, cell }) {
      ctx.lineWidth = cell * 0.08;
      ctx.lineJoin = "miter";
      const amp = cell * 0.25;
      for (let y = -cell; y < height + cell; y += cell * 0.5) {
        ctx.moveTo(-cell, y);
        for (let i = 0, x = -cell; x < width + cell; i += 1, x += cell / 2) {
          ctx.lineTo(x + cell / 2, y + (i % 2 ? 0 : -amp));
        }
      }
      ctx.stroke();
    },
  },
  {
    id: "waves",
    group: "lines",
    name: "물결",
    baseSize: 0.05,
    draw(ctx, { width, height, cell }) {
      ctx.lineWidth = cell * 0.07;
      ctx.lineCap = "round";
      const amp = cell * 0.18;
      for (let y = 0; y < height + cell; y += cell * 0.5) {
        ctx.moveTo(-cell, y);
        for (let x = -cell; x < width + cell; x += cell) {
          ctx.quadraticCurveTo(x + cell / 4, y - amp * 2, x + cell / 2, y);
          ctx.quadraticCurveTo(x + (cell * 3) / 4, y + amp * 2, x + cell, y);
        }
      }
      ctx.stroke();
    },
  },
  {
    id: "heartbeat",
    group: "lines",
    name: "심전도 선",
    baseSize: 0.09,
    draw(ctx, { width, height, cell }) {
      ctx.lineWidth = cell * 0.035;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      // One beat per cell, as [x, y] fractions of the cell; rows are cell apart.
      const beat = [
        [0, 0], [0.3, 0], [0.34, -0.06], [0.38, 0], [0.44, 0], [0.48, 0.12],
        [0.53, -0.42], [0.58, 0.3], [0.62, 0], [0.7, 0], [0.75, -0.1], [0.8, 0], [1, 0],
      ];
      for (let row = 0, y = cell / 2; y < height + cell; row += 1, y += cell * 0.75) {
        const offset = row % 2 ? cell * 0.45 : 0;
        ctx.moveTo(-cell + offset, y);
        for (let x = -cell + offset; x < width + cell; x += cell) {
          for (const [fx, fy] of beat) ctx.lineTo(x + fx * cell, y + fy * cell);
        }
      }
      ctx.stroke();
    },
  },
  {
    id: "bubbles",
    group: "scatter",
    name: "방울 (원 테두리)",
    baseSize: 0.06,
    random: true,
    draw(ctx, { width, height, cell, seed }) {
      const rng = createRng(seed);
      ctx.lineWidth = cell * 0.05;
      scatter(rng, width, height, cell, 1.1, 1500, (x, y) => {
        const r = cell * (0.12 + rng() * 0.22);
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, Math.PI * 2);
      });
      ctx.stroke();
    },
  },
  {
    id: "pills",
    minScale: 0.4, // smaller would make the preview sluggish
    group: "shapes",
    name: "알약",
    baseSize: 0.05,
    draw(ctx, { width, height, cell }) {
      ctx.lineWidth = cell * 0.055;
      const len = cell * 0.62;
      const rad = cell * 0.13;
      forGrid(width, height, cell, 0.6, (x, y) => capsule(ctx, x, y, len, rad, -Math.PI / 4));
      ctx.stroke();
    },
  },
  {
    id: "hearts",
    group: "scatter",
    name: "하트",
    baseSize: 0.07,
    random: true,
    draw(ctx, { width, height, cell, seed }) {
      const rng = createRng(seed);
      scatter(rng, width, height, cell, 1.2, 1400, (x, y) => {
        heart(ctx, x, y, cell * (0.18 + rng() * 0.42));
      });
      ctx.fill();
    },
  },
];
