import {
  failure,
  message,
  errorMessage,
  AbortMessageError,
  type UiMessage,
  english,
} from "../i18n/messages";
import { zipSync } from "fflate";
import { emptyDocument, type PageRule } from "../core/model";
import { type CompressionOptions, type CompressionResult } from "../core/compressPdf";
import { openFiles } from "./openFiles";
import { fontData, documentFontOptions } from "./resources";
import { runProcessingWorker } from "./workerClient";
import { recognizePages } from "./ocr";
import { releaseSources } from "./viewer";
import { ruleSchema } from "../core/utilityModel";
export type BatchOptions = {
  operation: "rule" | "ocr" | "compress";
  rule: PageRule;
  continuing: boolean;
  compression: CompressionOptions;
};
export type BatchOutput = { name: string; bytes: Uint8Array | null; error: UiMessage | null };
export async function batchUtilities(
  files: File[],
  options: BatchOptions,
  signal: AbortSignal,
  progress: (ui: UiMessage) => void,
  output: (result: BatchOutput) => void
) {
  const names = new Set<string>();
  if (options.operation === "rule") ruleSchema.parse(options.rule);
  let start = options.rule.start,
    total = 0;
  for (const [index, file] of files.entries()) {
    if (signal.aborted) throw new AbortMessageError();
    progress(message("progress.file", { index: index + 1, count: files.length, name: file.name }));
    const name = outputName(file.name, names);
    try {
      const { bytes, pageCount } = await processFile(file, options, start, signal, progress);
      if (total + bytes.length > 128 * 1024 * 1024) throw failure("errors.batchSize");
      total += bytes.length;
      if (continuesNumbering(options)) start += pageCount;
      output({ name, bytes, error: null });
    } catch (error) {
      if (signal.aborted) throw new AbortMessageError();
      output({
        name,
        bytes: null,
        error: batchError(error),
      });
    }
  }
}
function batchError(error: unknown) {
  return errorMessage(error, message("errors.processing"));
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
      .join("") || english(message("defaults.document"));
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
  signal: AbortSignal,
  progress: (ui: UiMessage) => void
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
      {
        kind: "export",
        document,
        flatten: false,
        pageIds: [],
        fonts: await fontData(documentFontOptions(document)),
      },
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
  if (!Object.keys(files).length) throw failure("errors.batchEmpty");
  return zipSync(files, { level: 0 });
}
