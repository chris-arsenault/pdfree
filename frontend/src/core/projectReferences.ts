import { failure, MessageError } from "../i18n/messages";
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
    throw failure("errors.projectEncryptedBytes");
  const items = [
    ...document.sources,
    ...document.pages,
    ...document.assets,
    ...document.pages.flatMap((page) => page.objects),
    ...document.pages.flatMap((page) => page.comments ?? []),
  ];
  if (new Set(items.map((item) => item.id)).size !== items.length)
    throw failure("errors.projectObjectIdentities");
  const sources = new Map(document.sources.map((source) => [source.id, source]));
  const assets = new Set(document.assets.map((asset) => asset.id));
  for (const page of document.pages) validatePageReferences(page, sources, assets);
  const fields = new Map(
    document.sources.flatMap((source) => source.fields.map((field) => [field.id, field] as const))
  );
  for (const [id, value] of Object.entries(document.values)) {
    const field = fields.get(id);
    if (!field) throw failure("errors.projectFieldMissing");
    validateFieldValue(field, value);
  }
}

function validatePageReferences(page: Page, sources: Map<string, Source>, assets: Set<string>) {
  const source = sources.get(page.sourceId);
  if (page.sourceId && (!source || page.sourceIndex >= source.pageCount))
    throw failure("errors.projectPageMissing");
  for (const object of page.objects) {
    const error = objectRotationError(object);
    if (error) throw new MessageError(error);
    if (object.kind === "image" && !assets.has(object.assetId))
      throw failure("errors.projectImageMissing");
  }
  validateCommentReferences(page);
}
function validateCommentReferences(page: Page) {
  const annotations = (page.comments ?? []).flatMap((comment) =>
    comment.annotationIndex === null ? [] : [comment.annotationIndex]
  );
  if (new Set(annotations).size !== annotations.length)
    throw failure("errors.projectAnnotationsDuplicate");
  validateCommentThreads(page.comments ?? []);
}

function validateFieldValue(field: NativeField, value: FieldValue) {
  if (field.kind === "checkbox" && typeof value !== "boolean")
    throw failure("validation.checkedValue", { name: field.name });
  if ((field.kind === "text" || field.kind === "radio") && typeof value !== "string")
    throw failure("validation.textValue", { name: field.name });
  if (
    (field.kind === "list" || field.kind === "dropdown") &&
    typeof value !== "string" &&
    !Array.isArray(value)
  )
    throw failure("validation.choiceValue", { name: field.name });
}
