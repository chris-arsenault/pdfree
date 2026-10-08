import { expect, it } from "vitest";
import { PDFDict, PDFDocument, PDFName, PDFRef } from "pdf-lib";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument } from "./model";
import { addComment, createComment, editComment, removeComment } from "./comments";
import { commentFixture } from "./commentFixture";
import { exportPdf } from "./exportPdf";
import { duplicatePages, rotatePages, movePage, removePages } from "./pageOperations";
import { readProject, writeProject } from "./projects";
import { annotationText, annotationType } from "./importComments";
import { validateProjectReferences } from "./projectReferences";
import { commentView } from "./commentView";

const load = async () =>
  appendSource(emptyDocument(), await importPdf(await commentFixture(), "comments.pdf"));
it("imports native notes, Unicode authors, replies and markup text", async () => {
  const doc = await load(),
    comments = doc.pages[0].comments!;
  expect(comments).toHaveLength(3);
  expect(comments[0]).toMatchObject({
    text: "Review café 東京",
    author: "Zoë",
    createdAt: "D:20261008120000Z",
    readOnly: false,
  });
  expect(comments[1].parentId).toBe(comments[0].id);
  expect(comments[2]).toMatchObject({ text: "Highlighted passage", readOnly: true });
});
it("edits and deletes source annotations and popups without restoring them on reopen", async () => {
  let doc = await load();
  const immutable = doc.sources[0].bytes.slice();
  const root = doc.pages[0].comments![0];
  doc = editComment(doc, doc.pages[0].id, root.id, "Changed Ελληνικά");
  const added = createComment({ x: 150, y: 600 }, "New reply", "You", root.id);
  doc = addComment(doc, doc.pages[0].id, added);
  const reopened = await importPdf(await exportPdf(doc, true), "saved.pdf");
  expect(reopened.pages[0].comments!.map((item) => item.text)).toContain("Changed Ελληνικά");
  expect(reopened.pages[0].comments!.find((item) => item.text === "New reply")!.parentId).toBe(
    reopened.pages[0].comments![0].id
  );
  doc = removeComment(doc, doc.pages[0].id, root.id);
  const saved = await PDFDocument.load(await exportPdf(doc, true));
  const annotations = saved.getPage(0).node.Annots()!;
  expect(
    Array.from({ length: annotations.size() }, (_, index) =>
      annotationType(annotations.lookup(index, PDFDict))
    )
  ).toEqual(["Highlight", "Link"]);
  expect(doc.sources[0].bytes).toEqual(immutable);
});
it("duplicates independent threads and rebinds page, popup and reply references during composition", async () => {
  let doc = await load();
  doc = duplicatePages(doc, [doc.pages[0].id]);
  const copy = doc.pages[1];
  expect(copy.comments![1].parentId).toBe(copy.comments![0].id);
  expect(copy.comments![0].id).not.toBe(doc.pages[0].comments![0].id);
  doc = editComment(doc, copy.id, copy.comments![0].id, "Copy only");
  doc = rotatePages(movePage(doc, copy.id, 0), [copy.id]);
  doc = removePages(doc, [doc.pages[3].id]);
  const pdf = await PDFDocument.load(await exportPdf(doc));
  expect(pdf.getPage(0).getRotation().angle).toBe(90);
  for (const page of pdf.getPages().slice(0, 2)) {
    const annots = page.node.Annots()!;
    const notes = Array.from({ length: annots.size() }, (_, index) =>
      annots.lookup(index, PDFDict)
    ).filter((item) => annotationType(item) === "Text");
    expect(notes[1].lookup(PDFName.of("IRT"), PDFDict)).toBe(notes[0]);
    expect(
      notes[0].lookup(PDFName.of("Popup"), PDFDict).lookup(PDFName.of("Parent"), PDFDict)
    ).toBe(notes[0]);
    for (const note of notes) expect(note.get(PDFName.of("P"))).toEqual(page.ref);
  }
  const first = pdf.getPage(0).node.Annots()!;
  expect(
    Array.from({ length: first.size() }, (_, index) =>
      annotationText(first.lookup(index, PDFDict), "Contents")
    )
  ).toContain("Copy only");
});
it("persists deletion and threads in version 3 projects and migrates old projects", async () => {
  let doc = await load();
  doc = removeComment(doc, doc.pages[0].id, doc.pages[0].comments![0].id);
  const project = writeProject(doc);
  const restored = await readProject(project);
  expect(restored.pages[0].comments).toEqual(doc.pages[0].comments);
  const files = unzipSync(project),
    manifest = JSON.parse(strFromU8(files["manifest.json"]));
  manifest.version = 1;
  for (const page of manifest.pages) delete page.comments;
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  expect((await readProject(zipSync(files))).pages[0].comments).toHaveLength(3);
  const invalid = structuredClone(doc);
  invalid.pages[0].comments![0].parentId = "missing";
  expect(() => validateProjectReferences(invalid)).toThrow("missing comment thread");
});
it("keeps cross-page replies read only and rejects composition instead of breaking the thread", async () => {
  const pdf = await PDFDocument.load(await commentFixture());
  const first = pdf.getPage(0).node.Annots()!;
  const replyIndex = Array.from({ length: first.size() }, (_, index) => index).find((index) =>
    first.lookup(index, PDFDict).has(PDFName.of("IRT"))
  )!;
  const replyRef = first.get(replyIndex);
  if (!(replyRef instanceof PDFRef)) throw new Error("Expected an indirect reply fixture.");
  pdf.getPage(1).node.addAnnot(replyRef);
  first.remove(replyIndex);
  const doc = appendSource(emptyDocument(), await importPdf(await pdf.save(), "cross-page.pdf"));
  expect(doc.pages[0].comments[0].readOnly).toBe(true);
  expect(doc.pages[1].comments[0].readOnly).toBe(true);
  const saved = await PDFDocument.load(await exportPdf(doc));
  const reply = saved
    .getPage(1)
    .node.Annots()!
    .lookup(saved.getPage(1).node.Annots()!.size() - 1, PDFDict);
  const parent = reply.lookup(PDFName.of("IRT"), PDFDict);
  expect(annotationText(parent, "Contents")).toBe("Review café 東京");
  await expect(exportPdf(doc, false, [doc.pages[0].id])).rejects.toThrow(
    "comment relationships across pages"
  );
});
it("rejects circular threads and forged source annotation references", async () => {
  const doc = await load();
  const invalid = structuredClone(doc);
  invalid.pages[0].comments[0].parentId = invalid.pages[0].comments[1].id;
  expect(() => writeProject(invalid)).toThrow("circular comment thread");
  const files = unzipSync(writeProject(doc)),
    manifest = JSON.parse(strFromU8(files["manifest.json"]));
  manifest.pages[0].comments[0].annotationIndex = 9999;
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  await expect(readProject(zipSync(files))).rejects.toThrow("missing PDF comment");
  manifest.pages[0].comments[0].annotationIndex = doc.pages[0].comments[0].annotationIndex;
  manifest.pages[0].comments[2].readOnly = false;
  files["manifest.json"] = strToU8(JSON.stringify(manifest));
  await expect(readProject(zipSync(files))).rejects.toThrow("read-only PDF comment");
});
it("omits note icons only in the rendering copy while keeping other annotations and immutable bytes", async () => {
  const bytes = await commentFixture(),
    immutable = bytes.slice();
  const original = await PDFDocument.load(bytes),
    rendered = await PDFDocument.load(await commentView(bytes));
  expect(bytes).toEqual(immutable);
  expect(original.getPage(0).node.Annots()!.size()).toBeGreaterThan(
    rendered.getPage(0).node.Annots()!.size()
  );
  const annots = rendered.getPage(0).node.Annots()!;
  const types = Array.from({ length: annots.size() }, (_, index) =>
    annotationType(annots.lookup(index, PDFDict))
  );
  expect(types).not.toContain("Text");
  expect(types).toContain("Highlight");
  expect(types).toContain("Link");
});
