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
beforeEach(() => deleteDraft());
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  await deleteDraft();
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
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const project = await readProject(
    await editorDownload("Download editing project", "application/octet-stream")
  );
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
it("opens permission-only encryption without prompting and does not autosave decrypted content", async () => {
  root = await openEditor(await encryptedFixture("AES-256", ""));
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Private Ada");
  await expect.element(page.getByText(/decrypted drafts are disabled/)).toBeVisible();
  await expect.element(page.getByRole("dialog", { name: "Unlock PDF" })).not.toBeInTheDocument();
  expect(await loadDraft()).toBe(null);
});
it("cancels opening another encrypted file without replacing the current edited document", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Retained Ada");
  vi.spyOn(window, "confirm").mockReturnValue(true);
  await userEvent.upload(
    document.querySelector<HTMLInputElement>('.app-header input[type="file"]')!,
    new File([Uint8Array.from(await encryptedFixture())], "locked.pdf", { type: "application/pdf" })
  );
  await expect.element(page.getByRole("dialog", { name: "Unlock PDF" })).toBeVisible();
  await page
    .getByRole("dialog", { name: "Unlock PDF" })
    .getByRole("button", { name: "Cancel opening", exact: true })
    .click();
  await expect.element(page.getByRole("alert")).toHaveTextContent("current document is unchanged");
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Retained Ada");
});
it("requires decrypted-draft consent, preserves recovery and excludes the opening password", async () => {
  await uploadLocked();
  await unlock();
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Recovered encrypted Ada");
  await page.getByRole("button", { name: "Document", exact: true }).click();
  await page
    .getByRole("checkbox", { name: "Save decrypted drafts on this device (without a password)" })
    .click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
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
  await page.getByRole("button", { name: "Recover draft", exact: true }).click();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Recovered encrypted Ada");
});
it("rejects direct draft saves without consent and fences revoked consent inside the transaction", async () => {
  const doc = appendSource(
    emptyDocument(),
    await importPdf(await encryptedFixture(), "locked.pdf", "reader-fixture")
  );
  await expect(saveDraft(doc)).rejects.toThrow("Enable decrypted local drafts");
  doc.allowDecryptedDrafts = true;
  let permitted = true;
  const pending = saveDraft(doc, await draftSession(), () => permitted);
  permitted = false;
  expect(await pending).toBe(false);
  expect(await loadDraft()).toBe(null);
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
  expect(await loadDraft()).toBe(null);
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
