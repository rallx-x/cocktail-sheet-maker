import { BUILTIN_STICKERS, STICKER_GROUPS, getBuiltinSticker } from "../stickers/builtin.js";
import { bindRange, colorRow, createColorField, el, rangeRow } from "../ui/controls.js";
import { checkRow, selectRow } from "./frame-panels.js";
import { STRINGS } from "../strings.js";

// Sheet-level stickers. Built-in stickers are the normal workflow; folder stickers appear only
// when assets/stickers/stickers.json actually lists files (an empty folder is normal, no notice).

let nextNumber = 1;
const makeId = () => `st-${Date.now().toString(36)}-${(nextNumber++).toString(36)}`;

export function createStickerPanel(container, { getState, updateState, getStickerFiles, getTarget, select }) {
  const list = (s) => s.components.stickers;
  const current = (s) => {
    const id = getTarget()?.replace(/^sticker:/, "");
    return list(s).find((st) => st.id === id) ?? null;
  };
  const setCurrent = (mutate) =>
    updateState((draft) => {
      const st = current(draft);
      if (st) mutate(st);
    });

  const add = selectRow("스티커", []);
  const fillAdd = () => {
    const entries = STICKER_GROUPS.map((g) => ({
      group: `기본 스티커 · ${g.name}`,
      items: BUILTIN_STICKERS.filter((s) => s.group === g.id).map((s) => ({ value: `builtin:${s.id}`, text: s.name })),
    }));
    const files = getStickerFiles();
    if (files.length) entries.push({ group: "내 스티커 (폴더)", items: files.map((f) => ({ value: `file:${f.file}`, text: f.name })) });
    add.fill(entries);
  };
  fillAdd();
  const addButton = el("button", { class: "reseed-button", type: "button", text: "＋ 시트에 붙이기" });

  const placed = selectRow("붙인 스티커", []);
  const duplicate = el("button", { class: "small", type: "button", text: "복사" });
  const remove = el("button", { class: "small", type: "button", text: "지우기" });
  const actions = el("div", { class: "file-row" }, el("span", { class: "field-label" }), duplicate, remove);

  const width = rangeRow("크기", { min: 1, max: 80, step: 0.5, unit: "%" });
  const rotation = rangeRow("회전", { min: -180, max: 180, step: 1, unit: "°" });
  const opacity = rangeRow("진하기", { min: 0, max: 100, step: 1, unit: "%" });
  const flip = checkRow("좌우 뒤집기");
  const color = colorRow("색");
  const tint = checkRow("색 바꾸기 (폴더 스티커)");
  const themeRole = selectRow("테마 색", [
    { value: "accent", text: "포인트" },
    { value: "accent2", text: "포인트 2" },
    { value: "ink", text: "글자·선" },
  ]);
  const layer = selectRow("위치", [
    { value: "front", text: "캐릭터 앞" },
    { value: "back", text: "캐릭터 뒤 (배경 위)" },
  ]);
  const body = el("div", {}, actions, width.row, rotation.row, opacity.row, flip.row, themeRole.row, color.row, tint.row, layer.row);
  const empty = el("p", { class: "hint", text: STRINGS.stickerEmpty });
  container.append(add.row, addButton, placed.row, empty, body, el("p", { class: "hint", text: STRINGS.stickerHint }));

  const has = (s) => Boolean(current(s));
  const common = { getState, updateState, enabled: has };
  const ranges = [
    bindRange(width, { ...common, toUi: (v) => v * 100, fromUi: (v) => Math.min(1.5, Math.max(0.01, v / 100)), read: (s) => current(s).width, write: (d, v) => (current(d).width = v) }),
    bindRange(rotation, { ...common, read: (s) => current(s).rotation, write: (d, v) => (current(d).rotation = Math.max(-180, Math.min(180, v))) }),
    bindRange(opacity, { ...common, toUi: (v) => v * 100, fromUi: (v) => Math.min(1, Math.max(0, v / 100)), read: (s) => current(s).opacity, write: (d, v) => (current(d).opacity = v) }),
  ];
  const colorField = createColorField({
    picker: color.picker,
    hex: color.hex,
    getState,
    updateState,
    read: (s) => current(s)?.color,
    write: (d, v) => {
      const st = current(d);
      if (st) st.color = v;
    },
  });

  addButton.addEventListener("click", () => {
    const [kind, ...rest] = add.select.value.split(":");
    const key = rest.join(":");
    if (!key) return;
    const id = makeId();
    const aspect = kind === "builtin" ? getBuiltinSticker(key)?.aspect ?? 1 : 1;
    updateState((draft) => {
      list(draft).push({
        id,
        source: kind === "file" ? "file" : "builtin",
        builtin: kind === "file" ? null : key,
        file: kind === "file" ? key : null,
        x: 0.5,
        y: 0.5,
        width: aspect > 0.8 ? 0.06 : 0.1,
        rotation: 0,
        flipX: false,
        opacity: 1,
        color: draft.design.colors?.accent ?? "#C7A4D8", // v13: new stickers start in the sheet's accent
        themeRole: "accent",
        tint: kind === "file" ? false : false,
        layer: "front",
      });
    });
    select(`sticker:${id}`);
  });

  placed.select.addEventListener("change", (e) => select(`sticker:${e.target.value}`));
  duplicate.addEventListener("click", () => {
    const st = current(getState());
    if (!st) return;
    const id = makeId();
    updateState((draft) => list(draft).push({ ...structuredClone(st), id, x: st.x + 0.02, y: st.y + 0.02 }));
    select(`sticker:${id}`);
  });
  remove.addEventListener("click", () => {
    const st = current(getState());
    if (!st) return;
    updateState((draft) => {
      const i = list(draft).findIndex((x) => x.id === st.id);
      if (i >= 0) list(draft).splice(i, 1);
    });
  });
  flip.box.addEventListener("change", (e) => setCurrent((st) => (st.flipX = e.target.checked)));
  tint.box.addEventListener("change", (e) => setCurrent((st) => (st.tint = e.target.checked)));
  layer.select.addEventListener("change", (e) => setCurrent((st) => (st.layer = e.target.value)));
  // Built-in stickers follow a Sheet Color role; picking one applies that role's current color now.
  themeRole.select.addEventListener("change", (e) =>
    updateState((d) => {
      const st = current(d);
      if (!st) return;
      st.themeRole = e.target.value;
      st.color = d.design.colors[e.target.value];
    }),
  );

  const label = (st, i) => {
    const name = st.source === "builtin" ? getBuiltinSticker(st.builtin)?.name ?? st.builtin : st.file;
    return `${i + 1}. ${name}${st.layer === "back" ? " (뒤)" : ""}`;
  };

  return {
    refreshStickerFiles: fillAdd,
    sync(state) {
      const stickers = list(state);
      placed.fill(stickers.map((st, i) => ({ value: st.id, text: label(st, i) })));
      const st = current(state);
      if (st) placed.select.value = st.id;
      placed.row.hidden = !stickers.length;
      empty.hidden = stickers.length > 0;
      body.hidden = !st;
      if (!st) return;
      ranges.forEach((r) => r.sync(state));
      colorField.sync(state);
      flip.box.checked = st.flipX;
      tint.box.checked = st.tint;
      tint.row.hidden = st.source !== "file";
      color.row.classList.toggle("is-disabled", st.source === "file" && !st.tint);
      layer.select.value = st.layer;
      themeRole.select.value = st.themeRole ?? "accent";
      themeRole.row.hidden = st.source !== "builtin";
    },
  };
}
