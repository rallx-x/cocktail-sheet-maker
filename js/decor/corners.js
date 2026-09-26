// Built-in corner ornaments, drawn ONCE for the top-left corner (corner point at the origin,
// extending into +x / +y) and mirrored to the four shape anchors by the caller.
// s = ornament size in px; lw = line width. Single color: uses strokeStyle / fillStyle.

function heart(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.8);
  ctx.bezierCurveTo(x - s * 1.25, y - s * 0.05, x - s * 0.7, y - s * 1.15, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.15, x + s * 1.25, y - s * 0.05, x, y + s * 0.8);
  ctx.fill();
}

function sparkle(ctx, x, y, s) {
  ctx.beginPath();
  for (let i = 0; i <= 48; i += 1) {
    const t = (i / 48) * Math.PI * 2;
    const px = x + s * Math.cos(t) ** 3;
    const py = y + s * Math.sin(t) ** 3;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.fill();
}

export const CORNER_ORNAMENTS = {
  // Lines that overshoot the frame corner (drawn OUTWARD from the anchor) with small end squares.
  overshoot: {
    name: "뻗은 선 + 작은 네모",
    draw(ctx, s, lw) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(-s * 2.2, 0);
      ctx.lineTo(s * 3, 0);
      ctx.moveTo(0, -s * 2.2);
      ctx.lineTo(0, s * 3);
      ctx.stroke();
      ctx.strokeRect(-s * 0.55, -s * 0.55, s * 1.1, s * 1.1);
    },
  },
  curlLine: {
    name: "선 + 말린 끝",
    draw(ctx, s, lw) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, s * 2.6);
      ctx.lineTo(0, s * 0.9);
      ctx.moveTo(s * 0.9, 0);
      ctx.lineTo(s * 2.6, 0);
      // scroll curl filling the corner
      for (let i = 0; i <= 60; i += 1) {
        const t = (i / 60) * Math.PI * 1.75;
        const r = s * 0.9 * (1 - (i / 60) * 0.75);
        const px = s * 0.9 - r * Math.cos(t);
        const py = s * 0.9 - r * Math.sin(t);
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
    },
  },
  doubleBox: {
    name: "두 줄 + 네모",
    draw(ctx, s, lw) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, s * 3);
      ctx.lineTo(0, 0);
      ctx.lineTo(s * 3, 0);
      ctx.moveTo(s * 0.35, s * 2.6);
      ctx.lineTo(s * 0.35, s * 0.35);
      ctx.lineTo(s * 2.6, s * 0.35);
      ctx.stroke();
      ctx.strokeRect(s * 0.7, s * 0.7, s * 0.6, s * 0.6);
    },
  },
  heartLine: {
    name: "선 + 하트",
    draw(ctx, s, lw) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, s * 2.8);
      ctx.lineTo(0, s * 1.2);
      ctx.moveTo(s * 1.2, 0);
      ctx.lineTo(s * 2.8, 0);
      ctx.stroke();
      heart(ctx, s * 0.55, s * 0.55, s * 0.45);
      ctx.beginPath();
      ctx.arc(s * 3.1, 0, lw * 1.4, 0, Math.PI * 2);
      ctx.arc(0, s * 3.1, lw * 1.4, 0, Math.PI * 2);
      ctx.fill();
    },
  },
  sparkleLine: {
    name: "선 + 반짝이",
    draw(ctx, s, lw) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, s * 3);
      ctx.lineTo(0, s * 1.3);
      ctx.moveTo(s * 1.3, 0);
      ctx.lineTo(s * 3, 0);
      ctx.stroke();
      sparkle(ctx, s * 0.45, s * 0.45, s * 0.7);
    },
  },
  knot: {
    name: "각진 매듭",
    draw(ctx, s, lw) {
      ctx.lineWidth = lw;
      ctx.beginPath();
      ctx.moveTo(0, s * 3);
      ctx.lineTo(0, 0);
      ctx.lineTo(s * 3, 0);
      ctx.moveTo(s * 0.3, s * 3);
      ctx.lineTo(s * 0.3, s * 0.3);
      ctx.lineTo(s * 3, s * 0.3);
      ctx.stroke();
      ctx.strokeRect(s * 0.6, s * 0.6, s * 0.7, s * 0.7);
      ctx.strokeRect(s * 1.0, s * 1.0, s * 0.7, s * 0.7);
      ctx.beginPath();
      ctx.moveTo(s * 1.3, s * 0.3);
      ctx.lineTo(s * 1.3, s * 0.6);
      ctx.moveTo(s * 0.3, s * 1.3);
      ctx.lineTo(s * 0.6, s * 1.3);
      ctx.stroke();
    },
  },
};
