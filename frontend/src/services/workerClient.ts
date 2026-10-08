import { newId } from "../core/model";
import { type WorkerRequest } from "./pdfWorker";

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };
let worker: Worker | null = null;
const pending = new Map<string, Pending>();
function getWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("./pdfWorker.ts", import.meta.url), { type: "module" });
  worker.onmessage = (event: MessageEvent<{ id: string; result: unknown; error: string }>) => {
    const task = pending.get(event.data.id);
    if (!task) return;
    pending.delete(event.data.id);
    if (event.data.error) task.reject(new Error(event.data.error));
    else task.resolve(event.data.result);
  };
  worker.onerror = () => {
    pending.forEach((task) =>
      task.reject(
        new Error("The PDF worker stopped. Your current edits are still available; try again.")
      )
    );
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}
type RequestWithoutId<T = WorkerRequest> = T extends unknown ? Omit<T, "id"> : never;
export function runPdfWorker<T>(request: RequestWithoutId): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = newId();
    pending.set(id, { resolve: (result) => resolve(result as T), reject });
    try {
      getWorker().postMessage({ ...request, id });
    } catch (error) {
      pending.delete(id);
      reject(error instanceof Error ? error : new Error("The PDF worker could not start."));
    }
  });
}
