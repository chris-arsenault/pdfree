import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { page, userEvent } from "vitest/browser";
import * as pdfjs from "pdfjs-dist";
import App from "./App";
import { encryptedFixture } from "../tooling/encryptedFixture";
import { formFixture } from "./core/fixtures";
import { deleteDraft, loadDraft, saveDraft, draftSession } from "./services/drafts";
import { importPdf, appendSource } from "./core/importPdf";
import { emptyDocument } from "./core/model";
import { readProject } from "./core/projects";
import { editorDownload, openEditor } from "../tooling/editorHarness";
import { setProtectedAutosaveDisabled } from "./services/settings";
import "./styles.css";
import recipientCertificate from "../tooling/fixtures/encryption/recipient.crt?raw";

async function recipientFixture(name: string) {
  const response = await fetch(new URL(`../tooling/fixtures/encryption/${name}`, import.meta.url));
  if (!response.ok) throw new Error("Recipient fixture is unavailable");
  return new Uint8Array(await response.arrayBuffer());
}
async function uploadRecipient() {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  root.render(createElement(App));
  await expect.element(page.getByText("Your paperwork.")).toBeVisible();
  await userEvent.upload(
    document.querySelector<HTMLInputElement>(".drop-card input")!,
    new File([Uint8Array.from(await recipientFixture("pubsec-256.pdf"))], "recipient.pdf", {
      type: "application/pdf",
    })
  );
  await expect.element(page.getByRole("dialog", { name: "Unlock PDF" })).toBeVisible();
}
async function chooseIdentity(password: string) {
  await userEvent.upload(
    document.querySelector<HTMLInputElement>('input[accept=".p12,.pfx"]')!,
    new File([Uint8Array.from(await recipientFixture("recipient.p12"))], "recipient.p12")
  );
  await page.getByLabelText("Identity password", { exact: true }).fill(password);
}

