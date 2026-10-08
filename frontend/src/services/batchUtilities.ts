import { zipSync } from "fflate";
import { emptyDocument, type PageRule } from "../core/model";
import { type CompressionOptions, type CompressionResult } from "../core/compressPdf";
import { openFiles } from "./openFiles";
import { fontData } from "./resources";
import { runProcessingWorker } from "./workerClient";
import { recognizePages } from "./ocr";
import { releaseSources } from "./viewer";
import { type FontData } from "../core/drawObjects";
import { ruleSchema } from "../core/utilityModel";
export type BatchOptions = {
  operation: "rule" | "ocr" | "compress";
  rule: PageRule;
  continuing: boolean;
  compression: CompressionOptions;
};
export type BatchOutput = { name: string; bytes: Uint8Array | null; error: string };
export async function batchUtilities(
  files: File[],
  options: BatchOptions,
  signal: AbortSignal,
  progress: (message: string) => void,
  output: (result: BatchOutput) => void
) {
  const names = new Set<string>();
  if (options.operation === "rule") ruleSchema.parse(options.rule);
  let start = options.rule.start,
    total = 0;
  const fonts = await fontData();
  for (const [index, file] of files.entries()) {
    if (signal.aborted) throw new DOMException("Batch canceled.", "AbortError");
    progress(`File ${index + 1} of ${files.length} · ${file.name}`);
    const name = outputName(file.name, names);
    try {
      const { bytes, pageCount } = await processFile(file, options, start, fonts, signal, progress);
      if (total + bytes.length > 128 * 1024 * 1024)
        throw new Error("Batch output exceeds 128 MB. Process fewer files together.");
      total += bytes.length;
      if (continuesNumbering(options)) start += pageCount;
      output({ name, bytes, error: "" });
    } catch (error) {
      if (signal.aborted) throw new DOMException("Batch canceled.", "AbortError");
      output({
        name,
        bytes: null,
        error: batchError(error),
      });
    }
  }
}
function batchError(error: unknown) {
  return error instanceof Error ? error.message : "This file could not be processed.";
}
function continuesNumbering(options: BatchOptions) {
  return options.operation === "rule" && options.continuing && options.rule.kind === "number";
}
function outputName(filename: string, names: Set<string>) {
  const base =
    [...filename.replace(/\.pdf$/i, "")]
      .map((character) =>
        character.charCodeAt(0) < 32 || ["/", "\\"].includes(character) ? "_" : character
      )
      .join("") || "Document";
  let name = `${base}-processed.pdf`,
    suffix = 2;
  while (names.has(name.toLocaleLowerCase())) name = `${base}-processed-${suffix++}.pdf`;
  names.add(name.toLocaleLowerCase());
  return name;
}
async function processFile(
  file: File,
  options: BatchOptions,
  start: number,
  fonts: FontData,
  signal: AbortSignal,
  progress: (message: string) => void
) {
  let document = await openFiles([file], emptyDocument(), undefined, signal);
  try {
    if (options.operation === "rule")
      document = { ...document, rules: [{ ...options.rule, pageIds: [], start }] };
    if (options.operation === "ocr")
      document = (
        await recognizePages(
          document,
          document.pages.map((page) => page.id),
          signal,
          progress
        )
      ).document;
    let bytes = await runProcessingWorker<Uint8Array>(
      { kind: "export", document, flatten: false, pageIds: [], fonts },
      signal,
      progress
    );
    if (options.operation === "compress")
      bytes = (
        await runProcessingWorker<CompressionResult>(
          { kind: "compress", bytes, options: options.compression },
          signal,
          progress
        )
      ).bytes;
    return { bytes, pageCount: document.pages.length };
  } finally {
    releaseSources(document.sources.map((source) => source.id));
  }
}
export function batchArchive(outputs: BatchOutput[]) {
  const files: Record<string, Uint8Array> = {};
  for (const output of outputs) if (output.bytes) files[output.name] = output.bytes;
  if (!Object.keys(files).length) throw new Error("No successful outputs to download.");
  return zipSync(files, { level: 0 });
}
