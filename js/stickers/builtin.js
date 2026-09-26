import { GLYPHS } from "../decor/glyphs.js";

// Built-in stickers: our own procedural geometry (no license exposure, resolution independent).
// draw(ctx) works in a unit box: x, y ∈ [-1, 1] × [-aspect, aspect]; single color via
// fillStyle / strokeStyle. `aspect` = height / width. No randomness.

function tapered(ctx, rx, ry, rot, thick) {
  // crescent-like ring: outer ellipse minus a shifted, thinner inner ellipse (even-odd)
  ctx.save();
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.moveTo(rx - thick * 0.3, thick * 0.5);
  ctx.ellipse(-thick * 0.3, thick * 0.5, rx - thick * 0.3, ry - thick, 0, 0, Math.PI * 2);
  ctx.fill("evenodd");
  ctx.restore();
}

function thinRing(ctx, rx, ry, rot, lw) {
  ctx.save();
  ctx.rotate(rot);
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

const glyph = (kind, x, y, s) => (ctx) => GLYPHS[kind].draw(ctx, x, y, s);

export const STICKER_GROUPS = [
  { id: "orbit", name: "궤도" },
  { id: "sparkle", name: "반짝이" },
  { id: "heart", name: "하트" },
  { id: "moon", name: "달" },
  { id: "misc", name: "기타" },
];

export const BUILTIN_STICKERS = [
  { id: "ringTapered", group: "orbit", name: "궤도 고리", aspect: 0.6, draw: (ctx) => tapered(ctx, 0.95, 0.42, -0.35, 0.16) },
  {
    id: "ringCross", group: "orbit", name: "교차 궤도", aspect: 0.7,
    draw(ctx) {
      tapered(ctx, 0.95, 0.3, 0.45, 0.13);
      tapered(ctx, 0.95, 0.3, -0.45, 0.13);
    },
  },
  {
    id: "ringStack", group: "orbit", name: "겹친 고리", aspect: 0.7,
    draw(ctx) {
      for (const dy of [-0.22, 0, 0.22]) {
        ctx.save();
        ctx.translate(0, dy);
        thinRing(ctx, 0.9, 0.3, -0.2, 0.035);
        ctx.restore();
      }
      GLYPHS.sparkle.draw(ctx, 0.55, -0.38, 0.14);
    },
  },
  {
    id: "ringDots", group: "orbit", name: "고리 + 점", aspect: 0.6,
    draw(ctx) {
      thinRing(ctx, 0.92, 0.38, -0.3, 0.035);
      for (const [t, r] of [[0.7, 0.07], [2.4, 0.05], [4.2, 0.04]]) {
        const x = 0.92 * Math.cos(t);
        const y = 0.38 * Math.sin(t);
        const c = Math.cos(-0.3);
        const s = Math.sin(-0.3);
        ctx.beginPath();
        ctx.arc(x * c - y * s, x * s + y * c, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: "ringSparkle", group: "orbit", name: "고리 + 반짝이", aspect: 0.6,
    draw(ctx) {
      thinRing(ctx, 0.9, 0.34, -0.25, 0.035);
      GLYPHS.astroid.draw(ctx, 0.62, -0.32, 0.2);
      GLYPHS.astroid.draw(ctx, -0.72, 0.3, 0.13);
    },
  },
  { id: "astroid", group: "sparkle", name: "오목 반짝이", aspect: 1, draw: glyph("astroid", 0, 0, 1) },
  { id: "starburst", group: "sparkle", name: "팔각 반짝이", aspect: 1, draw: glyph("starburst", 0, 0, 1) },
  {
    id: "thinCross", group: "sparkle", name: "가는 십자 반짝이", aspect: 1,
    draw(ctx) {
      ctx.beginPath();
      for (let k = 0; k < 8; k += 1) {
        const r = k % 2 ? 0.06 : k % 4 === 0 ? 1 : 0.55;
        const a = -Math.PI / 2 + (k * Math.PI) / 4;
        if (k) ctx.lineTo(r * Math.cos(a), r * Math.sin(a));
        else ctx.moveTo(r * Math.cos(a), r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    id: "sparkleCluster", group: "sparkle", name: "반짝이 무리", aspect: 1,
    draw(ctx) {
      GLYPHS.astroid.draw(ctx, -0.2, -0.1, 0.62);
      GLYPHS.astroid.draw(ctx, 0.55, 0.45, 0.32);
      GLYPHS.astroid.draw(ctx, 0.58, -0.62, 0.2);
    },
  },
  { id: "heartFill", group: "heart", name: "하트", aspect: 1, draw: glyph("heart", 0, 0.05, 1) },
  {
    id: "heartOutline", group: "heart", name: "하트 테두리", aspect: 1,
    draw(ctx) {
      ctx.lineWidth = 0.12;
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(0, 0.82);
      ctx.bezierCurveTo(-1.18, 0.02, -0.64, -1.05, 0, -0.34);
      ctx.bezierCurveTo(0.64, -1.05, 1.18, 0.02, 0, 0.82);
      ctx.stroke();
    },
  },
  {
    id: "heartDouble", group: "heart", name: "겹친 하트", aspect: 1,
    draw(ctx) {
      ctx.lineWidth = 0.08;
      ctx.lineJoin = "round";
      for (const [dx, dy, s] of [[-0.14, 0.08, 0.8], [0.16, -0.1, 0.8]]) {
        ctx.beginPath();
        ctx.moveTo(dx, dy + 0.8 * s);
        ctx.bezierCurveTo(dx - 1.25 * s, dy - 0.05 * s, dx - 0.7 * s, dy - 1.15 * s, dx, dy - 0.4 * s);
        ctx.bezierCurveTo(dx + 0.7 * s, dy - 1.15 * s, dx + 1.25 * s, dy - 0.05 * s, dx, dy + 0.8 * s);
        ctx.stroke();
      }
    },
  },
  { id: "crescent", group: "moon", name: "초승달", aspect: 1, draw: glyph("moon", 0, 0, 0.95) },
  {
    id: "crescentSparkle", group: "moon", name: "초승달 + 반짝이", aspect: 1,
    draw(ctx) {
      GLYPHS.moon.draw(ctx, -0.15, 0.1, 0.8);
      GLYPHS.astroid.draw(ctx, 0.62, -0.55, 0.3);
    },
  },
  { id: "star5", group: "misc", name: "별", aspect: 1, draw: glyph("star5", 0, 0.05, 1) },
  { id: "asterisk", group: "misc", name: "별표", aspect: 1, draw: glyph("asterisk", 0, 0, 0.9) },
  {
    id: "dotCluster", group: "misc", name: "점 무리", aspect: 0.6,
    draw(ctx) {
      for (const [x, y, r] of [[-0.55, 0.1, 0.28], [0.1, -0.05, 0.2], [0.6, 0.12, 0.13]]) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  {
    id: "checker", group: "misc", name: "체크무늬 조각", aspect: 0.5,
    draw(ctx) {
      const skew = 0.25;
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          if ((row + col) % 2) continue;
          const x = -1 + col * 0.5 + (1 - row) * skew * 0.5;
          const y = -0.5 + row * 0.5;
          ctx.beginPath();
          ctx.moveTo(x + skew * 0.5, y);
          ctx.lineTo(x + 0.5 + skew * 0.5, y);
          ctx.lineTo(x + 0.5, y + 0.5);
          ctx.lineTo(x, y + 0.5);
          ctx.closePath();
          ctx.fill();
        }
      }
    },
  },
];

const byId = new Map(BUILTIN_STICKERS.map((s) => [s.id, s]));
export function getBuiltinSticker(id) {
  return byId.get(id) ?? null;
}
