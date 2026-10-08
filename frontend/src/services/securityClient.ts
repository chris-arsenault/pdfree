import { type PdfSecurity } from "../core/pdfSecurity";

// One export owns one worker. Termination releases its keys, passwords and parsed PDF.
export function runSecurityWorker(
  bytes: Uint8Array,
  security: PdfSecurity,
  signal: AbortSignal | null = null
): Promise<Uint8Array> {
  if (signal?.aborted)
    return Promise.reject(new DOMException("Signing/protection canceled.", "AbortError"));
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
      reject(
        new DOMException(
          "Signing/protection canceled. No secured PDF was downloaded.",
          "AbortError"
        )
      );
    };
    signal?.addEventListener("abort", cancel, { once: true });
    worker.onmessage = (event: MessageEvent<{ result: Uint8Array; error: string }>) => {
      if (event.data.error) fail(event.data.error);
      else {
        cleanup();
        resolve(event.data.result);
      }
    };
    worker.onerror = () =>
      fail("Signing/protection stopped. Your edits are still available; try again.");
    worker.onmessageerror = () =>
      fail("The secured PDF could not be received. Try exporting again.");
    try {
      const transfer: Transferable[] = [bytes.buffer];
      if (security.signing) transfer.push(security.signing.certificate.buffer);
      worker.postMessage({ bytes, security }, { transfer });
    } catch {
      fail("The signing/protection worker could not start.");
    }
  });
}
