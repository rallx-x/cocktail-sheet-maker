import { createRng } from "../patterns/prng.js";
import { hexToRgb, hsl, rgbToHsl } from "../decor/auto-color.js";

// Confetti layer (v11): seeded pieces scattered inside a region. No subject-avoidance logic:
// the MD draw order (… coaster → FRONT confetti → character) keeps the character's opaque
// pixels on top. Density is pieces per (design-width units)², so the arrangement is identical at
// any export resolution. Only "배치 다시 뽑기" changes the seed.

const MAX_PIECES = 900;

export function confettiRect(c, W, H) {
  const w = c.width * W;
  const h = w * c.aspect;
  return { x: c.x * W - w / 2, y: c.y * H - h / 2, w, h };
}

// Lighter / less saturated … deeper / more saturated variants of the main color.
export function confettiPalette(color, spread) {
  const [h, s, l] = rgbToHsl(hexToRgb(color));
  const out = [];
  for (const t of [-1, -0.5, 0, 0.5, 1]) {
    const ll = Math.min(0.95, Math.max(0.12, l - t * spread * 0.35));
    const ss = Math.min(1, Math.max(0, s + t * spread * 0.3));
    out.push(hsl(h, ss, ll));
  }
  return out;
}

export function drawConfetti(ctx, c, W, H) {
  if (!c?.on) return;
  const kinds = Object.entries(c.kinds).filter(([, on]) => on).map(([k]) => k);
  if (!kinds.length || c.density <= 0) return;
  const rect = confettiRect(c, W, H);
  const colors = confettiPalette(c.color, c.spread);
  const rng = createRng(c.seed);
  // normalized area → piece count (resolution independent), stratified cells
  const count = Math.min(MAX_PIECES, Math.round(c.density * c.width * c.width * c.aspect));
  if (!count) return;
  const cols = Math.max(1, Math.round(Math.sqrt(count / c.aspect)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cw = rect.w / cols;
  const ch = rect.h / rows;
  const s = c.size * W;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let i = 0; i < count; i += 1) {
    const x = rect.x + ((i % cols) + rng()) * cw;
    const y = rect.y + (Math.floor(i / cols) + rng()) * ch;
    const color = colors[Math.floor(rng() * colors.length)];
    const kind = kinds[Math.floor(rng() * kinds.length)];
    const angle = rng() * Math.PI * 2;
    const scale = 0.7 + rng() * 0.6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    const z = s * scale;
    if (kind === "curl") {
      ctx.lineWidth = z * 0.28;
      ctx.beginPath();
      for (let k = 0; k <= 24; k += 1) {
        const t = k / 24;
        const px = -z * 1.2 + z * 2.4 * t;
        const py = Math.sin(t * Math.PI * 3) * z * 0.45;
        if (k) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
    } else if (kind === "strip") {
      ctx.lineWidth = z * 0.38;
      ctx.beginPath();
      ctx.moveTo(-z * 0.7, 0);
      ctx.lineTo(z * 0.7, 0);
      ctx.stroke();
    } else if (kind === "dot") {
      ctx.beginPath();
      ctx.arc(0, 0, z * 0.32, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      for (let k = 0; k <= 32; k += 1) {
        const t = (k / 32) * Math.PI * 2;
        const px = z * 0.6 * Math.cos(t) ** 3;
        const py = z * 0.6 * Math.sin(t) ** 3;
        if (k) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
