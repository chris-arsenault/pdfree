import { type SecurityRequest } from "./securityProtocol";
type ImportRequest = Extract<SecurityRequest, { kind: "import" }>;
self.onmessage = async (event: MessageEvent<ImportRequest>) => {
  const request = event.data;
  const [{ importPdf }, { completeCredentialOperation }] = await Promise.all([
    import("../core/importPdf"),
    import("./credentialWorker"),
  ]);
  return completeCredentialOperation(request, () =>
    importPdf(request.bytes, request.name, request.credential ?? undefined)
  );
};
