import { FRAME_SHAPES } from "../components/shapes.js";
import { BORDER_STYLES, FRAME_FILLS } from "../components/frame.js";
import { LEGACY_TOP_TYPES, TOP_TYPES } from "../decor/top.js";
import { FRAME_PRESETS, applyFramePreset } from "../decor/presets.js";
import { CORNER_GLYPHS } from "../decor/md-decor.js";
import { CORNER_ORNAMENTS } from "../decor/corners.js";
import { GLYPHS } from "../decor/glyphs.js";
import { fontStatus } from "../fonts.js";
import { bindRange, colorRow, createColorField, el, fontRow, rangeRow } from "../ui/controls.js";
import { STRINGS } from "../strings.js";

// Generated panels for the MD background frame and the MD decorations (separate subsections).

export function selectRow(label, entries) {
  // entries: [{ value, text }] or [{ group, items: [{ value, text }] }]
  const select = el("select", { "aria-label": label });
  const fill = (list) => {
    select.replaceChildren(
      ...list.map((e) =>
        e.group
          ? el("optgroup", { label: e.group }, ...e.items.map((i) => el("option", { value: i.value, text: i.text })))
          : el("option", { value: e.value, text: e.text }),
      ),
    );
  };
  fill(entries);
  const row = el("div", { class: "pattern-row" }, el("span", { class: "field-label", text: label }), select);
  return { row, select, fill };
}

export function checkRow(label) {
  const box = el("input", { type: "checkbox" });
  return { row: el("label", { class: "check-row" }, box, el("span", { text: label })), box };
}

const pct = (min, max) => ({ toUi: (v) => v * 100, fromUi: (v) => Math.min(max, Math.max(min, v / 100)) });
const group = (title, open, ...children) =>
  el("details", { class: "subsection", open }, el("summary", { text: title }), el("div", { class: "subsection-body" }, ...children));

