import { newId } from "../core/model";
import { type WorkerRequest } from "./pdfWorker";
import {
  isMessage,
  MessageError,
  message,
  failure,
  AbortMessageError,
  type UiMessage,
} from "../i18n/messages";

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };
let cachedWorker: Worker | null = null;
const pending = new Map<string, Pending>();
function createWorker() {
  return new Worker(new URL("./pdfWorker.ts", import.meta.url), { type: "module" });
}
function getWorker() {
  if (cachedWorker) return cachedWorker;
  const worker = createWorker();
  cachedWorker = worker;
  worker.onmessage = (event: MessageEvent<{ id: string; result?: unknown; ui?: unknown }>) => {
    const task = pending.get(event.data.id);
    if (!task || cachedWorker !== worker) return;
    if ("progress" in event.data) return;
    pending.delete(event.data.id);
    if (isMessage(event.data.ui)) task.reject(new MessageError(event.data.ui));
    else if (!("result" in event.data)) task.reject(failure("errors.processing"));
    else task.resolve(event.data.result);
  };
  const stopped = () => {
    if (cachedWorker !== worker) return;
    pending.forEach((task) => task.reject(failure("errors.workerStopped")));
    pending.clear();
    worker.terminate();
    cachedWorker = null;
  };
  worker.onerror = stopped;
  worker.onmessageerror = stopped;
  return worker;
}

// Long operations own a disposable worker, so cancellation cannot interrupt
// another document's rendering or an unrelated export.
export function runProcessingWorker<T>(
  request: RequestWithoutId,
  signal: AbortSignal,
  progress: (ui: UiMessage) => void = () => {}
) {
  return new Promise<T>((resolve, reject) => {
    if (signal.aborted) {
      reject(new AbortMessageError());
      return;
    }
    const worker = createWorker();
    const finish = () => {
      signal.removeEventListener("abort", abort);
      worker.terminate();
    };
    const abort = () => {
      finish();
      reject(new AbortMessageError());
    };
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event: MessageEvent<{ result?: T; progress?: unknown; ui?: unknown }>) => {
      if (event.data.progress) {
        progress(
          isMessage(event.data.progress) ? event.data.progress : message("errors.processing")
        );
        return;
      }
      finish();
      if (isMessage(event.data.ui)) reject(new MessageError(event.data.ui));
      else if (!("result" in event.data)) reject(failure("errors.processing"));
      else resolve(event.data.result as T);
    };
    const stopped = () => {
      finish();
      reject(failure("errors.processing"));
    };
    worker.onerror = stopped;
    worker.onmessageerror = stopped;
    try {
      worker.postMessage({ ...request, id: newId() });
    } catch {
      finish();
      reject(failure("errors.workerStart"));
    }
  });
}
type RequestWithoutId<T = WorkerRequest> = T extends unknown ? Omit<T, "id"> : never;
export function runPdfWorker<T>(request: RequestWithoutId): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = newId();
    try {
      const worker = getWorker();
      pending.set(id, { resolve: (result) => resolve(result as T), reject });
      worker.postMessage({ ...request, id });
    } catch {
      pending.delete(id);
      reject(failure("errors.workerStart"));
    }
  });
}
