import { type PdfSecurity } from "../core/pdfSecurity";
import { type SecurityRequest } from "./securityWorker";
import { type importPdf } from "../core/importPdf";
import { PdfPasswordError, PdfRecipientError, type PdfCredential } from "../core/pdfCredentials";

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
    ? "Opening PDF canceled. Your current document is unchanged."
    : "Signing/protection canceled. No secured PDF was downloaded.";
  if (signal?.aborted) return Promise.reject(new DOMException(canceled, "AbortError"));
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./securityWorker.ts", import.meta.url), { type: "module" });
    const cleanup = () => {
      signal?.removeEventListener("abort", cancel);
      worker.terminate();
    };
    const fail = (message: string) => {
      cleanup();
      reject(new Error(message));
    };
    const cancel = () => {
      cleanup();
      reject(new DOMException(canceled, "AbortError"));
    };
    signal?.addEventListener("abort", cancel, { once: true });
    worker.onmessage = (event: MessageEvent<{ result: T; error: string; code: string | null }>) => {
      if (event.data.code === "PDF_PASSWORD" || event.data.code === "PDF_RECIPIENT") {
        cleanup();
        reject(
          event.data.code === "PDF_PASSWORD"
            ? new PdfPasswordError(event.data.error)
            : new PdfRecipientError(event.data.error)
        );
      } else if (event.data.error) fail(event.data.error);
      else {
        cleanup();
        resolve(event.data.result);
      }
    };
    worker.onerror = () =>
      fail(
        opening
          ? "Opening PDF stopped. Your current document is unchanged; try again."
          : "Signing/protection stopped. Your edits are still available; try again."
      );
    worker.onmessageerror = () =>
      fail(
        opening
          ? "The unlocked PDF could not be received. Try opening it again."
          : "The secured PDF could not be received. Try exporting again."
      );
    try {
      const transfer: Transferable[] = [request.bytes.buffer];
      if (request.kind === "secure" && request.security.signing)
        transfer.push(request.security.signing.certificate.buffer);
      if (request.kind === "import" && typeof request.credential === "object" && request.credential)
        transfer.push(request.credential.bytes.buffer);
      worker.postMessage(request, { transfer });
    } catch {
      fail(
        opening
          ? "The PDF opening worker could not start."
          : "The signing/protection worker could not start."
      );
    }
  });
}
