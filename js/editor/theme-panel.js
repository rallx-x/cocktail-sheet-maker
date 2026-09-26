import { COLOR_ROLES, THEMES, getTheme } from "../themes/themes.js";
import { applyRole, applyTheme } from "../themes/apply-theme.js";
import { colorRow, createColorField, el } from "../ui/controls.js";

// Sheet Color Preset strip (always visible) + the 10 Sheet Colors editor (SHEET mode).
// Both only call applyTheme / applyRole inside updateState: concrete values are written into the
// component fields at edit time. The preview bar reads the CURRENT design.colors (cardBase → gradient).

const SVG = "http://www.w3.org/2000/svg";
function heartIcon(color) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 22");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", "M12 21 C4 14.5 1 11 1 6.8 C1 3.6 3.5 1.2 6.6 1.2 C8.7 1.2 10.8 2.4 12 4.3 C13.2 2.4 15.3 1.2 17.4 1.2 C20.5 1.2 23 3.6 23 6.8 C23 11 20 14.5 12 21 Z");
  path.setAttribute("fill", color);
  path.setAttribute("stroke", "rgba(255,255,255,.35)");
  path.setAttribute("stroke-width", "1");
  svg.append(path);
  return svg;
}

export const ROLE_LABELS = {
  bg: "배경",
  pattern: "패턴",
  gradient: "메인 그라데이션 (MD·카드)",
  cardBase: "카드 바탕",
  ink: "글자·선",
  inkSoft: "보조선",
  accent: "포인트",
  accent2: "포인트 2",
  tray: "트레이",
  board: "클립보드",
};

export function createThemeStrip({ getState, updateState }) {
  const hearts = el("div", { class: "theme-hearts", role: "radiogroup", "aria-label": "시트 색상 프리셋" });
  const buttons = new Map();
  for (const t of THEMES) {
    const b = el("button", { class: "theme-heart", type: "button", role: "radio", title: `${t.name} · ${t.nameKo}`, "aria-label": t.nameKo });
    b.append(heartIcon(t.heart));
    // same theme again = re-apply its defaults; another theme = re-sync every role
    b.addEventListener("click", () => updateState((d) => applyTheme(d, t.id)));
    buttons.set(t.id, b);
    hearts.append(b);
  }
  const name = el("p", { class: "theme-name" });
  const bar = el("div", { class: "theme-bar", "aria-hidden": "true" });
  const node = el("div", { class: "theme-strip" }, hearts, name, bar);
  return {
    node,
    sync(state) {
      const id = state.design.theme?.id ?? null;
      for (const [tid, b] of buttons) b.setAttribute("aria-checked", String(tid === id));
      const t = getTheme(id);
      name.textContent = t ? (t.name === t.nameKo ? t.name : `${t.name} · ${t.nameKo}`) : "직접 조합한 색";
      const c = state.design.colors;
      bar.style.background = `linear-gradient(90deg, ${c.cardBase}, ${c.gradient})`;
    },
  };
}

export function createSheetColorsPanel(container, { getState, updateState }) {
  // v14: the sheet background has its own editor (단색 / 그라데이션) right below, so no "배경" row here
  const fields = COLOR_ROLES.filter((role) => role !== "bg").map((role) => {
    const row = colorRow(ROLE_LABELS[role]);
    const field = createColorField({
      picker: row.picker,
      hex: row.hex,
      getState,
      updateState,
      read: (s) => s.design.colors[role],
      write: (d, v) => applyRole(d, role, v), // propagates this role only
    });
    return { row, field };
  });
  container.append(
    el("p", { class: "hint", text: "색 하나를 바꾸면 연결된 곳이 전부 같이 바뀌어요. 한 곳만 따로 바꾸고 싶으면 그 부분 설정에서 직접 고르면 돼요. 코스터·도일리는 테마와 상관없어요. 시트 배경은 아래 \"배경색\"에서 따로 바꿔요." }),
    ...fields.map((f) => f.row.row),
  );
  return {
    sync(state) {
      for (const f of fields) f.field.sync(state);
    },
  };
}
