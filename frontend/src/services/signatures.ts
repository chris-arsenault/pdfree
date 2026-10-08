import { get, update, del } from "idb-keyval";
import { type Asset, type PlacedObject, newId } from "../core/model";
export type SavedSignature = {
  id: string;
  label: string;
  object: Partial<PlacedObject>;
  asset: Asset | null;
};
const key = "pdfree-signatures-v1";
export const savedSignatures = async () => (await get<SavedSignature[]>(key)) ?? [];
export async function rememberSignature(signature: SavedSignature) {
  await update<SavedSignature[]>(key, (saved) => [...(saved ?? []), signature]);
}
export async function removeSignature(id: string) {
  await update<SavedSignature[]>(key, (saved) =>
    (saved ?? []).filter((signature) => signature.id !== id)
  );
}
export const clearSignatures = () => del(key);
export async function makeSignature(
  mode: string,
  text: string,
  canvas: HTMLCanvasElement | null,
  image: Asset | null
) {
  let asset: Asset | null = null;
  let object: Partial<PlacedObject> = {
    kind: "text",
    text,
    font: "signature",
    fontSize: 28,
    width: 200,
    height: 50,
  };
  if (mode === "type" && !text.trim()) throw new Error("Type your signature first.");
  if (mode === "draw") {
    if (!canvas) throw new Error("The signature canvas is unavailable.");
    asset = await canvasSignature(canvas);
  }
  if (mode === "image") {
    if (!image) throw new Error("Choose a signature image first.");
    asset = image;
  }
  if (asset) {
    const bitmap = await createImageBitmap(
      new Blob([Uint8Array.from(asset.data)], { type: asset.mime })
    );
    object = {
      kind: "image",
      assetId: asset.id,
      width: 180,
      height: (180 * bitmap.height) / bitmap.width,
    };
    bitmap.close();
  }
  return { object, asset };
}
export async function canvasSignature(canvas: HTMLCanvasElement): Promise<Asset> {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Drawing is unavailable in this browser.");
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  let left = canvas.width,
    top = canvas.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < canvas.width; x++) {
      if (image.data[(y * canvas.width + x) * 4 + 3] > 20) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
    }
  if (right < left) throw new Error("Draw your signature first.");
  const trimmed = document.createElement("canvas");
  trimmed.width = right - left + 9;
  trimmed.height = bottom - top + 9;
  trimmed
    .getContext("2d")
    ?.drawImage(
      canvas,
      left,
      top,
      right - left + 1,
      bottom - top + 1,
      4,
      4,
      right - left + 1,
      bottom - top + 1
    );
  const blob = await new Promise<Blob>((resolve, reject) =>
    trimmed.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error("Signature image could not be created.")),
      "image/png"
    )
  );
  return {
    id: newId(),
    name: "Signature",
    data: new Uint8Array(await blob.arrayBuffer()),
    mime: "image/png",
  };
}
