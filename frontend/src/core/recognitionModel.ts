import { type Page, type Recognition, type TextWord } from "./model";
import { deskewMatrix } from "./scanGeometry";
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
  const confidence = letters
    ? words.reduce((sum, word) => sum + word.confidence * word.text.length, 0) / letters
    : 0;
  return {
    words: words.length,
    confidence: Math.round(confidence),
    uncertain: words.filter((word) => word.confidence < uncertainConfidence).length,
  };
}
/** Group words in reading order; a baseline shift exceeding half the height starts a line. */
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
