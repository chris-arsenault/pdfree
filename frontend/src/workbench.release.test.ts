import { beforeAll, afterAll, expect, it } from "vitest";
import { chromium, firefox, webkit, type Browser, type Page } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { PNG } from "pngjs";
import { startTestServer } from "../tooling/testServer";
import { formFixture } from "./core/fixtures";
import { encryptedFixture } from "../tooling/encryptedFixture";
import { readProject } from "./core/projects";

let browser: Browser, server: Awaited<ReturnType<typeof startTestServer>>;
const engineName = process.env.PDFREE_BROWSER ?? "chromium";
beforeAll(async () => {
  server = await startTestServer();
  const engines = { chromium, firefox, webkit };
  if (!(engineName in engines)) throw new Error("Choose chromium, firefox or webkit.");
  browser = await engines[engineName as keyof typeof engines].launch({ headless: true });
  await mkdir("test-results", { recursive: true });
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});
async function open(page: Page, bytes: Uint8Array | null = null) {
  await page.goto(server.url);
  await page.locator(".drop-card input").setInputFiles({
    name: "workbench.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(bytes ?? (await formFixture())),
  });
  await page.getByRole("region", { name: "PDF page", exact: true }).waitFor();
}
async function accessible(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    result.violations.map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    }))
  ).toEqual([]);
}
async function waitForSampleText(page: Page) {
  await expect
    .poll(
      () =>
        page.locator(".page-surface .pdf-canvas").evaluate((canvas: HTMLCanvasElement) => {
          const context = canvas.getContext("2d");
          if (!context) return false;
          const pixels = context.getImageData(
            Math.floor((40 / 612) * canvas.width),
            Math.floor((210 / 792) * canvas.height),
            Math.ceil((260 / 612) * canvas.width),
            Math.ceil((40 / 792) * canvas.height)
          ).data;
          for (let index = 0; index < pixels.length; index += 4) {
            if (pixels[index + 3] > 0 && pixels[index] < 150) return true;
          }
          return false;
        }),
      { timeout: 10_000 }
    )
    .toBe(true);
}

it.each([1280, 320])(
  "confirms selected-page deletion with safe focus and cancellation at %ipx",
  async (width) => {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    const page = await context.newPage();
    const nativeDialogs: string[] = [];
    page.on("dialog", async (dialog) => {
      nativeDialogs.push(dialog.type());
      await dialog.dismiss();
    });
    try {
      await open(page);
      const narrow = width < 760;
      if (narrow) await page.getByRole("button", { name: "Pages", exact: true }).click();
      await page.getByRole("checkbox", { name: "Select page 1", exact: true }).check();
      await page.getByRole("checkbox", { name: "Select page 3", exact: true }).check();
      const remove = page.getByRole("button", { name: "Delete pages", exact: true });
      const dialog = page.getByRole("dialog", { name: "Delete 2 selected pages?", exact: true });
      await remove.click();
      await expect
        .poll(() =>
          dialog
            .getByRole("button", { name: "Cancel" })
            .evaluate((element) => element === document.activeElement)
        )
        .toBe(true);
      await page.keyboard.press("Tab");
      await expect
        .poll(() =>
          dialog
            .getByRole("button", { name: "Delete pages", exact: true })
            .evaluate((element) => element === document.activeElement)
        )
        .toBe(true);
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await expect
        .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
        .toBe(true);
      await accessible(page);
      await page.screenshot({ path: `test-results/${engineName}-confirmation-${width}.png` });
      await page.keyboard.press("Escape");
      await dialog.waitFor({ state: "hidden" });
      await expect
        .poll(() =>
          remove.evaluate((element) =>
            element === document.activeElement
              ? "trigger"
              : document.activeElement?.outerHTML.slice(0, 240)
          )
        )
        .toBe("trigger");
      expect(
        await page.getByRole("checkbox", { name: "Select page 1", exact: true }).isChecked()
      ).toBe(true);
      expect(
        await page.getByRole("checkbox", { name: "Select page 3", exact: true }).isChecked()
      ).toBe(true);
      if (narrow)
        expect(await page.getByRole("dialog", { name: "Pages", exact: true }).isVisible()).toBe(
          true
        );
      await remove.click();
      await page.keyboard.press("Enter");
      await dialog.waitFor({ state: "hidden" });
      await remove.click();
      await dialog.getByRole("button", { name: "Delete pages", exact: true }).click();
      if (narrow) await page.getByRole("button", { name: "Hide pages", exact: true }).click();
      await page.getByText("PAGE 1 OF 1", { exact: true }).waitFor();
      await page.getByRole("button", { name: "Undo", exact: true }).click();
      await page.getByText("PAGE 1 OF 3", { exact: true }).waitFor();
      expect(nativeDialogs).toEqual([]);
    } finally {
      await context.close();
    }
  }
);

