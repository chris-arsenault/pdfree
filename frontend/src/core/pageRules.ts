import { failure } from "../i18n/messages";
import { degrees, type PDFDocument } from "pdf-lib";
import { type EditorDocument, type Page } from "./model";
import { displaySize, toPdf } from "./coordinates";
import { type Fonts, pdfColor } from "./drawObjects";
import { ruleText, pageRules, ruleY } from "./ruleModel";
export { ruleText, pageRules, ruleY } from "./ruleModel";
export function writeRules(
  pdf: PDFDocument,
  document: EditorDocument,
  pages: Page[],
  fonts: Fonts
) {
  const supported = new Set(fonts.sans.getCharacterSet());
  pages.forEach((page, index) => {
    const dimensions = displaySize(page);
    for (const rule of pageRules(document, page)) {
      const text = ruleText(document, page, rule);
      if (dimensions.height < rule.fontSize + 48) throw failure("errors.ruleHeight");
      if ([...text].some((character) => !supported.has(character.codePointAt(0)!)))
        throw failure("errors.ruleFont");
      const width = fonts.sans.widthOfTextAtSize(text, rule.fontSize);
      if (width > dimensions.width - 24) throw failure("errors.ruleWidth");
      const position = toPdf(
        {
          x: (dimensions.width - width) / 2,
          y: ruleY(rule, dimensions.height),
        },
        page
      );
      pdf.getPage(index).drawText(text, {
        ...position,
        font: fonts.sans,
        size: rule.fontSize,
        rotate: degrees(page.rotation),
        color: pdfColor(rule.color),
        opacity: rule.opacity,
      });
    }
  });
}
