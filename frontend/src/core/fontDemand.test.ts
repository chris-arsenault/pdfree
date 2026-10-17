import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { emptyDocument, defaultObject, type EditorDocument } from "./model";
import { exportPdf } from "./exportPdf";
import { savedPdfText } from "../../tooling/pdfText";
function document(font: "sans" | "signature"): EditorDocument {
  return {
    ...emptyDocument(),
    pages: [
      {
        id: "page",
        sourceId: "",
        sourceIndex: 0,
        box: { x: 0, y: 0, width: 612, height: 792 },
        rotation: 0,
        comments: [],
        objects: [
          {
            ...defaultObject("text", { x: 20, y: 30 }),
            font,
            text: font === "sans" ? "Résumé Ж" : "Ada",
          },
        ],
      },
    ],
  };
}
it("retains Unicode sans output without a signature font and rejects a missing required font", async () => {
  const sans = new Uint8Array(await readFile("src/assets/NotoSans-Regular.ttf"));
  const bytes = await exportPdf(document("sans"), false, [], { sans, signature: null });
  expect(await savedPdfText(bytes)).toContain("Résumé Ж");
  await expect(
    exportPdf(document("signature"), false, [], { sans, signature: null })
  ).rejects.toMatchObject({ ui: { key: "errors.bundledFont" } });
  const signature = new Uint8Array(
    await readFile("node_modules/@fontsource/caveat/files/caveat-latin-400-normal.woff")
  );
  expect(
    await savedPdfText(await exportPdf(document("signature"), false, [], { sans, signature }))
  ).toContain("Ada");
});
