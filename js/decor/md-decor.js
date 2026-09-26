import { GLYPHS, drawGlyph } from "./glyphs.js";
import { CORNER_ORNAMENTS } from "./corners.js";
import { drawSwirls, drawTop } from "./top.js";
import { drawBanner } from "./banner.js";
import { shapeAnchors } from "../components/shapes.js";

// MD decorations, drawn after the frame and before coaster / character.
//   corners.type: "none" | glyph kind | "builtin:<corner id>" | "file:<sticker file>"
//   ONE type for all four anchors (mirrored per corner for ornaments / stickers).

export const CORNER_GLYPHS = ["dot", "star", "sparkle", "astroid", "star5", "starburst", "moon", "box", "heart"];

export function drawCorners(ctx, corners, shape, box, images) {
  if (!corners || corners.type === "none") return;
  const w = box.w;
  const s = corners.size * w;
  ctx.save();
  ctx.fillStyle = corners.color;
  ctx.strokeStyle = corners.color;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (GLYPHS[corners.type]) {
    // Legacy formula (identical to v7 ornaments): anchors inset by gap + 1.4 × size.
    const m = corners.inset * w + s * 1.4;
    for (const p of shapeAnchors(shape, box, m)) drawGlyph(ctx, corners.type, p.x, p.y, s);
  } else if (corners.type.startsWith("builtin:")) {
    const ornament = CORNER_ORNAMENTS[corners.type.slice(8)];
    if (ornament) {
      for (const p of shapeAnchors(shape, box, corners.inset * w)) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.sx, p.sy);
        ornament.draw(ctx, s, Math.max(s * 0.12, 0.5));
        ctx.restore();
      }
    }
  } else if (corners.type.startsWith("file:")) {
    const image = images?.cornerSticker;
    if (image) {
      const iw = s * 3;
      const ih = (iw * image.height) / image.width;
      for (const p of shapeAnchors(shape, box, corners.inset * w)) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.scale(p.sx, p.sy);
        ctx.drawImage(image, 0, 0, iw, ih);
        ctx.restore();
      }
    }
  }
  ctx.restore();
}

export function drawMdDecor(ctx, decor, shape, box, images, W, H) {
  if (!decor) return;
  drawCorners(ctx, decor.corners, shape, box, images);
  drawTop(ctx, decor.top, decor.outline, shape, box);
  drawSwirls(ctx, decor.swirls, decor.outline, box);
  drawBanner(ctx, decor.banner, decor.outline, W, H);
}
