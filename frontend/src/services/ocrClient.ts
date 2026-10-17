import {
  failure,
  message,
  isMessage,
  MessageError,
  AbortMessageError,
  type UiMessage,
} from "../i18n/messages";
import { type Block } from "tesseract.js";
import { newId } from "../core/model";
export async function recognitionEngine(signal: AbortSignal, progress: (ui: UiMessage) => void) {
  if (signal.aborted) throw new AbortMessageError();
  // Terminating this owner also terminates its child Tesseract worker, including
  // cancellation while engine or language initialization is still pending.
  const worker = new Worker(new URL("./ocrWorker.ts", import.meta.url), { type: "module" });
  const pending = new Map<
    string,
    { resolve: (blocks: Block[]) => void; reject: (error: Error) => void }
  >();
  const terminate = () => {
    signal.removeEventListener("abort", abort);
    worker.terminate();
    pending.forEach((task) => task.reject(new AbortMessageError()));
    pending.clear();
  };
  const abort = () => terminate();
  signal.addEventListener("abort", abort, { once: true });
  worker.onerror = () => {
    pending.forEach((task) => task.reject(failure("errors.recognitionWorker")));
    pending.clear();
    terminate();
  };
  worker.onmessage = (
    event: MessageEvent<{ id: string; blocks?: Block[]; progress?: unknown; ui?: unknown }>
  ) => {
    if (event.data.progress) {
      progress(isMessage(event.data.progress) ? event.data.progress : message("progress.ocrReady"));
      return;
    }
    const task = pending.get(event.data.id);
    if (!task) return;
    pending.delete(event.data.id);
    if ("ui" in event.data)
      task.reject(
        new MessageError(isMessage(event.data.ui) ? event.data.ui : message("errors.recognition"))
      );
    else task.resolve(event.data.blocks ?? []);
  };
  const request = (message: { base?: string; image?: Blob }) =>
    new Promise<Block[]>((resolve, reject) => {
      if (signal.aborted) {
        reject(new AbortMessageError());
        return;
      }
      const id = newId();
      pending.set(id, { resolve, reject });
      try {
        worker.postMessage({ ...message, id });
      } catch (error) {
        pending.delete(id);
        reject(error);
      }
    });
  try {
    await request({ base: new URL(`${import.meta.env.BASE_URL}ocr`, window.location.href).href });
  } catch (error) {
    terminate();
    throw error;
  }
  return { recognize: (image: Blob) => request({ image }), terminate };
}
