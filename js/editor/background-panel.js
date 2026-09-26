import { BG_DIRECTIONS, BG_STOP_LIMITS, colorAt, isGradientBackground, sortedStops, stopsCss } from "../background.js";
import { colorRow, createColorField, el } from "../ui/controls.js";

// v14 sheet background gradient editor (SHEET mode), modeled on paint-app gradient editors:
// a preview bar with color pins under it. Click the bar or "+ 색 추가" to add a pin, drag a pin to
// move it, select a pin to change its color / position, remove it (at least 2 stay).
// Only writes design.background. The solid "배경색" row (index.html) is shown while the gradient is off.

const DIRECTION_LABELS = { topToBottom: "위 → 아래", leftToRight: "왼쪽 → 오른쪽", diagonal: "대각선 ↘" };
const round = (v) => Math.round(v * 1000) / 1000;

export function createBackgroundPanel(container, { getState, updateState, solidRow }) {
  const bg = (s) => s.design.background;
  const toggle = el("label", { class: "check-row" }, el("input", { type: "checkbox" }), el("span", { text: "그라데이션 배경" }));
  const toggleBox = toggle.querySelector("input");
  const direction = el("select", { "aria-label": "그라데이션 방향" }, ...BG_DIRECTIONS.map((d) => el("option", { value: d, text: DIRECTION_LABELS[d] })));
  const directionRow = el("div", { class: "pattern-row" }, el("span", { class: "field-label", text: "방향" }), direction);
  const bar = el("div", { class: "gradient-bar", title: "누르면 그 자리에 색이 추가돼요" });
  const pins = el("div", { class: "gradient-pins" });
  const addButton = el("button", { class: "reseed-button", type: "button", text: "+ 색 추가" });
  const removeButton = el("button", { class: "reseed-button", type: "button", text: "색 지우기" });
  const count = el("span", { class: "hint gradient-count" });
  const color = colorRow("고른 색");
  const posRange = el("input", { type: "range", min: 0, max: 100, step: 1, "aria-label": "고른 색 위치" });
  const posNumber = el("input", { class: "num-input", type: "number", min: 0, max: 100, step: 1, "aria-label": "고른 색 위치 (%)" });
  const posRow = el("label", { class: "range-row" }, el("span", { class: "field-label", text: "위치" }), posRange, posNumber);
  const hint = el("p", { class: "hint", text: "색 핀을 끌어서 옮기고, 핀을 눌러서 색을 바꿔요. 막대를 누르면 그 자리에 색이 하나 더 생겨요." });
  const body = el("div", { class: "gradient-editor" }, directionRow, bar, pins, el("div", { class: "button-row" }, addButton, removeButton, count), color.row, posRow, hint);
  container.append(toggle, body);

  let selected = 0;
  const set = (mutate) => updateState((draft) => mutate(draft.design.background, draft));

  toggleBox.addEventListener("change", (e) =>
    set((b, d) => {
      b.type = e.target.checked ? "linear" : "solid";
      // first switch-on from the untouched default (all stops equal): start from white → the solid color
      if (b.type === "linear" && b.stops.every((st) => st.color === b.stops[0].color)) {
        b.stops = [{ pos: 0, color: "#FFFFFF" }, { pos: 1, color: d.design.backgroundColor }];
      }
    }),
  );
  direction.addEventListener("change", (e) => set((b) => (b.direction = e.target.value)));

  const posFromEvent = (event) => {
    const r = bar.getBoundingClientRect();
    return round(Math.min(1, Math.max(0, (event.clientX - r.left) / r.width)));
  };
  function addStop(pos) {
    const stops = bg(getState()).stops;
    if (stops.length >= BG_STOP_LIMITS.max) return;
    selected = stops.length; // the new stop is appended
    set((b) => b.stops.push({ pos, color: colorAt(b.stops, pos) }));
  }
  bar.addEventListener("click", (e) => addStop(posFromEvent(e)));
  addButton.addEventListener("click", () => {
    // middle of the widest gap between neighbouring stops
    const s = sortedStops(bg(getState()).stops);
    let best = 0;
    for (let i = 1; i < s.length; i++) if (s[i].pos - s[i - 1].pos > s[best + 1].pos - s[best].pos) best = i - 1;
    addStop(round((s[best].pos + s[best + 1].pos) / 2));
  });
  removeButton.addEventListener("click", () => {
    if (bg(getState()).stops.length <= BG_STOP_LIMITS.min) return;
    const i = selected;
    selected = Math.max(0, i - 1);
    set((b) => b.stops.splice(i, 1));
  });
  const setPos = (pos) => set((b) => b.stops[selected] && (b.stops[selected].pos = round(pos)));
  posRange.addEventListener("input", (e) => setPos(Number(e.target.value) / 100));
  posNumber.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    if (Number.isFinite(v)) setPos(Math.min(100, Math.max(0, v)) / 100);
  });
  const colorField = createColorField({
    picker: color.picker,
    hex: color.hex,
    getState,
    updateState,
    read: (s) => bg(s).stops[selected]?.color,
    write: (d, v) => d.design.background.stops[selected] && (d.design.background.stops[selected].color = v),
  });

  let pinNodes = [];
  function buildPins(n) {
    pins.replaceChildren();
    pinNodes = Array.from({ length: n }, (_, i) => {
      const pin = el("button", { class: "gradient-pin", type: "button", "aria-label": `색 핀 ${i + 1}` });
      pin.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        selected = i;
        pin.setPointerCapture(e.pointerId);
        sync(getState());
        const move = (ev) => setPos(posFromEvent(ev));
        const up = () => {
          pin.removeEventListener("pointermove", move);
          pin.removeEventListener("pointerup", up);
          pin.removeEventListener("pointercancel", up);
        };
        pin.addEventListener("pointermove", move);
        pin.addEventListener("pointerup", up);
        pin.addEventListener("pointercancel", up);
      });
      pin.addEventListener("keydown", (e) => {
        const step = e.shiftKey ? 0.1 : 0.01;
        const cur = bg(getState()).stops[i]?.pos ?? 0;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          selected = i;
          setPos(Math.min(1, Math.max(0, cur + (e.key === "ArrowLeft" ? -step : step))));
        } else if (e.key === "Delete") {
          selected = i;
          removeButton.click();
        }
      });
      pins.append(pin);
      return pin;
    });
  }

  function sync(state) {
    const b = bg(state);
    const on = isGradientBackground(state.design);
    toggleBox.checked = on;
    body.hidden = !on;
    if (solidRow) solidRow.hidden = on;
    if (!on) return;
    if (selected >= b.stops.length) selected = b.stops.length - 1;
    direction.value = b.direction;
    bar.style.background = stopsCss(b.stops);
    if (pinNodes.length !== b.stops.length) buildPins(b.stops.length);
    b.stops.forEach((st, i) => {
      const pin = pinNodes[i];
      pin.style.left = `${st.pos * 100}%`;
      pin.style.background = st.color;
      pin.setAttribute("aria-pressed", String(i === selected));
    });
    const cur = b.stops[selected];
    if (document.activeElement !== posRange) posRange.value = Math.round(cur.pos * 100);
    if (document.activeElement !== posNumber) posNumber.value = Math.round(cur.pos * 100);
    colorField.sync(state);
    addButton.disabled = b.stops.length >= BG_STOP_LIMITS.max;
    removeButton.disabled = b.stops.length <= BG_STOP_LIMITS.min;
    count.textContent = `색 ${b.stops.length}개 (최대 ${BG_STOP_LIMITS.max})`;
  }
  return { sync };
}
