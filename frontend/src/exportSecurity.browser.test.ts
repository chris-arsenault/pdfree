import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { type Root } from "react-dom/client";
import * as pdfjs from "pdfjs-dist";
import rsaUrl from "../tooling/fixtures/signer.p12?url";
import { formFixture } from "./core/fixtures";
import { readProject } from "./core/projects";
import { assetBytes } from "./services/resources";
import * as resources from "./services/resources";
import { type FontData } from "./core/drawObjects";
import { deleteDraft, loadDraft } from "./services/drafts";
import { editorDownload, openEditor } from "../tooling/editorHarness";
import { inspectSignature } from "../tooling/signatureInspection";

vi.mock("./services/resources", { spy: true });

let root: Root | null = null;
beforeEach(() => deleteDraft());
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  await deleteDraft();
});
async function openExport() {
  root = await openEditor(await formFixture());
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Secured Ada");
  await page.getByRole("button", { name: "Export", exact: true }).click();
}
async function chooseCertificate(password = "fixture-password") {
  await page.getByRole("combobox", { name: "Certificate signing", exact: true }).selectOptions("1");
  await userEvent.upload(
    document.querySelector<HTMLInputElement>('input[accept*=".p12"]')!,
    new File([Uint8Array.from(await assetBytes(rsaUrl))], "identity.p12")
  );
  await page.getByLabelText("Certificate password", { exact: true }).fill(password);
}
async function chooseProtection() {
  await page.getByRole("checkbox", { name: "Protect PDF with passwords and permissions" }).click();
  await page.getByLabelText("Opening password (optional)", { exact: true }).fill("reader-password");
  await page.getByLabelText("Confirm opening password", { exact: true }).fill("reader-password");
  await page.getByLabelText("Owner password", { exact: true }).fill("owner-password");
  await page.getByLabelText("Confirm owner password", { exact: true }).fill("owner-password");
  await page.getByRole("checkbox", { name: "Allow copying and extraction" }).click();
}
it("exports a filled, encrypted and certified PDF from the actual dialog", async () => {
  await openExport();
  await chooseCertificate();
  await chooseProtection();
  await page.getByLabelText("Signing reason", { exact: true }).fill("Approved locally");
  const bytes = await editorDownload("Download PDF", "application/pdf", "");
  const signature = inspectSignature(bytes);
  expect(
    await signature.data.verify({ signer: 0, data: signature.signed.buffer, checkChain: false })
  ).toBe(true);
  const pdf = await pdfjs.getDocument({ data: bytes.slice(), password: "reader-password" }).promise;
  try {
    expect(pdf.numPages).toBe(3);
    expect(
      (await (await pdf.getPage(1)).getAnnotations()).find((field) => field.fieldName === "name")
        ?.fieldValue
    ).toBe("Secured Ada");
    expect(await pdf.getPermissions()).not.toContain(pdfjs.PermissionFlag.COPY);
  } finally {
    await pdf.destroy();
  }
});
it("blocks mismatched confirmations and succeeds after correction", async () => {
  await openExport();
  await chooseProtection();
  await page.getByLabelText("Confirm owner password", { exact: true }).fill("mismatch");
  const spy = vi.spyOn(URL, "createObjectURL");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await expect.element(page.getByRole("alert")).toHaveTextContent("confirmations must match");
  expect(
    spy.mock.calls.filter(([blob]) => blob instanceof Blob && blob.type === "application/pdf")
  ).toHaveLength(0);
  spy.mockRestore();
  await page.getByLabelText("Confirm owner password", { exact: true }).fill("owner-password");
  const pdf = await pdfjs.getDocument({
    data: await editorDownload("Download PDF", "application/pdf", ""),
    password: "reader-password",
  }).promise;
  expect(pdf.numPages).toBe(3);
  await pdf.destroy();
});
it("reports a bad identity without downloading a PDF and allows retry", async () => {
  await openExport();
  await chooseCertificate("wrong");
  const spy = vi.spyOn(URL, "createObjectURL");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await expect.element(page.getByRole("alert")).toHaveTextContent("could not be unlocked");
  expect(
    spy.mock.calls.filter(([blob]) => blob instanceof Blob && blob.type === "application/pdf")
  ).toHaveLength(0);
  spy.mockRestore();
  await page.getByLabelText("Certificate password", { exact: true }).fill("fixture-password");
  const signature = inspectSignature(await editorDownload("Download PDF", "application/pdf", ""));
  expect(
    await signature.data.verify({ signer: 0, data: signature.signed.buffer, checkChain: false })
  ).toBe(true);
});
it("keeps security credentials out of editing projects and drafts and clears them when closing", async () => {
  await openExport();
  await chooseCertificate();
  await chooseProtection();
  await expect
    .poll(async () =>
      Object.values((await loadDraft())?.document.values ?? {}).includes("Secured Ada")
    )
    .toBe(true);
  const project = await readProject(
    await editorDownload("Download editing project", "application/octet-stream", "")
  );
  expect(Object.keys(project)).not.toContain("security");
  expect(JSON.stringify(project)).not.toMatch(
    /fixture-password|reader-password|owner-password|certificatePassword/
  );
  expect(JSON.stringify(await loadDraft())).not.toMatch(
    /fixture-password|reader-password|owner-password|certificatePassword/
  );
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect
    .element(page.getByRole("combobox", { name: "Certificate signing", exact: true }))
    .toHaveValue("none");
  await expect
    .element(page.getByRole("checkbox", { name: "Protect PDF with passwords and permissions" }))
    .not.toBeChecked();
});

it("cancels a secured export even when closed before the security worker starts", async () => {
  await openExport();
  await chooseCertificate();
  const fonts = await resources.fontData();
  let resume: (value: FontData) => void = vi.fn();
  const waiting = new Promise<FontData>((resolve) => {
    resume = resolve;
  });
  const prepare = vi.spyOn(resources, "fontData").mockReturnValue(waiting);
  prepare.mockClear();
  const downloads = vi.spyOn(URL, "createObjectURL");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await expect.poll(() => prepare.mock.calls.length).toBeGreaterThan(0);
  await expect
    .element(page.getByRole("button", { name: "Download PDF", exact: true }))
    .toBeDisabled();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  resume(fonts);
  await expect.element(page.getByRole("alert")).toHaveTextContent("canceled");
  expect(
    downloads.mock.calls.filter(([blob]) => blob instanceof Blob && blob.type === "application/pdf")
  ).toHaveLength(0);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect
    .element(page.getByRole("combobox", { name: "Certificate signing", exact: true }))
    .toHaveValue("none");
});
