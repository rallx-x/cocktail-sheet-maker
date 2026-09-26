import { createRng, pickWeighted } from "./prng.js";
import { TILE_SHADES, forQuincunx, diagonalLines, forGrid, forHexCenters, scatter, jitteredLattice, eachQuad, hexagon, heart, star, gear, capsule, hexToRgb } from "./pattern-helpers.js";

// Built-in patterns 1–10 (moved from builtin.js unchanged; order preserved).
export default [
  {
    id: "dots-circle",
    group: "dots",
    name: "사선 점 (원)",
    baseSize: 0.035,
    draw(ctx, { width, height, cell }) {
      forQuincunx(width, height, cell, (x, y) => {
        ctx.moveTo(x + cell * 0.1, y);
        ctx.arc(x, y, cell * 0.1, 0, Math.PI * 2);
      });
      ctx.fill();
    },
  },
  {
    id: "dots-plus",
    group: "dots",
    name: "사선 점 (플러스)",
    baseSize: 0.035,
    draw(ctx, { width, height, cell }) {
      const arm = cell * 0.16;
      const thick = cell * 0.05;
      forQuincunx(width, height, cell, (x, y) => {
        ctx.rect(x - arm, y - thick, arm * 2, thick * 2);
        ctx.rect(x - thick, y - arm, thick * 2, arm * 2);
      });
      ctx.fill("nonzero");
    },
  },
  {
    id: "dots-square",
    group: "dots",
    name: "사선 점 (네모)",
    baseSize: 0.035,
    draw(ctx, { width, height, cell }) {
      const half = cell * 0.09;
      forQuincunx(width, height, cell, (x, y) => ctx.rect(x - half, y - half, half * 2, half * 2));
      ctx.fill();
    },
  },
  {
    id: "polka",
    group: "dots",
    name: "폴카 도트",
    baseSize: 0.03,
    draw(ctx, { width, height, cell }) {
      const r = cell * 0.22;
      for (let y = cell / 2; y < height + r; y += cell) {
        for (let x = cell / 2; x < width + r; x += cell) {
          ctx.moveTo(x + r, y);
          ctx.arc(x, y, r, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    },
  },
  {
    id: "grid-square",
    group: "lines",
    name: "격자 (네모)",
    baseSize: 0.04,
    draw(ctx, { width, height, cell }) {
      const t = cell * 0.05;
      for (let x = 0; x <= width + t; x += cell) ctx.rect(x - t / 2, 0, t, height);
      for (let y = 0; y <= height + t; y += cell) ctx.rect(0, y - t / 2, width, t);
      ctx.fill("nonzero");
    },
  },
  {
    id: "grid-diamond",
    group: "lines",
    name: "격자 (다이아몬드)",
    baseSize: 0.04,
    draw(ctx, { width, height, cell }) {
      ctx.lineWidth = cell * 0.05;
      diagonalLines(ctx, width, height, cell, 1);
      diagonalLines(ctx, width, height, cell, -1);
      ctx.stroke();
    },
  },
  {
    id: "stripes",
    group: "lines",
    name: "줄무늬",
    baseSize: 0.03,
    draw(ctx, { width, height, cell }) {
      ctx.lineWidth = cell * 0.35;
      diagonalLines(ctx, width, height, cell, 1);
      ctx.stroke();
    },
  },
  {
    id: "checker",
    group: "tiles",
    name: "체크",
    baseSize: 0.04,
    draw(ctx, { width, height, cell }) {
      for (let row = 0, y = 0; y < height; row += 1, y += cell) {
        for (let col = row % 2, x = col * cell; x < width; x += cell * 2) ctx.rect(x, y, cell, cell);
      }
      ctx.fill();
    },
  },
  {
    id: "hexagons",
    group: "tiles",
    name: "벌집 (명암 타일)",
    baseSize: 0.05,
    random: true,
    draw(ctx, { width, height, cell, seed }) {
      const rng = createRng(seed);
      // Pointy-top hexagons; cell = width of one hexagon.
      const r = cell / Math.sqrt(3);
      const rowStep = r * 1.5;
      for (let row = -1, y = 0; y < height + r; row += 1, y = row * rowStep) {
        const offset = row % 2 ? cell / 2 : 0;
        for (let x = -cell + offset; x < width + cell; x += cell) {
          const alpha = pickWeighted(rng, TILE_SHADES);
          if (!alpha) continue;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          for (let k = 0; k < 6; k += 1) {
            const angle = Math.PI / 6 + (k * Math.PI) / 3;
            const px = x + r * Math.cos(angle);
            const py = y + r * Math.sin(angle);
            if (k) ctx.lineTo(px, py);
            else ctx.moveTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    id: "pixels",
    group: "tiles",
    name: "픽셀 (랜덤 타일)",
    baseSize: 0.035,
    random: true,
    draw(ctx, { width, height, cell, seed }) {
      const rng = createRng(seed);
      const gap = cell * 0.08;
      for (let y = 0; y < height; y += cell) {
        for (let x = 0; x < width; x += cell) {
          const alpha = pickWeighted(rng, TILE_SHADES);
          if (!alpha) continue;
          ctx.globalAlpha = alpha;
          ctx.fillRect(x + gap / 2, y + gap / 2, cell - gap, cell - gap);
        }
      }
      ctx.globalAlpha = 1;
    },
  },
];
