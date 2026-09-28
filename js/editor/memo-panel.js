import { bindRange, colorRow, createColorField, el, fontRow, rangeRow } from "../ui/controls.js";
import { MEMO_TEXT_MAX } from "../state.js";
import { layoutMemoText, memoOverlapsCard, memoRect, memoYBelowCard } from "../components/memo.js";

// v17 "메모 (TIP)" panel: the bar-table note on the card layer. Typing marks the memo as hand-written
// (auto = false), so Random Cocktail never replaces a note the user wrote.
const M = (s) => s.components.memo;
const measure = typeof document !== "undefined" ? document.createElement("canvas").getContext("2d") : null;

export function createMemoPanel(container, { getState, updateState, select }) {
  const set = (fn) => updateState((d) => fn(M(d)));
  const common = { getState, updateState, enabled: () => true };
  const pct = (lo, hi) => ({ toUi: (v) => v * 100, fromUi: (v) => Math.min(hi, Math.max(lo, v / 100)) });

  const visible = el("input", { type: "checkbox" });
  const visibleRow = el("label", { class: "check-row" }, visible, el("span", { text: "메모 보이기" }));
  visible.addEventListener("change", (e) =>
    updateState((d) => {
      const m = M(d);
      m.visible = e.target.checked;
      // first shown over the card (the card grows with its content) → move it just under the card
      if (m.visible && memoOverlapsCard(m, d.components.card, d.design.width, d.design.height)) m.y = memoYBelowCard(m, d.components.card, d.design.width, d.design.height);
    }),
  );
  const pick = el("button", { class: "reseed-button", type: "button", text: "메모 선택 (끌어서 이동 · Ctrl+휠 크기)" });
  pick.addEventListener("click", () => select("memo"));

  const styleSel = el("select", { "aria-label": "메모 모양" }, el("option", { value: "napkin", text: "칵테일 냅킨" }), el("option", { value: "note", text: "포스트잇" }));
  const styleRow = el("div", { class: "pattern-row" }, el("span", { class: "field-label", text: "모양" }), styleSel);
  styleSel.addEventListener("change", (e) => set((m) => (m.style = e.target.value === "note" ? "note" : "napkin")));

  const text = el("textarea", { class: "text-input memo-text", rows: "3", maxlength: String(MEMO_TEXT_MAX), placeholder: "칵테일, 캐릭터, 페어의 분위기를 자유롭게 적어요", "aria-label": "메모 내용" });
  text.addEventListener("input", (e) => set((m) => {
    m.text = [...e.target.value.replace(/\r\n?/g, "\n")].slice(0, MEMO_TEXT_MAX).join("");
    m.auto = false; // hand-written: Random Cocktail will not replace it
  }));
  const overflow = el("p", { class: "notice", hidden: true, text: "글이 메모 칸보다 길어서 끝이 '…'로 잘렸어요. 글을 줄이거나 메모를 키워 주세요." });

  const font = fontRow("글꼴");
  font.select.addEventListener("change", (e) => set((m) => (m.font = e.target.value)));
  const alignSel = el("select", { "aria-label": "정렬" }, el("option", { value: "left", text: "왼쪽" }), el("option", { value: "center", text: "가운데" }), el("option", { value: "right", text: "오른쪽" }));
  const alignRow = el("div", { class: "pattern-row" }, el("span", { class: "field-label", text: "정렬" }), alignSel);
  alignSel.addEventListener("change", (e) => set((m) => (m.align = e.target.value)));

  const size = rangeRow("글자 크기", { min: 3, max: 20, step: 0.5, unit: "%" });
  const width = rangeRow("메모 크기", { min: 5, max: 80, step: 0.5, unit: "%" });
  const aspect = rangeRow("세로 비율", { min: 15, max: 200, step: 1, unit: "%" });
  const rotation = rangeRow("기울기", { min: -30, max: 30, step: 1, unit: "°" });
  const ranges = [
    bindRange(size, { ...common, ...pct(0.03, 0.2), read: (s) => M(s).size, write: (d, v) => (M(d).size = v) }),
    bindRange(width, { ...common, ...pct(0.05, 0.8), read: (s) => M(s).width, write: (d, v) => (M(d).width = v) }),
    bindRange(aspect, { ...common, ...pct(0.15, 2), read: (s) => M(s).aspect, write: (d, v) => (M(d).aspect = v) }),
    bindRange(rotation, { ...common, read: (s) => M(s).rotation, write: (d, v) => (M(d).rotation = Math.min(30, Math.max(-30, v))) }),
  ];
  const colors = [
    ["글자 색", "color"],
    ["종이 색", "paper"],
    ["테두리 색 (냅킨)", "edge"],
    ["테이프 색 (포스트잇)", "tape"],
  ].map(([label, key]) => {
    const row = colorRow(label);
    const field = createColorField({ picker: row.picker, hex: row.hex, read: (s) => M(s)[key], write: (d, v) => (M(d)[key] = v), getState, updateState });
    return { row, field, key };
  });

  const body = el("div", {}, pick, styleRow, text, overflow, font.row, alignRow, size.row, width.row, aspect.row, rotation.row, ...colors.map((c) => c.row.row),
    el("p", { class: "hint", text: "칵테일 카드와 SD 트레이 사이에 두는 작은 메모예요. 랜덤 칵테일은 메모가 비어 있거나 랜덤이 쓴 글 그대로일 때만 새 설명으로 바꿔요. 직접 고친 메모는 그대로 둬요." }));
  container.append(el("details", { class: "subsection memo-panel", open: true }, el("summary", { text: "메모 (TIP)" }), el("div", { class: "subsection-body" }, visibleRow, body)));

  return {
    sync(state) {
      const m = M(state);
      visible.checked = m.visible;
      body.hidden = !m.visible;
      styleSel.value = m.style;
      if (document.activeElement !== text) text.value = m.text;
      font.select.value = m.font;
      alignSel.value = m.align;
      ranges.forEach((r) => r.sync(state));
      for (const c of colors) c.field.sync(state);
      colors[2].row.row.hidden = m.style !== "napkin";
      colors[3].row.row.hidden = m.style !== "note";
      if (measure && m.text) {
        const r = memoRect(m, state.design.width, state.design.height);
        overflow.hidden = !layoutMemoText(measure, m, r.w, r.h).overflow;
      } else overflow.hidden = true;
    },
  };
}
