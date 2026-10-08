import { afterEach, beforeEach, expect, it } from "vitest";
import { get, set } from "idb-keyval";
import { PDFDocument } from "pdf-lib";
import { choiceFixture } from "../../tooling/choiceFixture";
import { appendSource, importPdf } from "../core/importPdf";
import { emptyDocument, defaultObject } from "../core/model";
import { deleteDraft, deleteSavedDraft, loadDrafts } from "./drafts";
import { commentFixture } from "../core/commentFixture";

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
  expect(draft.modelRevision).toBe(4);
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
  await deleteSavedDraft(draft.id);
  expect(await loadDrafts()).toEqual([]);
  expect(await get("pdfree-draft-v1")).toBeUndefined();
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
it("recovers comments from revision 3 drafts while retaining page identities and saved geometry", async () => {
  const doc = appendSource(emptyDocument(), await importPdf(await commentFixture(), "notes.pdf"));
  const pageId = doc.pages[0].id;
  doc.pages[0].box = { x: 10, y: 20, width: 500, height: 700 };
  for (const page of doc.pages) Reflect.deleteProperty(page, "comments");
  const snapshot = {
    version: 1,
    modelRevision: 3,
    revision: "prior-notes",
    document: doc,
    savedAt: 123,
  };
  await set("pdfree-draft-v2:prior-notes", snapshot);
  const [draft] = await loadDrafts();
  expect(draft.modelRevision).toBe(4);
  expect(draft.document.pages[0].id).toBe(pageId);
  expect(draft.document.pages[0].box).toEqual(doc.pages[0].box);
  expect(draft.document.pages[0].comments.map((comment) => comment.text)).toContain(
    "Review café 東京"
  );
  expect(draft.document.pages[0].comments[1].parentId).toBe(draft.document.pages[0].comments[0].id);
  expect(await get("pdfree-draft-v2:prior-notes")).toEqual(snapshot);
});
