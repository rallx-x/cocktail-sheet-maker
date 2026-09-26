import { PRESETS, PRESET_ORDER, HEIGHT_RANGE, glassFromPreset } from "../cocktail/glasses.js";
import { GARNISH_FONT, drawCocktail, resolveColor } from "../cocktail/draw-cocktail.js";
import { stopsCss } from "../background.js";
import { makeSeed } from "../patterns/prng.js";
import { bindRange, el, rangeRow } from "../ui/controls.js";

// Cocktail Builder panel (v15, Phase 1a): 잔 → 음료 → 얼음 → 림. Writes only card.builder.
// Colors come from the Character Color Palette as { ref: chip id, color } (live link) or a custom color.

const STOP_MAX = 3;
const B = (s) => s.components.card.builder;
const chipsOf = (s) => s.components.palette.chips;
const round = (v) => Math.round(v * 1000) / 1000;

function caption(text) {
  return el("p", { class: "field-caption builder-caption", text });
}
function selectRow(label, options) {
  const select = el("select", { "aria-label": label }, ...options.map(([v, t]) => el("option", { value: v, text: t })));
  return { row: el("div", { class: "pattern-row" }, el("span", { class: "field-label", text: label }), select), select };
}

// A row of color chips: [white?] + palette chips + "직접 고르기". read/write use { ref, color }.
function chipRow({ getState, updateState, read, write, white = false }) {
  const box = el("div", { class: "builder-chips" });
  const custom = el("input", { type: "color", class: "builder-custom", title: "직접 고르기", "aria-label": "직접 고르기" });
  const customLabel = el("label", { class: "builder-chip custom-chip" }, custom, el("span", { text: "직접" }));
  custom.addEventListener("input", (e) => updateState((d) => write(d, { ref: null, color: e.target.value.toUpperCase() })));
  let signature = "";
  let buttons = [];
  function build(chips) {
    const options = [...(white ? [{ id: null, name: "흰색", hex: "#FFFFFF", white: true }] : []), ...chips];
    buttons = options.map((c) => {
      const b = el("button", { class: "builder-chip", type: "button", title: c.name || c.hex }, el("i", {}), el("span", { text: c.name || "·" }));
      b.querySelector("i").style.background = c.hex;
      b.addEventListener("click", () => updateState((d) => write(d, c.white ? { ref: null, color: "#FFFFFF" } : { ref: c.id, color: c.hex })));
      b._opt = c;
      return b;
    });
    box.replaceChildren(...buttons, customLabel);
  }
  return {
    node: box,
    sync(state) {
      const chips = chipsOf(state);
      const sig = chips.map((c) => `${c.id}:${c.name}:${c.hex}`).join("|");
      if (sig !== signature) {
        signature = sig;
        build(chips);
      }
      const cur = read(state);
      let matched = false;
      for (const b of buttons) {
        const o = b._opt;
        const on = o.white ? !cur.ref && cur.color === "#FFFFFF" : cur.ref === o.id && chips.some((c) => c.id === cur.ref);
        b.setAttribute("aria-pressed", String(on));
        matched ||= on;
      }
      customLabel.classList.toggle("active", !matched);
      const shown = resolveColor(cur, chips).toLowerCase();
      if (document.activeElement !== custom) custom.value = shown;
    },
  };
}

