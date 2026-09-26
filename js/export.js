import { renderSheet } from "./renderer.js";
import { downloadBlob } from "./project-io.js";
import { STRINGS } from "./strings.js";

export async function exportPng(state, filename = "three-dots-result-sheet.png") {
  if (!state.design.width || !state.design.height) {
    throw new Error(STRINGS.errors.exportNeedsBackground);
  }

  const exportCanvas = document.createElement("canvas");
  await renderSheet(exportCanvas, state, { renderScale: 1 });

  const blob = await new Promise((resolve, reject) => {
    exportCanvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error(STRINGS.errors.exportFailed));
    }, "image/png");
  });

  downloadBlob(blob, filename);
}
