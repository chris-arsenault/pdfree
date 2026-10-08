import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { emptyDocument } from "../core/model";

type Reply = { id: string; result: unknown } | { id: string; error: string };
class TestWorker {
  static readonly instances: TestWorker[] = [];
  messages: { id: string; kind: string }[] = [];
  onmessage: ((event: MessageEvent<Reply>) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();
  constructor() {
    TestWorker.instances.push(this);
  }
  postMessage(message: { id: string; kind: string }) {
    this.messages.push(message);
  }
  reply(reply: Reply) {
    this.onmessage?.({ data: reply } as MessageEvent<Reply>);
  }
}
beforeEach(() => {
  vi.resetModules();
  TestWorker.instances.length = 0;
  vi.stubGlobal("Worker", TestWorker);
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
const request = () => ({ kind: "project-save" as const, document: emptyDocument() });

it("pairs out-of-order worker replies with the correct requests", async () => {
  const { runPdfWorker } = await import("./workerClient");
  const first = runPdfWorker<string>(request()),
    second = runPdfWorker<string>(request()),
    worker = TestWorker.instances[0];
  worker.reply({ id: worker.messages[1].id, result: "second" });
  worker.reply({ id: worker.messages[0].id, result: "first" });
  expect(await first).toBe("first");
  expect(await second).toBe("second");
  expect(TestWorker.instances).toHaveLength(1);
});
it("rejects only the request with a processing error", async () => {
  const { runPdfWorker } = await import("./workerClient"),
    result = runPdfWorker(request());
  const assertion = expect(result).rejects.toThrow("damaged file"),
    worker = TestWorker.instances[0];
  worker.reply({ id: worker.messages[0].id, error: "damaged file" });
  await assertion;
});
it("rejects outstanding work on a crash and recreates the worker for a retry", async () => {
  const { runPdfWorker } = await import("./workerClient");
  const first = runPdfWorker(request()),
    second = runPdfWorker(request());
  const assertions = [
    expect(first).rejects.toThrow("worker stopped"),
    expect(second).rejects.toThrow("worker stopped"),
  ];
  TestWorker.instances[0].onerror?.();
  await Promise.all(assertions);
  expect(TestWorker.instances[0].terminate).toHaveBeenCalledOnce();
  const retry = runPdfWorker<string>(request()),
    worker = TestWorker.instances[1];
  worker.reply({ id: worker.messages[0].id, result: "retried" });
  expect(await retry).toBe("retried");
});
it("surfaces a synchronous message-cloning failure and permits the next request", async () => {
  const { runPdfWorker } = await import("./workerClient");
  vi.spyOn(TestWorker.prototype, "postMessage").mockImplementationOnce(() => {
    throw new DOMException("Cannot clone", "DataCloneError");
  });
  await expect(runPdfWorker(request())).rejects.toThrow("Cannot clone");
  const retry = runPdfWorker<number>(request()),
    worker = TestWorker.instances[0];
  worker.reply({ id: worker.messages[0].id, result: 42 });
  expect(await retry).toBe(42);
});
it("reports worker-construction failures without leaving the editor waiting", async () => {
  vi.stubGlobal(
    "Worker",
    class {
      constructor() {
        throw new Error("Worker blocked");
      }
    }
  );
  const { runPdfWorker } = await import("./workerClient");
  await expect(runPdfWorker(request())).rejects.toThrow("Worker blocked");
});
