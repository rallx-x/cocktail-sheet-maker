import { boxRect } from "./boxes.js";
import { drawBarcode } from "./barcode.js";
import { drawStyledText } from "./text-style.js";
import { drawLeaderRow, measureRow } from "./leader.js";

// Receipt (Layer 4). The BOARD has fixed geometry (x / y center, width, aspect) and never grows.
// The PAPER is content-derived and grows downward from under the clip. Crossing the board's
// safe inner bottom only raises an editor warning — nothing is resized or shrunk.
// Sizes: paper geometry = fractions of board width; text sizes = fractions of paper width.

export const RECEIPT_LIMITS = { sections: 12, items: 12, playlist: 3, text: 40, value: 16 };
export const HEADER_LABELS = ["DATE", "ORDER", "CLIENT", "SERVER"];
export const QUICK_SECTIONS = [
  { title: "Keyword", kind: "list" },
  { title: "Emoji", kind: "list" },
  { title: "Mood-Playlist", kind: "playlist" },
  { title: "Mood", kind: "list" },
  { title: "Fashion-Style", kind: "list" },
];

export function boardRect(receipt, W, H) {
  return boxRect(receipt, W, H);
}

// Real calendar date as YYYYMMDD (not just 8 digits).
export function isValidAnniversary(value) {
  if (!/^\d{8}$/.test(value)) return false;
  const y = Number(value.slice(0, 4));
  const m = Number(value.slice(4, 6));
  const d = Number(value.slice(6, 8));
  if (y < 1000 || m < 1 || m > 12 || d < 1) return false;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return d <= days;
}

export function displayedCode(receipt) {
  return receipt.code.anniversary || receipt.code.random;
}

/**
 * Pass 1 — layout. Returns every line with its geometry, the paper rect (height from content),
 * the board rect, and overflow info. `ctx` is only used for text measurement.
 */
export function layoutReceipt(ctx, receipt, shared, W, H) {
  const board = boardRect(receipt, W, H);
  const inset = receipt.paper.inset * board.w;
  const paperX = board.x + inset;
  const paperW = board.w - inset * 2;
  const paperTop = board.y + receipt.paper.top * board.w;
  const pad = paperW * 0.07;
  const left = paperX + pad;
  const right = paperX + paperW - pad;
  const body = receipt.body;
  const px = body.size * paperW;
  const lineH = px * 1.4;
  const lines = [];
  let y = paperTop + px * 2.2; // room under the clip
  const collisions = [];

  const text = (block, kind) => {
    if (!block.text) return;
    const size = block.size * paperW;
    lines.push({ kind, block, x: paperX + paperW / 2, y: y + size * 0.6, px: size });
    y += size * 1.35;
  };
  const rule = () => {
    y += px * 0.35;
    lines.push({ kind: "rule", x1: left, x2: right, y });
    y += px * 0.75;
  };
  const row = (r, index, label) => {
    const full = { ...r, leftX: left, rightX: right, y: y + lineH / 2, px, style: body, color: body.color };
    if (measureRow(ctx, full).collides) collisions.push(label ?? index);
    lines.push({ kind: "row", row: full });
    y += lineH;
  };

  text(receipt.title, "title");
  text(receipt.subtitle, "subtitle");
  rule();
  const headerValues = [receipt.header.date, shared.orderHex, receipt.header.client, receipt.header.server];
  HEADER_LABELS.forEach((label, i) => row({ left: label, right: headerValues[i] ?? "", leaderColor: null }, null, label));

  if (receipt.sections.length) rule();
  receipt.sections.forEach((section, si) => {
    if (section.title) {
      lines.push({ kind: "category", text: section.title, x: left, y: y + lineH / 2, px });
      y += lineH;
    }
    section.items.forEach((item, ii) => {
      const label = `${si + 1}-${ii + 1}`;
      if (section.kind === "playlist") {
        if (item.artist) row({ left: item.artist, right: "", leaderColor: null }, null, label);
        row({ left: item.song, right: item.duration, leaderColor: body.leaderColor, slantLeft: true }, null, label);
      } else {
        row({ left: item.text, right: item.value, leaderColor: item.value ? body.leaderColor : null }, null, label);
      }
    });
    y += px * 0.45;
  });

  rule();
  if (receipt.barcode.on) {
    const h = px * 2.8;
    lines.push({ kind: "barcode", rect: { x: left, y, w: right - left, h } });
    y += h + px * 0.6;
  }
  const code = displayedCode(receipt);
  if (code) {
    const size = receipt.code.size * paperW;
    lines.push({ kind: "code", text: code, x: paperX + paperW / 2, y: y + size * 0.6, px: size });
    y += size * 1.5;
  }
  if (receipt.footer.text) {
    for (const part of receipt.footer.text.split("\n")) {
      const size = receipt.footer.size * paperW;
      lines.push({ kind: "footer", text: part, x: paperX + paperW / 2, y: y + size * 0.6, px: size });
      y += size * 1.35;
    }
  }
  const teeth = paperW * 0.022;
  const paperBottom = y + px * 1.2 + (receipt.paper.edge === "zigzag" ? teeth : 0);
  const safeBottom = board.y + board.h - inset;

  return {
    board,
    paper: { x: paperX, y: paperTop, w: paperW, h: paperBottom - paperTop, teeth },
    lines,
    overflow: { pastBoard: paperBottom > safeBottom + 0.5, rows: [...new Set(collisions)] },
  };
}

