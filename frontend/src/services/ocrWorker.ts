import { createWorker, OEM, PSM, type Block } from "tesseract.js";
import { message, errorMessage, failure } from "../i18n/messages";
const phases = {
  "loading tesseract core": "progress.ocrEngine",
  "initializing tesseract": "progress.ocrInitialize",
  "initialized tesseract": "progress.ocrReady",
  "loading language traineddata": "progress.ocrLanguage",
  "initializing api": "progress.ocrReady",
  "recognizing text": "progress.ocrText",
} as const;
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
        logger: (event) =>
          self.postMessage({
            id,
            progress: message("progress.ocrPhase", {
              phase: [
                message(
                  Object.hasOwn(phases, event.status)
                    ? phases[event.status as keyof typeof phases]
                    : "progress.ocrReady"
                ),
              ],
              percent: Math.round(Math.max(0, Math.min(1, event.progress)) * 100),
            }),
          }),
        errorHandler: () => self.postMessage({ id, ui: message("errors.recognition") }),
      });
      await engine.setParameters({ tessedit_pageseg_mode: PSM.AUTO, user_defined_dpi: "216" });
      self.postMessage({ id, blocks: [] });
    } else if (image && engine) {
      const result = await engine.recognize(image, {}, { blocks: true });
      self.postMessage({ id, blocks: result.data.blocks ?? ([] as Block[]) });
    } else throw failure("errors.recognitionNotReady");
  } catch (error) {
    self.postMessage({ id, ui: errorMessage(error, message("errors.recognition")) });
  }
};
