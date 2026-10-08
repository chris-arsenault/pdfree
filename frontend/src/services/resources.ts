import sansUrl from "../assets/NotoSans-Regular.ttf?url";
import signatureUrl from "@fontsource/caveat/files/caveat-latin-400-normal.woff?url";
import { type FontData } from "../core/drawObjects";
let fonts: Promise<FontData> | null = null;
export async function assetBytes(url: string) {
  // This wrapper loads bundled application resources, never user document data.
  const response = await fetch(url);
  if (!response.ok)
    throw new Error("A bundled font could not load. Reload the application and try again.");
  return new Uint8Array(await response.arrayBuffer());
}
export function fontData() {
  fonts ??= Promise.all([assetBytes(sansUrl), assetBytes(signatureUrl)])
    .then(([sans, signature]) => ({ sans, signature }))
    .catch((error: unknown) => {
      fonts = null;
      throw error;
    });
  return fonts;
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
