import { expect, it } from "vitest";
import { defaultObject, emptyDocument } from "./model";
import { exportPdf } from "./exportPdf";
import { renderedPage, maximumDarkness } from "../../tooling/pdfPixels";

it("renders rectangle strokes and both arrowheads with the selected opacity", async () => {
  const doc = emptyDocument();
  doc.pages.push({
    id: "page",
    sourceId: "",
    sourceIndex: 0,
    comments: [],
    rotation: 0,
    box: { x: 0, y: 0, width: 300, height: 300 },
    objects: [
      {
        ...defaultObject("rectangle", { x: 20, y: 20 }),
        width: 100,
        height: 50,
        color: "#000000",
        opacity: 0.2,
      },
      {
        ...defaultObject("arrow", { x: 20, y: 100 }),
        width: 100,
        height: 50,
        color: "#000000",
        opacity: 0.2,
      },
    ],
  });
  const image = await renderedPage(await exportPdf(doc));
  for (const region of [
    { x: 40, y: 229, width: 50, height: 3 },
    { x: 108, y: 146, width: 9, height: 7 },
    { x: 110, y: 153, width: 7, height: 8 },
  ]) {
    const darkness = maximumDarkness(image, region);
    expect(darkness).toBeGreaterThan(30);
    expect(darkness).toBeLessThan(70);
  }
});
