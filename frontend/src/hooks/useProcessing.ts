import { useEffect, useRef, useState } from "react";
import { message, errorMessage, type UiMessage } from "../i18n/messages";
import { useMessages } from "../i18n/react";
const idle = { busy: false, message: null, error: null };
type ProcessingStatus = { busy: boolean; message: UiMessage | null; error: UiMessage | null };
export function useProcessing() {
  const { renderMessage } = useMessages();
  const [status, setStatus] = useState<ProcessingStatus>(idle);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
    };
  }, []);
  const cancel = () => controller.current?.abort();
  const run = async <T>(
    work: (signal: AbortSignal, progress: (ui: UiMessage) => void) => Promise<T>,
    accept: (result: T) => void
  ) => {
    if (controller.current) return;
    const current = new AbortController();
    controller.current = current;
    setStatus({ busy: true, message: message("progress.preparing"), error: null });
    try {
      const result = await work(current.signal, (message) => {
        if (mounted.current) setStatus({ busy: true, message, error: null });
      });
      if (!current.signal.aborted && mounted.current) {
        accept(result);
        setStatus(idle);
      }
    } catch (error) {
      if (mounted.current)
        setStatus({
          busy: false,
          message: null,
          error: processingError(error, current.signal),
        });
    } finally {
      if (controller.current === current) controller.current = null;
    }
  };
  return {
    ...status,
    message: status.message ? renderMessage(status.message) : "",
    error: status.error ? renderMessage(status.error) : "",
    run,
    cancel,
  };
}
function processingError(error: unknown, signal: AbortSignal) {
  if (signal.aborted) return message("errors.canceled");
  return errorMessage(error, message("errors.processing"));
}
