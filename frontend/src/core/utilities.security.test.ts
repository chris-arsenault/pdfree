import { expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { PDFDocument, PDFName } from "pdf-lib";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument, newId } from "./model";
import { exportPdf } from "./exportPdf";
import { nupPdf, defaultNup } from "./nupPdf";
const run = promisify(execFile);
it("checks native utility destinations, hidden text and N-up bytes using qpdf and Poppler", async () => {
  const original = await PDFDocument.create();
  original.addPage([612, 792]);
  original.addPage([300, 500]);
  const document = appendSource(
    emptyDocument(),
    await importPdf(await original.save(), "Utility.pdf")
  );
  document.bookmarks = [
    {
      id: newId(),
      parentId: null,
      title: "Second chapter",
      destination: { pageId: document.pages[1].id, mode: "Fit", coordinates: [] },
    },
  ];
  document.pages[0].recognition = {
    engine: "tesseract-7",
    language: "eng",
    words: [{ text: "Searchable café", x: 60, y: 600, width: 150, height: 18, confidence: 95 }],
  };
  document.rules = [
    {
      id: newId(),
      kind: "number",
      pageIds: [],
      text: "BATES-",
      start: 1,
      padding: 4,
      position: "bottom",
      fontSize: 12,
      color: "#173732",
      opacity: 1,
    },
  ];
  const bytes = await exportPdf(document),
    print = await nupPdf(bytes, { ...defaultNup, count: 2 });
  await mkdir("test-results/security", { recursive: true });
  for (const [name, output] of [
    ["utilities", bytes],
    ["utilities-nup", print],
  ] as const) {
    const path = `test-results/security/${name}.pdf`;
    await writeFile(path, output);
    const check = await run("qpdf", ["--check", path]);
    expect(check.stdout).toContain("No syntax or stream encoding errors");
    expect(check.stderr).not.toMatch(/warning|error/i);
    const text = await run("pdftotext", ["-layout", path, "-"]);
    expect(text.stderr).not.toMatch(/Syntax (Error|Warning)/i);
    expect(text.stdout).toContain("Searchable café");
    expect(text.stdout).toContain("BATES-0002");
    const render = await run("pdftoppm", [
      "-f",
      "1",
      "-l",
      "1",
      "-scale-to",
      "600",
      "-png",
      "-singlefile",
      path,
      `test-results/security/${name}`,
    ]);
    expect(render.stderr).not.toMatch(/Syntax (Error|Warning)/i);
  }
  const saved = await PDFDocument.load(bytes);
  expect(saved.catalog.has(PDFName.of("Outlines"))).toBe(true);
});
