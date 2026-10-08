import { useCallback, useState, useRef } from "react";
export function useTask() {
  const [status, setStatus] = useState({ busy: "", message: "", error: "" });
  const running = useRef(false);
  const run = useCallback(async (label: string, work: () => Promise<void> | void) => {
    if (running.current) return;
    running.current = true;
    setStatus({ busy: label, message: "", error: "" });
    try {
      await work();
      setStatus({ busy: "", message: "", error: "" });
    } catch (error) {
      setStatus({
        busy: "",
        message: "",
        error: error instanceof Error ? error.message : "The operation failed.",
      });
    } finally {
      running.current = false;
    }
  }, []);
  const notify = useCallback((message: string) => setStatus({ busy: "", message, error: "" }), []);
  const dismiss = useCallback(() => setStatus({ busy: "", message: "", error: "" }), []);
  return { ...status, run, notify, dismiss };
}
