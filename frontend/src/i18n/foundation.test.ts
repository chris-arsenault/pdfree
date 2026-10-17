import { expect, it, vi } from "vitest";
import { negotiateLocale, matchLocale } from "./locales";
import { message, MessageError, errorMessage, isMessage } from "./messages";
import {
  installCatalogLoader,
  selectLocale,
  currentLocale,
  renderMessage,
  languageIssue,
} from "./runtime";
import { en } from "./en";

it("resolves saved choices and browser region/script preferences explicitly", () => {
  expect(negotiateLocale("de", ["fr-CA"])).toBe("de");
  expect(negotiateLocale("invalid", ["xx", "fr-CA"])).toBe("fr");
  expect(matchLocale("zh-Hant-CN")).toBe("zh-Hant");
  expect(matchLocale("zh-Hans-TW")).toBe("zh-Hans");
  expect(matchLocale("zh-HK")).toBe("zh-Hant");
  expect(matchLocale("zh-SG")).toBe("zh-Hans");
  expect(matchLocale("pt-PT")).toBe("pt-BR");
  expect(negotiateLocale(null, ["xx"])).toBe("en");
});
it("retains typed messages across structured cloning and rejects invalid worker payloads", () => {
  const ui = message("language.choose", { language: "日本語" });
  expect(isMessage(structuredClone(ui))).toBe(true);
  expect(Object.keys(structuredClone(ui))).toEqual(["key", "values"]);
  expect(isMessage({ ...ui, password: "must-not-travel" })).toBe(false);
  expect(isMessage({ key: "common.cancel", values: { password: "must-not-travel" } })).toBe(false);
  expect(isMessage({ key: "language.choose", values: {} })).toBe(false);
  expect(isMessage({ key: "missing", values: {} })).toBe(false);
  expect(errorMessage(new MessageError(ui))).toEqual(ui);
  expect(errorMessage(new Error("untrusted third-party text"))).toEqual(
    message("errors.operation")
  );
});
it("selects atomically, preserves the active locale on failure and uses plural rules", async () => {
  installCatalogLoader(async () => en);
  await selectLocale("en", false);
  expect(renderMessage(message("common.pages", { count: 1 }))).toBe("1 page");
  expect(renderMessage(message("common.pages", { count: 2 }))).toBe("2 pages");
  installCatalogLoader(async () => {
    throw new Error("network");
  });
  expect(await selectLocale("fr", false)).toBe(false);
  expect(currentLocale()).toBe("en");
  expect(languageIssue()?.key).toBe("language.loadFailed");
  installCatalogLoader(async () => en);
  await selectLocale("en", false);
});
it("ignores a superseded language load", async () => {
  let complete: (catalog: typeof en) => void = () => {};
  installCatalogLoader((locale) =>
    locale === "fr"
      ? new Promise((resolve) => {
          complete = resolve;
        })
      : Promise.resolve(en)
  );
  const stale = selectLocale("fr", false);
  await selectLocale("de", false);
  complete(en);
  expect(await stale).toBe(false);
  expect(currentLocale()).toBe("de");
  installCatalogLoader(async () => en);
  await selectLocale("en", false);
});
it("keeps the page language when browser preference storage fails", async () => {
  vi.stubGlobal("localStorage", {
    setItem: () => {
      throw new Error("blocked");
    },
  });
  try {
    installCatalogLoader(async () => en);
    expect(await selectLocale("fr")).toBe(true);
    expect(currentLocale()).toBe("fr");
    expect(languageIssue()?.key).toBe("language.saveFailed");
  } finally {
    vi.unstubAllGlobals();
    await selectLocale("en", false);
  }
});
