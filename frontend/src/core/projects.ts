import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate";
import { projectSchema } from "./projectSchema";
import { type EditorDocument } from "./model";
import { refreshSources } from "./refreshSources";
import { validateProjectBudget, storedProjectBudget } from "./projectLimits";
import { validateProjectReferences } from "./projectReferences";

export function writeProject(document: EditorDocument) {
  const files: Record<string, Uint8Array> = {};
  const sources = document.sources.map((source, index) => {
    const path = `sources/${index}.pdf`;
    files[path] = source.bytes;
    return { id: source.id, name: source.name, path };
  });
  const assets = document.assets.map((asset, index) => {
    const path = `assets/${index}.${asset.mime === "image/jpeg" ? "jpg" : "png"}`;
    files[path] = asset.data;
    return { id: asset.id, name: asset.name, mime: asset.mime, path };
  });
  const parsed = projectSchema.safeParse({ ...document, sources, assets });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(`Cannot save this editing project: ${issue.path.join(".")} — ${issue.message}`);
  }
  validateProjectReferences(document);
  const manifest = parsed.data;
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  validateProjectBudget(
    storedProjectBudget(Object.entries(files).map(([path, data]) => ({ path, size: data.length })))
  );
  return zipSync(files, { level: 0 });
}
function projectFiles(bytes: Uint8Array) {
  validateProjectBudget({
    archiveBytes: bytes.length,
    expandedBytes: 0,
    manifestBytes: 0,
    entries: 0,
  });
  let size = 0,
    count = 0;
  return unzipSync(bytes, {
    filter: (entry) => {
      size += entry.originalSize;
      count++;
      validateProjectBudget({
        archiveBytes: bytes.length,
        expandedBytes: size,
        manifestBytes: entry.name === "manifest.json" ? entry.originalSize : 0,
        entries: count,
      });
      return (
        entry.name === "manifest.json" || /^(sources|assets)\/\d+\.(pdf|png|jpg)$/.test(entry.name)
      );
    },
  });
}
function bytesFor(files: Record<string, Uint8Array>, path: string) {
  if (!files[path]) throw new Error(`This project is missing ${path}.`);
  return files[path];
}
export async function readProject(bytes: Uint8Array): Promise<EditorDocument> {
  const files = projectFiles(bytes),
    parsed = projectSchema.safeParse(parseManifest(bytesFor(files, "manifest.json")));
  if (!parsed.success) throw new Error("This is not a supported PDFree version 1 project.");
  const manifest = parsed.data;
  const refreshed = await refreshSources(
    manifest.sources.map((item) => ({
      id: item.id,
      name: item.name,
      bytes: bytesFor(files, item.path),
    })),
    manifest.pages
  );
  const document: EditorDocument = {
    ...manifest,
    ...refreshed,
    assets: manifest.assets.map((asset) => ({
      id: asset.id,
      name: asset.name,
      mime: asset.mime,
      data: bytesFor(files, asset.path),
    })),
  };
  validateProjectReferences(document);
  return document;
}
function parseManifest(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(strFromU8(bytes));
  } catch {
    throw new Error("This project's manifest is not valid JSON.");
  }
}
