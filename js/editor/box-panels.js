import { TRAY_SHAPES } from "../components/boxes.js";
import { fontStatus } from "../fonts.js";
import { bindRange, colorRow, createColorField, el, fontRow, rangeRow } from "../ui/controls.js";
import { STRINGS } from "../strings.js";

// Small generated panels for the MD frame, the SD tray and the sheet branding.
// Position / width are edited on the canvas (drag, Ctrl + wheel) and with the section's
// 크기 slider; these panels only hold appearance and 비율.

function selectRow(label, values, labels) {
  const select = el("select", { "aria-label": label }, ...values.map((v) => el("option", { value: v, text: labels[v] })));
  return { row: el("div", { class: "pattern-row" }, el("span", { class: "field-label", text: label }), select), select };
}

function checkRow(label) {
  const box = el("input", { type: "checkbox" });
  return { row: el("label", { class: "check-row" }, box, el("span", { text: label })), box };
}

export function createTrayPanel(container, { get, getDoily, getState, updateState }) {
  const set = (mutate) => updateState((draft) => mutate(get(draft)));
  const visible = checkRow("트레이 보이기");
  const shape = selectRow("모양", TRAY_SHAPES, STRINGS.trayShapes);
  const aspect = rangeRow("세로 비율", { min: 20, max: 200, step: 1, unit: "%" });
  const radius = rangeRow("모서리 둥글기", { min: 0, max: 50, step: 0.5, unit: "%" });
  const border = rangeRow("테두리 굵기", { min: 0, max: 5, step: 0.1, unit: "%" });
  const fill = colorRow("트레이 색");
  const borderColor = colorRow("테두리 색");
  const rimStyle = selectRow("테두리 느낌", ["reflect", "solid"], { reflect: "반사광", solid: "한 가지 색" });
  const rimStrength = rangeRow("반사광 세기", { min: 0, max: 100, step: 1, unit: "%" });
  const rimLight = colorRow("반사광 색");
  const center = el("button", { class: "reseed-button", type: "button", text: "도일리 가운데로 맞추기" });
  const body = el("div", {}, center, shape.row, aspect.row, radius.row, border.row, fill.row, rimStyle.row, borderColor.row, rimStrength.row, rimLight.row);
  container.append(visible.row, body);
  // Editor action: tray center = doily center (one update, nothing new in state).
  center.addEventListener("click", () =>
    updateState((draft) => {
      const t = get(draft);
      const d = getDoily(draft);
      t.x = d.x;
      t.y = d.y;
    }),
  );

  const on = (s) => get(s).visible;
  const common = { getState, updateState, enabled: on };
  const pct = { toUi: (v) => v * 100 };
  const ranges = [
    bindRange(aspect, { ...common, ...pct, read: (s) => get(s).aspect, write: (d, v) => (get(d).aspect = v), fromUi: (v) => Math.min(2, Math.max(0.2, v / 100)) }),
    bindRange(radius, { ...common, ...pct, read: (s) => get(s).radius, write: (d, v) => (get(d).radius = v), fromUi: (v) => Math.min(0.5, Math.max(0, v / 100)), enabled: (s) => on(s) && get(s).shape === "rounded" }),
    bindRange(border, { ...common, ...pct, read: (s) => get(s).border, write: (d, v) => (get(d).border = v), fromUi: (v) => Math.min(0.05, Math.max(0, v / 100)) }),
    bindRange(rimStrength, { ...common, ...pct, read: (s) => get(s).rim.strength, write: (d, v) => (get(d).rim.strength = v), fromUi: (v) => Math.min(1, Math.max(0, v / 100)) }),
  ];
  const colors = [
    createColorField({ picker: fill.picker, hex: fill.hex, getState, updateState, read: (s) => get(s).colors.fill, write: (d, v) => (get(d).colors.fill = v) }),
    createColorField({ picker: borderColor.picker, hex: borderColor.hex, getState, updateState, read: (s) => get(s).colors.border, write: (d, v) => (get(d).colors.border = v) }),
    createColorField({ picker: rimLight.picker, hex: rimLight.hex, getState, updateState, read: (s) => get(s).rim.light, write: (d, v) => (get(d).rim.light = v) }),
  ];
  rimStyle.select.addEventListener("change", (e) => set((t) => (t.rim.style = e.target.value)));

  visible.box.addEventListener("change", (e) => set((t) => (t.visible = e.target.checked)));
  shape.select.addEventListener("change", (e) => set((t) => (t.shape = e.target.value)));

  return {
    sync(state) {
      const tray = get(state);
      visible.box.checked = tray.visible;
      body.hidden = !tray.visible;
      if (!tray.visible) return;
      shape.select.value = tray.shape;
      rimStyle.select.value = tray.rim.style;
      const reflect = tray.rim.style === "reflect";
      borderColor.row.hidden = reflect; // the reflect rim takes its colors from the fill + light
      rimStrength.row.hidden = rimLight.row.hidden = !reflect;
      ranges.forEach((r) => r.sync(state));
      colors.forEach((c) => c.sync(state));
    },
  };
}

