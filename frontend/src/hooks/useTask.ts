import { useCallback, useState, useRef } from "react";
import { errorMessage, type UiMessage } from "../i18n/messages";
import { useMessages } from "../i18n/react";
type TaskStatus = {
  busy: UiMessage | null;
  message: UiMessage | null;
  error: UiMessage | null;
  canceled: boolean;
};
const idle: TaskStatus = { busy: null, message: null, error: null, canceled: false };
export function useTask() {
  const { renderMessage } = useMessages();
  const [status, setStatus] = useState<TaskStatus>(idle);
  const running = useRef(false);
  const run = useCallback(async (label: UiMessage, work: () => Promise<void> | void) => {
    if (running.current) return;
    running.current = true;
    setStatus({ ...idle, busy: label });
    try {
      await work();
      setStatus(idle);
    } catch (error) {
      setStatus({
        ...idle,
        error: errorMessage(error),
        canceled:
          error instanceof Error || error instanceof DOMException
            ? error.name === "AbortError"
            : false,
      });
    } finally {
      running.current = false;
    }
  }, []);
  const notify = useCallback((ui: UiMessage) => setStatus({ ...idle, message: ui }), []);
  const dismiss = useCallback(() => setStatus(idle), []);
  return {
    busy: status.busy ? renderMessage(status.busy) : "",
    kind: status.busy?.key ?? null,
    message: status.message ? renderMessage(status.message) : "",
    error: status.error ? renderMessage(status.error) : "",
    canceled: status.canceled,
    run,
    notify,
    dismiss,
  };
}
