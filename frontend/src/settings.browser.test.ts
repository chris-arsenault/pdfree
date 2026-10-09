import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { page, userEvent } from "vitest/browser";
import App from "./App";
import { encryptedFixture } from "../tooling/encryptedFixture";
import { openEditor, openLibrary, selectDocument } from "../tooling/editorHarness";
import { formFixture } from "./core/fixtures";
import { deleteDraft, loadDrafts } from "./services/drafts";
import { protectedAutosaveDisabled, setProtectedAutosaveDisabled } from "./services/settings";
import "./styles.css";

let root: Root | null = null;
beforeEach(async () => {
  localStorage.clear();
  sessionStorage.removeItem("pdfree-open-documents");
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
function mount() {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  root.render(createElement(App));
}
// The browser-wide storage preference lives in Library, reached from the Open menu at every width.
const openSettings = openLibrary;
const restriction = () =>
  page.getByRole("checkbox", { name: "Don't autosave protected documents", exact: true });
async function hasSaved(value: string) {
  return (await loadDrafts()).some((draft) => Object.values(draft.document.values).includes(value));
}
async function openAnother(bytes: Uint8Array, name: string) {
  await userEvent.upload(
    document.querySelector<HTMLInputElement>('.app-header input[type="file"]')!,
    new File([Uint8Array.from(bytes)], name, { type: "application/pdf" })
  );
  await expect
    .element(page.getByRole("button", { name: `Close ${name}`, exact: true }))
    .toBeVisible();
}

it("persists the browser-wide restriction, applies it to background documents and resumes saving when off", async () => {
  expect(protectedAutosaveDisabled()).toBe(false);
  const protectedBytes = await encryptedFixture("AES-256", "");
  root = await openEditor(protectedBytes, "first.pdf");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("First saved");
  await expect.poll(() => hasSaved("First saved")).toBe(true);
  await openAnother(protectedBytes, "second.pdf");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Second saved");
  await expect.poll(() => hasSaved("Second saved")).toBe(true);
  await openSettings();
  await expect.element(restriction()).not.toBeChecked();
  await restriction().click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Second paused");
  await selectDocument("first.pdf");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("First paused");
  await expect.element(page.getByRole("button", { name: "Autosave off" })).toBeVisible();
  await openAnother(await formFixture(), "plain.pdf");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Plain saved");
  await expect.poll(() => hasSaved("Plain saved")).toBe(true);
  expect(await hasSaved("First paused")).toBe(false);
  expect(await hasSaved("Second paused")).toBe(false);
  expect(await loadDrafts()).toHaveLength(3);

  root.unmount();
  document.body.replaceChildren();
  mount();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Plain saved");
  await selectDocument("first.pdf");
  await expect.element(page.getByRole("button", { name: "Autosave off" })).toBeVisible();
  await openSettings();
  await expect.element(restriction()).toBeChecked();
  await restriction().click();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect.element(page.getByRole("button", { name: "Autosave off" })).not.toBeInTheDocument();
  await page.getByRole("textbox", { name: "name", exact: true }).fill("First resumed");
  await selectDocument("second.pdf");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Second resumed");
  await expect.poll(() => hasSaved("First resumed")).toBe(true);
  await expect.poll(() => hasSaved("Second resumed")).toBe(true);

  await page.viewport(320, 720);
  await page.getByRole("button", { name: "Hide pages", exact: true }).click();
  await openSettings();
  await expect.element(restriction()).not.toBeChecked();
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(320);
  await page.screenshot({ path: "../test-results/protected-autosave-settings-320.png" });
  // Three documents, a remount and several autosave round trips exceed 15 s on CI WebKit.
}, 30_000);
it("reflects browser storage changes and reports a preference write failure without changing the choice", async () => {
  mount();
  await expect.element(page.getByText("Your paperwork.")).toBeVisible();
  await openSettings();
  await restriction().click();
  await expect.element(restriction()).toBeChecked();
  localStorage.clear();
  window.dispatchEvent(new StorageEvent("storage", { key: null, storageArea: localStorage }));
  await expect.element(restriction()).not.toBeChecked();
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("Storage unavailable", "QuotaExceededError");
  });
  await restriction().click();
  await expect
    .element(page.getByRole("alert"))
    .toHaveTextContent("Your previous choice is unchanged");
  await expect.element(restriction()).not.toBeChecked();
  expect(protectedAutosaveDisabled()).toBe(false);
});
