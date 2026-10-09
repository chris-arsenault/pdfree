import { hasEncryptedSources, type EditorDocument } from "../core/model";

const key = "pdfree-settings-v1:disable-protected-autosave";
const changed = "pdfree-settings-changed";
let lastKnownValue = false;

export function protectedAutosaveDisabled() {
  try {
    lastKnownValue = localStorage.getItem(key) === "true";
  } catch {
    // Keep the last observed choice if browser storage becomes unavailable.
  }
  return lastKnownValue;
}

export function setProtectedAutosaveDisabled(disabled: boolean) {
  try {
    localStorage.setItem(key, String(disabled));
  } catch {
    throw new Error("This browser could not save the setting. Your previous choice is unchanged.");
  }
  lastKnownValue = disabled;
  window.dispatchEvent(new Event(changed));
}

export function subscribeSettings(notify: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) notify();
  };
  window.addEventListener(changed, notify);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(changed, notify);
    window.removeEventListener("storage", storage);
  };
}

export const canSaveDraft = (document: EditorDocument) =>
  !protectedAutosaveDisabled() || !hasEncryptedSources(document);
