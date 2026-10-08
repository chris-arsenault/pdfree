import { useEffect, useRef, useState } from "react";
import { type PdfCredential } from "../core/pdfCredentials";

export function usePdfPassword() {
  const [request, setRequest] = useState<{
    name: string;
    message: string;
    kind: "password" | "recipient";
  } | null>(null);
  const pending = useRef<((credential: PdfCredential | null) => void) | null>(null);
  const controller = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      controller.current?.abort();
      pending.current?.(null);
    },
    []
  );
  const ask = (name: string, message: string, kind: "password" | "recipient") =>
    new Promise<PdfCredential | null>((resolve) => {
      pending.current = resolve;
      setRequest({ name, message, kind });
    });
  const answer = (credential: PdfCredential | null) => {
    if (credential === null) controller.current?.abort();
    pending.current?.(credential);
    pending.current = null;
    setRequest(null);
  };
  const begin = () => {
    const active = new AbortController();
    controller.current = active;
    return active.signal;
  };
  const cancel = () => answer(null);
  return { request, ask, answer, begin, cancel };
}
