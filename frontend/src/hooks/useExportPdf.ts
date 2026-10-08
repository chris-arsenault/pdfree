import { useEffect, useRef } from "react";
import { useEditor } from "./editorContext";
import { fontData } from "../services/resources";
import { runPdfWorker } from "../services/workerClient";
import { runSecurityWorker } from "../services/securityClient";
import { type PdfSecurity } from "../core/pdfSecurity";
import { type SecuritySettings, hasSecurity, securityCredentials } from "../core/securitySettings";

function clearCertificate(options: PdfSecurity | null) {
  const certificate = options?.signing?.certificate;
  if (certificate?.byteLength) certificate.fill(0);
}

export function useExportPdf(pageIds: string[], flatten: boolean, security: SecuritySettings) {
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
    if (active && !mounted.current)
      throw new DOMException("Signing/protection canceled.", "AbortError");
    const current = active ? new AbortController() : null;
    controller.current = current;
    let options: PdfSecurity | null = null;
    try {
      options = active ? await securityCredentials(security) : null;
      const bytes = await runPdfWorker<Uint8Array>({
        kind: "export",
        document: editor.document,
        flatten,
        pageIds,
        fonts: await fontData(),
      });
      if (!options) return bytes;
      return await runSecurityWorker(bytes, options, current!.signal);
    } finally {
      clearCertificate(options);
      if (controller.current === current) controller.current = null;
    }
  };
}