export function createBrandPanel(container, { get, getState, updateState }) {
  const set = (mutate) => updateState((draft) => mutate(get(draft)));
  const visible = checkRow("브랜딩 보이기");
  const line1 = el("input", { class: "text-input", type: "text", maxlength: "40", "aria-label": "브랜딩 첫째 줄" });
  const line2 = el("input", { class: "text-input", type: "text", maxlength: "40", "aria-label": "브랜딩 둘째 줄" });
  const size = rangeRow("크기", { min: 2, max: 60, step: 0.5, unit: "%" });
  const spacing = rangeRow("자간", { min: -20, max: 100, step: 1, unit: "%" });
  const lineHeight = rangeRow("줄 간격", { min: 60, max: 250, step: 1, unit: "%" });
  const font = fontRow("글꼴");
  const color = colorRow("글자 색");
  const autoColor = el("label", { class: "check-row" }, el("input", { type: "checkbox" }), el("span", { text: "자동 색 (프레임 위면 프레임 선 색, 아니면 배경에 맞춤)" }));
  const autoBox = autoColor.querySelector("input");
  const outline = checkRow("글자 외곽선");
  const outlineWidth = rangeRow("외곽선 굵기", { min: 0, max: 20, step: 0.5, unit: "%" });
  const outlineColor = colorRow("외곽선 색");
  const notice = el("p", { class: "notice", hidden: true });
  const hint = el("p", { class: "hint", text: STRINGS.brandHint });
  const body = el("div", {}, line1, line2, font.row, size.row, spacing.row, lineHeight.row, autoColor, color.row, outline.row, outlineWidth.row, outlineColor.row, notice, hint);
  container.append(visible.row, body);

  const sizeBinding = bindRange(size, {
    getState,
    updateState,
    enabled: (s) => get(s).visible,
    read: (s) => get(s).width,
    write: (d, v) => (get(d).width = v),
    toUi: (v) => v * 100,
    fromUi: (v) => Math.min(0.6, Math.max(0.02, v / 100)),
  });
  const colorField = createColorField({ picker: color.picker, hex: color.hex, getState, updateState, read: (s) => get(s).color, write: (d, v) => (get(d).color = v) });
  const spacingBinding = bindRange(spacing, {
    getState, updateState, enabled: (s) => get(s).visible,
    read: (s) => get(s).letterSpacing, write: (d, v) => (get(d).letterSpacing = v),
    toUi: (v) => v * 100, fromUi: (v) => Math.min(1, Math.max(-0.2, v / 100)),
  });
  const lineBinding = bindRange(lineHeight, {
    getState, updateState, enabled: (s) => get(s).visible,
    read: (s) => get(s).lineHeight, write: (d, v) => (get(d).lineHeight = v),
    toUi: (v) => v * 100, fromUi: (v) => Math.min(2.5, Math.max(0.6, v / 100)),
  });

  const outlineWidthBinding = bindRange(outlineWidth, {
    getState, updateState, enabled: (s) => get(s).visible && get(s).outline.visible,
    read: (s) => get(s).outline.width, write: (d, v) => (get(d).outline.width = v),
    toUi: (v) => v * 100, fromUi: (v) => Math.min(0.2, Math.max(0, v / 100)),
  });
  const outlineColorField = createColorField({ picker: outlineColor.picker, hex: outlineColor.hex, getState, updateState, read: (s) => get(s).outline.color, write: (d, v) => (get(d).outline.color = v) });
  outline.box.addEventListener("change", (e) => set((b) => (b.outline.visible = e.target.checked)));

  visible.box.addEventListener("change", (e) => set((b) => (b.visible = e.target.checked)));
  autoBox.addEventListener("change", (e) => set((b) => (b.colorMode = e.target.checked ? "auto" : "manual")));
  font.select.addEventListener("change", (e) => set((b) => (b.font = e.target.value)));
  line1.addEventListener("input", (e) => set((b) => (b.lines[0] = e.target.value)));
  line2.addEventListener("input", (e) => set((b) => (b.lines[1] = e.target.value)));

  return {
    sync(state) {
      const brand = get(state);
      visible.box.checked = brand.visible;
      body.hidden = !brand.visible;
      if (!brand.visible) return;
      if (document.activeElement !== line1) line1.value = brand.lines[0];
      if (document.activeElement !== line2) line2.value = brand.lines[1];
      sizeBinding.sync(state);
      spacingBinding.sync(state);
      lineBinding.sync(state);
      colorField.sync(state);
      outline.box.checked = brand.outline.visible;
      outlineWidth.row.hidden = outlineColor.row.hidden = !brand.outline.visible;
      outlineWidthBinding.sync(state);
      outlineColorField.sync(state);
      autoBox.checked = brand.colorMode === "auto";
      color.row.hidden = brand.colorMode === "auto"; // the manual color stays stored and returns
      font.select.value = brand.font;
      const missing = fontStatus(brand.font) === "missing";
      notice.hidden = !missing;
      notice.textContent = missing ? STRINGS.fontMissing : "";
    },
  };
}
