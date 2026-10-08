import { useEffect, useRef } from "react";
import { useEditor } from "./editorContext";
import { fontData } from "../services/resources";
import { runPdfWorker } from "../services/workerClient";
import { runSecurityWorker } from "../services/securityClient";
import { type PdfSecurity } from "../core/pdfSecurity";
import { type SecuritySettings, hasSecurity, securityCredentials } from "../core/securitySettings";
import { type CompressionOptions, type CompressionResult } from "../core/compressPdf";
import { runProcessingWorker } from "../services/workerClient";
import { type NupOptions } from "../core/nupPdf";

export type ExportProcessing = { compression?: CompressionOptions; nup?: NupOptions };

function clearCertificate(options: PdfSecurity | null) {
  const certificate = options?.signing?.certificate;
  if (certificate?.byteLength) certificate.fill(0);
}

export function useExportPdf(
  pageIds: string[],
  flatten: boolean,
  security: SecuritySettings,
  processing: ExportProcessing = {}
) {
  const editor = useEditor();
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  return async (secured = true) => {
    const active = secured && hasSecurity(security);
    if (!mounted.current) throw new DOMException("Signing/protection canceled.", "AbortError");
    const current = new AbortController();
    controller.current = current;
    let options: PdfSecurity | null = null;
    try {
      options = active ? await securityCredentials(security) : null;
      let bytes = await runPdfWorker<Uint8Array>({
        kind: "export",
        document: editor.document,
        flatten: flatten || isNup(processing),
        pageIds,
        fonts: await fontData(),
      });
      if (current.signal.aborted) throw new DOMException("Export canceled.", "AbortError");
      bytes = await processExport(bytes, processing, current.signal);
      if (!options) return bytes;
      return await runSecurityWorker(bytes, options, current!.signal);
    } finally {
      clearCertificate(options);
      if (controller.current === current) controller.current = null;
    }
  };
}
function isNup(processing: ExportProcessing) {
  return !!processing.nup && processing.nup.count !== 1;
}
async function processExport(bytes: Uint8Array, processing: ExportProcessing, signal: AbortSignal) {
  if (processing.compression && processing.compression.preset !== "original") {
    const result = await runProcessingWorker<CompressionResult>(
      { kind: "compress", bytes, options: processing.compression },
      signal
    );
    bytes = result.bytes;
  }
  if (isNup(processing))
    bytes = await runProcessingWorker<Uint8Array>(
      { kind: "nup", bytes, options: processing.nup! },
      signal
    );
  return bytes;
}
