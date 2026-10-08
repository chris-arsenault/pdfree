import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNull,
  PDFNumber,
  PDFRef,
  PDFString,
} from "pdf-lib";
import { newId, type Bookmark, type Destination, type EditorDocument, type Page } from "./model";
import { adjustedDestination } from "./utilityNavigation";

const modes = new Map<string, number>([
  ["XYZ", 3],
  ["Fit", 0],
  ["FitH", 1],
  ["FitV", 1],
  ["FitR", 4],
  ["FitB", 0],
  ["FitBH", 1],
  ["FitBV", 1],
]);
function decoded(value: unknown) {
  if (value instanceof PDFString || value instanceof PDFHexString || value instanceof PDFName)
    return value.decodeText();
  return null;
}
function destinationIndex(pdf: PDFDocument, reference: unknown) {
  if (reference instanceof PDFRef)
    return pdf.getPages().findIndex((page) => page.ref.toString() === reference.toString());
  return reference instanceof PDFNumber ? reference.asNumber() : -1;
}
function destinationCoordinates(value: PDFArray) {
  const coordinates: (number | null)[] = [];
  for (let index = 2; index < value.size(); index++) {
    const coordinate = value.lookup(index);
    if (coordinate === PDFNull) coordinates.push(null);
    else if (coordinate instanceof PDFNumber && Number.isFinite(coordinate.asNumber()))
      coordinates.push(coordinate.asNumber());
    else throw new Error("Unsupported destination coordinates.");
  }
  return coordinates;
}
function bookmarkTarget(node: PDFDict) {
  if (["C", "F", "SE"].some((key) => node.has(PDFName.of(key))))
    throw new Error("Styled or structure-linked bookmarks require original-catalog preservation.");
  const action = node.lookupMaybe(PDFName.of("A"), PDFDict);
  if (action && action.get(PDFName.of("S"))?.toString() !== "/GoTo")
    throw new Error("Unsupported bookmark action.");
  return node.lookup(PDFName.of("Dest")) ?? action?.lookup(PDFName.of("D"));
}
function namedDestinations(pdf: PDFDocument) {
  const result = new Map<string, unknown>();
  const old = pdf.catalog.lookupMaybe(PDFName.of("Dests"), PDFDict);
  for (const [name, value] of old?.entries() ?? [])
    result.set(name.decodeText(), pdf.context.lookup(value));
  const root = pdf.catalog
    .lookupMaybe(PDFName.of("Names"), PDFDict)
    ?.lookupMaybe(PDFName.of("Dests"), PDFDict);
  const seen = new Set<PDFDict>();
  const visit = (node: PDFDict, depth: number) => {
    if (seen.has(node) || depth > 50) throw new Error("Unsupported destination tree.");
    seen.add(node);
    const names = node.lookupMaybe(PDFName.of("Names"), PDFArray);
    for (let i = 0; i < (names?.size() ?? 0); i += 2) {
      const key = decoded(names!.lookup(i));
      if (key !== null) result.set(key, names!.lookup(i + 1));
    }
    const kids = node.lookupMaybe(PDFName.of("Kids"), PDFArray);
    for (let i = 0; i < (kids?.size() ?? 0); i++) visit(kids!.lookup(i, PDFDict), depth + 1);
  };
  if (root) visit(root, 0);
  return result;
}
export function readNavigation(pdf: PDFDocument, pages: Page[]) {
  const outlineRoot = pdf.catalog.lookupMaybe(PDFName.of("Outlines"), PDFDict);
  if (outlineRoot && !outlineRoot.has(PDFName.of("First")))
    throw new Error("Unsupported empty outline catalog.");
  const names = namedDestinations(pdf);
  const destination = (input: unknown): Destination => {
    let value = input;
    const name = decoded(value);
    if (name !== null) value = names.get(name);
    if (value instanceof PDFDict) value = value.lookup(PDFName.of("D"));
    if (!(value instanceof PDFArray)) throw new Error("Unsupported bookmark or link destination.");
    const reference = value.get(0);
    const index = destinationIndex(pdf, reference);
    const mode = decoded(value.lookup(1));
    if (!pages[index] || !mode || modes.get(mode) !== value.size() - 2)
      throw new Error("Unsupported bookmark or link destination.");
    const coordinates = destinationCoordinates(value);
    return { pageId: pages[index].id, mode: mode as Destination["mode"], coordinates };
  };
  const bookmarks: Bookmark[] = [];
  const seen = new Set<PDFDict>();
  const walk = (first: PDFDict | undefined, parentId: string | null, depth: number) => {
    if (depth > 50) throw new Error("Bookmark hierarchy is too deep.");
    let node = first;
    while (node) {
      if (seen.has(node) || seen.size > 10_000) throw new Error("Invalid bookmark hierarchy.");
      seen.add(node);
      const target = bookmarkTarget(node);
      const id = newId();
      bookmarks.push({
        id,
        parentId,
        title: decoded(node.lookup(PDFName.of("Title"))) || "Untitled bookmark",
        destination: destination(target),
      });
      walk(node.lookupMaybe(PDFName.of("First"), PDFDict), id, depth + 1);
      node = node.lookupMaybe(PDFName.of("Next"), PDFDict);
    }
  };
  walk(
    pdf.catalog
      .lookupMaybe(PDFName.of("Outlines"), PDFDict)
      ?.lookupMaybe(PDFName.of("First"), PDFDict),
    null,
    0
  );
  pdf.getPages().forEach((page, index) => {
    const annots = page.node.Annots();
    pages[index].links = [];
    for (let i = 0; i < (annots?.size() ?? 0); i++) {
      const annotation = annots!.lookup(i, PDFDict);
      const action = annotation.lookupMaybe(PDFName.of("A"), PDFDict);
      const target =
        annotation.lookup(PDFName.of("Dest")) ??
        (action?.get(PDFName.of("S"))?.toString() === "/GoTo"
          ? action.lookup(PDFName.of("D"))
          : undefined);
      if (target)
        pages[index].links!.push({ annotationIndex: i, destination: destination(target) });
    }
  });
  return bookmarks;
}
function unsupportedNavigation(document: EditorDocument, pages: Page[]) {
  return document.sources
    .filter((source) => pages.some((page) => page.sourceId === source.id))
    .some((source) =>
      source.structuralWarnings.some((warning) =>
        ["document bookmarks", "internal page links"].includes(warning)
      )
    );
}
export function writeNavigation(pdf: PDFDocument, document: EditorDocument, pages: Page[]) {
  if (unsupportedNavigation(document, pages)) return;
  const targets = new Map(pages.map((page, index) => [page.id, pdf.getPage(index).ref]));
  const destination = (target: Destination) => {
    const reference = targets.get(target.pageId);
    if (!reference) return null;
    const coordinates = adjustedDestination(
      target,
      pages.find((page) => page.id === target.pageId)!
    ).coordinates;
    return pdf.context.obj([reference, PDFName.of(target.mode), ...coordinates]);
  };
  pages.forEach((page, index) => {
    const annotations = pdf.getPage(index).node.Annots();
    for (const link of page.links ?? []) {
      if (!annotations || link.annotationIndex >= annotations.size())
        throw new Error("Missing source link annotation.");
      const annotation = annotations.lookup(link.annotationIndex, PDFDict);
      annotation.delete(PDFName.of("A"));
      annotation.delete(PDFName.of("Dest"));
      const target = destination(link.destination);
      if (target) annotation.set(PDFName.of("Dest"), target);
    }
  });
  if (document.bookmarks === undefined) return;
  pdf.catalog.delete(PDFName.of("Outlines"));
  const bookmarks = document.bookmarks.filter((bookmark) =>
    targets.has(bookmark.destination.pageId)
  );
  if (!bookmarks.length) return;
  const included = new Set(bookmarks.map((bookmark) => bookmark.id));
  const root = pdf.context.obj({ Type: "Outlines" });
  const rootRef = pdf.context.register(root);
  const entries = new Map(
    bookmarks.map((bookmark) => {
      const dict = pdf.context.obj({
        Title: PDFHexString.fromText(bookmark.title),
        Dest: destination(bookmark.destination)!,
      });
      return [bookmark.id, { dict, ref: pdf.context.register(dict) }] as const;
    })
  );
  const writeLevel = (parentId: string | null, parent: PDFDict, parentRef: PDFRef) => {
    const children = bookmarks.filter(
      (bookmark) => (included.has(bookmark.parentId ?? "") ? bookmark.parentId : null) === parentId
    );
    if (!children.length) return;
    parent.set(PDFName.of("First"), entries.get(children[0].id)!.ref);
    parent.set(PDFName.of("Last"), entries.get(children.at(-1)!.id)!.ref);
    const descendants = (id: string): number =>
      bookmarks
        .filter((bookmark) => bookmark.parentId === id)
        .reduce((count, bookmark) => count + 1 + descendants(bookmark.id), 0);
    parent.set(
      PDFName.of("Count"),
      PDFNumber.of(children.reduce((count, child) => count + 1 + descendants(child.id), 0))
    );
    children.forEach((bookmark, index) => {
      const entry = entries.get(bookmark.id)!;
      entry.dict.set(PDFName.of("Parent"), parentRef);
      if (index) entry.dict.set(PDFName.of("Prev"), entries.get(children[index - 1].id)!.ref);
      if (index + 1 < children.length)
        entry.dict.set(PDFName.of("Next"), entries.get(children[index + 1].id)!.ref);
      writeLevel(bookmark.id, entry.dict, entry.ref);
    });
  };
  writeLevel(null, root, rootRef);
  pdf.catalog.set(PDFName.of("Outlines"), rootRef);
}
export function pruneNavigation(document: EditorDocument): EditorDocument {
  const ids = new Set(document.pages.map((page) => page.id));
  const bookmarks = (document.bookmarks ?? []).filter((bookmark) =>
    ids.has(bookmark.destination.pageId)
  );
  const retained = new Set(bookmarks.map((bookmark) => bookmark.id));
  return {
    ...document,
    bookmarks: bookmarks.map((bookmark) => ({
      ...bookmark,
      parentId: retained.has(bookmark.parentId ?? "") ? bookmark.parentId : null,
    })),
    rules: (document.rules ?? []).flatMap((rule) => {
      const pageIds = rule.pageIds.filter((id) => ids.has(id));
      return rule.pageIds.length && !pageIds.length ? [] : [{ ...rule, pageIds }];
    }),
    pages: document.pages,
  };
}
