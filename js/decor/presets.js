// Frame presets (v11) = ACTIONS. apply(draftMd) writes a bundle into the existing, fully editable
// md.frame / md.decor fields in ONE updateState. Geometry (x, y, width, aspect) and the stored
// manual colors are never touched; presets switch colorMode to "auto" (manual colors stay dormant).
// Built from the user's line-art references.

const lines = (f, count, gap, extra = {}) => {
  f.border.style = "multi";
  Object.assign(f.border.multi, { count, gap, dashedInner: false, chamfer: 0, ...extra });
};

export const FRAME_PRESETS = [
  {
    id: "doubleArch", name: "두 줄 아치 + 반짝이",
    apply(md) {
      Object.assign(md.frame, { shape: "arch" });
      lines(md.frame, 2, 0.02);
      Object.assign(md.decor.corners, { type: "astroid", size: 0.03, inset: 0.03 });
      md.decor.top.type = "none";
    },
  },
  {
    id: "tripleMoon", name: "세 줄 아치 + 달",
    apply(md) {
      Object.assign(md.frame, { shape: "arch" });
      lines(md.frame, 3, 0.015);
      Object.assign(md.decor.corners, { type: "sparkle", size: 0.028, inset: 0.035 });
      Object.assign(md.decor.top, { type: "moon", size: 1 });
    },
  },
  {
    id: "offsetOval", name: "겹친 타원 + 점선",
    apply(md) {
      Object.assign(md.frame, { shape: "oval" });
      md.frame.border.style = "offset";
      Object.assign(md.frame.border.offset, { dx: 0.05, dy: 0.04 });
      Object.assign(md.frame.border.multi, { dashedInner: true, gap: 0.03 });
      Object.assign(md.decor.corners, { type: "astroid", size: 0.026, inset: 0.0 });
      md.decor.top.type = "none";
    },
  },
  {
    id: "rectBoxes", name: "직사각형 + 모서리 네모 + 달",
    apply(md) {
      Object.assign(md.frame, { shape: "rect" });
      lines(md.frame, 2, 0.015);
      Object.assign(md.decor.corners, { type: "box", size: 0.02, inset: -0.0265 });
      Object.assign(md.decor.top, { type: "moon", size: 1 });
    },
  },
  {
    id: "pillBurst", name: "두 줄 알약 + 큰 반짝이",
    apply(md) {
      Object.assign(md.frame, { shape: "pill" });
      lines(md.frame, 2, 0.02);
      Object.assign(md.decor.corners, { type: "sparkle", size: 0.028, inset: 0.03 });
      Object.assign(md.decor.top, { type: "bigSparkle", size: 1 });
    },
  },
  {
    id: "medallion", name: "아치 + 원형 메달",
    apply(md) {
      Object.assign(md.frame, { shape: "arch" });
      lines(md.frame, 2, 0.02);
      md.decor.corners.type = "none";
      Object.assign(md.decor.top, { type: "medallion", size: 1 });
    },
  },
  {
    id: "chamfer", name: "아치 + 비스듬히 자른 안쪽 선",
    apply(md) {
      Object.assign(md.frame, { shape: "arch" });
      lines(md.frame, 2, 0.03, { chamfer: 0.07 });
      Object.assign(md.decor.corners, { type: "astroid", size: 0.028, inset: 0.05 });
      md.decor.top.type = "none";
    },
  },
  {
    id: "overshoot", name: "뻗은 선 직사각형",
    apply(md) {
      Object.assign(md.frame, { shape: "rect" });
      md.frame.border.style = "line";
      Object.assign(md.decor.corners, { type: "builtin:overshoot", size: 0.022, inset: 0 });
      md.decor.top.type = "none";
    },
  },
];

export function applyFramePreset(draft, id) {
  const preset = FRAME_PRESETS.find((p) => p.id === id);
  if (!preset) return;
  const md = draft.components.md;
  preset.apply(md);
  md.frame.visible = true;
  // v13: presets no longer force colorMode "auto" — a Sheet Color theme applied earlier stays visible.
}
