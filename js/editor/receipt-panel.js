import { HEADER_LABELS, QUICK_SECTIONS, RECEIPT_LIMITS, isValidAnniversary, layoutReceipt } from "../components/receipt.js";
import { fontStatus } from "../fonts.js";
import { newReceiptCode, newSeed, normalizeHexColor } from "../state.js";
import { bindRange, colorRow, createColorField, el, fontRow, rangeRow } from "../ui/controls.js";
import { checkRow, selectRow } from "./frame-panels.js";
import { STRINGS } from "../strings.js";

// "영수증" section. Board geometry is fixed (drag / Ctrl+wheel on the canvas); the paper grows with
// content. Sections hold only what the client supplied — new projects start with none.

const pct = (min, max) => ({ toUi: (v) => v * 100, fromUi: (v) => Math.min(max, Math.max(min, v / 100)) });
const group = (title, open, ...children) =>
  el("details", { class: "subsection", open }, el("summary", { text: title }), el("div", { class: "subsection-body" }, ...children));

let sectionNumber = 1;
const sectionId = () => `sec-${Date.now().toString(36)}-${(sectionNumber++).toString(36)}`;

// List-row values: purely numeric input follows 1–99 (max two digits, no 0; a leading zero is dropped);
// any other text stays free text. Editor input only — load normalization never rewrites stored values.
export const RECEIPT_VALUE_RANGE = { min: 1, max: 99 };
export function checkRowValue(raw) {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return { ok: true, value: raw.slice(0, RECEIPT_LIMITS.value) };
  const n = Number(t);
  if (t.length > 2 || n < RECEIPT_VALUE_RANGE.min || n > RECEIPT_VALUE_RANGE.max) return { ok: false };
  return { ok: true, value: String(n) };
}
export const randomRowValue = (rnd = Math.random) => String(RECEIPT_VALUE_RANGE.min + Math.floor(rnd() * RECEIPT_VALUE_RANGE.max));
// Track duration: exactly three digits → m:ss (seconds 00–59); 1–2 digits are kept while typing;
// anything else (with ":" or other text) stays free text, as before. Same string field, no second model.
export function checkDuration(raw) {
  // a digit typed right after a live conversion ("3:14" + "0" = "3:140") → back to the plain digits
  // the user actually typed ("3140"), which is free text like any other 4-digit entry
  if (/^\d:\d{3}$/.test(raw)) return { ok: true, value: raw.replace(":", ""), formatted: true };
  if (!/^\d{3}$/.test(raw)) return { ok: true, value: raw.slice(0, RECEIPT_LIMITS.value), formatted: false };
  if (Number(raw.slice(1)) > 59) return { ok: false };
  return { ok: true, value: `${raw[0]}:${raw.slice(1)}`, formatted: true };
}

