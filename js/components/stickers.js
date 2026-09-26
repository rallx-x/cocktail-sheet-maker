import { getBuiltinSticker } from "../stickers/builtin.js";

// Sheet-level stickers. sticker = { id, source: "builtin" | "file", builtin, file, x, y, width,
//   rotation (deg), flipX, opacity, color, tint (file stickers only: recolor on/off), layer }
// x / y = center (fractions of design width / height); width = fraction of design width;
// height = width × aspect (built-in aspect, or the image's own ratio).

export function stickerAspect(sticker, imageSize) {
  if (sticker.source === "builtin") return getBuiltinSticker(sticker.builtin)?.aspect ?? 1;
  return imageSize ? imageSize.height / imageSize.width : 1;
}

// Axis-aligned bounds of the rotated sticker (used for hit-testing and the overlay).
export function stickerRect(sticker, imageSize, W, H) {
  const w = sticker.width * W;
  const h = w * stickerAspect(sticker, imageSize);
  const a = (sticker.rotation * Math.PI) / 180;
  const bw = Math.abs(w * Math.cos(a)) + Math.abs(h * Math.sin(a));
  const bh = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
  return { x: sticker.x * W - bw / 2, y: sticker.y * H - bh / 2, w: bw, h: bh };
}

// Drawn on a bbox-sized layer, then composited once with its opacity (overlaps inside a
// sticker never darken). File stickers can be recolored (alpha-preserving source-in).
export function drawSticker(ctx, sticker, image, W, H, renderScale) {
  const builtin = sticker.source === "builtin" ? getBuiltinSticker(sticker.builtin) : null;
  if (!builtin && !image) return;
  const imageSize = image ? { width: image.width, height: image.height } : null;
  const w = sticker.width * W;
  const h = w * stickerAspect(sticker, imageSize);
  const box = stickerRect(sticker, imageSize, W, H);
  const pad = 2 / renderScale;
  const bx = box.x - pad;
  const by = box.y - pad;
  const bw = box.w + pad * 2;
  const bh = box.h + pad * 2;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(bw * renderScale));
  canvas.height = Math.max(1, Math.ceil(bh * renderScale));
  const lctx = canvas.getContext("2d");
  lctx.imageSmoothingEnabled = true;
  lctx.imageSmoothingQuality = "high";
  lctx.setTransform(renderScale, 0, 0, renderScale, -bx * renderScale, -by * renderScale);
  lctx.translate(sticker.x * W, sticker.y * H);
  lctx.rotate((sticker.rotation * Math.PI) / 180);
  if (sticker.flipX) lctx.scale(-1, 1);

  if (builtin) {
    lctx.scale(w / 2, w / 2);
    lctx.fillStyle = sticker.color;
    lctx.strokeStyle = sticker.color;
    lctx.lineCap = "round";
    builtin.draw(lctx);
  } else {
    lctx.drawImage(image, -w / 2, -h / 2, w, h);
    if (sticker.tint) {
      lctx.setTransform(1, 0, 0, 1, 0, 0);
      lctx.globalCompositeOperation = "source-in";
      lctx.fillStyle = sticker.color;
      lctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  ctx.save();
  ctx.globalAlpha = sticker.opacity;
  ctx.drawImage(canvas, bx, by, bw, bh);
  ctx.restore();
}
