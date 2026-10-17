import { type PdfSecurity } from "../core/pdfSecurity";
import { type SecurityRequest } from "./securityProtocol";
import { type importPdf } from "../core/importPdf";
import { PdfPasswordError, PdfRecipientError, type PdfCredential } from "../core/pdfCredentials";
import {
  message,
  MessageError,
  isMessage,
  AbortMessageError,
  type UiMessage,
} from "../i18n/messages";

// One import/export owns one worker. Termination releases credentials and parsed PDFs.
export function runSecurityWorker(
  bytes: Uint8Array,
  security: PdfSecurity,
  signal: AbortSignal | null = null
): Promise<Uint8Array> {
  return runSecurityOperation({ kind: "secure", bytes, security }, signal);
}

export function runImportWorker(
  bytes: Uint8Array,
  name: string,
  credential?: PdfCredential,
  signal: AbortSignal | null = null
) {
  return runSecurityOperation<Awaited<ReturnType<typeof importPdf>>>(
    { kind: "import", bytes, name, credential: credential ?? null },
    signal
  );
}

function runSecurityOperation<T>(request: SecurityRequest, signal: AbortSignal | null): Promise<T> {
  const opening = request.kind === "import";
  const canceled = opening
    ? message("security.importCanceled")
    : message("security.exportCanceled");
  if (signal?.aborted) return Promise.reject(new AbortMessageError(canceled));
  return new Promise((resolve, reject) => {
    const worker = opening
      ? new Worker(new URL("./importWorker.ts", import.meta.url), { type: "module" })
      : new Worker(new URL("./securityWorker.ts", import.meta.url), { type: "module" });
    const cleanup = () => {
      signal?.removeEventListener("abort", cancel);
      worker.terminate();
    };
    const fail = (ui: UiMessage) => {
      cleanup();
      reject(new MessageError(ui));
    };
    const cancel = () => {
      cleanup();
      reject(new AbortMessageError(canceled));
    };
    signal?.addEventListener("abort", cancel, { once: true });
    worker.onmessage = (event: MessageEvent<{ result?: T; ui?: unknown; code: string | null }>) => {
      if (event.data.code === "PDF_PASSWORD" || event.data.code === "PDF_RECIPIENT") {
        cleanup();
        const fallback =
          event.data.code === "PDF_PASSWORD"
            ? message("password.openRequired")
            : message("errors.recipientIdentityRequired");
        const ui = isMessage(event.data.ui) ? event.data.ui : fallback;
        reject(
          event.data.code === "PDF_PASSWORD" ? new PdfPasswordError(ui) : new PdfRecipientError(ui)
        );
      } else if (isMessage(event.data.ui)) fail(event.data.ui);
      else if (!("result" in event.data))
        fail(message(opening ? "errors.opening" : "errors.security"));
      else {
        cleanup();
        resolve(event.data.result as T);
      }
    };
    worker.onerror = () =>
      fail(opening ? message("security.importStopped") : message("security.exportStopped"));
    worker.onmessageerror = () =>
      fail(opening ? message("security.importReceive") : message("security.exportReceive"));
    try {
      const transfer: Transferable[] = [request.bytes.buffer];
      if (request.kind === "secure" && request.security.signing)
        transfer.push(request.security.signing.certificate.buffer);
      if (request.kind === "import" && typeof request.credential === "object" && request.credential)
        transfer.push(request.credential.bytes.buffer);
      worker.postMessage(request, { transfer });
    } catch {
      fail(opening ? message("security.importStart") : message("security.exportStart"));
    }
  });
}
