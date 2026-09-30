import { registerAsset } from "../assets.js";
import { coasterLibrary } from "../library.js";
import { MD_WIDTH_RANGE, releaseUnusedAssets } from "../state.js";
import { makeSeed } from "../patterns/prng.js";
import { copyPlateDesign, createCoasterPreset } from "../components/plate.js";
import { createBrandPanel, createTrayPanel } from "./box-panels.js";
import { createFramePanel, createMdDecorPanel } from "./frame-panels.js";
import { createStickerPanel } from "./sticker-panel.js";
import { createCardPanel } from "./card-panel.js";
import { createMemoPanel } from "./memo-panel.js";
import { createReceiptPanel } from "./receipt-panel.js";
import { createConfettiPanel } from "./confetti-panel.js";
import { createPalettePanel } from "./palette-panel.js";
import "./frame-fit.js"; // registers the "캐릭터에 맞춤" draft finalizer
import { createModeNav } from "./mode-nav.js";
import { createSheetColorsPanel, createThemeStrip } from "./theme-panel.js";
import { createBackgroundPanel } from "./background-panel.js";
import { stickerLibrary } from "../library.js";
import { defaultCharacterPlacement, defaultCoasterPlacement, viewportOf } from "../components/md.js";
import { defaultSdCharacterPlacement } from "../components/sd.js";
import { bindRange, createColorField, el } from "../ui/controls.js";
import { STRINGS } from "../strings.js";
import { createAdapters } from "./adapters.js";
import { createInteraction } from "./interaction.js";
import { createPlatePanel } from "./plate-panel.js";
import { createMdViewportPanel } from "./md-viewport-panel.js";
import { createRelativeSizeRow } from "./relative-size.js";