// Union of board and paper (the paper may extend below the board).
export function receiptBounds(ctx, receipt, shared, W, H) {
  const l = layoutReceipt(ctx, receipt, shared, W, H);
  const top = Math.min(l.board.y, l.paper.y);
  const bottom = Math.max(l.board.y + l.board.h, l.paper.y + l.paper.h);
  return { x: l.board.x, y: top, w: l.board.w, h: bottom - top };
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBoard(ctx, receipt, board) {
  if (receipt.board.style !== "clipboard") return;
  roundedRect(ctx, board.x, board.y, board.w, board.h, board.w * 0.05);
  ctx.fillStyle = receipt.board.color;
  ctx.fill();
  if (receipt.board.border > 0) {
    ctx.lineWidth = receipt.board.border * board.w;
    ctx.strokeStyle = receipt.board.clipColor;
    ctx.stroke();
  }
}

function drawClip(ctx, receipt, board, paper) {
  if (receipt.board.style !== "clipboard") return;
  const cw = board.w * 0.34;
  const ch = board.w * 0.1;
  const cx = board.x + board.w / 2;
  const cy = Math.min(board.y + board.w * 0.02, paper.y - ch * 0.35);
  ctx.save();
  ctx.fillStyle = receipt.board.clipColor;
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.lineWidth = Math.max(board.w * 0.003, 0.5);
  roundedRect(ctx, cx - cw / 2, cy, cw, ch, ch * 0.3);
  ctx.fill();
  ctx.stroke();
  // ring on top
  ctx.beginPath();
  ctx.arc(cx, cy, ch * 0.42, Math.PI, Math.PI * 2);
  ctx.lineWidth = ch * 0.16;
  ctx.strokeStyle = receipt.board.clipColor;
  ctx.stroke();
  // soft highlight
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  roundedRect(ctx, cx - cw * 0.4, cy + ch * 0.18, cw * 0.8, ch * 0.16, ch * 0.08);
  ctx.fill();
  ctx.restore();
}

function drawPaper(ctx, receipt, paper) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(paper.x, paper.y);
  ctx.lineTo(paper.x + paper.w, paper.y);
  const bottom = paper.y + paper.h;
  if (receipt.paper.edge === "zigzag") {
    const n = Math.max(6, Math.round(paper.w / (paper.teeth * 2)));
    const step = paper.w / n;
    ctx.lineTo(paper.x + paper.w, bottom - paper.teeth);
    for (let i = n; i > 0; i -= 1) {
      ctx.lineTo(paper.x + (i - 0.5) * step, bottom);
      ctx.lineTo(paper.x + (i - 1) * step, bottom - paper.teeth);
    }
  } else {
    ctx.lineTo(paper.x + paper.w, bottom);
    ctx.lineTo(paper.x, bottom);
  }
  ctx.closePath();
  ctx.fillStyle = receipt.paper.color;
  ctx.fill();
  ctx.restore();
}

/** Pass 2 — draw from the layout. Same path for preview and export. */
export function drawReceipt(ctx, receipt, shared, W, H, renderScale) {
  if (!receipt?.visible) return;
  const layout = layoutReceipt(ctx, receipt, shared, W, H);
  const { board, paper, lines } = layout;
  const body = receipt.body;

  ctx.save();
  drawBoard(ctx, receipt, board);
  drawPaper(ctx, receipt, paper);

  for (const line of lines) {
    if (line.kind === "title" || line.kind === "subtitle") {
      drawStyledText(ctx, line.block.text, line.x, line.y, { ...line.block, effect: "normal" }, line.px, renderScale, { align: "center" });
    } else if (line.kind === "rule") {
      ctx.save();
      ctx.strokeStyle = receipt.paper.lineColor;
      ctx.lineWidth = Math.max(paper.w * 0.003, 0.5);
      ctx.setLineDash([paper.w * 0.012, paper.w * 0.008]);
      ctx.beginPath();
      ctx.moveTo(line.x1, line.y);
      ctx.lineTo(line.x2, line.y);
      ctx.stroke();
      ctx.restore();
    } else if (line.kind === "row") {
      drawLeaderRow(ctx, line.row);
    } else if (line.kind === "category") {
      ctx.save();
      drawLeaderRow(ctx, { left: line.text, right: "", leftX: line.x, rightX: line.x, y: line.y, px: line.px, style: body, color: body.color, weight: "bold" });
      ctx.restore();
    } else if (line.kind === "barcode") {
      drawBarcode(ctx, line.rect, shared.barcodeSeed, receipt.barcode.color, "horizontal");
    } else if (line.kind === "code") {
      drawStyledText(ctx, line.text, line.x, line.y, { font: receipt.code.font, color: receipt.code.color, letterSpacing: 0.25 }, line.px, renderScale, { align: "center" });
    } else if (line.kind === "footer") {
      drawStyledText(ctx, line.text, line.x, line.y, { ...receipt.footer, effect: "normal" }, line.px, renderScale, { align: "center" });
    }
  }

  drawClip(ctx, receipt, board, paper);
  ctx.restore();
}