export function createFramePanel(container, { get, getState, updateState }) {
  const set = (mutate) => updateState((draft) => mutate(get(draft)));
  const on = (s) => get(s).visible;
  const common = { getState, updateState, enabled: on };

  const visible = checkRow("프레임 보이기");
  // v11: presets (actions writing into these same fields), auto color, fit
  const presets = el(
    "div",
    { class: "quick-row" },
    ...FRAME_PRESETS.map((p) => el("button", { class: "small", type: "button", "data-preset": p.id, text: p.name })),
  );
  presets.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-preset]");
    if (b) updateState((d) => applyFramePreset(d, b.dataset.preset));
  });
  const autoColor = checkRow("자동 색 (배경색에 맞춤)");
  const autoHint = el("p", { class: "hint", text: STRINGS.frameAutoHint });
  const fit = checkRow("캐릭터에 맞춤 (캐릭터·코스터를 따라 크기와 위치 조정)");
  const fitPadding = rangeRow("맞춤 여백", { min: 0, max: 30, step: 0.5, unit: "%" });
  const chamfer = rangeRow("안쪽 선 모서리 자르기", { min: 0, max: 20, step: 0.5, unit: "%" });
  const scallopCount = rangeRow("물결 개수", { min: 6, max: 80, step: 1 });
  const scallopDepth = rangeRow("물결 깊이", { min: 0, max: 10, step: 0.1, unit: "%" });
  const dotSize = rangeRow("점 크기", { min: 0.2, max: 8, step: 0.1, unit: "%" });
  const dotSpacing = rangeRow("점 간격", { min: 0.5, max: 20, step: 0.1, unit: "%" });
  const stitchColor = colorRow("바느질 선 색");
  const stitchDash = rangeRow("바느질 길이", { min: 0.2, max: 10, step: 0.1, unit: "%" });
  const scallopBox = el("div", {}, scallopCount.row, scallopDepth.row);
  const dotsBox = el("div", {}, dotSize.row, dotSpacing.row);
  const stitchBox = el("div", {}, stitchColor.row, stitchDash.row);
  const shape = selectRow("모양", FRAME_SHAPES.map((v) => ({ value: v, text: STRINGS.frameShapes[v] })));
  const radius = rangeRow("모서리 둥글기", { min: 0, max: 50, step: 0.5, unit: "%" });
  const aspect = rangeRow("세로 비율", { min: 20, max: 400, step: 1, unit: "%" });

  const fillType = selectRow("바탕", FRAME_FILLS.map((v) => ({ value: v, text: STRINGS.frameFills[v] })));
  const fill1 = colorRow("바탕 색");
  const fill2 = colorRow("그라데이션 끝 색");
  const angle = rangeRow("그라데이션 각도", { min: -180, max: 180, step: 1, unit: "°" });
  const stop0 = rangeRow("그라데이션 시작", { min: 0, max: 100, step: 1, unit: "%" });
  const stop1 = rangeRow("그라데이션 끝", { min: 0, max: 100, step: 1, unit: "%" });

  const style = selectRow("테두리", BORDER_STYLES.map((v) => ({ value: v, text: STRINGS.borderStyles[v] })));
  const borderColor = colorRow("선 색");
  const borderWidth = rangeRow("선 굵기", { min: 0, max: 5, step: 0.1, unit: "%" });
  const count = rangeRow("줄 수", { min: 1, max: 3, step: 1 });
  const gap = rangeRow("줄 간격", { min: 0, max: 20, step: 0.5, unit: "%" });
  const dashed = checkRow("안쪽 점선");
  const innerColor = colorRow("안쪽 선 색");
  const dx = rangeRow("어긋남 가로", { min: -30, max: 30, step: 0.5, unit: "%" });
  const dy = rangeRow("어긋남 세로", { min: -30, max: 30, step: 0.5, unit: "%" });
  const moldingWidth = rangeRow("액자 틀 두께", { min: 0, max: 20, step: 0.5, unit: "%" });
  const moldingColor = colorRow("액자 틀 색");
  const matWidth = rangeRow("매트 두께", { min: 0, max: 20, step: 0.5, unit: "%" });
  const matColor = colorRow("매트 색");

  const multiBox = el("div", {}, count.row, gap.row, chamfer.row, dashed.row, innerColor.row);
  const offsetBox = el("div", {}, dx.row, dy.row);
  const moldingBox = el("div", {}, moldingWidth.row, moldingColor.row);
  const matBox = el("div", {}, matWidth.row, matColor.row);

  const body = el(
    "div",
    {},
    group("프리셋 (한 번에 적용, 이후 자유롭게 수정)", true, presets),
    group("모양", true, shape.row, radius.row, aspect.row, fit.row, fitPadding.row),
    group("바탕", true, fillType.row, fill1.row, fill2.row, angle.row, stop0.row, stop1.row),
    group("색", true, autoColor.row, autoHint),
    group("테두리", true, style.row, borderColor.row, borderWidth.row, multiBox, offsetBox, scallopBox, dotsBox, moldingBox, stitchBox, matBox),
  );
  container.append(visible.row, body);

  const B = (s) => get(s).border;
  const ranges = [
    bindRange(radius, { ...common, ...pct(0, 0.5), read: (s) => get(s).radius, write: (d, v) => (get(d).radius = v) }),
    bindRange(aspect, { ...common, ...pct(0.2, 4), read: (s) => get(s).aspect, write: (d, v) => (get(d).aspect = v) }),
    bindRange(angle, { ...common, read: (s) => get(s).fill.angle, write: (d, v) => (get(d).fill.angle = Math.max(-180, Math.min(180, v))) }),
    bindRange(stop0, { ...common, ...pct(0, 1), read: (s) => get(s).fill.stops[0], write: (d, v) => (get(d).fill.stops[0] = v) }),
    bindRange(stop1, { ...common, ...pct(0, 1), read: (s) => get(s).fill.stops[1], write: (d, v) => (get(d).fill.stops[1] = v) }),
    bindRange(borderWidth, { ...common, ...pct(0, 0.05), read: (s) => B(s).width, write: (d, v) => (B(d).width = v) }),
    bindRange(count, { ...common, read: (s) => B(s).multi.count, write: (d, v) => (B(d).multi.count = Math.round(Math.max(1, Math.min(3, v)))) }),
    bindRange(gap, { ...common, ...pct(0, 0.2), read: (s) => B(s).multi.gap, write: (d, v) => (B(d).multi.gap = v) }),
    bindRange(dx, { ...common, ...pct(-0.3, 0.3), read: (s) => B(s).offset.dx, write: (d, v) => (B(d).offset.dx = v) }),
    bindRange(dy, { ...common, ...pct(-0.3, 0.3), read: (s) => B(s).offset.dy, write: (d, v) => (B(d).offset.dy = v) }),
    bindRange(moldingWidth, { ...common, ...pct(0, 0.2), read: (s) => B(s).molding.width, write: (d, v) => (B(d).molding.width = v) }),
    bindRange(matWidth, { ...common, ...pct(0, 0.2), read: (s) => B(s).mat.width, write: (d, v) => (B(d).mat.width = v) }),
  ];
  const color = (row, read, write) => createColorField({ picker: row.picker, hex: row.hex, getState, updateState, read, write });
  const colors = [
    color(fill1, (s) => get(s).fill.colors[0], (d, v) => (get(d).fill.colors[0] = v)),
    color(fill2, (s) => get(s).fill.colors[1], (d, v) => (get(d).fill.colors[1] = v)),
    color(borderColor, (s) => B(s).color, (d, v) => (B(d).color = v)),
    color(innerColor, (s) => B(s).multi.innerColor, (d, v) => (B(d).multi.innerColor = v)),
    color(moldingColor, (s) => B(s).molding.color, (d, v) => (B(d).molding.color = v)),
    color(matColor, (s) => B(s).mat.color, (d, v) => (B(d).mat.color = v)),
  ];

  visible.box.addEventListener("change", (e) => set((f) => (f.visible = e.target.checked)));
  autoColor.box.addEventListener("change", (e) => set((f) => (f.colorMode = e.target.checked ? "auto" : "manual")));
  fit.box.addEventListener("change", (e) => set((f) => (f.fit.on = e.target.checked)));
  const v11Ranges = [
    bindRange(fitPadding, { ...common, ...pct(0, 0.3), read: (s) => get(s).fit.padding, write: (d, v) => (get(d).fit.padding = v) }),
    bindRange(chamfer, { ...common, ...pct(0, 0.2), read: (s) => get(s).border.multi.chamfer, write: (d, v) => (get(d).border.multi.chamfer = v) }),
    bindRange(scallopCount, { ...common, read: (s) => get(s).border.scallop.count, write: (d, v) => (get(d).border.scallop.count = Math.round(Math.max(6, Math.min(80, v)))) }),
    bindRange(scallopDepth, { ...common, ...pct(0, 0.1), read: (s) => get(s).border.scallop.depth, write: (d, v) => (get(d).border.scallop.depth = v) }),
    bindRange(dotSize, { ...common, ...pct(0.002, 0.08), read: (s) => get(s).border.dots.size, write: (d, v) => (get(d).border.dots.size = v) }),
    bindRange(dotSpacing, { ...common, ...pct(0.005, 0.2), read: (s) => get(s).border.dots.spacing, write: (d, v) => (get(d).border.dots.spacing = v) }),
    bindRange(stitchDash, { ...common, ...pct(0.002, 0.1), read: (s) => get(s).border.stitch.dash, write: (d, v) => (get(d).border.stitch.dash = v) }),
    createColorField({ picker: stitchColor.picker, hex: stitchColor.hex, getState, updateState, read: (s) => get(s).border.stitch.color, write: (d, v) => (get(d).border.stitch.color = v) }),
  ];
  shape.select.addEventListener("change", (e) => set((f) => (f.shape = e.target.value)));
  fillType.select.addEventListener("change", (e) => set((f) => (f.fill.type = e.target.value)));
  style.select.addEventListener("change", (e) => set((f) => (f.border.style = e.target.value)));
  dashed.box.addEventListener("change", (e) => set((f) => (f.border.multi.dashedInner = e.target.checked)));

  return {
    sync(state) {
      const f = get(state);
      visible.box.checked = f.visible;
      body.hidden = !f.visible;
      if (!f.visible) return;
      shape.select.value = f.shape;
      fillType.select.value = f.fill.type;
      style.select.value = f.border.style;
      dashed.box.checked = f.border.multi.dashedInner;
      radius.row.hidden = !(f.shape === "rounded" || f.shape === "arch");
      fill2.row.hidden = f.fill.type !== "linear";
      angle.row.hidden = f.fill.type !== "linear";
      stop0.row.hidden = stop1.row.hidden = f.fill.type !== "linear";
      const st = f.border.style;
      multiBox.hidden = !(st === "multi" || st === "offset");
      chamfer.row.hidden = st !== "multi";
      scallopBox.hidden = st !== "scallop";
      dotsBox.hidden = st !== "dotted";
      stitchBox.hidden = st !== "stitch";
      autoColor.box.checked = f.colorMode === "auto";
      autoHint.hidden = f.colorMode !== "auto";
      fit.box.checked = f.fit.on;
      fitPadding.row.hidden = !f.fit.on;
      v11Ranges.forEach((r) => r.sync(state));
      count.row.hidden = st !== "multi";
      offsetBox.hidden = st !== "offset";
      moldingBox.hidden = !["picture", "pictureMat", "scallop", "stitch"].includes(st);
      matBox.hidden = st !== "pictureMat";
      ranges.forEach((r) => r.sync(state));
      colors.forEach((c) => c.sync(state));
    },
  };
}

