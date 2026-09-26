import { normalizeHexColor } from "../state.js";
import { STRINGS } from "../strings.js";
import { FONTS, FONT_ORDER } from "../fonts.js";

// Color picker + HEX text kept in sync. `read(state)` returns the current hex,
// `write(draft, hex)` applies it. Invalid HEX is flagged and never applied.
export function createColorField({ picker, hex, error, read, write, getState, updateState }) {
  const apply = (value) => {
    if (read(getState()) === value) return;
    updateState((draft) => write(draft, value));
  };
  const showError = (show) => {
    if (error) {
      error.hidden = !show;
      error.textContent = show ? STRINGS.invalidHex : "";
    }
    hex.setAttribute("aria-invalid", show ? "true" : "false");
  };

  picker.addEventListener("input", (event) => {
    const value = normalizeHexColor(event.target.value);
    if (!value) return;
    showError(false);
    hex.value = value;
    apply(value);
  });
  hex.addEventListener("input", (event) => {
    const value = normalizeHexColor(event.target.value);
    if (!value) return;
    showError(false);
    picker.value = value.toLowerCase();
    apply(value);
  });
  hex.addEventListener("change", (event) => {
    const value = normalizeHexColor(event.target.value);
    if (value) event.target.value = value;
    showError(!value);
  });
  hex.addEventListener("blur", (event) => {
    if (!normalizeHexColor(event.target.value)) {
      event.target.value = read(getState()) ?? "";
      showError(false);
    }
  });

  return {
    sync(state) {
      const value = read(state);
      if (!value) return;
      if (document.activeElement !== hex) hex.value = value;
      if (document.activeElement !== picker) picker.value = value.toLowerCase();
    },
  };
}

// Small DOM builders for panels generated in code (plate settings etc.).
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else if (value === true) node.setAttribute(key, "");
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  node.append(...children.filter(Boolean));
  return node;
}

export function colorRow(label) {
  const picker = el("input", { type: "color", "aria-label": `${label} 고르기` });
  const hex = el("input", { class: "hex-input", type: "text", maxlength: "7", spellcheck: "false", "aria-label": `${label} HEX 코드` });
  const row = el("div", { class: "color-row" }, el("span", { class: "field-label", text: label }), picker, hex);
  return { row, picker, hex };
}

// Range + number input bound to a numeric value. `toUi` / `fromUi` convert units.
export function rangeRow(label, { min, max, step, unit = "" }) {
  const range = el("input", { type: "range", min, max, step });
  const number = el("input", { class: "num-input", type: "number", min, max, step, "aria-label": `${label}${unit ? ` (${unit})` : ""}` });
  const row = el("label", { class: "range-row" }, el("span", { class: "field-label", text: label }), range, number);
  return { row, range, number };
}

export function bindRange({ range, number }, { read, write, toUi = (v) => v, fromUi = (v) => v, getState, updateState, enabled = () => true }) {
  const apply = (raw) => {
    const n = Number(raw);
    if (!Number.isFinite(n) || !enabled(getState())) return;
    updateState((draft) => write(draft, fromUi(n)));
  };
  range.addEventListener("input", (event) => apply(event.target.value));
  number.addEventListener("change", (event) => apply(event.target.value));
  return {
    sync(state) {
      const on = enabled(state);
      range.disabled = !on;
      number.disabled = !on;
      if (!on) return;
      const value = Math.round(toUi(read(state)) * 10) / 10;
      if (document.activeElement !== range) range.value = String(value);
      if (document.activeElement !== number) number.value = String(value);
    },
  };
}

// Shared font picker: every installed font, fixed order. Values are font IDs.
export function fontRow(label = "글꼴") {
  const select = el("select", { "aria-label": label }, ...FONT_ORDER.map((id) => el("option", { value: id, text: FONTS[id].label })));
  const row = el("div", { class: "pattern-row" }, el("span", { class: "field-label", text: label }), select);
  return { row, select };
}
