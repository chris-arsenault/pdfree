import { beforeAll, afterAll, expect, it } from "vitest";
import { chromium, firefox, webkit, type Browser, type Page } from "playwright";
import { startTestServer } from "../tooling/testServer";
import { formFixture } from "./core/fixtures";

let browser: Browser, server: Awaited<ReturnType<typeof startTestServer>>;
beforeAll(async () => {
  server = await startTestServer();
  const engines = { chromium, firefox, webkit };
  const name = process.env.PDFREE_BROWSER ?? "chromium";
  if (!(name in engines)) throw new Error("Choose chromium, firefox or webkit.");
  browser = await engines[name as keyof typeof engines].launch({ headless: true });
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
  await page.getByText("Draft saved on this device", { exact: true }).waitFor();
}

it("keeps two tabs drafts separate across reload and clearing fences the other tab", async () => {
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
    await first.getByRole("button", { name: "Clear local data", exact: true }).click();
    await first
      .getByText("Stored browser drafts and signatures cleared", { exact: true })
      .waitFor();
    await second.getByText("Stored drafts were cleared.", { exact: false }).waitFor();
    expect(await second.getByRole("textbox", { name: "name", exact: true }).inputValue()).toBe(
      "Second tab"
    );
    await second.reload();
    await second.getByRole("heading", { name: /^Your paperwork/ }).waitFor();
    expect(await second.getByRole("button", { name: "Recover draft", exact: true }).count()).toBe(
      0
    );
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