export function createMdDecorPanel(container, { get, getState, updateState, getStickerFiles, selectBanner }) {
  const set = (mutate) => updateState((draft) => mutate(get(draft)));
  const common = { getState, updateState, enabled: () => true };

  // corners
  const cornerType = selectRow("모서리 장식", []);
  const fillCorners = () => {
    const files = getStickerFiles();
    const entries = [
      { value: "none", text: STRINGS.none },
      { group: "도형", items: CORNER_GLYPHS.map((k) => ({ value: k, text: GLYPHS[k].name })) },
      { group: "모서리 장식", items: Object.entries(CORNER_ORNAMENTS).map(([id, o]) => ({ value: `builtin:${id}`, text: o.name })) },
    ];
    if (files.length) entries.push({ group: "내 스티커 (폴더)", items: files.map((f) => ({ value: `file:${f.file}`, text: f.name })) });
    cornerType.fill(entries);
  };
  fillCorners();
  const cornerColor = colorRow("모서리 색");
  const cornerSize = rangeRow("모서리 크기", { min: 0.5, max: 15, step: 0.1, unit: "%" });
  const cornerInset = rangeRow("안쪽으로", { min: -20, max: 20, step: 0.5, unit: "%" });

  // top
  // Legacy (childish) types are hidden from the list; an old project that uses one keeps it,
  // shown as "(이전 버전)" — never silently replaced.
  const topEntries = (current) =>
    TOP_TYPES.filter((v) => !LEGACY_TOP_TYPES.includes(v) || v === current).map((v) => ({
      value: v,
      text: LEGACY_TOP_TYPES.includes(v) ? `${STRINGS.topTypes[v]} (이전 버전)` : STRINGS.topTypes[v],
    }));
  const topType = selectRow("위쪽 장식", topEntries(null));
  let topListFor = null;
  const topColor = colorRow("장식 색");
  const topColor2 = colorRow("장식 색 2");
  const topSize = rangeRow("장식 크기", { min: 20, max: 300, step: 5, unit: "%" });

  // swirls + outline
  const swirls = checkRow("모서리 소용돌이 + 옆 별");
  const swirlColor = colorRow("소용돌이 색");
  const swirlStar = colorRow("별 색");
  const outlineOn = checkRow("장식 외곽선");
  const outlineColor = colorRow("외곽선 색");

  // banner
  const banner = checkRow("배너 리본");
  const bannerText = el("input", { class: "text-input", type: "text", maxlength: "40", "aria-label": "배너 글자" });
  const bannerFont = fontRow("배너 글꼴");
  const bannerFontNotice = el("p", { class: "notice", hidden: true });
  const bannerSpacing = rangeRow("글자 간격", { min: -20, max: 100, step: 1, unit: "%" });
  const bannerColor = colorRow("리본 색");
  const bannerBack = colorRow("접힌 부분 색");
  const bannerText2 = colorRow("글자 색");
  const bannerBend = rangeRow("휘어짐", { min: 0, max: 30, step: 0.5, unit: "%" });
  const bannerThick = rangeRow("리본 두께", { min: 4, max: 30, step: 0.5, unit: "%" });
  const bannerSelect = el("button", { class: "reseed-button", type: "button", text: "배너 선택 (끌어서 이동 · Ctrl+휠 크기)" });
  const bannerBody = el("div", {}, bannerText, bannerFont.row, bannerFontNotice, bannerSpacing.row, bannerColor.row, bannerBack.row, bannerText2.row, bannerBend.row, bannerThick.row, bannerSelect);

  const topBody = el("div", {}, topColor.row, topColor2.row, topSize.row);
  const cornerBody = el("div", {}, cornerColor.row, cornerSize.row, cornerInset.row);
  const swirlBody = el("div", {}, swirlColor.row, swirlStar.row);

  container.append(
    group("모서리", true, cornerType.row, cornerBody),
    group("위쪽", true, topType.row, topBody),
    group("배너 리본", false, banner.row, bannerBody),
    group("기타", false, swirls.row, swirlBody, outlineOn.row, outlineColor.row),
    el("p", { class: "hint", text: STRINGS.decorFrameHint }),
  );

  const D = get;
  const ranges = [
    bindRange(cornerSize, { ...common, ...pct(0.005, 0.15), read: (s) => D(s).corners.size, write: (d, v) => (D(d).corners.size = v) }),
    bindRange(cornerInset, { ...common, ...pct(0, 0.2), read: (s) => D(s).corners.inset, write: (d, v) => (D(d).corners.inset = v) }),
    bindRange(topSize, { ...common, ...pct(0.2, 3), read: (s) => D(s).top.size, write: (d, v) => (D(d).top.size = v) }),
    bindRange(bannerSpacing, { ...common, ...pct(-0.2, 1), read: (s) => D(s).banner.letterSpacing, write: (d, v) => (D(d).banner.letterSpacing = v) }),
    bindRange(bannerBend, { ...common, ...pct(0, 0.3), read: (s) => D(s).banner.bend, write: (d, v) => (D(d).banner.bend = v) }),
    bindRange(bannerThick, { ...common, ...pct(0.04, 0.3), read: (s) => D(s).banner.thickness, write: (d, v) => (D(d).banner.thickness = v) }),
  ];
  const color = (row, read, write) => createColorField({ picker: row.picker, hex: row.hex, getState, updateState, read, write });
  const colors = [
    color(cornerColor, (s) => D(s).corners.color, (d, v) => (D(d).corners.color = v)),
    color(topColor, (s) => D(s).top.color, (d, v) => (D(d).top.color = v)),
    color(topColor2, (s) => D(s).top.color2, (d, v) => (D(d).top.color2 = v)),
    color(swirlColor, (s) => D(s).swirls.color, (d, v) => (D(d).swirls.color = v)),
    color(swirlStar, (s) => D(s).swirls.color2, (d, v) => (D(d).swirls.color2 = v)),
    color(outlineColor, (s) => D(s).outline.color, (d, v) => (D(d).outline.color = v)),
    color(bannerColor, (s) => D(s).banner.color, (d, v) => (D(d).banner.color = v)),
    color(bannerBack, (s) => D(s).banner.back, (d, v) => (D(d).banner.back = v)),
    color(bannerText2, (s) => D(s).banner.textColor, (d, v) => (D(d).banner.textColor = v)),
  ];

  cornerType.select.addEventListener("change", (e) => set((x) => (x.corners.type = e.target.value)));
  topType.select.addEventListener("change", (e) => set((x) => (x.top.type = e.target.value)));
  swirls.box.addEventListener("change", (e) => set((x) => (x.swirls.visible = e.target.checked)));
  outlineOn.box.addEventListener("change", (e) => set((x) => (x.outline.on = e.target.checked)));
  banner.box.addEventListener("change", (e) => {
    set((x) => (x.banner.visible = e.target.checked));
    if (e.target.checked) selectBanner();
  });
  bannerText.addEventListener("input", (e) => set((x) => (x.banner.text = e.target.value.slice(0, 40))));
  bannerFont.select.addEventListener("change", (e) => set((x) => (x.banner.font = e.target.value)));
  bannerSelect.addEventListener("click", () => selectBanner());

  return {
    refreshStickerFiles: fillCorners,
    sync(state) {
      const d = get(state);
      if (![...cornerType.select.options].some((o) => o.value === d.corners.type)) {
        cornerType.select.append(el("option", { value: d.corners.type, text: STRINGS.patternNotListed(d.corners.type.replace(/^file:/, "")) }));
      }
      cornerType.select.value = d.corners.type;
      cornerBody.hidden = d.corners.type === "none";
      const legacyNow = LEGACY_TOP_TYPES.includes(d.top.type) ? d.top.type : null;
      if (legacyNow !== topListFor) {
        topType.fill(topEntries(legacyNow));
        topListFor = legacyNow;
      }
      topType.select.value = d.top.type;
      topBody.hidden = d.top.type === "none";
      swirls.box.checked = d.swirls.visible;
      swirls.row.hidden = !d.swirls.visible; // legacy: offered only to projects already using it
      swirlBody.hidden = !d.swirls.visible;
      outlineOn.box.checked = d.outline.on;
      outlineColor.row.hidden = !d.outline.on;
      banner.box.checked = d.banner.visible;
      bannerBody.hidden = !d.banner.visible;
      if (document.activeElement !== bannerText) bannerText.value = d.banner.text;
      bannerFont.select.value = d.banner.font;
      const missing = d.banner.visible && d.banner.text && fontStatus(d.banner.font) === "missing";
      bannerFontNotice.hidden = !missing;
      bannerFontNotice.textContent = missing ? STRINGS.fontMissing : "";
      ranges.forEach((r) => r.sync(state));
      colors.forEach((c) => c.sync(state));
    },
  };
}
