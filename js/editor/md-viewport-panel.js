import { el, rangeRow } from "../ui/controls.js";
import {
  defaultCharacterPlacement,
  fillCharacterPlacement,
  fitCharacterPlacement,
  viewportOf,
} from "../components/md.js";

// v16 "MD 영역 안 배치": one-shot Fit / Fill / Reset, position sliders and the clip checkbox.
// Everything writes ONLY md.character.x / y / width (the one image transform) through the
// md.character adapter, so the linked coaster follows the feet exactly like a drag (translation
// only, never scaled). md.viewport itself is fixed in phase 1 (not movable / resizable).
export function createMdViewportPanel(host, { getState, updateState, getAdapter }) {
  const md = (s) => s.components.md;
  const hasCharacter = (s) => Boolean(md(s).character.asset);

  const fitButton = el("button", { class: "reseed-button", type: "button", text: "맞추기" });
  const fillButton = el("button", { class: "reseed-button", type: "button", text: "채우기" });
  const resetButton = el("button", { class: "reseed-button", type: "button", text: "처음으로" });
  const buttons = el("div", { class: "button-row md-viewport-actions" }, fitButton, fillButton, resetButton);
  const xRow = rangeRow("좌우 위치", { min: -50, max: 150, step: 1 });
  const yRow = rangeRow("위아래 위치", { min: -50, max: 200, step: 1 });
  const clipInput = el("input", { type: "checkbox" });
  const clipRow = el("label", { class: "check-row" }, clipInput, el("span", { text: "프레임 밖으로 나간 부분 잘라내기" }));
  const hint = el("p", {
    class: "hint",
    text: "맞추기: 그림 전체가 점선 영역 안에 들어가요. 채우기: 점선 영역을 꽉 채우고 넘치는 부분은 잘려요. 잘라내기를 켜면 캐릭터가 MD 배경 프레임 모양 안에서만 보여요(프레임을 끄면 점선 영역 기준). 위치는 점선 영역 기준 %예요(50 = 가운데, 위아래는 발 위치).",
  });
  const details = el(
    "details",
    { class: "subsection md-viewport-panel", open: true },
    el("summary", { text: "MD 영역 안 배치" }),
    el("div", { class: "subsection-body" }, buttons, xRow.row, yRow.row, clipRow, hint),
  );
  host.after(details);

  // Move / resize the character; the adapter's linked rule moves the coaster by the same delta.
  function place(draft, next) {
    const adapter = getAdapter();
    const c = md(draft).character;
    const snap = adapter.snapshot(draft);
    if (next.width !== undefined) c.width = next.width;
    adapter.applyMove(draft, snap, (next.x ?? c.x) - c.x, (next.y ?? c.y) - c.y);
  }
  const action = (compute) => () => {
    if (!hasCharacter(getState())) return;
    updateState((draft) => {
      const W = draft.design.width;
      const H = draft.design.height;
      place(draft, compute(md(draft).character.asset, W, H, viewportOf(md(draft))));
    });
  };
  fitButton.addEventListener("click", action(fitCharacterPlacement));
  fillButton.addEventListener("click", action(fillCharacterPlacement));
  resetButton.addEventListener("click", action(defaultCharacterPlacement));

  // Position sliders: % of the viewport (x: 0 = left edge, 100 = right edge; y: feet line).
  const toUiX = (s) => ((md(s).character.x - viewportOf(md(s)).x) / viewportOf(md(s)).width) * 100;
  const toUiY = (s) => ((md(s).character.y - viewportOf(md(s)).y) / viewportOf(md(s)).height) * 100;
  const bindPos = ({ range, number }, axis) => {
    const apply = (raw) => {
      const n = Number(raw);
      if (!Number.isFinite(n) || !hasCharacter(getState())) return;
      updateState((draft) => {
        const v = viewportOf(md(draft));
        place(draft, axis === "x" ? { x: v.x + (n / 100) * v.width } : { y: v.y + (n / 100) * v.height });
      });
    };
    range.addEventListener("input", (e) => apply(e.target.value));
    number.addEventListener("change", (e) => apply(e.target.value));
  };
  bindPos(xRow, "x");
  bindPos(yRow, "y");

  clipInput.addEventListener("change", (e) => updateState((draft) => (md(draft).viewport.clip = e.target.checked)));

  const syncPos = ({ range, number }, value, on) => {
    range.disabled = number.disabled = !on;
    if (!on) return;
    const v = String(Math.round(value));
    if (document.activeElement !== range) range.value = v;
    if (document.activeElement !== number) number.value = v;
  };

  return {
    sync(state) {
      const on = hasCharacter(state);
      fitButton.disabled = fillButton.disabled = resetButton.disabled = !on;
      syncPos(xRow, on ? toUiX(state) : 0, on);
      syncPos(yRow, on ? toUiY(state) : 0, on);
      clipInput.checked = viewportOf(md(state)).clip;
    },
  };
}
