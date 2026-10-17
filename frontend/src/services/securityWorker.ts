import { securePdf } from "../core/securePdf";
import { completeCredentialOperation } from "./credentialWorker";
import { type SecurityRequest } from "./securityProtocol";
export type { SecurityRequest } from "./securityProtocol";
self.onmessage = (event: MessageEvent<SecurityRequest>) => {
  const request = event.data;
  return completeCredentialOperation(request, async () => {
    if (request.kind === "secure") return securePdf(request.bytes, request.security);
    // Preserve the old direct worker protocol; normal imports use importWorker.
    const { importPdf } = await import("../core/importPdf");
    return importPdf(request.bytes, request.name, request.credential ?? undefined);
  });
};
