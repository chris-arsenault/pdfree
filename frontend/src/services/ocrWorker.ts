import { createWorker, OEM, PSM, type Block } from "tesseract.js";
let engine: Awaited<ReturnType<typeof createWorker>> | null = null;
self.onmessage = async (event: MessageEvent<{ id: string; base?: string; image?: Blob }>) => {
  const { id, base, image } = event.data;
  try {
    if (base) {
      engine = await createWorker("eng", OEM.LSTM_ONLY, {
        workerPath: `${base}/worker.min.js`,
        corePath: `${base}/core`,
        langPath: `${base}/lang`,
        workerBlobURL: false,
        logger: (message) =>
          self.postMessage({
            id,
            progress: `${message.status} · ${Math.round(message.progress * 100)}%`,
          }),
        errorHandler: (error) =>
          self.postMessage({ id, error: error instanceof Error ? error.message : String(error) }),
      });
      await engine.setParameters({ tessedit_pageseg_mode: PSM.AUTO, user_defined_dpi: "216" });
      self.postMessage({ id, blocks: [] });
    } else if (image && engine) {
      const result = await engine.recognize(image, {}, { blocks: true });
      self.postMessage({ id, blocks: result.data.blocks ?? ([] as Block[]) });
    } else throw new Error("Recognition engine is not ready.");
  } catch (error) {
    self.postMessage({ id, error: error instanceof Error ? error.message : "Recognition failed." });
  }
};
