import { securePdf } from "../core/securePdf";
import { type PdfSecurity } from "../core/pdfSecurity";
import { importPdf } from "../core/importPdf";
import { PdfPasswordError, PdfRecipientError, type PdfCredential } from "../core/pdfCredentials";

export type SecurityRequest =
  | { kind: "secure"; bytes: Uint8Array; security: PdfSecurity }
  | { kind: "import"; bytes: Uint8Array; name: string; credential: PdfCredential | null };
self.onmessage = async (event: MessageEvent<SecurityRequest>) => {
  const request = event.data;
  try {
    const result =
      request.kind === "import"
        ? await importPdf(request.bytes, request.name, request.credential ?? undefined)
        : await securePdf(request.bytes, request.security);
    self.postMessage({ result }, { transfer: result instanceof Uint8Array ? [result.buffer] : [] });
  } catch (error) {
    self.postMessage({
      error: error instanceof Error ? error.message : "PDF security export failed.",
      code: credentialErrorCode(error),
    });
  } finally {
    eraseIdentity(request);
    self.close();
  }
};
function credentialErrorCode(error: unknown) {
  return error instanceof PdfPasswordError || error instanceof PdfRecipientError
    ? error.code
    : null;
}
function eraseIdentity(request: SecurityRequest) {
  if (request.kind === "secure") request.security.signing?.certificate.fill(0);
  else if (typeof request.credential === "object") request.credential?.bytes.fill(0);
}
