// SD tray (the MD frame lives in frame.js / shapes.js).
// Geometry uses the existing normalized convention (same as plates): x / y = center as
// fractions of design width / height, width = fraction of design width, height = width × aspect.
// border / radius / gap are fractions of the box's own width.

export const TRAY_SHAPES = ["rounded", "ellipse"];

export function boxRect(item, designWidth, designHeight) {
  const w = item.width * designWidth;
  const h = w * item.aspect;
  return { x: item.x * designWidth - w / 2, y: item.y * designHeight - h / 2, w, h };
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function drawTray(ctx, tray, rect) {
  const { x, y, w, h } = rect;
  ctx.beginPath();
  if (tray.shape === "ellipse") ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  else roundedRect(ctx, x, y, w, h, tray.radius * w);
  ctx.fillStyle = tray.colors.fill;
  ctx.fill();
  if (tray.border > 0) {
    ctx.lineWidth = tray.border * w;
    ctx.strokeStyle = tray.rim?.style === "reflect" ? rimGradient(ctx, tray, rect) : tray.colors.border;
    ctx.stroke();
  }
}

// v14 reflection rim: light at the top-left, fading into the tray fill toward the bottom-right.
const mixHex = (a, b, t) => {
  const x = parseInt(a.slice(1), 16);
  const y = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t);
  return `#${[16, 8, 0].map((s) => ch(s).toString(16).padStart(2, "0")).join("")}`;
};
function rimGradient(ctx, tray, { x, y, w, h }) {
  const { light, strength } = tray.rim;
  const fill = tray.colors.fill;
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, mixHex(fill, light, strength));
  g.addColorStop(0.45, mixHex(fill, light, strength * 0.5));
  g.addColorStop(1, fill);
  return g;
}
