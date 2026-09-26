import { setTextFont } from "./text-style.js";

// Measured dot-leader row for the Receipt: left text, right text on a shared right edge, and a
// leader filling the MEASURED gap (no character counting). The Cocktail Card keeps its own
// leader code (unchanged in Phase 5).
//
// row = { left, right, leftX, rightX, y, px, style, color, leaderColor, slantLeft, weight }

const SLANT = -Math.tan((12 * Math.PI) / 180); // fixed skew for the playlist song title

export function measureRow(ctx, row) {
  ctx.save();
  setTextFont(ctx, row.style, row.px, row.weight);
  const leftW = ctx.measureText(row.left ?? "").width;
  const rightW = ctx.measureText(row.right ?? "").width;
  ctx.restore();
  return { leftW, rightW, collides: row.leftX + leftW + row.px * 0.6 + rightW > row.rightX + 0.5 };
}

export function drawLeaderRow(ctx, row) {
  ctx.save();
  setTextFont(ctx, row.style, row.px, row.weight);
  ctx.textBaseline = "middle";
  ctx.fillStyle = row.color;
  const left = row.left ?? "";
  const right = row.right ?? "";

  ctx.textAlign = "left";
  if (row.slantLeft) {
    ctx.save();
    ctx.translate(row.leftX, row.y);
    ctx.transform(1, 0, SLANT, 1, 0, 0); // only the left text (song title) is slanted
    ctx.fillText(left, 0, 0);
    ctx.restore();
  } else {
    ctx.fillText(left, row.leftX, row.y);
  }
  const leftW = ctx.measureText(left).width;

  ctx.textAlign = "right";
  ctx.fillText(right, row.rightX, row.y);
  const rightW = ctx.measureText(right).width;

  if (right && row.leaderColor) {
    const start = row.leftX + leftW + row.px * 0.3;
    const end = row.rightX - rightW - row.px * 0.3;
    const dotW = Math.max(0.5, ctx.measureText(".").width);
    const count = Math.floor((end - start) / dotW);
    if (count > 0) {
      ctx.fillStyle = row.leaderColor;
      ctx.fillText(".".repeat(count), end, row.y);
    }
  }
  ctx.restore();
}
