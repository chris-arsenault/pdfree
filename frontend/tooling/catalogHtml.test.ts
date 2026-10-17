import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { catalogHtml } from "./catalogHtml";
import { en } from "../src/i18n/en";

it("resolves actual HTML metadata from the canonical catalog", () => {
  const html = catalogHtml(readFileSync(new URL("../index.html", import.meta.url), "utf8"));
  expect(html).not.toContain("__PDFREE_");
  expect(html).toContain("<title>" + en["page.title"] + "</title>");
  expect(html).toContain(en["page.description"]);
});
it("rejects an unknown metadata placeholder", () => {
  expect(() => catalogHtml("__PDFREE_page.missing__")).toThrow("Unknown HTML catalog key");
});
