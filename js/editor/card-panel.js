import { createBuilderPanel } from "./builder-panel.js";
import { registerAsset, removeAsset } from "../assets.js";
import { FRAME_FILLS } from "../components/frame.js";
import { TEXT_EFFECTS } from "../components/text-style.js";
import { CARD_LIMITS, cardGeometry, cardOverflow } from "../components/card.js";
import { fontStatus } from "../fonts.js";
import { collectAssetIds, newSeed, normalizeHexColor } from "../state.js";
import { bindRange, colorRow, createColorField, el, fontRow, rangeRow } from "../ui/controls.js";
import { checkRow, selectRow } from "./frame-panels.js";
import { STRINGS } from "../strings.js";

// "칵테일 카드" section. The card's internal layout is fixed; the user edits content and style.
// Only the illustration has its own composition controls (scale / dx / dy, slot-relative).

const pct = (min, max) => ({ toUi: (v) => v * 100, fromUi: (v) => Math.min(max, Math.max(min, v / 100)) });
const group = (title, open, ...children) =>
  el("details", { class: "subsection", open }, el("summary", { text: title }), el("div", { class: "subsection-body" }, ...children));

export function createCardPanel(container, { getState, updateState, reportError, select }) {
  const card = (s) => s.components.card;
  const set = (mutate) => updateState((draft) => mutate(card(draft)));
  const on = (s) => card(s).visible;
  const common = { getState, updateState, enabled: on };
  const color = (row, read, write) => createColorField({ picker: row.picker, hex: row.hex, getState, updateState, read, write });
  const measureCtx = document.createElement("canvas").getContext("2d");

  // ----- 카드 -----
  const visible = checkRow("카드 보이기");
  const pick = el("button", { class: "reseed-button", type: "button", text: "카드 선택 (끌어서 이동 · Ctrl+휠 크기)" });
  const fillType = selectRow("바탕", FRAME_FILLS.map((v) => ({ value: v, text: STRINGS.frameFills[v] })));
  const fill1 = colorRow("바탕 색");
  const fill2 = colorRow("그라데이션 끝 색");
  const angle = rangeRow("그라데이션 각도", { min: -180, max: 180, step: 1, unit: "°" });
  const aspect = rangeRow("세로 비율", { min: 30, max: 120, step: 1, unit: "%" });
  const radius = rangeRow("모서리 둥글기", { min: 0, max: 30, step: 0.5, unit: "%" });
  const borderColor = colorRow("테두리 색");
  const borderWidth = rangeRow("테두리 굵기", { min: 0, max: 3, step: 0.1, unit: "%" });
  const coating = checkRow("코팅 광택");
  const coatingStrength = rangeRow("광택 세기", { min: 0, max: 100, step: 1, unit: "%" });

  // ----- text blocks -----
  function textBlock(label, key, { effect }) {
    const input = el("input", { class: "text-input", type: "text", maxlength: "40", "aria-label": label });
    const font = fontRow("글꼴");
    const notice = el("p", { class: "notice", hidden: true });
    const size = rangeRow("크기", { min: 1, max: 15, step: 0.1, unit: "%" });
    const spacing = rangeRow("자간", { min: -20, max: 100, step: 1, unit: "%" });
    const textColor = colorRow("글자 색");
    const fx = effect ? selectRow("효과", TEXT_EFFECTS.map((v) => ({ value: v, text: STRINGS.textEffects[v] }))) : null;
    const fxColor = effect ? colorRow("효과 색") : null;
    const T = (s) => card(s)[key];
    input.addEventListener("input", (e) => set((c) => (c[key].text = e.target.value.slice(0, 40))));
    font.select.addEventListener("change", (e) => set((c) => (c[key].font = e.target.value)));
    fx?.select.addEventListener("change", (e) => set((c) => (c[key].effect = e.target.value)));
    const bindings = [
      bindRange(size, { ...common, ...pct(0.005, 0.2), read: (s) => T(s).size, write: (d, v) => (card(d)[key].size = v) }),
      bindRange(spacing, { ...common, ...pct(-0.2, 1), read: (s) => T(s).letterSpacing, write: (d, v) => (card(d)[key].letterSpacing = v) }),
      color(textColor, (s) => T(s).color, (d, v) => (card(d)[key].color = v)),
      ...(fxColor ? [color(fxColor, (s) => T(s).effectColor, (d, v) => (card(d)[key].effectColor = v))] : []),
    ];
    const node = group(label, key === "name", input, font.row, notice, size.row, spacing.row, textColor.row, ...(fx ? [fx.row, fxColor.row] : []));
    return {
      node,
      sync(state) {
        const t = T(state);
        if (document.activeElement !== input) input.value = t.text;
        font.select.value = t.font;
        const missing = t.text && fontStatus(t.font) === "missing";
        notice.hidden = !missing;
        notice.textContent = missing ? STRINGS.fontMissing : "";
        if (fx) {
          fx.select.value = t.effect;
          fxColor.row.hidden = t.effect === "normal";
        }
        bindings.forEach((b) => b.sync(state));
      },
    };
  }
  const title = textBlock("제목", "title", { effect: true });
  const name = textBlock("칵테일 이름", "name", { effect: true });

  // ----- 칵테일 그림 -----
  const imageRow = el("div", { class: "file-row" }, el("span", { class: "field-label", text: "그림" }));
  const upload = el("label", { class: "button-like small" }, el("span", { text: STRINGS.characterUpload }), el("input", { type: "file", accept: "image/png,image/webp" }));
  const removeImage = el("button", { class: "small", type: "button", text: "빼기" });
  imageRow.append(upload, removeImage);
  const imageName = el("p", { class: "file-name", text: "—" });
  const imgScale = rangeRow("그림 크기", { min: 10, max: 300, step: 1, unit: "%" });
  const imgDx = rangeRow("좌우 위치", { min: -100, max: 100, step: 1, unit: "%" });
  const imgDy = rangeRow("위아래 위치", { min: -100, max: 100, step: 1, unit: "%" });
  const imgSlot = rangeRow("그림 칸 너비", { min: 18, max: 45, step: 0.5, unit: "%" });
  const imgFrame = checkRow("그림 칸 테두리");
  const imgFrameColor = colorRow("칸 테두리 색");

  upload.querySelector("input").addEventListener("change", async (event) => {
    const [file] = event.target.files;
    if (!file) return;
    try {
      // Register first: a broken file never touches the current image. Replacing keeps scale/dx/dy.
      const asset = await registerAsset(file, { name: file.name, type: file.type });
      const previous = card(getState()).image.asset?.assetId;
      set((c) => (c.image.asset = asset));
      if (previous && !collectAssetIds(getState()).has(previous)) removeAsset(previous);
    } catch (error) {
      reportError(error);
    } finally {
      event.target.value = "";
    }
  });
  removeImage.addEventListener("click", () => {
    const previous = card(getState()).image.asset?.assetId;
    set((c) => (c.image.asset = null));
    if (previous && !collectAssetIds(getState()).has(previous)) removeAsset(previous);
  });

  // ----- 재료 목록 -----
  const rows = el("div", { class: "card-rows" });
  const addItem = el("button", { class: "reseed-button", type: "button", text: "＋ 재료 추가" });
  const overflow = el("p", { class: "notice", hidden: true });
  const listFont = fontRow("글꼴");
  const listSize = rangeRow("크기", { min: 1, max: 8, step: 0.1, unit: "%" });
  const listSpacing = rangeRow("자간", { min: -20, max: 100, step: 1, unit: "%" });
  const listColor = colorRow("글자 색");
  const wrap = checkRow("긴 재료는 두 줄로 (한 줄에 안 들어갈 때만)");
  const checkboxes = checkRow("체크박스 칸 보이기");
  const leader = checkRow("점선 (재료 … 용량)");
  const leaderColor = colorRow("점선 색");
  const brackets = checkRow("꺾쇠 모서리 ⌜ ⌟");
  const bracketColor = colorRow("꺾쇠 색");
  const divider = checkRow("구분선");
  const dividerDashed = checkRow("구분선 점선");
  const dividerColor = colorRow("구분선 색");

  // One row editor for both lists (v13): ingredients = name + amount, garnish = name only.
  function listEditor(key, { hasAmount, limit, addLabel, placeholder }) {
    const box = el("div", { class: "card-rows" });
    const add = el("button", { class: "reseed-button", type: "button", text: addLabel });
    let rendered = -1;
    const render = (state) => {
      const items = card(state)[key];
      rendered = items.length;
      box.replaceChildren(
        ...items.map((item, i) => {
          const check = el("input", { type: "checkbox", "aria-label": "체크" });
          check.checked = item.checked;
          const nameInput = el("input", { class: "row-name", type: "text", maxlength: String(CARD_LIMITS.name), value: item.name, placeholder, "aria-label": placeholder });
          const amountInput = hasAmount
            ? el("input", { class: "row-amount", type: "text", maxlength: String(CARD_LIMITS.amount), value: item.amount, "aria-label": "용량" })
            : null;
          const btn = (text, title, disabled, fn) => {
            const b = el("button", { class: "row-btn", type: "button", text, title });
            b.disabled = disabled;
            b.addEventListener("click", () => {
              fn();
              render(getState());
            });
            return b;
          };
          const move = (to) => set((c) => c[key].splice(to, 0, c[key].splice(i, 1)[0]));
          check.addEventListener("change", (e) => set((c) => (c[key][i].checked = e.target.checked)));
          nameInput.addEventListener("input", (e) => set((c) => (c[key][i].name = e.target.value.slice(0, CARD_LIMITS.name))));
          amountInput?.addEventListener("input", (e) => set((c) => (c[key][i].amount = e.target.value.slice(0, CARD_LIMITS.amount))));
          return el(
            "div",
            { class: hasAmount ? "card-row" : "card-row no-amount" },
            check,
            nameInput,
            ...(amountInput ? [amountInput] : []),
            btn("↑", "위로", i === 0, () => move(i - 1)),
            btn("↓", "아래로", i === items.length - 1, () => move(i + 1)),
            btn("✕", "지우기", false, () => set((c) => c[key].splice(i, 1))),
          );
        }),
      );
    };
    add.addEventListener("click", () => {
      if (card(getState())[key].length >= limit) return;
      set((c) => c[key].push(hasAmount ? { name: "", amount: "", checked: false } : { name: "", checked: false }));
      render(getState());
      box.querySelector(".card-row:last-child .row-name")?.focus();
    });
    return {
      box,
      add,
      sync(state) {
        const items = card(state)[key];
        add.disabled = items.length >= limit;
        if (rendered !== items.length) return render(state);
        // keep values in sync without stealing focus from the field being typed in
        box.querySelectorAll(".card-row").forEach((row, i) => {
          const [check, n, a] = row.querySelectorAll("input");
          check.checked = items[i].checked;
          if (document.activeElement !== n) n.value = items[i].name;
          if (a && document.activeElement !== a) a.value = items[i].amount;
        });
      },
    };
  }
  const ingredientsEditor = listEditor("ingredients", { hasAmount: true, limit: CARD_LIMITS.ingredients, addLabel: "＋ 재료 추가", placeholder: "재료" });
  const garnishEditor = listEditor("garnish", { hasAmount: false, limit: CARD_LIMITS.garnish, addLabel: "＋ 가니쉬 추가", placeholder: "가니쉬" });
  const sizing = checkRow("내용에 맞춰 높이 자동 (아래로 길어져요)");

  // ----- 바코드 · HEX -----
  const barcode = checkRow("세로 바코드");
  const barcodeColor = colorRow("바코드 색");
  const reseed = el("button", { class: "reseed-button", type: "button", text: "🎲 바코드 다시 뽑기 (영수증과 같이 바뀌어요)" });
  const hexInput = el("input", { class: "hex-input wide", type: "text", maxlength: "7", spellcheck: "false", placeholder: "#RRGGBB", "aria-label": "HEX (주문 정보)" });
  const hexRow = el("div", { class: "color-row" }, el("span", { class: "field-label", text: "HEX (주문 정보)" }), hexInput);
  const hexError = el("p", { class: "notice", hidden: true });
  const hexFont = fontRow("HEX 글꼴");
  const hexSize = rangeRow("HEX 크기", { min: 0.5, max: 10, step: 0.1, unit: "%" });
  const hexColor = colorRow("HEX 색");

  reseed.addEventListener("click", () => {
    const seed = newSeed(); // the ONLY way the shared seed changes
    updateState((d) => (d.components.barcode.seed = seed));
  });
  // Order information, not a color: never bound to any fill. Empty is allowed.
  hexInput.addEventListener("input", (e) => {
    const raw = e.target.value.trim();
    const value = raw === "" ? "" : normalizeHexColor(raw);
    hexError.hidden = value !== null;
    hexError.textContent = value === null ? STRINGS.invalidHex : "";
    if (value !== null) updateState((d) => (d.components.order.hex = value));
  });
  hexInput.addEventListener("blur", (e) => {
    e.target.value = getState().components.order.hex;
    hexError.hidden = true;
  });

  // v15: 이미지 올리기 / 직접 만들기 (Cocktail Builder). Both sides stay in state when switching.
  const srcUpload = el("button", { class: "mode-button", type: "button", text: "이미지 올리기" });
  const srcBuilder = el("button", { class: "mode-button", type: "button", text: "직접 만들기" });
  const sourceRow = el("div", { class: "source-toggle", role: "tablist", "aria-label": "칵테일 그림 방식" }, srcUpload, srcBuilder);
  srcUpload.addEventListener("click", () => set((c) => (c.image.source = "upload")));
  srcBuilder.addEventListener("click", () => set((c) => (c.image.source = "builder")));
  const uploadBox = el("div", {}, imageRow, imageName, imgScale.row, imgDx.row, imgDy.row);
  const builderBox = el("div", { class: "builder-box" });
  const builderPanel = createBuilderPanel(builderBox, { getState, updateState });

  const cardBody = el("div", {}, pick, sizing.row, fillType.row, fill1.row, fill2.row, angle.row, aspect.row, radius.row, borderColor.row, borderWidth.row, coating.row, coatingStrength.row);
  const body = el(
    "div",
    {},
    group("카드", true, cardBody),
    title.node,
    group("칵테일 그림", true, sourceRow, uploadBox, builderBox, imgSlot.row, imgFrame.row, imgFrameColor.row),
    group("재료 · 가니쉬", true, el("p", { class: "field-caption", text: "재료 (INGREDIENTS)" }), ingredientsEditor.box, ingredientsEditor.add, el("p", { class: "field-caption", text: "가니쉬 (GARNISH) — 없으면 카드에 안 나와요" }), garnishEditor.box, garnishEditor.add, overflow, wrap.row, listFont.row, listSize.row, listSpacing.row, listColor.row, checkboxes.row, leader.row, leaderColor.row, brackets.row, bracketColor.row, divider.row, dividerDashed.row, dividerColor.row),
    name.node,
    group("바코드 · HEX", false, barcode.row, barcodeColor.row, reseed, hexRow, hexError, hexFont.row, hexSize.row, hexColor.row),
  );
  container.append(visible.row, body, el("p", { class: "hint", text: STRINGS.cardHint }));

  const C = card;
  const bindings = [
    bindRange(angle, { ...common, read: (s) => C(s).fill.angle, write: (d, v) => (C(d).fill.angle = Math.max(-180, Math.min(180, v))) }),
    bindRange(aspect, { ...common, ...pct(0.3, 1.2), read: (s) => C(s).aspect, write: (d, v) => (C(d).aspect = v) }),
    bindRange(radius, { ...common, ...pct(0, 0.3), read: (s) => C(s).radius, write: (d, v) => (C(d).radius = v) }),
    bindRange(borderWidth, { ...common, ...pct(0, 0.03), read: (s) => C(s).border.width, write: (d, v) => (C(d).border.width = v) }),
    bindRange(coatingStrength, { ...common, ...pct(0, 1), read: (s) => C(s).coating.strength, write: (d, v) => (C(d).coating.strength = v) }),
    bindRange(imgSlot, { ...common, ...pct(0.18, 0.45), read: (s) => C(s).image.slot, write: (d, v) => (C(d).image.slot = v) }),
    bindRange(imgScale, { ...common, ...pct(0.1, 5), read: (s) => C(s).image.scale, write: (d, v) => (C(d).image.scale = v) }),
    bindRange(imgDx, { ...common, ...pct(-1, 1), read: (s) => C(s).image.dx, write: (d, v) => (C(d).image.dx = v) }),
    bindRange(imgDy, { ...common, ...pct(-1, 1), read: (s) => C(s).image.dy, write: (d, v) => (C(d).image.dy = v) }),
    bindRange(listSize, { ...common, ...pct(0.005, 0.2), read: (s) => C(s).list.size, write: (d, v) => (C(d).list.size = v) }),
    bindRange(listSpacing, { ...common, ...pct(-0.2, 1), read: (s) => C(s).list.letterSpacing, write: (d, v) => (C(d).list.letterSpacing = v) }),
    bindRange(hexSize, { ...common, ...pct(0.005, 0.1), read: (s) => C(s).hex.size, write: (d, v) => (C(d).hex.size = v) }),
    color(fill1, (s) => C(s).fill.colors[0], (d, v) => (C(d).fill.colors[0] = v)),
    color(fill2, (s) => C(s).fill.colors[1], (d, v) => (C(d).fill.colors[1] = v)),
    color(borderColor, (s) => C(s).border.color, (d, v) => (C(d).border.color = v)),
    color(imgFrameColor, (s) => C(s).image.frame.color, (d, v) => (C(d).image.frame.color = v)),
    color(listColor, (s) => C(s).list.color, (d, v) => (C(d).list.color = v)),
    color(leaderColor, (s) => C(s).list.leader.color, (d, v) => (C(d).list.leader.color = v)),
    color(bracketColor, (s) => C(s).list.brackets.color, (d, v) => (C(d).list.brackets.color = v)),
    color(dividerColor, (s) => C(s).divider.color, (d, v) => (C(d).divider.color = v)),
    color(barcodeColor, (s) => C(s).barcode.color, (d, v) => (C(d).barcode.color = v)),
    color(hexColor, (s) => C(s).hex.color, (d, v) => (C(d).hex.color = v)),
  ];
  const toggles = [
    [visible, (c) => c.visible, (c, v) => (c.visible = v)],
    [coating, (c) => c.coating.on, (c, v) => (c.coating.on = v)],
    [imgFrame, (c) => c.image.frame.on, (c, v) => (c.image.frame.on = v)],
    [wrap, (c) => c.list.wrap, (c, v) => (c.list.wrap = v)],
    [checkboxes, (c) => c.list.checkboxes, (c, v) => (c.list.checkboxes = v)],
    [leader, (c) => c.list.leader.on, (c, v) => (c.list.leader.on = v)],
    [brackets, (c) => c.list.brackets.on, (c, v) => (c.list.brackets.on = v)],
    [divider, (c) => c.divider.on, (c, v) => (c.divider.on = v)],
    [dividerDashed, (c) => c.divider.dashed, (c, v) => (c.divider.dashed = v)],
    [barcode, (c) => c.barcode.on, (c, v) => (c.barcode.on = v)],
  ];
  for (const [row, , write] of toggles) row.box.addEventListener("change", (e) => set((c) => write(c, e.target.checked)));
  // Switching to "fixed" keeps the current height (aspect = current height / width): nothing jumps.
  sizing.box.addEventListener("change", (e) => {
    const st = getState();
    const { rect } = cardGeometry(measureCtx, card(st), st.design.width, st.design.height);
    set((c) => {
      c.sizing = e.target.checked ? "content" : "fixed";
      if (!e.target.checked) c.aspect = Math.min(1.2, Math.max(0.3, rect.h / rect.w));
    });
  });
  fillType.select.addEventListener("change", (e) => set((c) => (c.fill.type = e.target.value)));
  listFont.select.addEventListener("change", (e) => set((c) => (c.list.font = e.target.value)));
  hexFont.select.addEventListener("change", (e) => set((c) => (c.hex.font = e.target.value)));
  pick.addEventListener("click", () => select("card"));

  return {
    sync(state) {
      const c = card(state);
      for (const [row, read] of toggles) row.box.checked = read(c);
      body.hidden = !c.visible;
      if (!c.visible) return;
      fillType.select.value = c.fill.type;
      fill2.row.hidden = c.fill.type !== "linear";
      angle.row.hidden = c.fill.type !== "linear";
      coatingStrength.row.hidden = !c.coating.on;
      imageName.textContent = c.image.asset?.name ?? STRINGS.cardNoImage;
      upload.querySelector("span").textContent = c.image.asset ? STRINGS.characterReplace : STRINGS.characterUpload;
      removeImage.disabled = !c.image.asset;
      imgFrameColor.row.hidden = !c.image.frame.on;
      const isBuilder = c.image.source === "builder";
      srcUpload.setAttribute("aria-selected", String(!isBuilder));
      srcBuilder.setAttribute("aria-selected", String(isBuilder));
      uploadBox.hidden = isBuilder;
      builderBox.hidden = !isBuilder;
      if (isBuilder) builderPanel.sync(state);
      listFont.select.value = c.list.font;
      hexFont.select.value = c.hex.font;
      leaderColor.row.hidden = !c.list.leader.on;
      bracketColor.row.hidden = !c.list.brackets.on;
      dividerColor.row.hidden = !c.divider.on;
      dividerDashed.row.hidden = !c.divider.on;
      barcodeColor.row.hidden = !c.barcode.on;
      ingredientsEditor.sync(state);
      garnishEditor.sync(state);
      sizing.box.checked = c.sizing !== "fixed";
      aspect.row.hidden = c.sizing !== "fixed"; // content cards take their height from the recipe
      const o = cardOverflow(measureCtx, c, state.design.width, state.design.height);
      const msg = [
        o.tooMany ? STRINGS.cardTooMany : "",
        o.tooLong.length ? STRINGS.cardTooLong(o.tooLong.map((i) => i + 1)) : "",
        o.garnishTooLong.length ? STRINGS.cardGarnishTooLong(o.garnishTooLong.map((i) => i + 1)) : "",
        o.pastSheet ? STRINGS.cardPastSheet : "",
      ].filter(Boolean).join(" ");
      overflow.hidden = !msg;
      overflow.textContent = msg;
      if (document.activeElement !== hexInput) hexInput.value = state.components.order.hex;
      title.sync(state);
      name.sync(state);
      bindings.forEach((b) => b.sync(state));
    },
  };
}
