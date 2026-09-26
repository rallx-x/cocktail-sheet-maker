import { CREDIT_OWNER_MAX, getState, normalizeCreditOwner, subscribe, updateState } from "../state.js";

// Tester build: "커미션주 표기" input in the SHEET section. The user types only the name; the renderer adds
// "©" and "·" and keeps @Sueyoiwife fixed at the right. Only design.creditOwner is state.
export function initCreditOwner() {
  const body = document.querySelector('details.section[data-section="background"] > .section-body');
  if (!body || document.querySelector(".credit-owner")) return;
  const input = document.createElement("input");
  input.type = "text";
  input.className = "text-input";
  input.maxLength = CREDIT_OWNER_MAX;
  input.placeholder = "커미션주 이름 (없으면 비워 두기)";
  input.setAttribute("aria-label", "커미션주 표기");
  const label = document.createElement("span");
  label.className = "field-label";
  label.textContent = "커미션주 표기";
  const hint = document.createElement("p");
  hint.className = "hint";
  hint.textContent = "©와 ·은 자동으로 붙어요. 비워 두면 아이디만 나와요. 예: © 이름 · @Sueyoiwife";
  const box = document.createElement("div");
  box.className = "credit-owner";
  box.append(label, input, hint);
  body.append(box);

  input.addEventListener("input", () => {
    const next = normalizeCreditOwner(input.value);
    if (next !== (getState().design.creditOwner ?? "")) updateState((d) => (d.design.creditOwner = next));
  });
  input.addEventListener("blur", () => (input.value = getState().design.creditOwner ?? ""));
  const sync = (state) => {
    if (document.activeElement !== input) input.value = state.design.creditOwner ?? "";
  };
  subscribe(sync);
  sync(getState());
}
