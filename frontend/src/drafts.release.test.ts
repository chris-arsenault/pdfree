import { beforeAll, afterAll, expect, it } from "vitest";
import { chromium, firefox, webkit, type Browser, type Page } from "playwright";
import { startTestServer } from "../tooling/testServer";
import { formFixture } from "./core/fixtures";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

let browser: Browser, server: Awaited<ReturnType<typeof startTestServer>>;
beforeAll(async () => {
  server = await startTestServer();
  const engines = { chromium, firefox, webkit };
  const name = process.env.PDFREE_BROWSER ?? "chromium";
  if (!(name in engines)) throw new Error("Choose chromium, firefox or webkit.");
  browser = await engines[name as keyof typeof engines].launch({ headless: true });
  await mkdir("test-results", { recursive: true });
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});
async function fillDraft(page: Page, name: string, value: string) {
  await page.goto(server.url);
  await page
    .locator(".drop-card input")
    .setInputFiles({ name, mimeType: "application/pdf", buffer: Buffer.from(await formFixture()) });
  await page.getByText("PAGE 1 OF 3", { exact: true }).waitFor();
  await page.getByRole("textbox", { name: "name", exact: true }).fill(value);
  await page
    .getByText("Draft saved on this device", { exact: true })
    .waitFor({ state: "attached" });
}

it("keeps two tabs drafts separate across reload and deletes only the selected library document", async () => {
  const context = await browser.newContext();
  try {
    const first = await context.newPage(),
      second = await context.newPage();
    first.on("dialog", (dialog) => dialog.accept());
    second.on("dialog", (dialog) => dialog.accept());
    await fillDraft(first, "First.pdf", "First tab");
    await fillDraft(second, "Second.pdf", "Second tab");
    await first.reload();
    await first.getByRole("button", { name: "Recover draft", exact: true }).click();
    expect(await first.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
      "First tab"
    );
    await first.getByText("Draft saved on this device", { exact: true }).waitFor();
    await second.reload();
    await second.getByRole("button", { name: "Recover draft", exact: true }).click();
    expect(await second.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
      "Second tab"
    );
    await second.getByText("Draft saved on this device", { exact: true }).waitFor();
    await first.getByRole("button", { name: "Library", exact: true }).click();
    await second.getByRole("button", { name: "Library", exact: true }).click();
    await second.getByRole("button", { name: "Delete First.pdf", exact: true }).click();
    await second
      .getByRole("dialog", { name: "Delete First.pdf?", exact: true })
      .getByRole("button", { name: "Delete document", exact: true })
      .click();
    await expect
      .poll(() => first.getByRole("button", { name: "Open First.pdf", exact: true }).count())
      .toBe(0);
    await first.getByRole("button", { name: "Open Second.pdf", exact: true }).waitFor();
    await expect
      .poll(() =>
        second
          .getByRole("dialog", { name: "Library", exact: true })
          .evaluate((element) => element.contains(document.activeElement))
      )
      .toBe(true);
    await second.getByRole("button", { name: "Close dialog", exact: true }).click();
    expect(await second.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
      "Second tab"
    );
    await second.getByRole("textbox", { name: "name", exact: true }).fill("Second continued");
    await second.getByText("Saving draft…", { exact: true }).waitFor();
    await second.getByText("Draft saved on this device", { exact: true }).waitFor();
    await second.reload();
    await second.getByRole("button", { name: "Recover draft", exact: true }).click();
    expect(await second.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
      "Second continued"
    );
    await first.getByRole("button", { name: "Close dialog", exact: true }).click();
    expect(await first.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
      "First tab"
    );
    await first.getByRole("textbox", { name: "name", exact: true }).fill("First new edit");
    await first.getByText("Saving draft…", { exact: true }).waitFor();
    await first.getByText("Draft saved on this device", { exact: true }).waitFor();
    await first.getByRole("button", { name: "Library", exact: true }).click();
    await first.getByRole("button", { name: "Open First.pdf", exact: true }).waitFor();
  } finally {
    await context.close();
  }
});

it.each([1280, 320])("keeps the library accessible and contained at %ipx", async (width) => {
  const context = await browser.newContext({ viewport: { width, height: 844 } });
  try {
    const page = await context.newPage();
    await fillDraft(page, "A long saved document filename.pdf", "Saved value");
    await prepareSignature(page, "Alice");
    await page.getByRole("button", { name: "Use signature" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page.getByRole("button", { name: "Library", exact: true }).click();
    const library = page.getByRole("dialog", { name: "Library", exact: true });
    await library
      .getByRole("button", { name: "Open A long saved document filename.pdf", exact: true })
      .waitFor();
    await library.getByRole("button", { name: "Use Alice", exact: true }).waitFor();
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
    expect(await library.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true
    );
    await page.screenshot({
      path: `test-results/${process.env.PDFREE_BROWSER ?? "chromium"}-library-${width}.png`,
    });
  } finally {
    await context.close();
  }
});

async function prepareSignature(page: Page, name: string) {
  await page.getByRole("button", { name: "Sign", exact: true }).click();
  await page.getByRole("button", { name: "Type", exact: true }).click();
  await page.getByRole("textbox", { name: "Your name or initials" }).fill(name);
  await page.getByRole("checkbox", { name: "Remember on this device" }).check();
}

it("retains signatures saved concurrently in two tabs and preserves an addition during removal", async () => {
  const context = await browser.newContext();
  try {
    const first = await context.newPage(),
      second = await context.newPage();
    await fillDraft(first, "First.pdf", "First tab");
    await fillDraft(second, "Second.pdf", "Second tab");
    await prepareSignature(first, "Alice");
    await prepareSignature(second, "Bob");
    await Promise.all(
      [first, second].map((page) => page.getByRole("button", { name: "Use signature" }).click())
    );
    await Promise.all(
      [first, second].map((page) => page.getByRole("dialog").waitFor({ state: "hidden" }))
    );
    await first.getByRole("button", { name: "Sign", exact: true }).click();
    await first.getByRole("button", { name: "Alice", exact: true }).waitFor();
    await first.getByRole("button", { name: "Bob", exact: true }).waitFor();
    await prepareSignature(second, "Charlie");
    await Promise.all([
      first.getByRole("button", { name: "Remove Alice", exact: true }).click(),
      second.getByRole("button", { name: "Use signature" }).click(),
    ]);
    await first.getByRole("button", { name: "Alice", exact: true }).waitFor({ state: "hidden" });
    await second.getByRole("dialog").waitFor({ state: "hidden" });
    await second.getByRole("button", { name: "Sign", exact: true }).click();
    await second.getByRole("button", { name: "Charlie", exact: true }).waitFor();
    expect(await second.getByRole("button", { name: "Bob", exact: true }).count()).toBe(1);
    expect(await second.getByRole("button", { name: "Alice", exact: true }).count()).toBe(0);
  } finally {
    await context.close();
  }
});
