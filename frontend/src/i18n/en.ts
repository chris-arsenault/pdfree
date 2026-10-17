import { errors } from "./enErrors";
import { ui } from "./enUi";
import { more } from "./enMore";
import { dynamic } from "./enDynamic";

export const en = {
  ...errors,
  ...ui,
  ...more,
  ...dynamic,
  "defaults.textObject": "Text object",
  "defaults.object": "object",
  "defaults.document": "document",
  "defaults.untitled": "Untitled.pdf",
  "defaults.stamp": "APPROVED",
  "language.title": "Language",
  "language.choose": "Choose language (current: {{language}})",
  "language.loading": "Loading language…",
  "language.loadFailed": "The language could not load. Your current language is unchanged.",
  "language.saveFailed":
    "Language changed for this page, but this browser could not save your preference.",
  "common.cancel": "Cancel",
  "common.retry": "Retry",
  "common.close": "Close",
  "common.open": "Open",
  "common.save": "Save",
  "common.delete": "Delete",
  "common.remove": "Remove",
  "common.apply": "Apply",
  "common.reset": "Reset",
  "common.none": "None",
  "common.all": "All",
  "common.current": "Current",
  "common.selected": "Selected",
  "common.name": "Name",
  "common.pages": "{{count}} pages",
  "common.pages_one": "{{count}} page",
  "common.pages_other": "{{count}} pages",
  "errors.operation": "The operation failed. Your current edits are still available.",
  "errors.processing": "Document processing failed; your original is unchanged.",
  "errors.opening": "The PDF could not be opened. Your current document is unchanged.",
  "errors.security": "Signing/protection failed. Your edits are still available.",
  "errors.recognition": "Recognition failed. Your original document is unchanged.",
  "errors.canceled": "Operation canceled. Your current edits are unchanged.",
  "warnings.scripts": "Embedded form scripts are not executed; check calculated values manually.",
  "warnings.navigation":
    "Some bookmarks or internal destinations are unsupported; navigation editing is unavailable for this source.",
  "structure.bookmarks": "document bookmarks",
  "structure.destinations": "named destinations or attachments",
  "structure.accessibility": "accessibility structure",
  "structure.links": "internal page links",
  "structure.comments": "comment relationships across pages",
  "errors.composition":
    "Page extraction/merge would discard {{structures}} in {{name}}. Export the complete original document instead.",
} as const;

export type MessageKey = keyof typeof en;
