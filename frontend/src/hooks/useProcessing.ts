import { useEffect, useRef, useState } from "react";
export function useProcessing() {
  const [status, setStatus] = useState({ busy: false, message: "", error: "" });
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
    work: (signal: AbortSignal, progress: (message: string) => void) => Promise<T>,
    accept: (result: T) => void
  ) => {
    if (controller.current) return;
    const current = new AbortController();
    controller.current = current;
    setStatus({ busy: true, message: "Preparing…", error: "" });
    try {
      const result = await work(current.signal, (message) => {
        if (mounted.current) setStatus({ busy: true, message, error: "" });
      });
      if (!current.signal.aborted && mounted.current) {
        accept(result);
        setStatus({ busy: false, message: "", error: "" });
      }
    } catch (error) {
      if (mounted.current)
        setStatus({
          busy: false,
          message: "",
          error: processingError(error, current.signal),
        });
    } finally {
      if (controller.current === current) controller.current = null;
    }
  };
  return { ...status, run, cancel };
}
function processingError(error: unknown, signal: AbortSignal) {
  if (signal.aborted) return "Canceled. Your document is unchanged.";
  return error instanceof Error ? error.message : "Processing failed.";
}
