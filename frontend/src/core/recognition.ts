import {
  beginText,
  endText,
  setFontAndSize,
  setTextMatrix,
  setTextRenderingMode,
  showText,
  TextRenderingMode,
  type PDFDocument,
} from "pdf-lib";
import { type Fonts } from "./drawObjects";
import { type Page, type Recognition, type TextWord } from "./model";
import { deskewMatrix } from "./scanCleanup";

export function recognizedPosition(page: Page, word: TextWord) {
  const [a, b, c, d, e, f] = deskewMatrix(page);
  return {
    x: a * word.x + c * word.y + e,
    y: b * word.x + d * word.y + f,
    angle: page.scan?.angle ?? 0,
  };
}
/** Words below this Tesseract confidence are flagged for review. */
export const uncertainConfidence = 60;
export function recognitionSummary(recognition: Recognition) {
  const words = recognition.words;
  const letters = words.reduce((sum, word) => sum + word.text.length, 0);
  // Weight by length so one-letter noise does not dominate the average.
  const confidence = letters
    ? words.reduce((sum, word) => sum + word.confidence * word.text.length, 0) / letters
    : 0;
  return {
    words: words.length,
    confidence: Math.round(confidence),
    uncertain: words.filter((word) => word.confidence < uncertainConfidence).length,
  };
}
/**
 * Groups recognized words into lines in their recognized reading order. A word
 * starts a new line when its baseline moves by more than half its height.
 */
export function recognizedLines(recognition: Recognition) {
  const lines: TextWord[][] = [];
  for (const word of recognition.words) {
    const line = lines.at(-1),
      previous = line?.at(-1);
    if (
      line &&
      previous &&
      Math.abs(previous.y - word.y) <= Math.max(previous.height, word.height) / 2
    )
      line.push(word);
    else lines.push([word]);
  }
  return lines;
}
export const recognizedText = (recognition: Recognition) =>
  recognizedLines(recognition)
    .map((line) => line.map((word) => word.text).join(" "))
    .join("\n");
export function writeRecognition(pdf: PDFDocument, pages: Page[], fonts: Fonts) {
  const supported = new Set(fonts.sans.getCharacterSet());
  pages.forEach((page, index) => {
    if (!page.recognition) return;
    const target = pdf.getPage(index);
    const font = target.node.newFontDictionary("OCR", fonts.sans.ref);
    for (const word of page.recognition.words) {
      if ([...word.text].some((character) => !supported.has(character.codePointAt(0)!)))
        throw new Error(
          "Recognized text contains a script unsupported by the bundled PDF font. Review recognition before exporting."
        );
      const size = Math.max(1, word.height),
        natural = fonts.sans.widthOfTextAtSize(word.text, size);
      if (!natural) continue;
      const position = recognizedPosition(page, word),
        angle = (position.angle * Math.PI) / 180;
      const horizontal = word.width / natural;
      target.pushOperators(
        beginText(),
        setFontAndSize(font, size),
        setTextRenderingMode(TextRenderingMode.Invisible),
        setTextMatrix(
          Math.cos(angle) * horizontal,
          Math.sin(angle) * horizontal,
          -Math.sin(angle),
          Math.cos(angle),
          position.x,
          position.y
        ),
        showText(fonts.sans.encodeText(word.text)),
        endText()
      );
    }
  });
}
