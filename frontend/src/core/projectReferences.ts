import {
  type EditorDocument,
  type NativeField,
  type FieldValue,
  type Page,
  type Source,
} from "./model";
import { objectRotationError } from "./editorValidation";
import { validateCommentThreads } from "./comments";
import { validateUtilities } from "./utilityModel";

export function validateProjectReferences(document: EditorDocument) {
  validateUtilities(document);
  if (document.sources.some((source) => !!source.encryption !== !!source.decryptedBytes))
    throw new Error("Encrypted sources need their original and decrypted working bytes.");
  const items = [
    ...document.sources,
    ...document.pages,
    ...document.assets,
    ...document.pages.flatMap((page) => page.objects),
    ...document.pages.flatMap((page) => page.comments ?? []),
  ];
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw new Error("This project has duplicate object identities.");
  const sources = new Map(document.sources.map((source) => [source.id, source]));
  const assets = new Set(document.assets.map((asset) => asset.id));
  for (const page of document.pages) validatePageReferences(page, sources, assets);
  const fields = new Map(
    document.sources.flatMap((source) => source.fields.map((field) => [field.id, field] as const))
  );
  for (const [id, value] of Object.entries(document.values)) {
    const field = fields.get(id);
    if (!field) throw new Error("This project refers to a missing form field.");
    validateFieldValue(field, value);
  }
}

function validatePageReferences(page: Page, sources: Map<string, Source>, assets: Set<string>) {
  const source = sources.get(page.sourceId);
  if (page.sourceId && (!source || page.sourceIndex >= source.pageCount))
    throw new Error("This project refers to a missing PDF page.");
  for (const object of page.objects) {
    const error = objectRotationError(object);
    if (error) throw new Error(error);
    if (object.kind === "image" && !assets.has(object.assetId))
      throw new Error("This project refers to a missing image.");
  }
  validateCommentReferences(page);
}
function validateCommentReferences(page: Page) {
  const annotations = (page.comments ?? []).flatMap((comment) =>
    comment.annotationIndex === null ? [] : [comment.annotationIndex]
  );
  if (new Set(annotations).size !== annotations.length)
    throw new Error("This project has duplicate annotation references.");
  validateCommentThreads(page.comments ?? []);
}

function validateFieldValue(field: NativeField, value: FieldValue) {
  if (field.kind === "checkbox" && typeof value !== "boolean")
    throw new Error(`The value of ${field.name} must be checked or unchecked.`);
  if ((field.kind === "text" || field.kind === "radio") && typeof value !== "string")
    throw new Error(`The value of ${field.name} must be text.`);
  if (
    (field.kind === "list" || field.kind === "dropdown") &&
    typeof value !== "string" &&
    !Array.isArray(value)
  )
    throw new Error(`The value of ${field.name} must be a choice.`);
}