it("keeps export settings when canceling a nested confirmation and downloads decrypted project bytes only with consent", async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const nativeDialogs: string[] = [],
    downloads: string[] = [];
  page.on("dialog", async (dialog) => {
    nativeDialogs.push(dialog.type());
    await dialog.dismiss();
  });
  page.on("download", (download) => downloads.push(download.suggestedFilename()));
  try {
    await open(page, await encryptedFixture("AES-256", ""));
    await page.getByRole("button", { name: "Export", exact: true }).click();
    await page.getByRole("textbox", { name: "File name", exact: true }).fill("Private.pdf");
    await page.getByRole("radio", { name: "Editing project", exact: true }).click();
    const project = page.getByRole("button", { name: "Download editing project", exact: true });
    const dialog = page.getByRole("dialog", {
      name: "Download an unprotected project?",
      exact: true,
    });
    await project.click();
    await accessible(page);
    await page.screenshot({ path: `test-results/${engineName}-project-confirmation.png` });
    await page.keyboard.press("Escape");
    await dialog.waitFor({ state: "hidden" });
    expect(await page.getByRole("textbox", { name: "File name", exact: true }).inputValue()).toBe(
      "Private.pdf"
    );
    expect(downloads).toEqual([]);
    await expect
      .poll(() =>
        project.evaluate((element) =>
          element === document.activeElement
            ? "trigger"
            : document.activeElement?.outerHTML.slice(0, 240)
        )
      )
      .toBe("trigger");
    await project.click();
    const downloading = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download project", exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe("Private.pdfree");
    const path = await download.path();
    expect(path).not.toBeNull();
    const restored = await readProject(new Uint8Array(await readFile(path!)));
    expect(restored.pages).toHaveLength(3);
    expect(restored.sources[0].decryptedBytes?.length).toBeGreaterThan(0);
    expect(nativeDialogs).toEqual([]);
  } finally {
    await context.close();
  }
});

it("keeps common desktop actions stable, explains icons and exposes contextual properties", async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await open(page);
    await waitForSampleText(page);
    expect(await page.locator(".inspector").count()).toBe(0);
    const text = page.getByRole("button", { name: "Text", exact: true });
    const before = await text.boundingBox();
    await page.screenshot({ path: `test-results/${engineName}-workbench.png` });
    await page.getByRole("button", { name: "Initials", exact: true }).hover();
    await expect
      .poll(() => page.getByRole("tooltip").textContent())
      .toContain("Draw, type or import your initials.");
    const tooltip = await page.getByRole("tooltip").boundingBox();
    expect(tooltip!.x).toBeGreaterThanOrEqual(0);
    expect(tooltip!.x + tooltip!.width).toBeLessThanOrEqual(1280);
    await page.getByRole("tooltip").hover();
    expect(await page.getByRole("tooltip").isVisible()).toBe(true);
    await page.keyboard.press("Escape");
    await text.click();
    await page.locator(".page-surface").click({ position: { x: 70, y: 100 } });
    await page.getByRole("textbox", { name: "Object text", exact: true }).fill("Review note");
    expect(await text.boundingBox()).toEqual(before);
    expect(await page.getByRole("spinbutton", { name: "Stroke width", exact: true }).count()).toBe(
      0
    );
    await page.getByRole("button", { name: "Center text", exact: true }).click();
    await accessible(page);
    await page.screenshot({ path: `test-results/${engineName}-workbench-properties.png` });
    await page.getByRole("button", { name: "Hide properties", exact: true }).click();
    expect(
      await page
        .getByRole("button", { name: "text: Review note", exact: true })
        .getAttribute("aria-pressed")
    ).toBe("true");
  } finally {
    await context.close();
  }
});

