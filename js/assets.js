import { STRINGS } from "./strings.js";

// Runtime registry: assetId -> { blob, metadata, decoded image }.
// Image binaries never enter application state; state stores metadata + assetId only.
let assets = new Map();
let nextAssetNumber = 1;

function makeAssetId() {
  return `asset-${Date.now().toString(36)}-${(nextAssetNumber++).toString(36)}`;
}

// Decodes once to validate the file and read dimensions, and keeps that decode
// as the render cache (no second decode on first render).
async function buildEntry(blob, metadata = {}) {
  const decoded = await decodeBlob(blob);
  return {
    assetId: metadata.assetId || makeAssetId(),
    blob,
    name: metadata.name || "image",
    type: metadata.type || blob.type || "application/octet-stream",
    width: decoded.width || decoded.naturalWidth,
    height: decoded.height || decoded.naturalHeight,
    decoded,
    decodePromise: null,
    disposed: false,
  };
}

// Registers a new asset. If decoding fails it throws and the registry is untouched.
export async function registerAsset(blob, metadata = {}) {
  const entry = await buildEntry(blob, metadata);
  assets.set(entry.assetId, entry);
  return getAssetMetadata(entry.assetId);
}

export function getAssetMetadata(assetId) {
  const asset = assets.get(assetId);
  if (!asset) return null;
  return {
    assetId: asset.assetId,
    name: asset.name,
    type: asset.type,
    width: asset.width,
    height: asset.height,
  };
}

export function hasAsset(assetId) {
  return assets.has(assetId);
}

export function getAssetBlob(assetId) {
  return assets.get(assetId)?.blob ?? null;
}

export async function getDecodedAsset(assetId) {
  const asset = assets.get(assetId);
  if (!asset) throw new Error(STRINGS.errors.missingAsset);
  if (asset.decoded) return asset.decoded;
  if (asset.decodePromise) return asset.decodePromise;

  asset.decodePromise = decodeBlob(asset.blob)
    .then((decoded) => {
      asset.decodePromise = null;
      // Entry was removed while decoding: release instead of caching on a dead entry.
      if (asset.disposed) {
        disposeDecoded(decoded);
        return decoded;
      }
      asset.decoded = decoded;
      return decoded;
    })
    .catch((error) => {
      asset.decodePromise = null;
      throw error;
    });

  return asset.decodePromise;
}

export function listAssets() {
  return [...assets.values()].map((asset) => getAssetMetadata(asset.assetId));
}

export function removeAsset(assetId) {
  const asset = assets.get(assetId);
  if (!asset) return;
  disposeEntry(asset);
  assets.delete(assetId);
}

export function clearAssets() {
  for (const asset of assets.values()) disposeEntry(asset);
  assets = new Map();
}

// Serializes only the requested (i.e. state-referenced) assets, so orphaned
// registry entries never leak into project files.
export async function exportAssetsAsDataUrls(assetIds) {
  const ids = assetIds ?? [...assets.keys()];
  const result = {};
  for (const assetId of ids) {
    const asset = assets.get(assetId);
    if (!asset) throw new Error(STRINGS.errors.missingAsset);
    result[assetId] = {
      ...getAssetMetadata(assetId),
      dataUrl: await blobToDataUrl(asset.blob),
    };
  }
  return result;
}

// Two-phase import. Stage decodes and validates everything WITHOUT touching the
// live registry; commit swaps it in. A broken project file therefore can never
// destroy the work currently open in the editor.
export async function stageAssetsFromDataUrls(serializedAssets = {}) {
  const staged = new Map();
  try {
    for (const [assetId, raw] of Object.entries(serializedAssets)) {
      if (typeof raw?.dataUrl !== "string") throw new Error(STRINGS.errors.invalidProjectAsset);
      const blob = dataUrlToBlob(raw.dataUrl);
      const entry = await buildEntry(blob, { name: raw.name, type: raw.type, assetId });
      staged.set(assetId, entry);
    }
  } catch (error) {
    for (const entry of staged.values()) disposeEntry(entry);
    throw error;
  }
  return staged;
}

export function commitStagedAssets(staged) {
  clearAssets();
  assets = staged;
}

export function discardStagedAssets(staged) {
  for (const entry of staged.values()) disposeEntry(entry);
}

function disposeEntry(asset) {
  asset.disposed = true;
  if (asset.decoded) disposeDecoded(asset.decoded);
  asset.decoded = null;
}

function disposeDecoded(decoded) {
  if (decoded && typeof decoded.close === "function") decoded.close();
}

async function decodeBlob(blob) {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob);
    } catch {
      // Fall through for formats/browser cases that ImageBitmap cannot decode.
    }
  }

  const url = URL.createObjectURL(blob);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(STRINGS.errors.imageDecode));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error(STRINGS.errors.fileRead));
    reader.readAsDataURL(blob);
  });
}

function dataUrlToBlob(dataUrl) {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/^data:([^;]+)/)?.[1] || "application/octet-stream";
  let binary;
  try {
    binary = atob(body ?? "");
  } catch {
    throw new Error(STRINGS.errors.invalidProjectAsset);
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
