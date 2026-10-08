import { PDFArray, PDFDict, PDFName, PDFHexString, type PDFPage } from "pdf-lib";

// Page copies use independent object copiers. Rebind relationships to the actual
// copied annotation array rather than recursively copied page/annotation objects.
export function rebindAnnotations(original: PDFPage, copied: PDFPage, identity: string) {
  const source = original.node.Annots(),
    target = copied.node.Annots();
  if (!source || !target) return;
  const indices = new Map<PDFDict, number>();
  for (let index = 0; index < source.size(); index++)
    indices.set(source.lookup(index, PDFDict), index);
  for (let index = 0; index < target.size(); index++) {
    const before = source.lookup(index, PDFDict),
      after = target.lookup(index, PDFDict);
    after.set(PDFName.of("P"), copied.ref);
    if (after.has(PDFName.of("NM")))
      after.set(PDFName.of("NM"), PDFHexString.fromText(`${identity}:${index}`));
    rebindRelationships(before, after, target, indices);
  }
}
function rebindRelationships(
  before: PDFDict,
  after: PDFDict,
  target: PDFArray,
  indices: Map<PDFDict, number>
) {
  for (const key of ["IRT", "Popup", "Parent"]) {
    if (key === "Parent" && after.get(PDFName.of("Subtype"))?.toString() === "/Widget") continue;
    const related = before.lookupMaybe(PDFName.of(key), PDFDict);
    if (!related) continue;
    const relatedIndex = indices.get(related);
    if (relatedIndex === undefined)
      throw new Error(
        "Page composition cannot preserve annotation relationships across pages. Export the complete original document instead."
      );
    after.set(PDFName.of(key), target.get(relatedIndex));
  }
}