let root: Root | null = null;
beforeEach(async () => {
  setProtectedAutosaveDisabled(false);
  await deleteDraft();
});
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  setProtectedAutosaveDisabled(false);
  await deleteDraft();
  await page.viewport(1280, 720);
});
async function uploadLocked(password = "reader-fixture") {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  root.render(createElement(App));
  await expect.element(page.getByText("Your paperwork.")).toBeVisible();
  await userEvent.upload(
    document.querySelector<HTMLInputElement>(".drop-card input")!,
    new File([Uint8Array.from(await encryptedFixture())], "locked.pdf", { type: "application/pdf" })
  );
  await expect.element(page.getByRole("dialog", { name: "Unlock PDF" })).toBeVisible();
  await page.getByLabelText("PDF password", { exact: true }).fill(password);
}
async function unlock() {
  await page.getByRole("button", { name: "Unlock PDF", exact: true }).click();
  await expect.element(page.getByRole("main", { name: "Document editor" })).toBeVisible();
}
it("retries a wrong opening password, exports edited bytes and excludes credentials from projects", async () => {
  await uploadLocked("wrong-fixture");
  await page.getByRole("button", { name: "Unlock PDF", exact: true }).click();
  await expect
    .element(page.getByText("That password did not unlock this PDF.", { exact: false }))
    .toBeVisible();
  await expect.element(page.getByLabelText("PDF password", { exact: true })).toHaveValue("");
  await page.getByLabelText("PDF password", { exact: true }).fill("reader-fixture");
  await unlock();
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Encrypted Ada");
  const bytes = await editorDownload("Download PDF", "application/pdf");
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  try {
    expect(
      (await (await pdf.getPage(1)).getAnnotations()).find((field) => field.fieldName === "name")
        ?.fieldValue
    ).toBe("Encrypted Ada");
  } finally {
    await pdf.destroy();
  }
  const downloading = editorDownload("Download editing project", "application/octet-stream");
  await page
    .getByRole("dialog", { name: "Download an unprotected project?", exact: true })
    .getByRole("button", { name: "Download project", exact: true })
    .click();
  const project = await readProject(await downloading);
  expect(project.sources[0].encryption?.algorithm).toBe("AES-256");
  expect(project.sources[0].decryptedBytes?.length).toBeGreaterThan(0);
  expect(JSON.stringify(project)).not.toMatch(/reader-fixture|owner-fixture|wrong-fixture/);
});
it("opens with an owner password and exposes the access mode in document details", async () => {
  await uploadLocked("owner-fixture");
  await unlock();
  await page.getByRole("button", { name: "Document", exact: true }).click();
  await expect.element(page.getByText(/using owner access/)).toBeVisible();
});
it("opens permission-only encryption without prompting and autosaves by default", async () => {
  root = await openEditor(await encryptedFixture("AES-256", ""));
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Private Ada");
  await expect.element(page.getByRole("button", { name: "Autosave off" })).not.toBeInTheDocument();
  await expect.element(page.getByRole("dialog", { name: "Unlock PDF" })).not.toBeInTheDocument();
  await expect
    .poll(async () => Object.values((await loadDraft())?.document.values ?? {}))
    .toContain("Private Ada");
});
it("cancels opening another encrypted file without replacing the current edited document", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Retained Ada");
  await userEvent.upload(
    document.querySelector<HTMLInputElement>('.app-header input[type="file"]')!,
    new File([Uint8Array.from(await encryptedFixture())], "locked.pdf", { type: "application/pdf" })
  );
  await expect.element(page.getByRole("dialog", { name: "Unlock PDF" })).toBeVisible();
  await page
    .getByRole("dialog", { name: "Unlock PDF" })
    .getByRole("button", { name: "Cancel opening", exact: true })
    .click();
  await expect.element(page.getByRole("dialog", { name: "Unlock PDF" })).not.toBeInTheDocument();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Retained Ada");
});
it("autosaves unlocked PDFs, preserves recovery and excludes the opening password", async () => {
  await uploadLocked();
  await unlock();
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Recovered encrypted Ada");
  await expect
    .element(page.getByRole("button", { name: "Autosave off", exact: true }))
    .not.toBeInTheDocument();
  await expect
    .poll(
      async () =>
        Object.values((await loadDraft())?.document.values ?? {}).includes(
          "Recovered encrypted Ada"
        ),
      { timeout: 5000 }
    )
    .toBe(true);
  const draft = await loadDraft();
  expect(JSON.stringify(draft)).not.toMatch(/reader-fixture|owner-fixture/);
  expect(draft?.document.sources[0].encryption?.algorithm).toBe("AES-256");
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  root.render(createElement(App));
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Recovered encrypted Ada");
});
it("explains protected-document autosave without expanding or overflowing the footer", async () => {
  setProtectedAutosaveDisabled(true);
  await uploadLocked();
  await unlock();
  await page.getByRole("button", { name: "Autosave off", exact: true }).hover();
  await expect
    .element(page.getByRole("tooltip"))
    .toHaveTextContent("Autosave is off for protected PDFs in this browser");
  await page.getByRole("button", { name: "Autosave off", exact: true }).click();
  expect(await loadDraft()).toBe(null);
  await expect.element(page.getByRole("dialog", { name: "Library", exact: true })).toBeVisible();
  await expect
    .element(
      page.getByRole("checkbox", { name: "Don't autosave protected documents", exact: true })
    )
    .toBeChecked();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("button", { name: "Hide pages", exact: true }).click();
  for (const width of [1280, 768, 320]) {
    await page.viewport(width, 720);
    const footer = document.querySelector<HTMLElement>(".app-footer")!;
    await expect
      .poll(() => footer.getBoundingClientRect().height)
      .toBeLessThanOrEqual(width === 320 ? 110 : 60);
    expect(footer.scrollWidth).toBeLessThanOrEqual(footer.clientWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);
    expect(footer.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect
      .element(page.getByRole("button", { name: "Open options", exact: true }))
      .toBeVisible();
    await expect.element(page.getByRole("button", { name: "Fit page", exact: true })).toBeVisible();
    await page.screenshot({ path: `../test-results/autosave-footer-${width}.png` });
  }
});
it("applies the global restriction to direct saves and fences queued writes when it changes", async () => {
  const doc = appendSource(
    emptyDocument(),
    await importPdf(await encryptedFixture(), "locked.pdf", "reader-fixture")
  );
  Reflect.set(doc, "allowDecryptedDrafts", true);
  setProtectedAutosaveDisabled(true);
  await expect(saveDraft(doc)).rejects.toThrow("disabled in Settings");
  setProtectedAutosaveDisabled(false);
  const session = await draftSession();
  const pending = saveDraft(doc, session);
  setProtectedAutosaveDisabled(true);
  expect(await pending).toBe(false);
  expect(await loadDraft()).toBe(null);
  expect(
    await saveDraft(
      appendSource(emptyDocument(), await importPdf(await formFixture(), "plain.pdf"))
    )
  ).toBe(true);
});
it("retries recipient credentials, edits and exports certificate protection without storing the identity", async () => {
  await uploadRecipient();
  await chooseIdentity("wrong-fixture");
  await page.getByRole("button", { name: "Unlock PDF", exact: true }).click();
  await expect.element(page.getByText(/identity could not be unlocked/)).toBeVisible();
  await expect.element(page.getByLabelText("Identity password", { exact: true })).toHaveValue("");
  await chooseIdentity("identity-fixture");
  await unlock();
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Recipient Ada");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Protect PDF with passwords and permissions", exact: true })
    .click();
  await page.getByRole("combobox", { name: /Encryption credentials/ }).selectOptions("recipients");
  await userEvent.upload(
    document.querySelector<HTMLInputElement>(
      'input[accept=".cer,.crt,.pem,application/pkix-cert"]'
    )!,
    new File([recipientCertificate], "recipient.crt")
  );
  const bytes = await editorDownload("Download PDF", "application/pdf", "");
  const reopened = await importPdf(bytes, "protected.pdf", {
    bytes: await recipientFixture("recipient.p12"),
    password: "identity-fixture",
  });
  expect(reopened.source.fields.find((field) => field.name === "name")?.value).toBe(
    "Recipient Ada"
  );
  expect(reopened.source.encryption?.authenticatedAs).toBe("recipient");
  await expect
    .poll(async () => Object.values((await loadDraft())?.document.values ?? {}))
    .toContain("Recipient Ada");
  expect(JSON.stringify(await loadDraft())).not.toMatch(/identity-fixture|wrong-fixture/);
});
it("cancels recipient unlock without installing a partially opened document", async () => {
  await uploadRecipient();
  await page
    .getByRole("dialog", { name: "Unlock PDF" })
    .getByRole("button", { name: "Cancel opening", exact: true })
    .click();
  await expect.element(page.getByText("Your paperwork.")).toBeVisible();
  await expect.element(page.getByRole("dialog", { name: "Unlock PDF" })).not.toBeInTheDocument();
});
