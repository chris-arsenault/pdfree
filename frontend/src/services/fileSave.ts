type Writable = { write: (bytes: Uint8Array) => Promise<void>; close: () => Promise<void> };
type FileHandle = { createWritable: () => Promise<Writable> };
type FilePicker = (options: {
  suggestedName: string;
  types: { description: string; accept: Record<string, string[]> }[];
}) => Promise<FileHandle>;
const candidate = Reflect.get(window, "showSaveFilePicker") as unknown;
export const filePicker = typeof candidate === "function" ? (candidate as FilePicker) : null;
export async function saveDirect(handle: FileHandle, bytes: Uint8Array) {
  const writable = await handle.createWritable();
  await writable.write(bytes);
  await writable.close();
}
