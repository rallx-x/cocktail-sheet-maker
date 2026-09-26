import { BUILTIN_PATTERNS, PATTERN_GROUPS, getBuiltinPattern, minScaleFor } from "../patterns/builtin.js";
import { makeSeed } from "../patterns/prng.js";
import { EDGE_STYLES, PLATE_LIMITS, copyPlateDesign } from "../components/plate.js";
import { DECOR_MAX_GRAPHEMES, splitGraphemes } from "../components/decor-path.js";
import { fontStatus } from "../fonts.js";
import { SCALE_RANGE } from "../state.js";
import { bindRange, colorRow, createColorField, el, fontRow, rangeRow } from "../ui/controls.js";
import { STRINGS } from "../strings.js";

// "받침 설정": ONE UI component, bound to a plate through `read` / `write`.
// Used for the MD coaster (when it is a plate) and for the SD doily.
//   read(state)            → plate | null
//   write(draft, mutate)   → calls mutate(plate) on the draft's plate
//   other                  → { read, write } of the OTHER plate, for design sync
// Design sync: every control except 모양 (aspect) and 다시 뽑기 (seed) is a design field; while
// sync is on, design edits are applied to both plates. Geometry and seeds never sync.
export function createPlatePanel(container, { read, write: writeOwn, other, getState, updateState }) {
  const enabled = (state) => Boolean(read(state));
  const synced = (state) => state.components.plateSync === true && Boolean(other.read(state));
  const write = (draft, mutate, { design = true } = {}) => {
    writeOwn(draft, mutate);
    if (design && synced(draft)) other.write(draft, mutate);
  };
  const setPlate = (mutate, options) => updateState((draft) => write(draft, mutate, options));
  const common = { getState, updateState, enabled };

  // ----- 모양 -----
  const aspect = rangeRow("모양 (납작 ↔ 동그란)", { min: 20, max: 100, step: 1, unit: "%" });
  const edgeSelect = el(
    "select",
    { "aria-label": "테두리 모양" },
    ...EDGE_STYLES.map((style) => el("option", { value: style, text: STRINGS.edgeStyles[style] })),
  );
  const edgeRow = el("div", { class: "pattern-row" }, el("span", { class: "field-label", text: "테두리" }), edgeSelect);
  const edgeCount = rangeRow("물결 개수", { min: PLATE_LIMITS.edgeCount[0], max: PLATE_LIMITS.edgeCount[1], step: 1 });
  const edgeDepth = rangeRow("물결 깊이", { min: 0, max: PLATE_LIMITS.edgeDepth[1] * 100, step: 0.5, unit: "%" });
  const laceBox = el("input", { type: "checkbox" });
  const laceRow = el("label", { class: "check-row" }, laceBox, el("span", { text: "레이스 구멍 (바깥쪽에 구멍 뚫기)" }));
  const ringRatio = rangeRow("안쪽 선 위치", { min: PLATE_LIMITS.ringRatio[0] * 100, max: PLATE_LIMITS.ringRatio[1] * 100, step: 1, unit: "%" });
  const ringWidth = rangeRow("안쪽 선 굵기", { min: 0, max: PLATE_LIMITS.ringWidth[1] * 100, step: 0.1, unit: "%" });

  // ----- 색 -----
  const outer = colorRow("바깥 색");
  const inner = colorRow("안쪽 색");
  const line = colorRow("선 색");

  // ----- 안쪽 패턴 -----
  const patternSelect = el("select", { "aria-label": "안쪽 패턴" });
  patternSelect.append(
    el("option", { value: "", text: STRINGS.patternNone }),
    ...PATTERN_GROUPS.map((group) =>
      el(
        "optgroup",
        { label: group.name },
        ...BUILTIN_PATTERNS.filter((def) => def.group === group.id).map((def) => el("option", { value: def.id, text: def.name })),
      ),
    ),
  );
  const patternRow = el("div", { class: "pattern-row" }, el("span", { class: "field-label", text: "패턴" }), patternSelect);
  const patternColor = colorRow("패턴 색");
  const patternOpacity = rangeRow("진하기", { min: 0, max: 100, step: 1, unit: "%" });
  const patternScale = rangeRow("크기", { min: SCALE_RANGE.min * 100, max: SCALE_RANGE.max * 100, step: 5, unit: "%" });
  const reseed = el("button", { class: "reseed-button", type: "button", text: "🎲 배치 다시 뽑기" });
  const patternControls = el("div", {}, patternColor.row, patternOpacity.row, patternScale.row, reseed);

  // ----- 장식 글자 (curved, follows this plate's own ellipse) -----
  const decorText = el("input", { class: "text-input", type: "text", placeholder: "예: ✦ ･ﾟ ✧ ･ﾟ ✦", "aria-label": "장식 글자" });
  const decorLimit = el("p", { class: "hint", text: STRINGS.decorLimit(DECOR_MAX_GRAPHEMES) });
  const { row: decorFontRow, select: decorFont } = fontRow("글꼴");
  const decorFontNotice = el("p", { class: "notice", hidden: true });
  const decorColor = colorRow("글자 색");
  const decorSize = rangeRow("글자 크기", { min: PLATE_LIMITS.decorSize[0] * 100, max: PLATE_LIMITS.decorSize[1] * 100, step: 0.5, unit: "%" });
  const decorOffset = rangeRow("받침과 거리", { min: PLATE_LIMITS.decorOffset[0] * 100, max: PLATE_LIMITS.decorOffset[1] * 100, step: 1, unit: "%" });
  const decorStart = rangeRow("위치 (각도)", { min: PLATE_LIMITS.decorStart[0], max: PLATE_LIMITS.decorStart[1], step: 1, unit: "°" });
  const decorSpacing = rangeRow("글자 간격", { min: PLATE_LIMITS.decorSpacing[0] * 100, max: PLATE_LIMITS.decorSpacing[1] * 100, step: 1, unit: "%" });
  const decorHint = el("p", { class: "hint", text: STRINGS.decorHint });
  const decorControls = el("div", {}, decorFontRow, decorFontNotice, decorColor.row, decorSize.row, decorOffset.row, decorStart.row, decorSpacing.row);

  // ----- sync -----
  const syncBox = el("input", { type: "checkbox" });
  const syncRow = el("label", { class: "check-row sync-row" }, syncBox, el("span", { text: "코스터와 도일리 디자인 맞추기" }));
  const syncHint = el("p", { class: "hint", text: STRINGS.syncHint });

  const group = (title, open, ...children) =>
    el("details", { class: "subsection", open }, el("summary", { text: title }), el("div", { class: "subsection-body" }, ...children));

  container.append(
    el(
      "div",
      { class: "plate-panel" },
      group("모양", true, aspect.row, edgeRow, edgeCount.row, edgeDepth.row, laceRow, ringRatio.row, ringWidth.row),
      group("색", true, outer.row, inner.row, line.row),
      group("안쪽 패턴", false, patternRow, patternControls),
      group("장식 글자", false, decorText, decorLimit, decorControls, decorHint),
      el("div", { class: "subsection-body" }, syncRow, syncHint),
    ),
  );

  // ----- Bindings -----
  const ranges = [
    bindRange(aspect, { ...common, read: (s) => read(s).aspect, write: (d, v) => write(d, (p) => (p.aspect = v), { design: false }), toUi: (v) => v * 100, fromUi: (v) => clamp(v / 100, PLATE_LIMITS.aspect) }),
    bindRange(edgeCount, { ...common, read: (s) => read(s).edge.count, write: (d, v) => write(d, (p) => (p.edge.count = Math.round(clamp(v, PLATE_LIMITS.edgeCount)))), enabled: (s) => enabled(s) && read(s).edge.style !== "smooth" }),
    bindRange(edgeDepth, { ...common, read: (s) => read(s).edge.depth, write: (d, v) => write(d, (p) => (p.edge.depth = v)), toUi: (v) => v * 100, fromUi: (v) => clamp(v / 100, PLATE_LIMITS.edgeDepth), enabled: (s) => enabled(s) && read(s).edge.style !== "smooth" }),
    bindRange(ringRatio, { ...common, read: (s) => read(s).ring.ratio, write: (d, v) => write(d, (p) => (p.ring.ratio = v)), toUi: (v) => v * 100, fromUi: (v) => clamp(v / 100, PLATE_LIMITS.ringRatio) }),
    bindRange(ringWidth, { ...common, read: (s) => read(s).ring.width, write: (d, v) => write(d, (p) => (p.ring.width = v)), toUi: (v) => v * 100, fromUi: (v) => clamp(v / 100, PLATE_LIMITS.ringWidth) }),
    bindRange(patternOpacity, { ...common, read: (s) => read(s).pattern.opacity, write: (d, v) => write(d, (p) => (p.pattern.opacity = v)), toUi: (v) => v * 100, fromUi: (v) => clamp(v / 100, [0, 1]), enabled: (s) => enabled(s) && Boolean(read(s).pattern.id) }),
    bindRange(patternScale, {
      ...common,
      read: (s) => read(s).pattern.scale,
      write: (d, v) => write(d, (p) => (p.pattern.scale = Math.max(v, minScaleFor(p.pattern.id, SCALE_RANGE.min)))),
      toUi: (v) => v * 100,
      fromUi: (v) => clamp(v / 100, [SCALE_RANGE.min, SCALE_RANGE.max]),
      enabled: (s) => enabled(s) && Boolean(read(s).pattern.id),
    }),
  ];
  ranges.push(
    bindRange(decorSize, { ...common, read: (s) => read(s).decor.size, write: (d, v) => write(d, (p) => (p.decor.size = v)), toUi: (v) => v * 100, fromUi: (v) => clamp(v / 100, PLATE_LIMITS.decorSize) }),
    bindRange(decorOffset, { ...common, read: (s) => read(s).decor.offset, write: (d, v) => write(d, (p) => (p.decor.offset = v)), toUi: (v) => v * 100, fromUi: (v) => clamp(v / 100, PLATE_LIMITS.decorOffset) }),
    bindRange(decorStart, { ...common, read: (s) => read(s).decor.start, write: (d, v) => write(d, (p) => (p.decor.start = v)), fromUi: (v) => clamp(v, PLATE_LIMITS.decorStart) }),
    bindRange(decorSpacing, { ...common, read: (s) => read(s).decor.spacing, write: (d, v) => write(d, (p) => (p.decor.spacing = v)), toUi: (v) => v * 100, fromUi: (v) => clamp(v / 100, PLATE_LIMITS.decorSpacing) }),
  );
  const colors = [
    createColorField({ picker: outer.picker, hex: outer.hex, getState, updateState, read: (s) => read(s)?.colors.outer, write: (d, v) => write(d, (p) => (p.colors.outer = v)) }),
    createColorField({ picker: inner.picker, hex: inner.hex, getState, updateState, read: (s) => read(s)?.colors.inner, write: (d, v) => write(d, (p) => (p.colors.inner = v)) }),
    createColorField({ picker: line.picker, hex: line.hex, getState, updateState, read: (s) => read(s)?.colors.line, write: (d, v) => write(d, (p) => (p.colors.line = v)) }),
    createColorField({ picker: patternColor.picker, hex: patternColor.hex, getState, updateState, read: (s) => read(s)?.pattern.color, write: (d, v) => write(d, (p) => (p.pattern.color = v)) }),
    createColorField({ picker: decorColor.picker, hex: decorColor.hex, getState, updateState, read: (s) => read(s)?.decor.color, write: (d, v) => write(d, (p) => (p.decor.color = v)) }),
  ];

  // The grapheme limit is enforced in the input itself (never silently at render time).
  decorText.addEventListener("input", (event) => {
    const graphemes = splitGraphemes(event.target.value);
    if (graphemes.length > DECOR_MAX_GRAPHEMES) event.target.value = graphemes.slice(0, DECOR_MAX_GRAPHEMES).join("");
    const text = event.target.value;
    setPlate((p) => (p.decor.text = text));
  });
  decorFont.addEventListener("change", (event) => setPlate((p) => (p.decor.font = event.target.value)));

  // Turning sync on copies THIS plate's design to the other one; turning it off changes nothing.
  syncBox.addEventListener("change", (event) => {
    const on = event.target.checked;
    updateState((draft) => {
      draft.components.plateSync = on;
      const mine = read(draft);
      const theirs = other.read(draft);
      if (on && mine && theirs) copyPlateDesign(mine, theirs);
    });
  });

  edgeSelect.addEventListener("change", (event) => setPlate((p) => (p.edge.style = event.target.value)));
  laceBox.addEventListener("change", (event) => setPlate((p) => (p.lace = event.target.checked)));
  patternSelect.addEventListener("change", (event) => {
    const id = event.target.value || null;
    setPlate((p) => {
      p.pattern.id = id;
      if (id) p.pattern.scale = Math.max(p.pattern.scale, minScaleFor(id, SCALE_RANGE.min));
    });
  });
  // The only place a plate's seed changes: an explicit user action on THIS plate.
  reseed.addEventListener("click", () => {
    const seed = makeSeed();
    setPlate((p) => (p.pattern.seed = seed), { design: false });
  });

  return {
    sync(state) {
      const plate = read(state);
      container.hidden = !plate;
      if (!plate) return;
      for (const r of ranges) r.sync(state);
      for (const c of colors) c.sync(state);
      edgeSelect.value = plate.edge.style;
      laceBox.checked = plate.lace;
      patternSelect.value = plate.pattern.id ?? "";
      patternControls.hidden = !plate.pattern.id;
      reseed.hidden = !getBuiltinPattern(plate.pattern.id)?.random;
      const minPct = Math.round(minScaleFor(plate.pattern.id, SCALE_RANGE.min) * 100);
      patternScale.range.min = String(minPct);
      patternScale.number.min = String(minPct);

      if (document.activeElement !== decorText) decorText.value = plate.decor.text;
      decorFont.value = plate.decor.font;
      decorControls.hidden = !plate.decor.text;
      const missing = plate.decor.text && fontStatus(plate.decor.font) === "missing";
      decorFontNotice.hidden = !missing;
      decorFontNotice.textContent = missing ? STRINGS.fontMissing : "";
      syncBox.checked = state.components.plateSync === true;
    },
  };
}

function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, value));
}
