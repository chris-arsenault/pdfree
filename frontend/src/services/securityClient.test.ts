import { expect, it, vi, beforeEach, afterEach } from "vitest";
import { runSecurityWorker, runImportWorker } from "./securityClient";
import { PdfPasswordError } from "../core/unlockPdf";
import { PdfRecipientError } from "../core/pdfCredentials";

class TestWorker {
  static readonly instances: TestWorker[] = [];
  terminate = vi.fn();
  messages: unknown[] = [];
  postMessage(message: unknown) {
    this.messages.push(message);
  }
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  constructor() {
    TestWorker.instances.push(this);
  }
}
beforeEach(() => {
  TestWorker.instances.length = 0;
  vi.stubGlobal("Worker", TestWorker);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const security = () => ({ protection: null, signing: null });
it("does not launch or transfer credentials for an already canceled export", async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(
    runSecurityWorker(new Uint8Array([1]), security(), controller.signal)
  ).rejects.toThrow("canceled");
  expect(TestWorker.instances).toHaveLength(0);
});
it("terminates an active worker and removes its cancellation listener", async () => {
  const controller = new AbortController();
  const remove = vi.spyOn(controller.signal, "removeEventListener");
  const output = runSecurityWorker(new Uint8Array([1]), security(), controller.signal);
  const check = expect(output).rejects.toThrow("No secured PDF was downloaded");
  controller.abort();
  await check;
  expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
  expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
});
it("releases the worker after success and creates a fresh one for each export", async () => {
  const first = runSecurityWorker(new Uint8Array([1]), security());
  const second = runSecurityWorker(new Uint8Array([2]), security());
  TestWorker.instances[1].onmessage?.({ data: { result: new Uint8Array([4]) } } as MessageEvent);
  TestWorker.instances[0].onmessage?.({ data: { result: new Uint8Array([3]) } } as MessageEvent);
  expect(await first).toEqual(new Uint8Array([3]));
  expect(await second).toEqual(new Uint8Array([4]));
  for (const worker of TestWorker.instances) expect(worker.terminate).toHaveBeenCalledOnce();
});
it.each(["onerror", "onmessageerror"] as const)(
  "releases keys on %s and permits a fresh retry",
  async (event) => {
    const output = runSecurityWorker(new Uint8Array([1]), security());
    const check = expect(output).rejects.toThrow(
      /Signing\/protection stopped|could not be received/
    );
    TestWorker.instances[0][event]?.();
    await check;
    expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
    const retry = runSecurityWorker(new Uint8Array([1]), security());
    TestWorker.instances[1].onmessage?.({ data: { result: new Uint8Array([5]) } } as MessageEvent);
    expect(await retry).toEqual(new Uint8Array([5]));
  }
);
it("terminates the worker when signing reports an invalid identity", async () => {
  const output = runSecurityWorker(new Uint8Array([1]), security());
  const check = expect(output).rejects.toThrow("Invalid certificate");
  TestWorker.instances[0].onmessage?.({ data: { error: "Invalid certificate" } } as MessageEvent);
  await check;
  expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
});
it("terminates on a transfer failure instead of retaining credentials", async () => {
  vi.spyOn(TestWorker.prototype, "postMessage").mockImplementationOnce(() => {
    throw new Error("Cannot transfer");
  });
  await expect(runSecurityWorker(new Uint8Array([1]), security())).rejects.toThrow(
    "could not start"
  );
  expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
});
it("preserves the password-required error code across the worker boundary and terminates the worker", async () => {
  const output = runImportWorker(new Uint8Array([1]), "locked.pdf");
  const check = expect(output).rejects.toBeInstanceOf(PdfPasswordError);
  TestWorker.instances[0].onmessage?.({
    data: { error: "Enter PDF password", code: "PDF_PASSWORD" },
  } as MessageEvent);
  await check;
  expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
});
it("cancels an import and releases its password before its result can replace a document", async () => {
  const controller = new AbortController();
  const output = runImportWorker(
    new Uint8Array([1]),
    "locked.pdf",
    "reader-fixture",
    controller.signal
  );
  const check = expect(output).rejects.toThrow("current document is unchanged");
  controller.abort();
  await check;
  expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
});
it("transfers a recipient identity and preserves its retry error without retaining a worker", async () => {
  const bytes = new Uint8Array([1]);
  const identity = new Uint8Array([2]);
  const post = vi.spyOn(TestWorker.prototype, "postMessage");
  const output = runImportWorker(bytes, "recipient.pdf", { bytes: identity, password: "fixture" });
  const check = expect(output).rejects.toBeInstanceOf(PdfRecipientError);
  expect(post).toHaveBeenCalledWith(expect.objectContaining({ kind: "import" }), {
    transfer: [bytes.buffer, identity.buffer],
  });
  TestWorker.instances[0].onmessage?.({
    data: { error: "Choose a matching recipient", code: "PDF_RECIPIENT" },
  } as MessageEvent);
  await check;
  expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
});
