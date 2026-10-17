import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { create } from "@pdf-lib/fontkit";
import { locales, type Locale } from "./locales";
import { loadCatalog } from "./catalogs";
import { catalogIssues } from "../../tooling/catalogIntegrity";
import { installCatalogLoader, renderMessage, selectLocale, text } from "./runtime";
import { message } from "./messages";
const font = create(readFileSync(new URL("../assets/NotoSans-Regular.ttf", import.meta.url)));

it("selects native plural forms and digits across language families", async () => {
  const restore = installCatalogLoader(loadCatalog);
  const cases: [Locale, number, string][] = [
    ["ru", 1, "1 слово"],
    ["ru", 2, "2 слова"],
    ["ru", 5, "5 слов"],
    ["ru", 21, "21 слово"],
    ["ar", 0, "لا كلمات ({{count}})"],
    ["ar", 1, "كلمة واحدة ({{count}})"],
    ["ar", 2, "كلمتان ({{count}})"],
    ["ar", 3, "{{count}} كلمات"],
    ["ar", 11, "{{count}} كلمة"],
    ["ar", 100, "{{count}} كلمة"],
    ["zh-Hans", 2, "2 个词"],
    ["ja", 2, "2 語"],
    ["ko", 2, "2단어"],
    ["hi", 2, "2 शब्द"],
    ["bn", 2, "২টি শব্দ"],
    ["tr", 2, "2 kelime"],
    ["vi", 2, "2 từ"],
  ];
  try {
    for (const [locale, count, expected] of cases) {
      expect(await selectLocale(locale, false)).toBe(true);
      expect(text("ocr.words", { count })).toBe(
        expected.replace("{{count}}", new Intl.NumberFormat(locale).format(count))
      );
    }
    await selectLocale("es", false);
    expect(
      renderMessage(
        message("document.summary", {
          pages: [message("common.pages", { count: 1 })],
          sources: [message("document.sourceCount", { count: 2 })],
          images: [message("document.imageCount", { count: 0 })],
        })
      )
    ).toBe("1 página · 2 PDF de origen · 0 imágenes locales");
  } finally {
    await selectLocale("en", false);
    restore();
  }
});

it.each(locales)("has complete copy and native plurals for $code", async ({ code }) => {
  const catalog = await loadCatalog(code);
  expect(catalogIssues(code, catalog)).toEqual([]);
  expect(
    [...catalog["defaults.stamp"]].every((character) =>
      font.hasGlyphForCodePoint(character.codePointAt(0)!)
    )
  ).toBe(true);
});
it("renders real Spanish plurals and nested messages without English fallback", async () => {
  const restore = installCatalogLoader(loadCatalog);
  try {
    await selectLocale("es", false);
    expect(text("ocr.words", { count: 1 })).toBe("1 palabra");
    expect(text("ocr.words", { count: 2 })).toBe("2 palabras");
    expect(text("cleanup.summaryStraightened", { count: 1 })).toBe("1 enderezada");
    expect(text("cleanup.summaryStraightened", { count: 2 })).toBe("2 enderezadas");
    expect(text("common.deleteQuestion", { name: "東京.pdf" })).toBe("¿Eliminar 東京.pdf?");
  } finally {
    await selectLocale("en", false);
    restore();
  }
});
