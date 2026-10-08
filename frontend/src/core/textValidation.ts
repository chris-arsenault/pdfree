import { type EditorDocument, type Page, type PlacedObject } from "./model";
import { type Fonts, wrapText } from "./drawObjects";
function checkGlyphs(text: string, font: Fonts["sans"], label: string) {
  const supported = new Set(font.getCharacterSet());
  const missing = [
    ...new Set(
      [...text].filter(
        (character) => !/[\n\r\t]/.test(character) && !supported.has(character.codePointAt(0) ?? 0)
      )
    ),
  ];
  if (missing.length)
    throw new Error(
      `${label} contains characters this font cannot export: ${missing.slice(0, 8).join(" ")}. Choose a supported font or import a signature image.`
    );
}
export function validateText(document: EditorDocument, pages: Page[], fonts: Fonts) {
  for (const source of document.sources) {
    const indexes = pages
      .filter((page) => page.sourceId === source.id)
      .map((page) => page.sourceIndex);
    for (const field of source.fields.filter(
      (item) =>
        item.kind === "text" && item.widgets.some((widget) => indexes.includes(widget.pageIndex))
    ))
      checkGlyphs(String(document.values[field.id] ?? field.value), fonts.sans, field.name);
  }
  for (const page of pages) for (const object of page.objects) validateObject(object, fonts);
}
function validateObject(object: PlacedObject, fonts: Fonts) {
  if (!["text", "stamp", "field"].includes(object.kind)) return;
  const font = fonts[object.font],
    label = object.fieldName || object.text.slice(0, 30) || "Text object";
  checkGlyphs(object.text, font, label);
  object.options.forEach((option) => checkGlyphs(option, fonts.sans, label));
  if (object.kind === "field") return;
  const lines = wrapText(object.text, font, object.fontSize, object.width);
  if (
    (lines.length - 1) * object.fontSize * 1.25 + object.fontSize > object.height ||
    lines.some((line) => font.widthOfTextAtSize(line, object.fontSize) > object.width)
  ) {
    throw new Error(
      `The text “${label}” does not fit its box. Enlarge the box or reduce the font size before export.`
    );
  }
}