export function createBuilderPanel(container, { getState, updateState }) {
  const set = (mutate) => updateState((d) => mutate(B(d), d));
  const common = { getState, updateState, enabled: () => true };

  // ---- 잔 ----
  const grid = el("div", { class: "glass-grid" });
  const thumbs = PRESET_ORDER.map((id) => {
    const canvas = el("canvas", { width: 96, height: 120 });
    const b = el("button", { class: "glass-thumb", type: "button", title: PRESETS[id].label }, canvas, el("span", { text: PRESETS[id].label }));
    b.addEventListener("click", () => set((bd) => (bd.glass = glassFromPreset(id, bd.glass.height)))); // keeps 잔 높이
    grid.append(b);
    const ctx = canvas.getContext("2d");
    const demo = {
      glass: glassFromPreset(id),
      scale: 1,
      liquid: { level: 0.6, stops: [{ color: "#C7A4D8", pos: 0 }, { color: "#F0A0B8", pos: 1 }] },
      ice: { type: "none", count: 0, seed: 1 },
      rim: { type: "none", color: { color: "#FFFFFF" }, seed: 1 },
    };
    drawCocktail(ctx, demo, { x: 0, y: 0, w: 96, h: 120 }, { ink: "#E9E1F2" });
    return { id, b };
  });
  const height = rangeRow("잔 높이", { min: HEIGHT_RANGE.min * 100, max: HEIGHT_RANGE.max * 100, step: 1, unit: "%" });
  const size = rangeRow("잔 크기", { min: 50, max: 100, step: 1, unit: "%" });
  const pct = (lo, hi) => ({ toUi: (v) => v * 100, fromUi: (v) => Math.min(hi, Math.max(lo, v / 100)) });
  const ranges = [
    bindRange(height, { ...common, ...pct(HEIGHT_RANGE.min, HEIGHT_RANGE.max), read: (s) => B(s).glass.height, write: (d, v) => (B(d).glass.height = v) }),
    bindRange(size, { ...common, ...pct(0.5, 1), read: (s) => B(s).scale, write: (d, v) => (B(d).scale = v) }),
  ];

  // ---- 음료 ----
  const level = rangeRow("양", { min: 0, max: 100, step: 1, unit: "%" });
  ranges.push(bindRange(level, { ...common, ...pct(0, 1), read: (s) => B(s).liquid.level, write: (d, v) => (B(d).liquid.level = v) }));
  const bar = el("div", { class: "gradient-bar builder-bar" });
  const pins = el("div", { class: "gradient-pins" });
  const ends = el("div", { class: "builder-ends" }, el("span", { text: "바닥" }), el("span", { text: "표면" }));
  const addStop = el("button", { class: "reseed-button", type: "button", text: "+ 색 추가" });
  const removeStop = el("button", { class: "reseed-button", type: "button", text: "색 지우기" });
  const flip = el("button", { class: "reseed-button", type: "button", text: "↔ 뒤집기", title: "바닥과 표면을 뒤집어요" });
  const stopPos = rangeRow("위치", { min: 0, max: 100, step: 1, unit: "%" });
  let selected = 0;
  const liquidChips = chipRow({
    getState,
    updateState,
    read: (s) => B(s).liquid.stops[Math.min(selected, B(s).liquid.stops.length - 1)],
    write: (d, c) => {
      const st = B(d).liquid.stops[selected];
      if (st) Object.assign(st, { ref: c.ref, color: c.color });
    },
  });
  const setPos = (pos) => set((bd) => bd.liquid.stops[selected] && (bd.liquid.stops[selected].pos = round(Math.min(1, Math.max(0, pos)))));
  stopPos.range.addEventListener("input", (e) => setPos(Number(e.target.value) / 100));
  stopPos.number.addEventListener("input", (e) => Number.isFinite(Number(e.target.value)) && setPos(Number(e.target.value) / 100));
  addStop.addEventListener("click", () => {
    const s = getState();
    const stops = B(s).liquid.stops;
    if (stops.length >= STOP_MAX) return;
    const used = new Set(stops.map((st) => st.ref));
    const chip = chipsOf(s).find((c) => !used.has(c.id)) ?? chipsOf(s)[0];
    const sorted = [...stops].sort((a, b) => a.pos - b.pos);
    let pos;
    if (sorted.length === 1) pos = sorted[0].pos < 0.5 ? 1 : 0;
    else {
      let best = 0;
      for (let i = 1; i < sorted.length; i++) if (sorted[i].pos - sorted[i - 1].pos > sorted[best + 1].pos - sorted[best].pos) best = i - 1;
      pos = round((sorted[best].pos + sorted[best + 1].pos) / 2);
    }
    selected = stops.length;
    set((bd) => bd.liquid.stops.push({ ref: chip?.id ?? null, color: chip?.hex ?? "#FFFFFF", pos }));
  });
  removeStop.addEventListener("click", () => {
    if (B(getState()).liquid.stops.length <= 1) return;
    const i = selected;
    selected = Math.max(0, i - 1);
    set((bd) => bd.liquid.stops.splice(i, 1));
  });
  // one-shot spatial reverse: pos → 1 − pos, then sort; every stop keeps its own { ref, color }
  flip.addEventListener("click", () => {
    const st = B(getState()).liquid.stops;
    const picked = st[selected];
    set((bd) => {
      for (const s of bd.liquid.stops) s.pos = round(1 - s.pos);
      bd.liquid.stops.sort((a, b) => a.pos - b.pos);
    });
    const after = B(getState()).liquid.stops;
    const k = after.findIndex((s) => s.ref === picked?.ref && s.color === picked?.color && Math.abs(s.pos - round(1 - picked.pos)) < 1e-9);
    selected = k >= 0 ? k : 0;
    sync(getState());
  });
  const posFromEvent = (event) => {
    const r = bar.getBoundingClientRect();
    return Math.min(1, Math.max(0, (event.clientX - r.left) / r.width));
  };
  let pinNodes = [];
  function buildPins(n) {
    pins.replaceChildren();
    pinNodes = Array.from({ length: n }, (_, i) => {
      const pin = el("button", { class: "gradient-pin", type: "button", "aria-label": `음료 색 ${i + 1}` });
      pin.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        selected = i;
        pin.setPointerCapture(e.pointerId);
        sync(getState());
        const move = (ev) => setPos(posFromEvent(ev));
        const up = () => {
          pin.removeEventListener("pointermove", move);
          pin.removeEventListener("pointerup", up);
          pin.removeEventListener("pointercancel", up);
        };
        pin.addEventListener("pointermove", move);
        pin.addEventListener("pointerup", up);
        pin.addEventListener("pointercancel", up);
      });
      pins.append(pin);
      return pin;
    });
  }

  // ---- 얼음 ----
  const iceType = selectRow("얼음", [["none", "없음"], ["cubes", "큐브"]]);
  const iceCount = rangeRow("개수", { min: 1, max: 4, step: 1 });
  ranges.push(bindRange(iceCount, { ...common, enabled: (s) => B(s).ice.type === "cubes", read: (s) => B(s).ice.count, write: (d, v) => (B(d).ice.count = Math.round(Math.min(4, Math.max(1, v)))) }));
  const iceReroll = el("button", { class: "reseed-button", type: "button", text: "얼음 다시 섞기" });
  iceType.select.addEventListener("change", (e) => set((bd) => (bd.ice.type = e.target.value)));
  iceReroll.addEventListener("click", () => set((bd) => (bd.ice.seed = makeSeed())));

  // ---- 림 ----
  const rimType = selectRow("림", [["none", "없음"], ["salt", "소금"], ["sugar", "설탕"]]);
  const rimChips = chipRow({ getState, updateState, white: true, read: (s) => B(s).rim.color, write: (d, c) => (B(d).rim.color = c) });
  const rimReroll = el("button", { class: "reseed-button", type: "button", text: "림 다시 섞기" });
  rimType.select.addEventListener("change", (e) => set((bd) => (bd.rim.type = e.target.value)));
  rimReroll.addEventListener("click", () => set((bd) => (bd.rim.seed = makeSeed())));

  // ---- 가니쉬 (1b): rim-attached MONA emoji, 좌우 위치 + 크기 3단계 + 회전 + 색 ----
  const GARNISH_PRESETS = ["🍒", "🍋", "🍊", "🍓", "🫐", "🍍", "🥝", "🫒", "🌿", "🍃", "🍑", "🍇", "🥥", "🌸"];
  let gSel = 0;
  const G = (s) => B(s).garnish;
  const gList = el("div", { class: "builder-chips garnish-list" });
  const gAdd = el("button", { class: "reseed-button", type: "button", text: "+ 가니쉬 추가" });
  const gRemove = el("button", { class: "reseed-button", type: "button", text: "이 가니쉬 빼기" });
  const gPresets = el("div", { class: "builder-chips garnish-presets" }, ...GARNISH_PRESETS.map((ch) => {
    const b = el("button", { class: "builder-chip emoji-chip", type: "button", text: ch, title: ch });
    b.addEventListener("click", () => set((bd) => bd.garnish[gSel] && (bd.garnish[gSel].char = ch)));
    return b;
  }));
  const gInput = el("input", { class: "text-input", type: "text", maxlength: "16", placeholder: "이모지 직접 입력", "aria-label": "가니쉬 이모지 직접 입력" });
  const gWarn = el("p", { class: "notice", hidden: true, text: "이 이모지는 도트(MONA) 글꼴에 없어서 모양이 달라질 수 있어요." });
  const gPos = rangeRow("좌우 위치", { min: 0, max: 100, step: 1, unit: "%" });
  const gRot = rangeRow("회전", { min: -180, max: 180, step: 1, unit: "°" });
  const gSize = selectRow("크기", [["S", "작게"], ["M", "보통"], ["L", "크게"]]);
  const gEdit = el("div", {}, gPresets, gInput, gWarn, gPos.row, gSize.row, gRot.row, gRemove);
  const segment = (v) => {
    const seg = Intl.Segmenter ? new Intl.Segmenter("ko", { granularity: "grapheme" }) : null;
    return seg ? seg.segment(v)[Symbol.iterator]().next().value?.segment ?? "" : [...v][0] ?? "";
  };
  gInput.addEventListener("input", (e) => {
    const ch = segment(e.target.value.trim());
    if (ch) set((bd) => bd.garnish[gSel] && (bd.garnish[gSel].char = ch));
  });
  gSize.select.addEventListener("change", (e) => set((bd) => bd.garnish[gSel] && (bd.garnish[gSel].size = e.target.value)));
  ranges.push(
    bindRange(gPos, { ...common, enabled: (s) => G(s).length > 0, toUi: (v) => v * 100, fromUi: (v) => Math.min(1, Math.max(0, v / 100)), read: (s) => G(s)[gSel]?.u ?? 0.5, write: (d, v) => B(d).garnish[gSel] && (B(d).garnish[gSel].u = v) }),
    bindRange(gRot, { ...common, enabled: (s) => G(s).length > 0, read: (s) => G(s)[gSel]?.rotation ?? 0, write: (d, v) => B(d).garnish[gSel] && (B(d).garnish[gSel].rotation = Math.min(180, Math.max(-180, v))) }),
  );
  gAdd.addEventListener("click", () => {
    gSel = G(getState()).length;
    set((bd) => bd.garnish.push({ char: "🍋", u: 0.25, size: "M", rotation: 0 }));
  });
  gRemove.addEventListener("click", () => {
    const i = gSel;
    gSel = Math.max(0, i - 1);
    set((bd) => bd.garnish.splice(i, 1));
  });
  // MONA coverage. The color MONA glyphs are pure pixel art: drawn at 12px they have NO anti-aliased
  // (partial-alpha) pixels, while any fallback font does. A char missing everywhere shows the font's
  // "tofu" box, which is also crisp, so it is compared against the tofu of a surely-missing code point.
  const coverage = new Map();
  let tofu = null;
  function raster(ch) {
    const c = document.createElement("canvas");
    c.width = c.height = 24;
    const x = c.getContext("2d");
    x.font = `12px ${GARNISH_FONT}, sans-serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText(ch, 12, 12);
    return x.getImageData(0, 0, 24, 24).data;
  }
  function inMona(ch) {
    if (coverage.has(ch)) return coverage.get(ch);
    const d = raster(ch);
    let full = 0;
    let partial = 0;
    for (let i = 3; i < d.length; i += 4) {
      if (d[i] === 255) full++;
      else if (d[i] > 0) partial++;
    }
    tofu ??= raster("\u{10FFFD}").join(",");
    const has = full > 0 && partial === 0 && d.join(",") !== tofu;
    if (document.fonts?.check(`12px ${GARNISH_FONT}`, ch)) coverage.set(ch, has);
    return has;
  }
  let gRendered = "";
  function syncGarnish(state) {
    const list = G(state);
    if (gSel >= list.length) gSel = Math.max(0, list.length - 1);
    const sig = list.map((g) => g.char).join("|") + `#${gSel}`;
    if (sig !== gRendered) {
      gRendered = sig;
      gList.replaceChildren(...list.map((g, i) => {
        const b = el("button", { class: "builder-chip emoji-chip", type: "button", text: g.char, "aria-pressed": String(i === gSel), title: `가니쉬 ${i + 1}` });
        b.addEventListener("click", () => {
          gSel = i;
          sync(getState());
        });
        return b;
      }));
    }
    gEdit.hidden = list.length === 0;
    if (!list.length) return;
    const g = list[gSel];
    for (const b of gPresets.children) b.setAttribute("aria-pressed", String(b.textContent === g.char));
    if (document.activeElement !== gInput) gInput.value = g.char;
    gWarn.hidden = inMona(g.char);
    gSize.select.value = g.size;
  }

  const liquidTools = el("div", { class: "button-row builder-buttons" }, addStop, removeStop, flip);
  container.append(
    caption("잔"), grid, height.row, size.row,
    caption("음료"), level.row, ends, bar, pins, liquidTools, stopPos.row, liquidChips.node,
    caption("얼음"), iceType.row, iceCount.row, iceReroll,
    caption("림"), rimType.row, rimChips.node, rimReroll,
    caption("가니쉬"), gList, gAdd, gEdit,
    el("p", { class: "hint", text: "음료·림 색은 캐릭터 컬러 팔레트와 연결돼요. 팔레트 색을 바꾸면 칵테일도 같이 바뀌어요." }),
  );

  function sync(state) {
    const b = B(state);
    const chips = chipsOf(state);
    for (const t of thumbs) t.b.setAttribute("aria-pressed", String(b.glass.preset === t.id));
    ranges.forEach((r) => r.sync(state));
    const stops = b.liquid.stops;
    if (selected >= stops.length) selected = stops.length - 1;
    bar.style.background = stops.length === 1 ? resolveColor(stops[0], chips) : stopsCss(stops.map((s) => ({ pos: s.pos, color: resolveColor(s, chips) })));
    if (pinNodes.length !== stops.length) buildPins(stops.length);
    stops.forEach((st, i) => {
      pinNodes[i].style.left = `${st.pos * 100}%`;
      pinNodes[i].style.background = resolveColor(st, chips);
      pinNodes[i].setAttribute("aria-pressed", String(i === selected));
    });
    const cur = stops[selected];
    if (document.activeElement !== stopPos.range) stopPos.range.value = Math.round(cur.pos * 100);
    if (document.activeElement !== stopPos.number) stopPos.number.value = Math.round(cur.pos * 100);
    addStop.disabled = stops.length >= STOP_MAX;
    removeStop.disabled = stops.length <= 1;
    liquidChips.sync(state);
    iceType.select.value = b.ice.type;
    iceCount.row.hidden = iceReroll.hidden = b.ice.type !== "cubes";
    rimType.select.value = b.rim.type;
    rimChips.node.hidden = rimReroll.hidden = b.rim.type === "none";
    rimChips.sync(state);
    syncGarnish(state);
  }
  return { sync };
}
