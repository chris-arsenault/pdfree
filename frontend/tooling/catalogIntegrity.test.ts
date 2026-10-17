import { expect, it } from "vitest";
import { en } from "../src/i18n/en";
import { catalogIssues, logicalKeys } from "./catalogIntegrity";

it("accepts the complete English catalog", () => {
  expect(catalogIssues("en", en)).toEqual([]);
});
it("rejects missing messages, empty text and mismatched interpolation", () => {
  const missing: Record<string, string> = { ...en };
  delete missing["language.title"];
  missing["common.cancel"] = " ";
  missing["language.choose"] = "Language";
  expect(catalogIssues("en", missing)).toEqual(
    expect.arrayContaining([
      "Missing copy: language.title",
      "Missing copy: common.cancel",
      "Interpolation differs: language.choose",
    ])
  );
});
it("requires locale-native plurals, including all six Arabic forms", () => {
  const catalog: Record<string, string> = { ...en };
  expect(catalogIssues("ar", catalog)).toContain("Missing copy: common.pages_two");
  for (const key of logicalKeys)
    if (Object.hasOwn(en, key + "_one"))
      for (const form of new Intl.PluralRules("ar").resolvedOptions().pluralCategories)
        catalog[key + "_" + form] = en[key as keyof typeof en];
  expect(catalogIssues("ar", catalog)).toEqual([]);
  delete catalog["common.pages_few"];
  expect(catalogIssues("ar", catalog)).toContain("Missing copy: common.pages_few");
});
