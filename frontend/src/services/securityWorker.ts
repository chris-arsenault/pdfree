import { securePdf } from "../core/securePdf";
import { type PdfSecurity } from "../core/pdfSecurity";

export type SecurityRequest = { bytes: Uint8Array; security: PdfSecurity };
self.onmessage = async (event: MessageEvent<SecurityRequest>) => {
  const { bytes, security } = event.data;
  try {
    const result = await securePdf(bytes, security);
    self.postMessage({ result }, { transfer: [result.buffer] });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "PDF security export failed.",
    });
  } finally {
    security.signing?.certificate.fill(0);
    self.close();
  }
};
