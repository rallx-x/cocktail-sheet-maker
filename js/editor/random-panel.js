import { el } from "../ui/controls.js";
import { loadFonts } from "../fonts.js";
import { CATALOG_FROZEN } from "../cocktail/catalog.js";
import { FAMILIES, THIN_POOL, applyEntry, entryById, pickEntry, poolFor } from "../cocktail/random-cocktail.js";

// v17 Random Cocktail panel (top of the card section). Editor-only UI state: the family filter and the
// safety checkbox are never saved and never enter undo history; the safety checkbox always starts OFF
// (page load / project load). One press = one updateState = one undo step.
export function createRandomPanel(container, { getState, updateState }) {
  let family = "all";
  const note = el("p", { class: "notice random-test-note", hidden: CATALOG_FROZEN, text: "⚠ 테스트용 칵테일 목록이에요 (아직 확정 전). 레시피와 모양은 검증 후 바뀔 수 있어요." });
  const chips = el("div", { class: "builder-chips random-families", role: "radiogroup", "aria-label": "칵테일 색" });
  const buttons = FAMILIES.map((f) => {
    const b = el("button", { class: "builder-chip family-chip", type: "button", role: "radio", title: f.label }, el("span", { class: "family-heart", text: f.heart }), el("span", { text: f.label }));
    b.addEventListener("click", () => {
      family = f.id;
      sync(getState());
    });
    chips.append(b);
    return { f, b };
  });
  const caution = el("p", { class: "hint random-caution", hidden: true });
  const safety = el("input", { type: "checkbox" });
  const safetyRow = el("label", { class: "check-row" }, safety, el("span", { text: "랜덤 생성 켜기" }));
  const go = el("button", { class: "primary random-go", type: "button", text: "🎲 랜덤 칵테일 만들기" });
  const safetyHint = el("p", { class: "hint", text: "실수로 누르지 않게 체크해야만 만들 수 있어요. 마음에 드는 칵테일이 나오면 체크를 꼭 풀어 주세요." });
  const current = el("p", { class: "random-current", hidden: true });
  const effect = el("p", { class: "hint", text: "누르면 카드 그림이 '직접 만들기'로 바뀌고, 이름·재료·가니쉬·잔 모양이 새 칵테일로 바뀌어요. Ctrl+Z로 되돌릴 수 있어요." });

  safety.addEventListener("change", () => sync(getState()));
  // project load → the safety switch goes back OFF (never saved)
  document.querySelector("#projectInput")?.addEventListener("change", () => {
    safety.checked = false;
    sync(getState());
  });
  go.addEventListener("click", () => {
    if (!safety.checked) return;
    const s = getState();
    const entry = pickEntry(poolFor(family), s.components.card.builder.presetId);
    if (!entry) return;
    // measure the name with the real card font (the name size fit), then apply as ONE step
    loadFonts([s.components.card.name.font], entry.name).catch(() => {}).finally(() => updateState((d) => applyEntry(d, entry)));
  });

  container.append(
    el("details", { class: "subsection random-panel", open: true },
      el("summary", { text: "🎲 랜덤 칵테일" }),
      el("div", { class: "subsection-body" }, note, chips, caution, safetyRow, go, safetyHint, current, effect)),
  );

  function sync(state) {
    const pool = poolFor(family);
    for (const { f, b } of buttons) {
      b.setAttribute("aria-checked", String(f.id === family));
      b.setAttribute("aria-pressed", String(f.id === family));
    }
    caution.hidden = family === "all" || pool.length > THIN_POOL;
    caution.textContent = pool.length
      ? `이 색은 칵테일 수가 적어서 (${pool.length}개) 비슷한 결과가 자주 나올 수 있어요.`
      : "이 색에 해당하는 칵테일이 아직 없어요.";
    go.disabled = !safety.checked || pool.length === 0;
    const e = entryById(state.components.card.builder.presetId);
    current.hidden = !e;
    if (e) current.textContent = `방금 만든 칵테일: ${e.nameKo} (${e.name})`;
  }
  return { sync };
}
