import { failure } from "../i18n/messages";
import sansUrl from "../assets/NotoSans-Regular.ttf?url";
import signatureUrl from "@fontsource/caveat/files/caveat-latin-400-normal.woff?url";
import { type FontData } from "../core/drawObjects";
import { type EditorDocument } from "../core/model";
export type FontOptions = { signature?: boolean };
const fontSets = new Map<boolean, Promise<FontData>>();
const fontAssets = new Map<string, Promise<Uint8Array>>();
export async function assetBytes(url: string) {
  // This wrapper loads bundled application resources, never user document data.
  const response = await fetch(url);
  if (!response.ok) throw failure("errors.bundledFont");
  return new Uint8Array(await response.arrayBuffer());
}
function fontBytes(url: string) {
  const cached = fontAssets.get(url);
  if (cached) return cached;
  const pending = assetBytes(url).catch((error: unknown) => {
    fontAssets.delete(url);
    throw error;
  });
  fontAssets.set(url, pending);
  return pending;
}
export function fontData(): Promise<FontData & { signature: Uint8Array }>;
export function fontData(options: {
  signature?: true;
}): Promise<FontData & { signature: Uint8Array }>;
export function fontData(options: FontOptions): Promise<FontData>;
export function fontData({ signature = true }: FontOptions = {}) {
  const cached = fontSets.get(signature);
  if (cached) return cached;
  const pending = Promise.all([fontBytes(sansUrl), signature ? fontBytes(signatureUrl) : null])
    .then(([sans, signature]) => ({ sans, signature }))
    .catch((error: unknown) => {
      fontSets.delete(signature);
      throw error;
    });
  fontSets.set(signature, pending);
  return pending;
}
export function documentFontOptions(document: EditorDocument, pageIds: string[] = []): FontOptions {
  const selected = new Set(pageIds);
  return {
    signature: document.pages.some(
      (page) =>
        (!selected.size || selected.has(page.id)) &&
        page.objects.some(
          (object) =>
            ["text", "stamp", "field"].includes(object.kind) && object.font === "signature"
        )
    ),
  };
}
export function download(bytes: Uint8Array, name: string, mime: string) {
  const blob = new Blob([Uint8Array.from(bytes)], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
