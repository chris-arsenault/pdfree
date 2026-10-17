import { type EditorDocument, type Page, type PageRule } from "./model";
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
export function ruleY(rule: PageRule, height: number) {
  if (rule.position === "top") return 24 + rule.fontSize;
  return rule.position === "bottom" ? height - 24 : height / 2;
}
