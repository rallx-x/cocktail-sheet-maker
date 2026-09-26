import { STRINGS } from "./strings.js";

// Folder-based asset libraries. The browser cannot list a folder by itself, so each
// folder has a JSON manifest listing its files. Projects store only the chosen FILE
// NAME; images are read from the folder (editing a PNG changes older projects too).
//
//   assets/backgrounds/patterns.json  → background patterns
//   assets/coasters/coasters.json     → MD coasters
// SVG files cannot always go through createImageBitmap; fall back to an <img> decode.
function decodeViaImage(blob) {
  const url = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      if (!image.naturalWidth) Object.assign(image, { width: 300, height: 300 });
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode"));
    };
    image.src = url;
  });
}

// optional: a missing / empty manifest is a normal state (returns []), never an error.
function createLibrary({ dir, manifest, listKey, errorMessage, optional = false }) {
  const manifestUrl = `${dir}${manifest}`;
  let manifestPromise = null;
  const images = new Map(); // file -> { promise, image, error }

  function load() {
    if (!manifestPromise) {
      manifestPromise = fetch(manifestUrl, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.json();
        })
        .then((json) => normalizeManifest(json, listKey))
        .catch(() => {
          manifestPromise = null;
          if (optional) return [];
          throw new Error(errorMessage);
        });
    }
    return manifestPromise;
  }

  // Re-reads the manifest and forgets cached images, so newly added or edited
  // files are picked up without reloading the page.
  function reload() {
    manifestPromise = null;
    for (const entry of images.values()) {
      if (entry.image && typeof entry.image.close === "function") entry.image.close();
    }
    images.clear();
    return load();
  }

  // Resolves to the decoded image, or null if the file is missing/broken.
  // A missing file never breaks rendering; the UI reads status() instead.
  function getImage(file) {
    if (!isSafeFileName(file)) return Promise.resolve(null);
    let entry = images.get(file);
    if (!entry) {
      entry = { promise: null, image: null, error: null };
      entry.promise = fetch(`${dir}${encodeURIComponent(file)}`, { cache: "no-store" })
        .then((response) => {
          if (!response.ok) throw new Error(String(response.status));
          return response.blob();
        })
        .then((blob) => createImageBitmap(blob).catch(() => decodeViaImage(blob)))
        .then((image) => {
          entry.image = image;
          return image;
        })
        .catch((error) => {
          entry.error = error;
          return null;
        });
      images.set(file, entry);
    }
    return entry.promise;
  }

  function status(file) {
    const entry = images.get(file);
    if (!entry) return { state: "unknown" };
    if (entry.error) return { state: "missing" };
    if (entry.image) return { state: "ready", width: entry.image.width, height: entry.image.height };
    return { state: "loading" };
  }

  return { load, reload, getImage, status };
}

export const patternLibrary = createLibrary({
  dir: "assets/backgrounds/",
  manifest: "patterns.json",
  listKey: "patterns",
  errorMessage: STRINGS.errors.patternList,
});

export const coasterLibrary = createLibrary({
  dir: "assets/coasters/",
  manifest: "coasters.json",
  listKey: "coasters",
  errorMessage: STRINGS.errors.coasterList,
});

// Optional: built-in stickers are the normal workflow; this folder may be empty or absent.
export const stickerLibrary = createLibrary({
  dir: "assets/stickers/",
  manifest: "stickers.json",
  listKey: "stickers",
  errorMessage: "",
  optional: true,
});

// Pattern API kept as before.
export const loadPatternManifest = patternLibrary.load;
export const reloadPatternLibrary = patternLibrary.reload;
export const getPatternImage = patternLibrary.getImage;
export const getPatternStatus = patternLibrary.status;

function normalizeManifest(json, listKey) {
  const list = Array.isArray(json) ? json : json?.[listKey];
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const items = [];
  for (const item of list) {
    const file = typeof item === "string" ? item : item?.file;
    if (!isSafeFileName(file) || seen.has(file)) continue;
    seen.add(file);
    const name = typeof item?.name === "string" && item.name.trim() ? item.name.trim() : file;
    items.push({ file, name });
  }
  return items;
}

// Only plain file names inside the library folder (no sub-paths).
function isSafeFileName(file) {
  return typeof file === "string" && file.length > 0 && !/[\\/]/.test(file) && file !== "." && file !== "..";
}
