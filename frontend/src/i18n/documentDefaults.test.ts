import { readFileSync } from "node:fs";
import { create } from "@pdf-lib/fontkit";
import { expect, it } from "vitest";
import { locales } from "./locales";
import { en } from "./en";
import { installCatalogLoader, selectLocale } from "./runtime";
import { formatDocumentDate } from "./format";

const font = create(readFileSync(new URL("../assets/NotoSans-Regular.ttf", import.meta.url)));
it.each(locales)(
  "keeps a new date exportable with the bundled PDF font for $code",
  async ({ code }) => {
    // Catalog prose is irrelevant to the date-formatting contract.
    const restore = installCatalogLoader(async () => en);
    try {
      await selectLocale(code, false);
      const value = formatDocumentDate(new Date(2026, 9, 17, 12));
      expect(value).toContain("2026");
      expect(
        [...value].every((character) => font.hasGlyphForCodePoint(character.codePointAt(0)!))
      ).toBe(true);
    } finally {
      await selectLocale("en", false);
      restore();
    }
  }
);
it("retains the selected locale's numeric date order", async () => {
  const restore = installCatalogLoader(async () => en);
  try {
    const value = new Date(2026, 9, 17, 12);
    await selectLocale("en", false);
    expect(formatDocumentDate(value)).toBe("10/17/2026");
    await selectLocale("de", false);
    expect(formatDocumentDate(value)).toBe("17.10.2026");
    await selectLocale("ja", false);
    expect(formatDocumentDate(value)).toBe("2026/10/17");
  } finally {
    await selectLocale("en", false);
    restore();
  }
});
