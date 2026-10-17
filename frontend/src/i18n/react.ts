import { useTranslation } from "react-i18next";
import { useState } from "react";
import { i18n, text, renderMessage } from "./runtime";
import { type UiMessage } from "./messages";

export function useMessages() {
  useTranslation(undefined, { i18n });
  return { text, renderMessage };
}
/** Retain semantic state; resolve its copy for the component's current render. */
export function useMessageState(initial: UiMessage | null = null) {
  useMessages();
  const [ui, setUi] = useState<UiMessage | null>(initial);
  return [ui ? renderMessage(ui) : "", setUi, ui] as const;
}