// MD + SD editing: one interaction controller (pointer / wheel / selection) plus one panel
// binder per section. Editor-only state (selection, remembered plate) is never saved.
export function createFigureEditor({ getState, updateState, getPreviewScale, reportError }) {
  const $ = (selector) => document.querySelector(selector);
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#fff";

  const { getAdapters, guides } = createAdapters();
  // Each section remembers which of its two items the panel controls edit.
  const sectionTarget = { md: "md.character", sd: "sd.character", background: "brand", stickers: null, card: "card", receipt: "receipt", palette: "palette" };

  let modeNav = null; // created below; selection may only open modes once it exists
  const interaction = createInteraction({
    overlay: $("#overlayCanvas"),
    sheet: $("#sheetCanvas"),
    stage: $("#stage"),
    getAdapters,
    guides,
    getState,
    updateState,
    getPreviewScale,
    cssVar,
    onSelect(id, changed) {
      const adapter = interaction.get(id);
      sectionTarget[adapter.section] = id;
      // Opening the owning section never collapses the others.
      if (changed) modeNav?.show(adapter.section); // v13: selecting on the canvas opens the owning mode
      sync(getState());
    },
  });

  // A-2: images are released only when no state in undo history references them
  const releaseIfUnreferenced = () => releaseUnusedAssets();

  // Shared: upload / replace / remove a character for a section.
  function bindCharacter({ input, remove, get, place, section }) {
    input.addEventListener("change", async (event) => {
      const [file] = event.target.files;
      if (!file) return;
      try {
        // Register first: a broken file never touches the current character.
        const asset = await registerAsset(file, { name: file.name, type: file.type });
        const previous = get(getState()).asset;
        updateState((draft) => {
          const c = get(draft);
          c.asset = asset;
          // Replacing keeps x / y / width; the first character gets the default placement.
          if (!previous) Object.assign(c, place(asset, draft));
        });
        releaseIfUnreferenced(previous?.assetId);
        interaction.select(`${section}.character`);
      } catch (error) {
        reportError(error);
      } finally {
        event.target.value = "";
      }
    });
    remove.addEventListener("click", () => {
      const previousId = get(getState()).asset?.assetId;
      if (!previousId) return;
      updateState((draft) => Object.assign(get(draft), { asset: null, x: 0, y: 0, width: 0 }));
      releaseIfUnreferenced(previousId);
    });
  }

  // Shared: 편집 대상 toggle (2-3 items) + width + 위치 초기화 + linked checkbox for a section.
  function bindFigureControls({ section, buttons, width, reset, linked, getLinked, setLinked }) {
    const none = { has: () => false, getWidth: () => 0, setWidth() {}, reset() {} };
    const target = () => interaction.get(sectionTarget[section]) ?? none;
    for (const [id, button] of Object.entries(buttons)) button.addEventListener("click", () => interaction.select(id));
    const widthBinding = bindRange(width, {
      getState,
      updateState,
      enabled: (s) => target().has(s),
      read: (s) => target().getWidth(s),
      write: (d, v) => target().setWidth(d, v),
      toUi: (v) => v * 100,
      fromUi: (v) => Math.min(MD_WIDTH_RANGE.max, Math.max(MD_WIDTH_RANGE.min, v / 100)),
    });
    reset.addEventListener("click", () => {
      if (!target().has(getState())) return;
      updateState((draft) => target().reset(draft));
    });
    // Relinking never snaps anything; it only affects later movement.
    linked?.addEventListener("change", (event) => updateState((draft) => setLinked(draft, event.target.checked)));
    return {
      sync(state) {
        for (const [id, button] of Object.entries(buttons)) button.setAttribute("aria-checked", String(sectionTarget[section] === id));
        widthBinding.sync(state);
        reset.disabled = !target().has(state);
        if (linked) linked.checked = getLinked(state);
      },
    };
  }

  // ---------- MD section ----------
  const md = (s) => s.components.md;
  bindCharacter({
    section: "md",
    input: $("#characterInput"),
    remove: $("#characterRemoveButton"),
    get: (s) => md(s).character,
    place: (asset, draft) => defaultCharacterPlacement(asset, draft.design.width, draft.design.height, viewportOf(md(draft))),
  });
  // v16: MD viewport actions (Fit / Fill / Reset, position, clip), built right under the character row
  const mdViewportPanel = createMdViewportPanel($("#characterName"), {
    getState,
    updateState,
    getAdapter: () => interaction.get("md.character"),
  });
  const mdControls = bindFigureControls({
    section: "md",
    buttons: { "md.character": $("#targetCharacter"), "md.coaster": $("#targetCoaster"), "md.frame": $("#targetFrame") },
    width: { range: $("#mdWidthRange"), number: $("#mdWidthNumber") },
    reset: $("#mdResetButton"),
    linked: $("#mdLinked"),
    getLinked: (s) => md(s).linked,
    setLinked: (d, v) => (md(d).linked = v),
  });

  let coasterList = [];
  let coasterListError = null;
  let lastCoasterPlate = null; // editor memory: coaster plate survives switching to a PNG and back
  const coasterSelect = $("#coasterSelect");
  const coasterPlate = {
    read: (s) => (md(s).coaster.source === "plate" ? md(s).coaster.plate : null),
    write: (d, mutate) => {
      if (md(d).coaster.source === "plate") mutate(md(d).coaster.plate);
    },
  };
  const doilyPlate = {
    read: (s) => s.components.sd.doily.plate,
    write: (d, mutate) => mutate(d.components.sd.doily.plate),
  };
  const coasterPlatePanel = createPlatePanel($("#coasterPlate"), { getState, updateState, ...coasterPlate, other: doilyPlate });
  // v13: Sheet Color Preset strip + editor modes (pinned above the scroll area; built from JS),
  // and the 10 Sheet Colors as the first subsection of SHEET mode.
  const themeStrip = createThemeStrip({ getState, updateState });
  modeNav = createModeNav({ panel: $(".panel"), pinnedTop: themeStrip.node });
  const sheetColorsBody = el("div", { class: "subsection-body" });
  $('details[data-section="background"] > .section-body').prepend(
    el("details", { class: "subsection", open: true }, el("summary", { text: "시트 색 (테마)" }), sheetColorsBody),
  );
  const sheetColors = createSheetColorsPanel(sheetColorsBody, { getState, updateState });
  // v14: sheet background gradient editor, right under the solid 배경색 row (hidden while the gradient is on)
  const solidRow = $("#backgroundColorPicker").closest(".color-row");
  const backgroundBody = el("div", { class: "background-gradient" });
  $("#backgroundHexError").after(backgroundBody);
  const backgroundPanel = createBackgroundPanel(backgroundBody, { getState, updateState, solidRow });

  const framePanel = createFramePanel($("#framePanel"), { get: (s) => md(s).frame, getState, updateState });
  let stickerFiles = [];
  const mdDecorPanel = createMdDecorPanel($("#mdDecorPanel"), {
    get: (s) => md(s).decor,
    getState,
    updateState,
    getStickerFiles: () => stickerFiles,
    selectBanner: () => interaction.select("md.banner"),
  });
  const stickerPanel = createStickerPanel($("#stickerPanel"), {
    getState,
    updateState,
    getStickerFiles: () => stickerFiles,
    getTarget: () => sectionTarget.stickers,
    select: (id) => interaction.select(id),
  });
  const cardPanel = createCardPanel($("#cardPanel"), {
    getState,
    updateState,
    reportError,
    select: (id) => interaction.select(id),
  });
  const memoPanel = createMemoPanel($("#cardPanel"), { getState, updateState, select: (id) => interaction.select(id) }); // v17
  const receiptPanel = createReceiptPanel($("#receiptPanel"), {
    getState,
    updateState,
    select: (id) => interaction.select(id),
  });
  const confettiPanel = createConfettiPanel($("#confettiPanel"), { getState, updateState, select: (id) => interaction.select(id) });
  const palettePanel = createPalettePanel($("#palettePanel"), { getState, updateState, select: (id) => interaction.select(id) });
  // Folder stickers are optional: an absent / empty manifest simply means "none".
  stickerLibrary.load().then((files) => {
    stickerFiles = files;
    mdDecorPanel.refreshStickerFiles();
    stickerPanel.refreshStickerFiles();
    sync(getState());
  });
  const brandPanel = createBrandPanel($("#brandPanel"), { get: (s) => s.components.brand, getState, updateState });

  coasterSelect.addEventListener("change", (event) => {
    const value = event.target.value;
    const current = md(getState()).coaster;
    if (current.source === "plate") lastCoasterPlate = structuredClone(current.plate);
    updateState((draft) => {
      const m = md(draft);
      const placement = m.coaster.source !== "none"
        ? { x: m.coaster.x, y: m.coaster.y, width: m.coaster.width } // swapping keeps placement
        : defaultCoasterPlacement(m.character, viewportOf(m)); // the first coaster goes under the character
      if (value === "plate") m.coaster = { source: "plate", plate: lastCoasterPlate ?? createCoasterPreset(makeSeed()), ...placement };
      else if (value.startsWith("file:")) m.coaster = { source: "file", file: value.slice(5), ...placement };
      else m.coaster = { source: "none" };
      // With design sync on, a coaster that becomes a plate takes the doily's design.
      if (m.coaster.source === "plate" && draft.components.plateSync) copyPlateDesign(draft.components.sd.doily.plate, m.coaster.plate);
    });
    if (value !== "none") interaction.select("md.coaster");
  });

  $("#coasterReloadButton").addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try {
      await refreshCoasterList(coasterLibrary.reload());
    } finally {
      $("#coasterReloadButton").disabled = false;
    }
  });

  async function refreshCoasterList(promise = coasterLibrary.load()) {
    try {
      coasterList = await promise;
      coasterListError = null;
    } catch (error) {
      coasterList = [];
      coasterListError = error.message;
    }
    renderCoasterOptions(getState());
    sync(getState());
  }

  function coasterValue(coaster) {
    if (coaster.source === "plate") return "plate";
    if (coaster.source === "file") return `file:${coaster.file}`;
    return "none";
  }

  function renderCoasterOptions(state) {
    const coaster = md(state).coaster;
    const option = (value, label) => {
      const o = document.createElement("option");
      o.value = value;
      o.textContent = label;
      return o;
    };
    const files = coasterList.map((c) => option(`file:${c.file}`, c.name));
    if (coaster.source === "file" && !coasterList.some((c) => c.file === coaster.file)) {
      files.push(option(`file:${coaster.file}`, STRINGS.patternNotListed(coaster.file)));
    }
    const children = [option("none", STRINGS.coasterNone), option("plate", STRINGS.coasterPlate)];
    if (files.length) {
      const group = document.createElement("optgroup");
      group.label = STRINGS.coasterGroupFile;
      group.append(...files);
      children.push(group);
    }
    coasterSelect.replaceChildren(...children);
    coasterSelect.value = coasterValue(coaster);
  }

  // ---------- SD section ----------
  const sd = (s) => s.components.sd;
  bindCharacter({
    section: "sd",
    input: $("#sdCharacterInput"),
    remove: $("#sdCharacterRemoveButton"),
    get: (s) => sd(s).character,
    place: (asset, draft) => defaultSdCharacterPlacement(asset, sd(draft).doily, draft.design.width, draft.design.height),
  });
  // v17.1: SD 캐릭터 크기, a relative view of sd.character.width — 100% = the default placement size
  const sdSize = createRelativeSizeRow({
    getState,
    updateState,
    label: "캐릭터 크기",
    get: (s) => sd(s).character,
    reference: (s) => {
      const c = sd(s).character;
      return c.asset ? defaultSdCharacterPlacement(c.asset, sd(s).doily, s.design.width, s.design.height).width : null;
    },
  });
  $("#sdCharacterName").after(sdSize.row);
  const sdControls = bindFigureControls({
    section: "sd",
    buttons: { "sd.character": $("#targetSd"), "sd.doily": $("#targetDoily"), "sd.tray": $("#targetTray") },
    width: { range: $("#sdWidthRange"), number: $("#sdWidthNumber") },
    reset: $("#sdResetButton"),
    linked: $("#sdLinked"),
    getLinked: (s) => sd(s).linked,
    setLinked: (d, v) => (sd(d).linked = v),
  });
  const doilyPlatePanel = createPlatePanel($("#doilyPlate"), { getState, updateState, ...doilyPlate, other: coasterPlate });
  const trayPanel = createTrayPanel($("#trayPanel"), { get: (s) => sd(s).tray, getDoily: (s) => sd(s).doily, getState, updateState });

  // ---------- Sync (after every render) ----------
  function syncCharacterRow(character, { name, upload, remove }) {
    const has = Boolean(character.asset);
    name.textContent = has ? character.asset.name : STRINGS.characterNone;
    upload.textContent = has ? STRINGS.characterReplace : STRINGS.characterUpload;
    remove.disabled = !has;
  }

  function sync(state) {
    syncCharacterRow(md(state).character, { name: $("#characterName"), upload: $("#characterUploadLabel"), remove: $("#characterRemoveButton") });
    syncCharacterRow(sd(state).character, { name: $("#sdCharacterName"), upload: $("#sdCharacterUploadLabel"), remove: $("#sdCharacterRemoveButton") });
    sdSize.sync(state);

    const coaster = md(state).coaster;
    if (coasterSelect.value !== coasterValue(coaster) || !coasterSelect.options.length) renderCoasterOptions(state);
    const status = coaster.source === "file" ? coasterLibrary.status(coaster.file) : null;
    const notice = coasterListError || (status?.state === "missing" ? STRINGS.coasterMissing(coaster.file) : "");
    $("#coasterNotice").hidden = !notice;
    $("#coasterNotice").textContent = notice;

    mdControls.sync(state);
    mdViewportPanel.sync(state);
    sdControls.sync(state);
    coasterPlatePanel.sync(state);
    doilyPlatePanel.sync(state);
    themeStrip.sync(state);
    sheetColors.sync(state);
    backgroundPanel.sync(state);
    framePanel.sync(state);
    mdDecorPanel.sync(state);
    cardPanel.sync(state);
    memoPanel.sync(state);
    receiptPanel.sync(state);
    confettiPanel.sync(state);
    palettePanel.sync(state);
    stickerPanel.sync(state);
    trayPanel.sync(state);
    brandPanel.sync(state);
  }

  refreshCoasterList();
  return {
    sync,
    drawOverlay: (state) => interaction.draw(state),
    select: (id) => interaction.select(id),
  };
}
