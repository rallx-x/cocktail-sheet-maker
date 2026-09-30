import { rangeRow } from "../ui/controls.js";
import { clampWidth } from "../components/md.js";

// "크기" as a RELATIVE VIEW of character.width (the single source of truth — no stored scale).
// 100% = a reference width (MD: the current Fit width; SD: the default placement width), range 50–200%.
// Changing it keeps the character's VISUAL CENTER: with the bottom-center anchor, y moves by the height
// change / 2. The existing 크기 slider and Ctrl+wheel keep writing the same width (feet-anchored).
export const RELATIVE_SIZE_RANGE = { min: 50, max: 200 };

export function createRelativeSizeRow({ getState, updateState, get, reference, label = "크기" }) {
  const r = rangeRow(label, { min: RELATIVE_SIZE_RANGE.min, max: RELATIVE_SIZE_RANGE.max, step: 1, unit: "%" });
  r.row.title = "100% = 기준 크기. 그림 가운데를 기준으로 커지고 작아져요.";
  const apply = (raw) => {
    const n = Number(raw);
    const s = getState();
    const c = get(s);
    const ref = reference(s);
    if (!Number.isFinite(n) || !c?.asset || !ref) return;
    const pct = Math.min(RELATIVE_SIZE_RANGE.max, Math.max(RELATIVE_SIZE_RANGE.min, n));
    updateState((d) => {
      const ch = get(d);
      const W = d.design.width;
      const H = d.design.height;
      const ar = ch.asset.height / ch.asset.width;
      const h0 = ch.width * W * ar;
      const w1 = clampWidth(ref * (pct / 100));
      const h1 = w1 * W * ar;
      ch.y = (ch.y * H - h0 / 2 + h1 / 2) / H; // same visual center
      ch.width = w1;
    });
  };
  r.range.addEventListener("input", (e) => apply(e.target.value));
  r.number.addEventListener("change", (e) => apply(e.target.value));
  return {
    row: r.row,
    sync(state) {
      const c = get(state);
      const ref = reference(state);
      const on = Boolean(c?.asset && ref);
      r.range.disabled = r.number.disabled = !on;
      if (!on) return;
      const v = Math.round((c.width / ref) * 100); // may be outside 50–200 (e.g. after Fill): shown truthfully
      if (document.activeElement !== r.range) r.range.value = String(Math.min(RELATIVE_SIZE_RANGE.max, Math.max(RELATIVE_SIZE_RANGE.min, v)));
      if (document.activeElement !== r.number) r.number.value = String(v);
    },
  };
}
