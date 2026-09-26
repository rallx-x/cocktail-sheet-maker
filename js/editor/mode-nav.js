import { el } from "../ui/controls.js";

// Editor modes (v13). A 3-column button grid above the scroll area; exactly one top-level section is
// shown at a time and re-clicking the open mode closes it. Pure editor memory: never saved, never
// touches project state, geometry or rendering. Built from JS so index.html stays unchanged.

export const MODES = [
  { section: "background", label: "시트" },
  { section: "md", label: "MD" },
  { section: "card", label: "카드" },
  { section: "sd", label: "SD" },
  { section: "receipt", label: "영수증" },
  { section: "palette", label: "팔레트" },
  { section: "stickers", label: "장식" },
];

export function createModeNav({ panel, pinnedTop }) {
  const scroll = panel.querySelector(".panel-scroll");
  const sections = new Map(MODES.map((m) => [m.section, scroll.querySelector(`details.section[data-section="${m.section}"]`)]));
  const grid = el("div", { class: "mode-grid", role: "tablist", "aria-label": "편집할 부분" });
  const buttons = new Map();
  for (const m of MODES) {
    const b = el("button", { class: "mode-button", type: "button", role: "tab", text: m.label });
    b.addEventListener("click", () => toggle(m.section));
    buttons.set(m.section, b);
    grid.append(b);
  }
  const empty = el("p", { class: "hint mode-empty", text: "위에서 편집할 부분을 골라요. 미리보기에서 요소를 클릭해도 열려요." });
  scroll.prepend(empty);

  const pinned = el("div", { class: "panel-pinned" }, pinnedTop, grid);
  panel.querySelector(".panel-header").after(pinned);

  let active = null;
  function show(section) {
    active = sections.has(section) ? section : null;
    for (const [key, details] of sections) {
      if (!details) continue;
      const on = key === active;
      details.hidden = !on;
      if (on) details.open = true;
    }
    for (const [key, b] of buttons) b.setAttribute("aria-selected", String(key === active));
    empty.hidden = active !== null;
    if (active) scroll.scrollTop = 0;
  }
  function toggle(section) {
    show(active === section ? null : section);
  }
  show(null); // everything closed at start
  return { show, toggle, getActive: () => active };
}
