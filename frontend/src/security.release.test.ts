import { beforeAll, afterAll, expect, it } from "vitest";
import { chromium, firefox, webkit, type Browser, type Page } from "playwright";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { getDocument, PermissionFlag } from "pdfjs-dist/legacy/build/pdf.mjs";
import AxeBuilder from "@axe-core/playwright";
import { startTestServer } from "../tooling/testServer";
import { formFixture } from "./core/fixtures";
import { verifyDownloadedSignature } from "../tooling/verifySignature";

let server: Awaited<ReturnType<typeof startTestServer>>, browser: Browser;
const engine = process.env.PDFREE_BROWSER ?? "chromium";
beforeAll(async () => {
  server = await startTestServer();
  if (!(engine in { chromium, firefox, webkit })) throw new Error("Choose a valid browser engine.");
  browser = await { chromium, firefox, webkit }[engine as "chromium" | "firefox" | "webkit"].launch(
    { headless: true }
  );
});
afterAll(async () => {
  await browser?.close();
  await server?.close();
});

async function expectFixtureAbsent(certificateFile: string) {
  const names = await readdir("dist/assets");
  expect(names.filter((name) => /\.p12$|\.pem$|signer/i.test(name))).toEqual([]);
  const fixture = (await readFile(`tooling/fixtures/${certificateFile}`)).toString("base64");
  for (const name of names.filter((file) => /\.m?js$/.test(file))) {
    const script = await readFile(`dist/assets/${name}`, "utf8");
    expect(script).not.toContain(fixture);
    expect(script).not.toContain("fixture-password");
  }
}

async function setupExport(page: Page, certificateFile: string) {
  await page.goto(server.url);
  await page.locator(".drop-card input").setInputFiles({
    name: "secure.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(await formFixture()),
  });
  await page.getByText("PAGE 1 OF 3", { exact: true }).waitFor();
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Production Ada");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("combobox", { name: "Certificate signing", exact: true }).selectOption("1");
  await page.locator('input[accept*=".p12"]').setInputFiles(`tooling/fixtures/${certificateFile}`);
  await page.getByLabel("Certificate password", { exact: true }).fill("fixture-password");
  await page.getByRole("checkbox", { name: "Protect PDF with passwords and permissions" }).check();
  await page.getByLabel("Opening password (optional)", { exact: true }).fill("reader-password");
  await page.getByLabel("Confirm opening password", { exact: true }).fill("reader-password");
  await page.getByLabel("Owner password", { exact: true }).fill("owner-password");
  await page.getByLabel("Confirm owner password", { exact: true }).fill("owner-password");
  await page.getByRole("checkbox", { name: "Allow copying and extraction" }).uncheck();
  await page.getByRole("checkbox", { name: "Allow content editing" }).uncheck();
}

