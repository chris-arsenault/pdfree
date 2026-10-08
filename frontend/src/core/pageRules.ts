import { degrees, type PDFDocument } from "pdf-lib";
import { type EditorDocument, type Page, type PageRule } from "./model";
import { displaySize, toPdf } from "./coordinates";
import { type Fonts, pdfColor } from "./drawObjects";
export function ruleText(document: EditorDocument, page: Page, rule: PageRule) {
  if (rule.kind !== "number") return rule.text;
  const position = document.pages
    .filter((page) => !rule.pageIds.length || rule.pageIds.includes(page.id))
    .findIndex((item) => item.id === page.id);
  return `${rule.text}${String(rule.start + position).padStart(rule.padding, "0")}`;
}
export function pageRules(document: EditorDocument, page: Page) {
  return (document.rules ?? []).filter(
    (rule) => !rule.pageIds.length || rule.pageIds.includes(page.id)
  );
}
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
      if (dimensions.height < rule.fontSize + 48)
        throw new Error("Page rule text is too tall for this page. Use a smaller font.");
      if ([...text].some((character) => !supported.has(character.codePointAt(0)!)))
        throw new Error("Page rule text contains characters unsupported by the PDF font.");
      const width = fonts.sans.widthOfTextAtSize(text, rule.fontSize);
      if (width > dimensions.width - 24)
        throw new Error(
          "Page rule text is too wide for this page. Use a smaller font or shorter label."
        );
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
export function ruleY(rule: PageRule, height: number) {
  if (rule.position === "top") return 24 + rule.fontSize;
  return rule.position === "bottom" ? height - 24 : height / 2;
}
