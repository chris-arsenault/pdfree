import { type importPdf } from "../core/importPdf";
import { PdfPasswordError, PdfRecipientError } from "../core/pdfCredentials";
import { errorMessage, message } from "../i18n/messages";
import { type SecurityRequest } from "./securityProtocol";
type Result = Uint8Array | Awaited<ReturnType<typeof importPdf>>;

export async function completeCredentialOperation(
  request: SecurityRequest,
  work: () => Promise<Result>
) {
  try {
    const result = await work();
    const buffers =
      result instanceof Uint8Array
        ? [result.buffer]
        : [
            result.source.bytes.buffer,
            ...(result.source.decryptedBytes ? [result.source.decryptedBytes.buffer] : []),
          ];
    self.postMessage({ result }, { transfer: [...new Set(buffers)] });
  } catch (error) {
    self.postMessage({
      ui: errorMessage(error, message("errors.security")),
      code:
        error instanceof PdfPasswordError || error instanceof PdfRecipientError ? error.code : null,
    });
  } finally {
    if (request.kind === "secure") request.security.signing?.certificate.fill(0);
    else if (typeof request.credential === "object") request.credential?.bytes.fill(0);
    self.close();
  }
}
