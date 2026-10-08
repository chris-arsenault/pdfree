import { useCallback, useEffect, useRef, useState } from "react";

export interface Confirmation {
  title: string;
  message: string;
  confirmLabel: string;
  tone: "primary" | "danger";
}

export function useConfirmation(busy: boolean) {
  const [request, setRequest] = useState<Confirmation | null>(null);
  const pending = useRef<((confirmed: boolean) => void) | null>(null);
  const trigger = useRef<HTMLElement | null>(null);
  const ask = useCallback((next: Confirmation) => {
    // A second action must not replace a decision the user is already making.
    if (pending.current) return Promise.resolve(false);
    trigger.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return new Promise<boolean>((resolve) => {
      pending.current = resolve;
      setRequest(next);
    });
  }, []);
  const answer = useCallback((confirmed: boolean) => {
    const resolve = pending.current;
    if (!resolve) return;
    pending.current = null;
    setRequest(null);
    resolve(confirmed);
  }, []);
  useEffect(() => {
    if (request || busy) return;
    // Wait for the task's rendered state to remove inert/disabled before restoring focus.
    const element = trigger.current;
    trigger.current = null;
    const active = document.activeElement;
    if (
      element?.isConnected &&
      (active === document.body || active?.closest("dialog") === element.closest("dialog"))
    )
      element.focus();
  }, [request, busy]);
  useEffect(
    () => () => {
      pending.current?.(false);
      pending.current = null;
      trigger.current = null;
    },
    []
  );
  return { request, ask, answer };
}
