import { type EditorDocument } from "../core/model";
import { appendSource, type importPdf } from "../core/importPdf";
import { runPdfWorker } from "./workerClient";
export async function openFiles(files: File[], current: EditorDocument) {
  const project = files.find((file) => file.name.toLowerCase().endsWith(".pdfree"));
  if (project) {
    if (files.length !== 1) throw new Error("Open one editing project at a time.");
    return runPdfWorker<EditorDocument>({
      kind: "project-open",
      bytes: new Uint8Array(await project.arrayBuffer()),
    });
  }
  let next = current;
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const imported = await runPdfWorker<Awaited<ReturnType<typeof importPdf>>>(
      file.type.startsWith("image/")
        ? { kind: "image-pdf", bytes, name: file.name, mime: file.type }
        : { kind: "import", bytes, name: file.name }
    );
    next = appendSource(next, imported);
  }
  return next;
}
export function insertImported(document: EditorDocument, existingCount: number, afterId: string) {
  const original = document.pages.slice(0, existingCount),
    added = document.pages.slice(existingCount);
  const index = original.findIndex((page) => page.id === afterId);
  return {
    ...document,
    pages: [...original.slice(0, index + 1), ...added, ...original.slice(index + 1)],
  };
}
