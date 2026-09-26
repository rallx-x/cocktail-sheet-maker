// Small single-color glyphs shared by frame corners, top decorations and stickers.
// draw at (x, y) with size s (outer radius), using the current fillStyle / strokeStyle.

// Legacy ornaments (kept exactly for v7 → v8 identical output): dot, star (4-point), sparkle (thin 4-point).
function fourPoint(ctx, x, y, s, inner) {
  ctx.beginPath();
  for (let k = 0; k < 8; k += 1) {
    const r = k % 2 ? inner : s;
    const a = -Math.PI / 2 + (k * Math.PI) / 4;
    if (k) ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
    else ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
  }
  ctx.closePath();
  ctx.fill();
}

export const GLYPHS = {
  dot: { name: "점", draw: (ctx, x, y, s) => { ctx.beginPath(); ctx.arc(x, y, s * 0.35, 0, Math.PI * 2); ctx.fill(); } },
  star: { name: "4각 별", draw: (ctx, x, y, s) => fourPoint(ctx, x, y, s, s * 0.28) },
  sparkle: { name: "반짝이", draw: (ctx, x, y, s) => fourPoint(ctx, x, y, s, s * 0.12) },
  astroid: {
    name: "오목 반짝이",
    draw(ctx, x, y, s) {
      ctx.beginPath();
      for (let i = 0; i <= 64; i += 1) {
        const t = (i / 64) * Math.PI * 2;
        const px = x + s * Math.cos(t) ** 3;
        const py = y + s * Math.sin(t) ** 3;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  star5: {
    name: "별",
    draw(ctx, x, y, s) {
      ctx.beginPath();
      for (let k = 0; k < 10; k += 1) {
        const r = k % 2 ? s * 0.45 : s;
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        if (k) ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
        else ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  starburst: {
    name: "팔각 반짝이",
    draw(ctx, x, y, s) {
      ctx.beginPath();
      for (let k = 0; k < 16; k += 1) {
        const r = k % 4 === 0 ? s : k % 2 === 0 ? s * 0.55 : s * 0.2;
        const a = -Math.PI / 2 + (k * Math.PI) / 8;
        if (k) ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a));
        else ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  moon: {
    name: "달",
    draw(ctx, x, y, s) {
      // Crescent = outer circle minus an offset inner circle, traced as ONE outline through the
      // two circle intersections (no even-odd tricks, never spills outside the outer circle).
      const R = s;
      const r = s * 0.84;
      const cx1 = x + s * 0.34;
      const cy1 = y - s * 0.3;
      const dx = cx1 - x;
      const dy = cy1 - y;
      const d = Math.hypot(dx, dy);
      const a = (R * R - r * r + d * d) / (2 * d);
      const h = Math.sqrt(Math.max(0, R * R - a * a));
      const ux = dx / d;
      const uy = dy / d;
      const bx = x + a * ux;
      const by = y + a * uy;
      const p1 = [bx - h * uy, by + h * ux];
      const p2 = [bx + h * uy, by - h * ux];
      const ang = (cx, cy, p) => Math.atan2(p[1] - cy, p[0] - cx);
      // outer arc: the long way round, away from the inner circle
      const t1 = ang(x, y, p1);
      const t2 = ang(x, y, p2);
      const away = Math.atan2(-dy, -dx);
      let span = (((t2 - t1) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const mid = t1 + span / 2;
      if (Math.cos(mid - away) < 0) span -= Math.PI * 2;
      ctx.beginPath();
      for (let i = 0; i <= 48; i += 1) {
        const t = t1 + (span * i) / 48;
        const px = x + R * Math.cos(t);
        const py = y + R * Math.sin(t);
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      // inner arc back from p2 to p1, the side that lies inside the outer circle
      const u1 = ang(cx1, cy1, p2);
      const u2 = ang(cx1, cy1, p1);
      const toward = Math.atan2(-dy, -dx);
      let span2 = (((u2 - u1) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      if (Math.cos(u1 + span2 / 2 - toward) < 0) span2 -= Math.PI * 2;
      for (let i = 0; i <= 48; i += 1) {
        const t = u1 + (span2 * i) / 48;
        ctx.lineTo(cx1 + r * Math.cos(t), cy1 + r * Math.sin(t));
      }
      ctx.closePath();
      ctx.fill();
    },
  },
  box: {
    name: "작은 네모",
    draw(ctx, x, y, s) {
      ctx.save();
      ctx.lineWidth = Math.max(s * 0.12, 0.5);
      ctx.strokeStyle = ctx.fillStyle;
      ctx.strokeRect(x - s * 0.7, y - s * 0.7, s * 1.4, s * 1.4);
      ctx.restore();
    },
  },
  heart: {
    name: "하트",
    draw(ctx, x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.8);
      ctx.bezierCurveTo(x - s * 1.25, y - s * 0.05, x - s * 0.7, y - s * 1.15, x, y - s * 0.4);
      ctx.bezierCurveTo(x + s * 0.7, y - s * 1.15, x + s * 1.25, y - s * 0.05, x, y + s * 0.8);
      ctx.closePath();
      ctx.fill();
    },
  },
  asterisk: {
    name: "별표",
    draw(ctx, x, y, s) {
      ctx.save();
      ctx.lineWidth = Math.max(s * 0.14, 0.5);
      ctx.lineCap = "round";
      ctx.strokeStyle = ctx.fillStyle;
      ctx.beginPath();
      for (let k = 0; k < 3; k += 1) {
        const a = (k * Math.PI) / 3 + Math.PI / 2;
        ctx.moveTo(x - s * Math.cos(a), y - s * Math.sin(a));
        ctx.lineTo(x + s * Math.cos(a), y + s * Math.sin(a));
      }
      ctx.stroke();
      ctx.restore();
    },
  },
};

export function drawGlyph(ctx, kind, x, y, s) {
  GLYPHS[kind]?.draw(ctx, x, y, s);
}
