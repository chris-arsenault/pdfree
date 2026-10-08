import { expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { commentFixture } from "./commentFixture";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument } from "./model";
import { duplicatePages, rotatePages } from "./pageOperations";
import { addComment, createComment, editComment } from "./comments";
import { exportPdf } from "./exportPdf";

const run = promisify(execFile);
it("checks composed note/reply bytes and appearances with qpdf and Poppler", async () => {
  let document = appendSource(
    emptyDocument(),
    await importPdf(await commentFixture(), "native.pdf")
  );
  document = duplicatePages(document, [document.pages[0].id]);
  const page = document.pages[1],
    parent = page.comments[0];
  document = editComment(document, page.id, parent.id, "Copied café 東京");
  document = addComment(
    document,
    page.id,
    createComment(parent, "Independent reply", "Ada", parent.id)
  );
  document = rotatePages(document, [page.id]);
  await mkdir("test-results/security", { recursive: true });
  const path = "test-results/security/comments.pdf";
  await writeFile(path, await exportPdf(document, true));
  expect((await run("qpdf", ["--check", path])).stdout).toContain(
    "No syntax or stream encoding errors"
  );
  const info = await run("pdfinfo", [path]);
  expect(info.stderr).not.toMatch(/Syntax (Error|Warning)/i);
  const rendered = await run("pdftoppm", [
    "-f",
    "2",
    "-l",
    "2",
    "-scale-to",
    "600",
    "-png",
    "-singlefile",
    path,
    "test-results/security/comments-rendered",
  ]);
  expect(rendered.stderr).not.toMatch(/Syntax (Error|Warning)/i);
  const json = JSON.parse((await run("qpdf", ["--json", path])).stdout);
  const object = (ref: string): Record<string, unknown> => json.qpdf[1][`obj:${ref}`].value;
  const copiedPage = json.pages[1].object as string;
  const annotations = object(copiedPage)["/Annots"] as string[];
  const notes = annotations.map(object).filter((item) => item["/Subtype"] === "/Text");
  expect(notes.some((note) => note["/Contents"] === "u:Copied café 東京")).toBe(true);
  const reply = notes.find((note) => note["/Contents"] === "u:Independent reply")!;
  expect(object(reply["/IRT"] as string)["/Contents"]).toBe("u:Copied café 東京");
  expect(annotations).toContain(reply["/IRT"]);
  for (const note of notes) expect(note["/P"]).toBe(copiedPage);
});
