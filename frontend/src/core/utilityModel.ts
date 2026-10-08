import { z } from "zod";
import { type EditorDocument, type Bookmark, type Page } from "./model";

const coordinate = z.number().finite().min(-100_000).max(100_000);
const identity = z.string().min(1).max(200);
export const destinationSchema = z
  .object({
    pageId: identity,
    mode: z.enum(["XYZ", "Fit", "FitH", "FitV", "FitR", "FitB", "FitBH", "FitBV"]),
    coordinates: z.array(coordinate.nullable()).max(4),
  })
  .refine(
    (destination) =>
      destination.coordinates.length ===
      {
        XYZ: 3,
        Fit: 0,
        FitH: 1,
        FitV: 1,
        FitR: 4,
        FitB: 0,
        FitBH: 1,
        FitBV: 1,
      }[destination.mode],
    "Invalid destination coordinates."
  );
export const bookmarkSchema = z.object({
  id: identity,
  parentId: identity.nullable(),
  title: z.string().min(1).max(1000),
  destination: destinationSchema,
});
export const linkSchema = z.object({
  annotationIndex: z.number().int().nonnegative(),
  destination: destinationSchema,
});
export const recognitionSchema = z.object({
  engine: z.literal("tesseract-7"),
  language: z.literal("eng"),
  words: z
    .array(
      z.object({
        x: coordinate,
        y: coordinate,
        width: coordinate.positive(),
        height: coordinate.positive(),
        text: z.string().min(1).max(1000),
        confidence: z.number().min(0).max(100),
      })
    )
    .max(100_000),
});
export const scanSchema = z.object({
  assetId: identity,
  angle: z.number().min(-10).max(10),
  contrast: z.number().min(0.5).max(3),
  background: z.number().min(0).max(100),
});
export const ruleSchema = z.object({
  id: identity,
  kind: z.enum(["number", "watermark", "stamp"]),
  pageIds: z.array(identity).max(10_000),
  text: z.string().max(1000),
  start: z.number().int().min(0).max(1_000_000_000),
  padding: z.number().int().min(0).max(12),
  position: z.enum(["top", "center", "bottom"]),
  fontSize: z.number().min(6).max(150),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  opacity: z.number().min(0.05).max(1),
});

// New archives always write explicit utility state. Missing fields are only an
// in-memory compatibility representation for older documents and fixtures.
export function normalizeUtilities(document: EditorDocument): EditorDocument {
  return {
    ...document,
    bookmarks: document.bookmarks ?? [],
    rules: document.rules ?? [],
    pages: document.pages.map((page) => ({
      ...page,
      recognition: page.recognition ?? null,
      scan: page.scan ?? null,
      links: page.links ?? [],
    })),
  };
}
export function validateUtilities(document: EditorDocument) {
  const ids = new Set(document.pages.map((page) => page.id));
  const assets = new Set(document.assets.map((asset) => asset.id));
  const bookmarks = document.bookmarks ?? [];
  const byId = new Map(bookmarks.map((item) => [item.id, item]));
  if (byId.size !== bookmarks.length) throw new Error("Duplicate bookmark identities.");
  for (const bookmark of bookmarks) validateBookmark(bookmark, ids, byId);
  for (const page of document.pages) validatePageUtility(page, assets);
  const rules = document.rules ?? [];
  if (new Set(rules.map((rule) => rule.id)).size !== rules.length)
    throw new Error("Duplicate page rules.");
  for (const rule of rules) {
    ruleSchema.parse(rule);
    if (rule.pageIds.some((id) => !ids.has(id)))
      throw new Error("A page rule targets a missing page.");
  }
}
function validateBookmark(bookmark: Bookmark, ids: Set<string>, byId: Map<string, Bookmark>) {
  bookmarkSchema.parse(bookmark);
  if (!ids.has(bookmark.destination.pageId)) throw new Error("A bookmark targets a missing page.");
  const visited = new Set([bookmark.id]);
  let parent = bookmark.parentId;
  while (parent) {
    if (visited.has(parent) || !byId.has(parent)) throw new Error("Invalid bookmark hierarchy.");
    visited.add(parent);
    if (visited.size > 50) throw new Error("Bookmark hierarchy is too deep.");
    parent = byId.get(parent)!.parentId;
  }
}
function validatePageUtility(page: Page, assets: Set<string>) {
  if (page.recognition) recognitionSchema.parse(page.recognition);
  if (page.scan) {
    scanSchema.parse(page.scan);
    if (!assets.has(page.scan.assetId)) throw new Error("Missing processed scan image.");
  }
  for (const link of page.links ?? []) {
    linkSchema.parse(link);
    // A removed target is retained as a tombstone so export clears the source
    // annotation's destination rather than preserving a dangling reference.
  }
}