export function createReceiptPanel(container, { getState, updateState, select }) {
  const R = (s) => s.components.receipt;
  const set = (mutate) => updateState((d) => mutate(R(d)));
  const on = (s) => R(s).visible;
  const common = { getState, updateState, enabled: on };
  const color = (row, read, write) => createColorField({ picker: row.picker, hex: row.hex, getState, updateState, read, write });
  const measureCtx = document.createElement("canvas").getContext("2d");

  // ----- 판 · 종이 -----
  const visible = checkRow("영수증 보이기");
  const pick = el("button", { class: "reseed-button", type: "button", text: "영수증 선택 (끌어서 이동 · Ctrl+휠 크기)" });
  const boardStyle = selectRow("판", [
    { value: "clipboard", text: "클립보드" },
    { value: "none", text: "없음" },
  ]);
  const boardColor = colorRow("판 색");
  const clipColor = colorRow("집게 · 테두리 색");
  const aspect = rangeRow("판 세로 비율", { min: 50, max: 400, step: 1, unit: "%" });
  const paperColor = colorRow("종이 색");
  const edge = selectRow("종이 끝", [
    { value: "zigzag", text: "뜯긴 톱니" },
    { value: "straight", text: "반듯하게" },
  ]);
  const lineColor = colorRow("구분 점선 색");

  // ----- 제목 / 부제 / 마무리 -----
  function textBlock(label, key, { multiline = false } = {}) {
    const input = multiline
      ? el("textarea", { class: "text-input", rows: "2", maxlength: "60", "aria-label": label })
      : el("input", { class: "text-input", type: "text", maxlength: "60", "aria-label": label });
    const font = fontRow("글꼴");
    const notice = el("p", { class: "notice", hidden: true });
    const size = rangeRow("크기", { min: 1, max: 15, step: 0.1, unit: "%" });
    const spacing = rangeRow("자간", { min: -20, max: 100, step: 1, unit: "%" });
    const textColor = colorRow("글자 색");
    const T = (s) => R(s)[key];
    input.addEventListener("input", (e) => set((r) => (r[key].text = e.target.value.slice(0, 60))));
    font.select.addEventListener("change", (e) => set((r) => (r[key].font = e.target.value)));
    const bindings = [
      bindRange(size, { ...common, ...pct(0.005, 0.2), read: (s) => T(s).size, write: (d, v) => (R(d)[key].size = v) }),
      bindRange(spacing, { ...common, ...pct(-0.2, 1), read: (s) => T(s).letterSpacing, write: (d, v) => (R(d)[key].letterSpacing = v) }),
      color(textColor, (s) => T(s).color, (d, v) => (R(d)[key].color = v)),
    ];
    return {
      node: group(label, false, input, font.row, notice, size.row, spacing.row, textColor.row),
      sync(state) {
        const t = T(state);
        if (document.activeElement !== input) input.value = t.text;
        font.select.value = t.font;
        const missing = t.text && fontStatus(t.font) === "missing";
        notice.hidden = !missing;
        notice.textContent = missing ? STRINGS.fontMissing : "";
        bindings.forEach((b) => b.sync(state));
      },
    };
  }
  const title = textBlock("제목", "title");
  const subtitle = textBlock("부제", "subtitle");
  const footer = textBlock("마무리 문구", "footer", { multiline: true });

  // ----- 헤더 -----
  const headerInputs = {};
  const headerRows = HEADER_LABELS.map((label) => {
    if (label === "ORDER") {
      const input = el("input", { class: "hex-input wide", type: "text", maxlength: "7", spellcheck: "false", placeholder: "#RRGGBB", "aria-label": "ORDER (HEX)" });
      headerInputs.ORDER = input;
      return el("div", { class: "color-row" }, el("span", { class: "field-label", text: "ORDER (카드 HEX와 같음)" }), input);
    }
    const key = label.toLowerCase();
    const input = el("input", { class: "text-input", type: "text", maxlength: "30", "aria-label": label });
    input.addEventListener("input", (e) => set((r) => (r.header[key] = e.target.value.slice(0, 30))));
    headerInputs[label] = input;
    return el("div", {}, el("span", { class: "field-caption", text: label }), input);
  });
  const orderError = el("p", { class: "notice", hidden: true });
  headerInputs.ORDER.addEventListener("input", (e) => {
    const raw = e.target.value.trim();
    const value = raw === "" ? "" : normalizeHexColor(raw);
    orderError.hidden = value !== null;
    orderError.textContent = value === null ? STRINGS.invalidHex : "";
    if (value !== null) updateState((d) => (d.components.order.hex = value)); // shared order information
  });
  headerInputs.ORDER.addEventListener("blur", (e) => {
    e.target.value = getState().components.order.hex;
    orderError.hidden = true;
  });

  // ----- 본문 -----
  const bodyFont = fontRow("본문 글꼴");
  const bodyNotice = el("p", { class: "notice", hidden: true });
  const bodySize = rangeRow("본문 크기", { min: 1, max: 10, step: 0.1, unit: "%" });
  const bodySpacing = rangeRow("본문 자간", { min: -20, max: 100, step: 1, unit: "%" });
  const bodyColor = colorRow("본문 색");
  const leaderColor = colorRow("점선 색");

  // ----- 섹션 -----
  const quick = el(
    "div",
    { class: "quick-row" },
    ...QUICK_SECTIONS.map((q) => el("button", { class: "small", type: "button", "data-title": q.title, "data-kind": q.kind, text: `＋ ${q.title}` })),
    el("button", { class: "small", type: "button", "data-title": "", "data-kind": "list", text: "＋ 직접 입력" }),
  );
  const sectionsBox = el("div", { class: "receipt-sections" });
  const overflow = el("p", { class: "notice", hidden: true });

  quick.addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (!b || R(getState()).sections.length >= RECEIPT_LIMITS.sections) return;
    const kind = b.dataset.kind;
    const item = kind === "playlist" ? { artist: "", song: "", duration: "" } : { text: "", value: "" };
    set((r) => r.sections.push({ id: sectionId(), kind, title: b.dataset.title, items: [item] }));
  });

  let shape = ""; // structure signature: rebuild the section editor only when it changes
  const signature = (sections) => sections.map((s) => `${s.id}:${s.kind}:${s.items.length}`).join("|");
  function renderSections(state) {
    const sections = R(state).sections;
    shape = signature(sections);
    sectionsBox.replaceChildren(
      ...sections.map((section, si) => {
        const titleInput = el("input", { class: "text-input", type: "text", maxlength: String(RECEIPT_LIMITS.text), value: section.title, "aria-label": "카테고리 이름" });
        titleInput.addEventListener("input", (e) => set((r) => (r.sections[si].title = e.target.value.slice(0, RECEIPT_LIMITS.text))));
        const btn = (text, title, fn, disabled = false) => {
          const b = el("button", { class: "row-btn", type: "button", text, title });
          b.disabled = disabled;
          b.addEventListener("click", fn);
          return b;
        };
        const moveSection = (to) => set((r) => r.sections.splice(to, 0, r.sections.splice(si, 1)[0]));
        const head = el(
          "div",
          { class: "section-head" },
          titleInput,
          btn("↑", "섹션 위로", () => moveSection(si - 1), si === 0),
          btn("↓", "섹션 아래로", () => moveSection(si + 1), si === sections.length - 1),
          btn("✕", "섹션 지우기", () => set((r) => r.sections.splice(si, 1))),
        );
        const isPlaylist = section.kind === "playlist";
        const notice = el("p", { class: "notice", hidden: true });
        const cap = isPlaylist ? RECEIPT_LIMITS.playlist : RECEIPT_LIMITS.items;
        const rows = section.items.map((item, ii) => {
          const moveItem = (to) => set((r) => r.sections[si].items.splice(to, 0, r.sections[si].items.splice(ii, 1)[0]));
          const field = (key, max, placeholder, cls) => {
            const input = el("input", { class: cls, type: "text", maxlength: String(max), value: item[key], placeholder, "aria-label": placeholder });
            const check = key === "value" ? checkRowValue : key === "duration" ? checkDuration : null;
            if (!check) {
              input.addEventListener("input", (e) => set((r) => (r.sections[si].items[ii][key] = e.target.value.slice(0, max))));
              return input;
            }
            input.addEventListener("input", (e) => {
              const res = check(e.target.value);
              notice.hidden = res.ok;
              notice.textContent = res.ok ? "" : key === "value" ? STRINGS.receiptValueRange : STRINGS.durationSeconds;
              if (!res.ok) return; // rejected: nothing stored; blur restores the last valid value
              if (res.formatted) e.target.value = res.value;
              set((r) => (r.sections[si].items[ii][key] = res.value));
            });
            input.addEventListener("blur", (e) => {
              e.target.value = R(getState()).sections[si]?.items[ii]?.[key] ?? "";
              notice.hidden = true;
            });
            return input;
          };
          const fields = isPlaylist
            ? [field("artist", RECEIPT_LIMITS.text, "가수", "row-name"), field("song", RECEIPT_LIMITS.text, "곡명", "row-name"), field("duration", RECEIPT_LIMITS.value, "3:00", "row-amount")]
            : [field("text", RECEIPT_LIMITS.text, "항목", "row-name"), field("value", RECEIPT_LIMITS.value, "수량", "row-amount")];
          return el(
            "div",
            { class: isPlaylist ? "receipt-row playlist" : "receipt-row" },
            ...fields,
            btn("↑", "위로", () => moveItem(ii - 1), ii === 0),
            btn("↓", "아래로", () => moveItem(ii + 1), ii === section.items.length - 1),
            btn("✕", "지우기", () => set((r) => r.sections[si].items.splice(ii, 1))),
          );
        });
        const add = el("button", { class: "small", type: "button", text: isPlaylist ? "＋ 곡 추가 (최대 3곡)" : "＋ 항목 추가" });
        add.disabled = section.items.length >= cap;
        add.addEventListener("click", () =>
          set((r) => r.sections[si].items.push(isPlaylist ? { artist: "", song: "", duration: "" } : { text: "", value: "" })),
        );
        // 🎲 fills every row of this list section with 1–99 — generated once here, stored, one undo step.
        // Music (playlist) sections never take part.
        let dice = null;
        if (!isPlaylist) {
          dice = el("button", { class: "small", type: "button", text: "🎲 수량 랜덤" });
          dice.disabled = section.items.length === 0;
          dice.addEventListener("click", () => {
            const values = R(getState()).sections[si].items.map(() => randomRowValue());
            set((r) => r.sections[si].items.forEach((it, k) => (it.value = values[k])));
          });
        }
        return el("div", { class: "receipt-section" }, head, ...rows, notice, add, ...(dice ? [dice] : []));
      }),
    );
  }

  // ----- 바코드 · 번호 -----
  const barcode = checkRow("가로 바코드");
  const barcodeColor = colorRow("바코드 색");
  const reseed = el("button", { class: "reseed-button", type: "button", text: "🎲 바코드 다시 뽑기 (카드와 같이 바뀌어요)" });
  const anniversary = el("input", { class: "text-input", type: "text", maxlength: "8", inputmode: "numeric", placeholder: "기념일 YYYYMMDD (비우면 랜덤 번호)", "aria-label": "기념일" });
  const anniversaryError = el("p", { class: "notice", hidden: true });
  const codeInfo = el("p", { class: "hint" });
  const recode = el("button", { class: "reseed-button", type: "button", text: "🎲 번호 다시 뽑기" });
  const codeFont = fontRow("번호 글꼴");
  const codeSize = rangeRow("번호 크기", { min: 1, max: 15, step: 0.1, unit: "%" });
  const codeColor = colorRow("번호 색");

  reseed.addEventListener("click", () => {
    const seed = newSeed();
    updateState((d) => (d.components.barcode.seed = seed)); // shared with the card
  });
  recode.addEventListener("click", () => {
    const code = newReceiptCode(); // the ONLY way the persistent code changes
    set((r) => (r.code.random = code));
  });
  anniversary.addEventListener("input", (e) => {
    const v = e.target.value.trim();
    const ok = v === "" || isValidAnniversary(v);
    anniversaryError.hidden = ok;
    anniversaryError.textContent = ok ? "" : STRINGS.anniversaryInvalid;
    if (ok) set((r) => (r.code.anniversary = v));
  });
  anniversary.addEventListener("blur", (e) => {
    e.target.value = R(getState()).code.anniversary;
    anniversaryError.hidden = true;
  });

  const body = el(
    "div",
    {},
    group("판 · 종이", true, pick, boardStyle.row, boardColor.row, clipColor.row, aspect.row, paperColor.row, edge.row, lineColor.row),
    title.node,
    subtitle.node,
    group("헤더", false, ...headerRows, orderError),
    group("신청 내용 (섹션)", true, el("p", { class: "hint", text: STRINGS.receiptContentRule }), quick, sectionsBox, overflow),
    group("본문 글자", false, bodyFont.row, bodyNotice, bodySize.row, bodySpacing.row, bodyColor.row, leaderColor.row),
    group("바코드 · 번호", false, barcode.row, barcodeColor.row, reseed, anniversary, anniversaryError, codeInfo, recode, codeFont.row, codeSize.row, codeColor.row),
    footer.node,
  );
  container.append(visible.row, body);

  const bindings = [
    bindRange(aspect, { ...common, ...pct(0.5, 4), read: (s) => R(s).aspect, write: (d, v) => (R(d).aspect = v) }),
    bindRange(bodySize, { ...common, ...pct(0.005, 0.2), read: (s) => R(s).body.size, write: (d, v) => (R(d).body.size = v) }),
    bindRange(bodySpacing, { ...common, ...pct(-0.2, 1), read: (s) => R(s).body.letterSpacing, write: (d, v) => (R(d).body.letterSpacing = v) }),
    bindRange(codeSize, { ...common, ...pct(0.005, 0.2), read: (s) => R(s).code.size, write: (d, v) => (R(d).code.size = v) }),
    color(boardColor, (s) => R(s).board.color, (d, v) => (R(d).board.color = v)),
    color(clipColor, (s) => R(s).board.clipColor, (d, v) => (R(d).board.clipColor = v)),
    color(paperColor, (s) => R(s).paper.color, (d, v) => (R(d).paper.color = v)),
    color(lineColor, (s) => R(s).paper.lineColor, (d, v) => (R(d).paper.lineColor = v)),
    color(bodyColor, (s) => R(s).body.color, (d, v) => (R(d).body.color = v)),
    color(leaderColor, (s) => R(s).body.leaderColor, (d, v) => (R(d).body.leaderColor = v)),
    color(barcodeColor, (s) => R(s).barcode.color, (d, v) => (R(d).barcode.color = v)),
    color(codeColor, (s) => R(s).code.color, (d, v) => (R(d).code.color = v)),
  ];
  visible.box.addEventListener("change", (e) => set((r) => (r.visible = e.target.checked)));
  barcode.box.addEventListener("change", (e) => set((r) => (r.barcode.on = e.target.checked)));
  boardStyle.select.addEventListener("change", (e) => set((r) => (r.board.style = e.target.value)));
  edge.select.addEventListener("change", (e) => set((r) => (r.paper.edge = e.target.value)));
  bodyFont.select.addEventListener("change", (e) => set((r) => (r.body.font = e.target.value)));
  codeFont.select.addEventListener("change", (e) => set((r) => (r.code.font = e.target.value)));
  pick.addEventListener("click", () => select("receipt"));

  return {
    sync(state) {
      const r = R(state);
      visible.box.checked = r.visible;
      body.hidden = !r.visible;
      if (!r.visible) return;
      boardStyle.select.value = r.board.style;
      boardColor.row.hidden = r.board.style === "none";
      clipColor.row.hidden = r.board.style === "none";
      edge.select.value = r.paper.edge;
      bodyFont.select.value = r.body.font;
      const missing = fontStatus(r.body.font) === "missing";
      bodyNotice.hidden = !missing;
      bodyNotice.textContent = missing ? STRINGS.fontMissing : "";
      codeFont.select.value = r.code.font;
      barcode.box.checked = r.barcode.on;
      barcodeColor.row.hidden = !r.barcode.on;
      for (const [label, input] of Object.entries(headerInputs)) {
        if (document.activeElement === input) continue;
        input.value = label === "ORDER" ? state.components.order.hex : r.header[label.toLowerCase()];
      }
      if (document.activeElement !== anniversary) anniversary.value = r.code.anniversary;
      codeInfo.textContent = r.code.anniversary ? STRINGS.codeUsesAnniversary(r.code.random) : STRINGS.codeUsesRandom(r.code.random);
      quick.querySelectorAll("button").forEach((b) => (b.disabled = r.sections.length >= RECEIPT_LIMITS.sections));
      if (signature(r.sections) !== shape) renderSections(state);
      else {
        // keep values in sync without stealing focus from the field being typed in
        sectionsBox.querySelectorAll(".receipt-section").forEach((node, si) => {
          const section = r.sections[si];
          const inputs = node.querySelectorAll("input");
          if (document.activeElement !== inputs[0]) inputs[0].value = section.title;
          const keys = section.kind === "playlist" ? ["artist", "song", "duration"] : ["text", "value"];
          let k = 1;
          section.items.forEach((item) => keys.forEach((key) => {
            const input = inputs[k++];
            if (input && document.activeElement !== input) input.value = item[key];
          }));
        });
      }
      const layout = layoutReceipt(measureCtx, r, { orderHex: state.components.order.hex }, state.design.width, state.design.height);
      const msg = [
        layout.overflow.pastBoard ? STRINGS.receiptPastBoard : "",
        layout.overflow.rows.length ? STRINGS.receiptRowsCollide(layout.overflow.rows) : "",
      ].filter(Boolean).join(" ");
      overflow.hidden = !msg;
      overflow.textContent = msg;
      title.sync(state);
      subtitle.sync(state);
      footer.sync(state);
      bindings.forEach((b) => b.sync(state));
    },
  };
}
