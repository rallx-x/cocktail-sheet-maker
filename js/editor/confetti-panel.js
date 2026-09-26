import { sampleBackground } from "../background.js";
import { autoPalette } from "../decor/auto-color.js";
import { newSeed } from "../state.js";
import { bindRange, colorRow, createColorField, el, rangeRow } from "../ui/controls.js";
import { checkRow } from "./frame-panels.js";
import { STRINGS } from "../strings.js";

// "컨페티" subsection of MD: two independent seeded layers (뒤 = behind the frame, 앞 = over the
// coaster, under the character). Region = drag / Ctrl+wheel on the canvas or the sliders here.
// Q1: when an untouched layer is first enabled, its color gets ONE suggestion from the background
// (stored normally, no binding afterwards).

const pct = (min, max) => ({ toUi: (v) => v * 100, fromUi: (v) => Math.min(max, Math.max(min, v / 100)) });

function layerControls(key, label, { getState, updateState, select }) {
  const C = (s) => s.components.md.confetti[key];
  // any edit marks the layer as touched (so the one-time suggestion never fires again)
  const set = (mutate) =>
    updateState((d) => {
      const c = d.components.md.confetti[key];
      mutate(c);
      c.touched = true;
    });
  const common = { getState, updateState: (fn) => updateState((d) => { fn(d); C(d).touched = true; }), enabled: (s) => C(s).on };

  const on = checkRow(`${label} 켜기`);
  const pick = el("button", { class: "small", type: "button", text: "범위 선택 (끌어서 이동 · Ctrl+휠)" });
  const width = rangeRow("범위 너비", { min: 5, max: 150, step: 1, unit: "%" });
  const aspect = rangeRow("범위 세로 비율", { min: 5, max: 400, step: 1, unit: "%" });
  const size = rangeRow("조각 크기", { min: 0.2, max: 6, step: 0.1, unit: "%" });
  const density = rangeRow("밀도", { min: 0, max: 2000, step: 10 });
  const color = colorRow("메인 색");
  const spread = rangeRow("색 퍼짐 (옅게~진하게)", { min: 0, max: 100, step: 1, unit: "%" });
  const kinds = [
    ["curl", "꼬불 리본"],
    ["strip", "막대"],
    ["dot", "점"],
    ["sparkle", "반짝이"],
  ].map(([k, text]) => ({ k, row: checkRow(text) }));
  const reseed = el("button", { class: "reseed-button", type: "button", text: "🎲 배치 다시 뽑기" });
  const body = el("div", {}, pick, width.row, aspect.row, size.row, density.row, color.row, spread.row, ...kinds.map((x) => x.row.row), reseed);
  const node = el("div", { class: "confetti-layer" }, el("p", { class: "field-caption", text: label }), on.row, body);

  on.box.addEventListener("change", (e) => {
    const enabled = e.target.checked;
    updateState((d) => {
      const c = C(d);
      if (enabled && !c.touched) c.color = autoPalette(sampleBackground(d.design, d.design.width / 2, d.design.height / 2)).accent; // one-time suggestion
      c.on = enabled;
      c.touched = true;
    });
    if (enabled) select(`md.confetti.${key}`);
  });
  pick.addEventListener("click", () => select(`md.confetti.${key}`));
  kinds.forEach(({ k, row }) => row.box.addEventListener("change", (e) => set((c) => (c.kinds[k] = e.target.checked))));
  reseed.addEventListener("click", () => {
    const seed = newSeed(); // the ONLY way the arrangement changes
    set((c) => (c.seed = seed));
  });

  const bindings = [
    bindRange(width, { ...common, ...pct(0.05, 1.5), read: (s) => C(s).width, write: (d, v) => (C(d).width = v) }),
    bindRange(aspect, { ...common, ...pct(0.05, 4), read: (s) => C(s).aspect, write: (d, v) => (C(d).aspect = v) }),
    bindRange(size, { ...common, ...pct(0.002, 0.06), read: (s) => C(s).size, write: (d, v) => (C(d).size = v) }),
    bindRange(density, { ...common, read: (s) => C(s).density, write: (d, v) => (C(d).density = Math.max(0, Math.min(2000, v))) }),
    bindRange(spread, { ...common, ...pct(0, 1), read: (s) => C(s).spread, write: (d, v) => (C(d).spread = v) }),
    createColorField({ picker: color.picker, hex: color.hex, getState, updateState: common.updateState, read: (s) => C(s).color, write: (d, v) => (C(d).color = v) }),
  ];

  return {
    node,
    sync(state) {
      const c = C(state);
      on.box.checked = c.on;
      body.hidden = !c.on;
      if (!c.on) return;
      kinds.forEach(({ k, row }) => (row.box.checked = c.kinds[k]));
      bindings.forEach((b) => b.sync(state));
    },
  };
}

export function createConfettiPanel(container, deps) {
  const back = layerControls("back", "뒤 (프레임 뒤)", deps);
  const front = layerControls("front", "앞 (코스터 위, 캐릭터 아래)", deps);
  container.append(back.node, front.node, el("p", { class: "hint", text: STRINGS.confettiHint }));
  return {
    sync(state) {
      back.sync(state);
      front.sync(state);
    },
  };
}
