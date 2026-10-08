import { afterEach, beforeEach, expect, it } from "vitest";
import { get, set } from "idb-keyval";
import { PDFDocument } from "pdf-lib";
import { choiceFixture } from "../../tooling/choiceFixture";
import { appendSource, importPdf } from "../core/importPdf";
import { emptyDocument, defaultObject } from "../core/model";
import { deleteDraft, loadDrafts } from "./drafts";

beforeEach(() => deleteDraft());
afterEach(() => deleteDraft());

it("recovers legacy choice descriptors and visible boxes without changing edits or stored snapshots", async () => {
  const pdf = await PDFDocument.load(await choiceFixture("dropdown"));
  pdf.getPage(0).setMediaBox(0, 0, 600, 800);
  pdf.getPage(0).setCropBox(-50, -100, 500, 650);
  const bytes = await pdf.save({ updateFieldAppearances: false });
  const doc = appendSource(emptyDocument(), await importPdf(bytes, "legacy.pdf"));
  const field = doc.sources[0].fields[0];
  field.options = ["California", "New York"];
  Reflect.deleteProperty(field, "choiceOptions");
  doc.pages[0].box = { x: -50, y: -100, width: 500, height: 650 };
  doc.pages[0].objects.push({ ...defaultObject("text", { x: 20, y: 200 }), text: "Saved edit" });
  doc.values[field.id] = ["NY"];
  const snapshot = { version: 1, revision: "old-revision", document: doc, savedAt: 123 };
  await set("pdfree-draft-v1", snapshot);
  const [draft] = await loadDrafts();
  expect(draft.modelRevision).toBe(3);
  expect(draft.id).toBe("legacy");
  expect(draft.revision).toBe("old-revision");
  expect(draft.document.pages[0].box).toEqual({ x: 0, y: 0, width: 450, height: 550 });
  expect(draft.document.pages[0].objects).toEqual(doc.pages[0].objects);
  expect(draft.document.pages[0].id).toBe(doc.pages[0].id);
  expect(draft.document.values).toEqual(doc.values);
  expect(draft.document.sources[0].bytes).toEqual(bytes);
  expect(draft.document.sources[0].fields[0].id).toBe(field.id);
  expect(draft.document.sources[0].fields[0].choiceOptions).toEqual([
    { value: "CA", label: "California" },
    { value: "NY", label: "New York" },
  ]);
  expect(await get("pdfree-draft-v1")).toEqual(snapshot);
});
it("normalizes revision 2 drafts without refreshing geometry or mutating stored data", async () => {
  const doc = appendSource(
    emptyDocument(),
    await importPdf(await choiceFixture("dropdown"), "old.pdf")
  );
  Reflect.deleteProperty(doc, "allowDecryptedDrafts");
  Reflect.deleteProperty(doc.sources[0], "encryption");
  Reflect.deleteProperty(doc.sources[0], "decryptedBytes");
  doc.pages[0].objects.push({ ...defaultObject("text", { x: 20, y: 200 }), text: "Retained edit" });
  const snapshot = { version: 1, modelRevision: 2, revision: "prior", document: doc, savedAt: 123 };
  await set("pdfree-draft-v2:prior", snapshot);
  const [draft] = await loadDrafts();
  expect(draft.document.allowDecryptedDrafts).toBe(false);
  expect(draft.document.sources[0].encryption).toBe(null);
  expect(draft.document.sources[0].decryptedBytes).toBe(null);
  expect(draft.document.pages).toEqual(doc.pages);
  expect(await get("pdfree-draft-v2:prior")).toEqual(snapshot);
});
