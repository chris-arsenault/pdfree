import { expect, it } from "vitest";
import { zipSync, strToU8 } from "fflate";
import { writeProject, readProject } from "./projects";
import { appendSource, importPdf } from "./importPdf";
import { emptyDocument, defaultObject, fieldKey, newId } from "./model";
import { formFixture } from "./fixtures";
import { duplicatePages, rotatePages } from "./pageOperations";

it("restores editable page identities, field values, objects, images and immutable sources", async () => {
  let doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "original.pdf"));
  const asset = {
    id: newId(),
    name: "signature.png",
    mime: "image/png",
    data: new Uint8Array([1, 2, 3]),
  };
  doc.assets.push(asset);
  doc.values[fieldKey(doc.sources[0].id, "name")] = "Recovered";
  doc.pages[0].objects.push({
    ...defaultObject("image", { x: 123, y: 456 }),
    assetId: asset.id,
    rotation: 30,
  });
  doc = rotatePages(duplicatePages(doc, [doc.pages[0].id]), [doc.pages[0].id]);
  const restored = await readProject(writeProject(doc));
  expect(restored.pages).toEqual(doc.pages);
  expect(restored.values).toEqual(doc.values);
  expect(restored.assets).toEqual(doc.assets);
  expect(restored.sources[0].bytes).toEqual(doc.sources[0].bytes);
  expect(restored.sources[0].fields[0].id).toBe(doc.sources[0].fields[0].id);
});
it("rejects future versions and missing manifest or page references", async () => {
  await expect(readProject(zipSync({}))).rejects.toThrow("missing manifest");
  await expect(readProject(zipSync({ "manifest.json": strToU8('{"version":2}') }))).rejects.toThrow(
    "supported PDFree"
  );
  const doc = appendSource(emptyDocument(), await importPdf(await formFixture(), "original.pdf"));
  doc.pages[0].sourceIndex = 200;
  expect(() => writeProject(doc)).toThrow("missing PDF page");
});