it.each(["signer.p12", "ec-signer.p12"])(
  "exports %s through the production CSP without uploading credentials",
  async (certificateFile) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    const errors: string[] = [],
      requests: { url: string; method: string }[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) =>
      requests.push({ url: request.url(), method: request.method() })
    );
    try {
      await setupExport(page, certificateFile);
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
            .analyze()
        ).violations
      ).toEqual([]);
      const ready = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download PDF", exact: true }).click();
      const path = await (await ready).path();
      if (!path) throw new Error("The secured PDF did not download.");
      const bytes = new Uint8Array(await readFile(path));
      expect(verifyDownloadedSignature(bytes)).toBe(true);
      const tampered = bytes.slice();
      tampered[10] ^= 1;
      expect(verifyDownloadedSignature(tampered)).toBe(false);
      const pdf = await getDocument({
        data: bytes.slice(),
        password: "reader-password",
        standardFontDataUrl: `${resolve("public/pdfjs/standard_fonts")}/`,
      }).promise;
      try {
        expect(pdf.numPages).toBe(3);
        expect(
          (await (await pdf.getPage(1)).getAnnotations()).find(
            (field) => field.fieldName === "name"
          )?.fieldValue
        ).toBe("Production Ada");
        expect(await pdf.getPermissions()).not.toContain(PermissionFlag.COPY);
        expect(await pdf.getPermissions()).not.toContain(PermissionFlag.MODIFY_CONTENTS);
        expect(
          (await (await pdf.getPage(3)).getTextContent()).items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
        ).toContain("Sample page 3");
      } finally {
        await pdf.destroy();
      }
      const bad = getDocument({ data: bytes.slice(), password: "wrong" });
      try {
        await expect(bad.promise).rejects.toThrow("Incorrect Password");
      } finally {
        await bad.destroy();
      }
      expect(errors).toEqual([]);
      expect(
        requests.filter(
          (request) =>
            request.method !== "GET" ||
            (!request.url.startsWith(server.url) && !request.url.startsWith("blob:"))
        )
      ).toEqual([]);
      await expectFixtureAbsent(certificateFile);
    } finally {
      await context.close();
    }
  }
);
it.each(["R2-empty.pdf", "pubsec-256.pdf"])(
  "edits encrypted input %s through production workers and CSP",
  async (fixture) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors: string[] = [],
      requests: { url: string; method: string }[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) =>
      requests.push({ url: request.url(), method: request.method() })
    );
    try {
      await page.goto(server.url);
      await page
        .locator(".drop-card input")
        .setInputFiles(`tooling/fixtures/encryption/${fixture}`);
      if (fixture.startsWith("pubsec")) {
        await page.getByRole("dialog", { name: "Unlock PDF" }).waitFor();
        await page
          .locator('input[accept=".p12,.pfx"]')
          .setInputFiles("tooling/fixtures/encryption/recipient.p12");
        await page.getByLabel("Identity password", { exact: true }).fill("identity-fixture");
        await page.getByRole("button", { name: "Unlock PDF", exact: true }).click();
      }
      await page
        .getByRole("textbox", { name: "name", exact: true })
        .fill("Production encrypted Ada");
      await page.getByRole("button", { name: "Export", exact: true }).click();
      const download = page.waitForEvent("download");
      await page.getByRole("button", { name: "Download PDF", exact: true }).click();
      const path = await (await download).path();
      if (!path) throw new Error("The edited PDF did not download");
      const pdf = await getDocument({ data: new Uint8Array(await readFile(path)) }).promise;
      try {
        expect(pdf.numPages).toBe(3);
        expect(
          (await (await pdf.getPage(1)).getAnnotations()).find(
            (field) => field.fieldName === "name"
          )?.fieldValue
        ).toBe("Production encrypted Ada");
      } finally {
        await pdf.destroy();
      }
      expect(errors).toEqual([]);
      expect(
        requests.filter(
          (request) =>
            request.method !== "GET" ||
            (!request.url.startsWith(server.url) && !request.url.startsWith("blob:"))
        )
      ).toEqual([]);
      await expectFixtureAbsent("encryption/recipient.p12");
    } finally {
      await context.close();
    }
  }
);
it("signs and encrypts the completed N-up print derivative", async () => {
  const context = await browser.newContext(),
    page = await context.newPage();
  try {
    await setupExport(page, "signer.p12");
    await page.getByText("Pages per printed sheet", { exact: true }).click();
    await page.getByRole("combobox", { name: "Pages per sheet", exact: true }).selectOption("2");
    const ready = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download PDF", exact: true }).click();
    const bytes = new Uint8Array(await readFile((await (await ready).path())!));
    expect(verifyDownloadedSignature(bytes)).toBe(true);
    const pdf = await getDocument({
      data: bytes,
      password: "reader-password",
      standardFontDataUrl: `${resolve("public/pdfjs/standard_fonts")}/`,
    }).promise;
    try {
      expect(pdf.numPages).toBe(2);
      const text = await (await pdf.getPage(1)).getTextContent();
      expect(text.items.map((item) => ("str" in item ? item.str : "")).join(" ")).toContain(
        "Production Ada"
      );
      expect(
        (await (await pdf.getPage(1)).getAnnotations()).filter(
          (annotation) => annotation.fieldName === "name"
        )
      ).toEqual([]);
    } finally {
      await pdf.destroy();
    }
  } finally {
    await context.close();
  }
});
