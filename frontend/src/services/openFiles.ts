import { type EditorDocument } from "../core/model";
import { appendSource, type importPdf } from "../core/importPdf";
import { runPdfWorker } from "./workerClient";
import { runImportWorker } from "./securityClient";
import { PdfPasswordError, PdfRecipientError, type PdfCredential } from "../core/pdfCredentials";
export type PasswordPrompt = (
  name: string,
  message: string,
  kind: "password" | "recipient"
) => Promise<PdfCredential | null>;
export async function openFiles(
  files: File[],
  current: EditorDocument,
  prompt?: PasswordPrompt,
  signal: AbortSignal | null = null
) {
  const project = files.find((file) => file.name.toLowerCase().endsWith(".pdfree"));
  if (project) {
    if (files.length !== 1) throw new Error("Open one editing project at a time.");
    const opened = await runPdfWorker<EditorDocument>({
      kind: "project-open",
      bytes: new Uint8Array(await project.arrayBuffer()),
    });
    if (signal?.aborted) throw new DOMException("Opening PDF canceled.", "AbortError");
    return opened;
  }
  let next = current;
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const imported = file.type.startsWith("image/")
      ? await runPdfWorker<Awaited<ReturnType<typeof importPdf>>>({
          kind: "image-pdf",
          bytes,
          name: file.name,
          mime: file.type,
        })
      : await importWithPassword(bytes, file.name, prompt, signal);
    if (signal?.aborted) throw new DOMException("Opening PDF canceled.", "AbortError");
    next = appendSource(next, imported);
  }
  return next;
}
async function importWithPassword(
  bytes: Uint8Array,
  name: string,
  prompt: PasswordPrompt | undefined,
  signal: AbortSignal | null
) {
  let credential: PdfCredential | undefined;
  for (;;) {
    try {
      return await runImportWorker(bytes.slice(), name, credential, signal);
    } catch (error) {
      if (
        (!(error instanceof PdfPasswordError) && !(error instanceof PdfRecipientError)) ||
        !prompt
      )
        throw error;
      const answer = await prompt(
        name,
        error.message,
        error instanceof PdfRecipientError ? "recipient" : "password"
      );
      if (answer === null || signal?.aborted)
        throw new DOMException(
          "Opening PDF canceled. Your current document is unchanged.",
          "AbortError"
        );
      credential = answer;
    }
  }
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
