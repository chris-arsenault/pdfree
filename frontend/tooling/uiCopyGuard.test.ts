import { expect, it } from "vitest";
import { findHardcodedCopy } from "./uiCopyGuard";

it.each([
  "<button>Save changes</button>",
  '<IconButton detail="Save changes" />',
  '<input aria-label="Document name" />',
  "<button>{`Delete ${name}?`}</button>",
  'const caption = "Save changes"; const view = <button>{caption}</button>;',
  'const choices = [{label: "Scan"}];',
  'worker.postMessage({message: "Failed to read PDF"});',
  'progress("Recognizing text");',
  'throw new Error("Cannot export this PDF");',
  'const caption = tr("common.save");',
  'worker.postMessage({progress: "Reading page"});',
])("rejects owned interface copy: %s", (source) => {
  expect(findHardcodedCopy(source)).not.toHaveLength(0);
});

it.each([
  'function Component() { return <button>{tr("common.save")}</button>; }',
  'function Component() { return <IconButton detail={tr("save.detail")} />; }',
  'notify(message("task.saved"));',
  '<input className="document-name" value={document.name} aria-label={field.name} />',
  'const mode = "text"; if (mode === "text") worker.postMessage({kind: "import"});',
  "<span>PDFree</span>",
  'throw failure("errors.export");',
])("accepts catalog copy, content and machine tokens: %s", (source) => {
  expect(findHardcodedCopy(source)).toEqual([]);
});