it.each([390, 320])(
  "keeps touch actions accessible at %ipx and places properties below the canvas",
  async (width) => {
    const context = await browser.newContext({ viewport: { width, height: 844 }, hasTouch: true });
    const page = await context.newPage();
    try {
      await open(page);
      await waitForSampleText(page);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width
      );
      const toolbar = page.locator(".toolbar");
      expect(await toolbar.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
        true
      );
      await page.getByRole("button", { name: "Add", exact: true }).tap();
      await page.getByRole("button", { name: "Box", exact: true }).tap();
      await page.screenshot({ path: `test-results/${engineName}-workbench-touch-${width}.png` });
      await page.getByRole("button", { name: "Text", exact: true }).tap();
      await page.locator(".page-surface").tap({ position: { x: 70, y: 100 } });
      await page.getByRole("textbox", { name: "Object text", exact: true }).fill("Touch note");
      const sheet = await page.locator(".inspector").boundingBox();
      const canvas = await page.locator(".page-scroll").boundingBox();
      expect(sheet!.y).toBeGreaterThanOrEqual(canvas!.y + canvas!.height - 1);
      await accessible(page);
      await page.screenshot({ path: `test-results/${engineName}-workbench-sheet-${width}.png` });
      await page.getByRole("button", { name: "Hide properties", exact: true }).tap();
      await page.getByRole("button", { name: "Pages", exact: true }).tap();
      await page.getByRole("button", { name: "Current page", exact: true }).tap();
      await page.getByRole("radio", { name: "All pages", exact: true }).tap();
      await expect
        .poll(() => page.getByRole("button", { name: "All pages", exact: true }).count())
        .toBe(1);
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Insert", exact: true }).tap();
      await expect
        .poll(() => page.getByRole("button", { name: /^Merge PDFs/ }).isVisible())
        .toBe(true);
      await accessible(page);
      await page.getByRole("button", { name: /^Merge PDFs/ }).focus();
      await page.keyboard.press("Tab");
      await expect
        .poll(() => page.getByRole("dialog", { name: "Insert", exact: true }).count())
        .toBe(0);
      expect(
        await page
          .getByRole("dialog", { name: "Pages", exact: true })
          .evaluate((element) => element.contains(document.activeElement))
      ).toBe(true);
      await page.getByRole("button", { name: "More", exact: true }).tap();
      await page.keyboard.press("Escape");
      await expect
        .poll(() => page.getByRole("dialog", { name: "Pages", exact: true }).isVisible())
        .toBe(true);
      await page.getByRole("button", { name: "Hide pages", exact: true }).tap();
    } finally {
      await context.close();
    }
  }
);

it("remounts the Pages pane with working virtualization and active-page navigation", async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    const pdf = await PDFDocument.create();
    for (let index = 0; index < 30; index++) pdf.addPage([612, 792]);
    await open(page, await pdf.save());
    await page.getByRole("button", { name: "Hide pages", exact: true }).click();
    await page.getByRole("spinbutton", { name: "Page", exact: true }).fill("25");
    await page.getByRole("button", { name: "Pages", exact: true }).click();
    await page.getByRole("button", { name: "Go to page 25", exact: true }).waitFor();
    await page.locator(".thumbnail-list").evaluate((element) => {
      element.scrollTop = 29 * 176;
    });
    await page.getByRole("button", { name: "Go to page 30", exact: true }).click();
    expect(await page.getByRole("spinbutton", { name: "Page", exact: true }).inputValue()).toBe(
      "30"
    );
    expect(await page.locator(".thumbnail-button").count()).toBeLessThan(12);
  } finally {
    await context.close();
  }
});

it("opens image selection from the keyboard and frees touch canvas space before placement", async () => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const page = await context.newPage();
  try {
    await open(page);
    await page.getByRole("button", { name: "Add", exact: true }).tap();
    await page.getByRole("button", { name: "Image", exact: true }).tap();
    await expect
      .poll(() =>
        page
          .getByRole("button", { name: "Add", exact: true })
          .evaluate((element) => element === document.activeElement)
      )
      .toBe(true);
    const choose = page.getByRole("button", { name: "Choose image", exact: true });
    const [picker] = await Promise.all([
      page.waitForEvent("filechooser", { timeout: 5_000 }),
      choose.press("Enter"),
    ]);
    expect(picker.isMultiple()).toBe(false);
    const png = new PNG({ width: 8, height: 8 });
    png.data.fill(255);
    await picker.setFiles({ name: "mark.png", mimeType: "image/png", buffer: PNG.sync.write(png) });
    await expect.poll(() => page.locator(".inspector").count()).toBe(0);
    await page.locator(".page-surface").tap({ position: { x: 70, y: 100 } });
    await page.getByRole("button", { name: "image: object", exact: true }).waitFor();
    expect(await page.getByRole("combobox", { name: "Font", exact: true }).count()).toBe(0);
    await page.getByRole("slider", { name: "Opacity", exact: true }).waitFor();
    await accessible(page);
  } finally {
    await context.close();
  }
});
