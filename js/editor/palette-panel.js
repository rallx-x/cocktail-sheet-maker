import { fontStatus } from "../fonts.js";
import { bindRange, colorRow, createColorField, el, fontRow, rangeRow } from "../ui/controls.js";
import { checkRow } from "./frame-panels.js";
import { STRINGS } from "../strings.js";

// "컬러 팔레트" section. Chip HEX values are real color state. "ORDER HEX 가져오기" is a ONE-TIME
// copy of components.order.hex into chip 1 — no binding afterwards.

const pct = (min, max) => ({ toUi: (v) => v * 100, fromUi: (v) => Math.min(max, Math.max(min, v / 100)) });
const group = (title, open, ...children) =>
  el("details", { class: "subsection", open }, el("summary", { text: title }), el("div", { class: "subsection-body" }, ...children));

export function createPalettePanel(container, { getState, updateState, select }) {
  const P = (s) => s.components.palette;
  const set = (mutate) => updateState((d) => mutate(P(d)));
  const common = { getState, updateState, enabled: (s) => P(s).visible };
  const color = (row, read, write) => createColorField({ picker: row.picker, hex: row.hex, getState, updateState, read, write });

  const visible = checkRow("팔레트 보이기");
  const pick = el("button", { class: "reseed-button", type: "button", text: "팔레트 선택 (끌어서 이동 · Ctrl+휠 크기)" });
  const aspect = rangeRow("세로 비율", { min: 30, max: 400, step: 1, unit: "%" });
  const fill = colorRow("카드 색");
  const border = colorRow("테두리 색");
  const radius = rangeRow("모서리 둥글기", { min: 0, max: 50, step: 0.5, unit: "%" });

  const titleInput = el("input", { class: "text-input", type: "text", maxlength: "30", "aria-label": "팔레트 제목" });
  const titleFont = fontRow("제목 글꼴");
  const titleSize = rangeRow("제목 크기", { min: 1, max: 20, step: 0.1, unit: "%" });
  const titleSpacing = rangeRow("제목 자간", { min: -20, max: 100, step: 1, unit: "%" });
  const titleColor = colorRow("제목 색");
  const textFont = fontRow("글자 글꼴");
  const fontNotice = el("p", { class: "notice", hidden: true });
  const textSize = rangeRow("글자 크기", { min: 1, max: 15, step: 0.1, unit: "%" });
  const textSpacing = rangeRow("글자 자간", { min: -20, max: 100, step: 1, unit: "%" });
  const textColor = colorRow("글자 색");

  const chipsBox = el("div", { class: "card-rows" });
  const addChip = el("button", { class: "small", type: "button", text: "＋ 색 추가 (최대 6개)" });
  const fromOrder = el("button", { class: "reseed-button", type: "button", text: "ORDER HEX 가져오기 (첫 번째 색에 한 번 복사)" });
  const orderNote = el("p", { class: "hint" });

  const body = el(
    "div",
    {},
    pick,
    group("색", true, chipsBox, addChip, fromOrder, orderNote),
    group("카드", false, aspect.row, fill.row, border.row, radius.row),
    group("글자", false, titleInput, titleFont.row, titleSize.row, titleSpacing.row, titleColor.row, textFont.row, fontNotice, textSize.row, textSpacing.row, textColor.row),
  );
  container.append(visible.row, body);

  let rendered = -1;
  function renderChips(state) {
    const chips = P(state).chips;
    rendered = chips.length;
    chipsBox.replaceChildren(
      ...chips.map((chip, i) => {
        const name = el("input", { class: "row-name", type: "text", maxlength: "16", value: chip.name, "aria-label": "색 이름" });
        name.addEventListener("input", (e) => set((p) => (p.chips[i].name = e.target.value.slice(0, 16))));
        const row = colorRow("");
        const field = createColorField({ picker: row.picker, hex: row.hex, getState, updateState, read: (s) => P(s).chips[i]?.hex, write: (d, v) => (P(d).chips[i].hex = v) });
        field.sync(state);
        const btn = (text, fn, disabled) => {
          const b = el("button", { class: "row-btn", type: "button", text });
          b.disabled = disabled;
          b.addEventListener("click", () => {
            fn();
            renderChips(getState());
          });
          return b;
        };
        const move = (to) => set((p) => p.chips.splice(to, 0, p.chips.splice(i, 1)[0]));
        const node = el(
          "div",
          { class: "palette-row" },
          row.picker,
          row.hex,
          name,
          btn("↑", () => move(i - 1), i === 0),
          btn("↓", () => move(i + 1), i === chips.length - 1),
          btn("✕", () => updateState((d) => removeChip(d, i)), chips.length <= 3),
        );
        node.syncField = field.sync;
        return node;
      }),
    );
  }
  addChip.addEventListener("click", () => {
    if (P(getState()).chips.length >= 6) return;
    set((p) => p.chips.push({ id: nextChipId(p.chips), name: "", hex: "#FFFFFF" }));
    renderChips(getState());
  });
  fromOrder.addEventListener("click", () => {
    const hex = getState().components.order.hex;
    if (!hex) return;
    set((p) => (p.chips[0].hex = hex)); // one-time copy; ORDER changes later never reach the palette
  });

  visible.box.addEventListener("change", (e) => set((p) => (p.visible = e.target.checked)));
  titleInput.addEventListener("input", (e) => set((p) => (p.title.text = e.target.value.slice(0, 30))));
  titleFont.select.addEventListener("change", (e) => set((p) => (p.title.font = e.target.value)));
  textFont.select.addEventListener("change", (e) => set((p) => (p.text.font = e.target.value)));
  pick.addEventListener("click", () => select("palette"));

  const bindings = [
    bindRange(aspect, { ...common, ...pct(0.3, 4), read: (s) => P(s).aspect, write: (d, v) => (P(d).aspect = v) }),
    bindRange(radius, { ...common, ...pct(0, 0.5), read: (s) => P(s).card.radius, write: (d, v) => (P(d).card.radius = v) }),
    bindRange(titleSize, { ...common, ...pct(0.005, 0.2), read: (s) => P(s).title.size, write: (d, v) => (P(d).title.size = v) }),
    bindRange(titleSpacing, { ...common, ...pct(-0.2, 1), read: (s) => P(s).title.letterSpacing, write: (d, v) => (P(d).title.letterSpacing = v) }),
    bindRange(textSize, { ...common, ...pct(0.005, 0.2), read: (s) => P(s).text.size, write: (d, v) => (P(d).text.size = v) }),
    bindRange(textSpacing, { ...common, ...pct(-0.2, 1), read: (s) => P(s).text.letterSpacing, write: (d, v) => (P(d).text.letterSpacing = v) }),
    color(fill, (s) => P(s).card.fill, (d, v) => (P(d).card.fill = v)),
    color(border, (s) => P(s).card.border, (d, v) => (P(d).card.border = v)),
    color(titleColor, (s) => P(s).title.color, (d, v) => (P(d).title.color = v)),
    color(textColor, (s) => P(s).text.color, (d, v) => (P(d).text.color = v)),
  ];

  return {
    sync(state) {
      const p = P(state);
      visible.box.checked = p.visible;
      body.hidden = !p.visible;
      if (!p.visible) return;
      if (rendered !== p.chips.length) renderChips(state);
      chipsBox.querySelectorAll(".palette-row").forEach((node, i) => {
        node.syncField(state);
        const name = node.querySelector(".row-name");
        if (document.activeElement !== name) name.value = p.chips[i].name;
      });
      addChip.disabled = p.chips.length >= 6;
      const hex = state.components.order.hex;
      fromOrder.disabled = !hex;
      orderNote.textContent = hex ? STRINGS.paletteOrderNote(hex) : STRINGS.paletteOrderEmpty;
      if (document.activeElement !== titleInput) titleInput.value = p.title.text;
      titleFont.select.value = p.title.font;
      textFont.select.value = p.text.font;
      const missing = fontStatus(p.text.font) === "missing";
      fontNotice.hidden = !missing;
      fontNotice.textContent = missing ? STRINGS.fontMissing : "";
      bindings.forEach((b) => b.sync(state));
    },
  };
}

// v15: chip ids are never reused within a project (next = highest numeric id + 1).
function nextChipId(chips) {
  return `c${1 + Math.max(0, ...chips.map((c) => (/^c\d+$/.test(c.id) ? Number(c.id.slice(1)) : 0)))}`;
}

// v15: before a chip disappears, Cocktail Builder colors that reference it cache its current hex, so the
// cocktail keeps its look (the cache is only a fallback; a live ref always wins).
function removeChip(draft, i) {
  const chips = draft.components.palette.chips;
  const gone = chips[i];
  const b = draft.components.card?.builder;
  if (gone && b) {
    for (const c of [...b.liquid.stops, b.rim.color]) if (c.ref === gone.id) c.color = gone.hex;
  }
  chips.splice(i, 1);
}
