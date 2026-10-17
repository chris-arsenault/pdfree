import { en } from "../src/i18n/en";

const pluralSuffix = /_(zero|one|two|few|many|other)$/;
export const logicalKeys = Object.keys(en).filter((key) => !pluralSuffix.test(key));
const parameters = (text: string) =>
  [...new Set([...text.matchAll(/{{(\w+)}}/g)].map((match) => match[1]))].sort().join(",");
export function catalogIssues(locale: string, catalog: Record<string, string>): string[] {
  const issues: string[] = [];
  const forms = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  for (const key of logicalKeys) {
    checkValue(key, key, catalog, issues);
    if (Object.hasOwn(en, key + "_one"))
      forms.forEach((form) => checkValue(key + "_" + form, key, catalog, issues));
  }
  for (const key of Object.keys(catalog))
    if (!logicalKeys.includes(key.replace(pluralSuffix, ""))) issues.push("Unknown key: " + key);
    else checkValue(key, key.replace(pluralSuffix, ""), catalog, issues);
  return issues;
}
function checkValue(key: string, base: string, catalog: Record<string, string>, issues: string[]) {
  const value = catalog[key];
  if (!Object.hasOwn(catalog, key) || typeof value !== "string" || !value.trim()) {
    issues.push("Missing copy: " + key);
    return;
  }
  if (parameters(value) !== parameters(en[base as keyof typeof en]))
    issues.push("Interpolation differs: " + key);
}
