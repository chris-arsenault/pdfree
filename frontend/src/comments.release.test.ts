import { afterAll, beforeAll, expect, it } from "vitest";
import { chromium, firefox, webkit, type Browser } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, readFile } from "node:fs/promises";
import { PDFDocument, degrees } from "pdf-lib";
import { startTestServer } from "../tooling/testServer";
import { commentFixture } from "./core/commentFixture";
import { importPdf } from "./core/importPdf";
import { readProject } from "./core/projects";

let browser: Browser, server: Awaited<ReturnType<typeof startTestServer>>;
const engine = process.env.PDFREE_BROWSER ?? "chromium";
beforeAll(async () => {
  server = await startTestServer();
  const engines = { chromium, firefox, webkit };
  browser = await engines[engine as keyof typeof engines].launch({ headless: true });
  await mkdir("test-results", { recursive: true });
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});

it.each([1280, 320])(
  "uses notes and replies, custom deletion and keyboard focus at %ipx",
  async (width) => {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    const dialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      dialogs.push(dialog.type());
      await dialog.dismiss();
    });
    try {
      await page.goto(server.url);
      await page.locator(".drop-card input").setInputFiles({
        name: "comments.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from(await commentFixture()),
      });
      const marker = page.getByRole("button", { name: "Comment: Review café 東京", exact: true });
      await marker.waitFor();
      await marker.press("Enter");
      await page.getByRole("button", { name: "Edit comment", exact: true }).click();
      const editing = page.getByRole("textbox", { name: "Edit comment", exact: true });
      expect(await editing.evaluate((element) => element === document.activeElement)).toBe(true);
      await editing.fill("Reviewed café 東京");
      await page.getByRole("button", { name: "Save comment", exact: true }).click();
      await page.getByRole("button", { name: "Reply", exact: true }).click();
      await page.getByRole("textbox", { name: "Reply", exact: true }).fill("Thanks for checking");
      await page.getByRole("textbox", { name: "Name (optional)", exact: true }).fill("Renée");
      await page.getByRole("button", { name: "Post reply", exact: true }).click();
      await page.locator(".comment-entry p").filter({ hasText: "Thanks for checking" }).waitFor();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width
      );
      const accessibility = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        accessibility.violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => node.target),
        }))
      ).toEqual([]);
      await page.screenshot({ path: `test-results/${engine}-comments-${width}.png` });
      await page.getByRole("button", { name: "Delete comment", exact: true }).click();
      await page
        .getByRole("dialog", { name: "Delete this comment thread?", exact: true })
        .waitFor();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Hide comments", exact: true }).click();
      await page.getByRole("button", { name: "Export", exact: true }).click();
      const downloading = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download PDF", exact: true }).click();
      const saved = await downloading;
      const imported = await importPdf(
        new Uint8Array(await readFile((await saved.path())!)),
        "saved.pdf"
      );
      expect(
        imported.pages[0].comments.some((comment) => comment.text === "Reviewed café 東京")
      ).toBe(true);
      const reply = imported.pages[0].comments.find(
        (comment) => comment.text === "Thanks for checking"
      )!;
      expect(reply.author).toBe("Renée");
      expect(reply.parentId).toBe(imported.pages[0].comments[0].id);
      await page.getByRole("button", { name: "Export", exact: true }).click();
      const projectDownloading = page.waitForEvent("download");
      await page.getByRole("radio", { name: "Editing project", exact: true }).click();
      await page.getByRole("button", { name: "Download editing project", exact: true }).click();
      const projectFile = await projectDownloading;
      const project = await readProject(
        new Uint8Array(await readFile((await projectFile.path())!))
      );
      expect(
        project.pages[0].comments.some((comment) => comment.text === "Thanks for checking")
      ).toBe(true);
      expect(dialogs).toEqual([]);
    } finally {
      await context.close();
    }
  }
);

it("places a note on a rotated cropped page and keeps its location through PDF export", async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 844 } });
  const page = await context.newPage();
  try {
    const source = await PDFDocument.create();
    source.addPage([600, 800]).setCropBox(50, 100, 500, 650);
    source.getPage(0).setRotation(degrees(90));
    await page.goto(server.url);
    await page.locator(".drop-card input").setInputFiles({
      name: "cropped.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from(await source.save()),
    });
    await page.locator(".page-surface").waitFor();
    await page.getByRole("button", { name: "Comment", exact: true }).click();
    await page.locator(".page-surface").click({ position: { x: 100, y: 100 } });
    await page
      .getByRole("textbox", { name: "New comment", exact: true })
      .fill("Check this location");
    await page.getByRole("button", { name: "Post comment", exact: true }).click();
    const marker = await page
      .getByRole("button", { name: "Comment: Check this location", exact: true })
      .boundingBox();
    const surface = await page.locator(".page-surface").boundingBox();
    expect(marker!.x - surface!.x).toBeCloseTo(100, 0);
    expect(marker!.y - surface!.y).toBeCloseTo(100, 0);
    await page.getByRole("button", { name: "Hide comments", exact: true }).click();
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF", exact: true }).click();
    const download = await downloading;
    const exported = await importPdf(
      new Uint8Array(await readFile((await download.path())!)),
      "saved.pdf"
    );
    expect(exported.pages[0].rotation).toBe(90);
    expect(exported.pages[0].comments[0].text).toBe("Check this location");
  } finally {
    await context.close();
  }
});
