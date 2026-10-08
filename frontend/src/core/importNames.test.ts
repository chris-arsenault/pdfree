import { expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument } from "./model";
import { writeProject, readProject } from "./projects";

it("saves and restores a legally long imported filename without truncating it", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  const name = `${"a".repeat(251)}.pdf`;
  const doc = appendSource(emptyDocument(), await importPdf(await pdf.save(), name));
  expect((await readProject(writeProject(doc))).name).toBe(name);
  expect(doc.sources[0].name).toBe(name);
});
