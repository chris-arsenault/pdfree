import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { type Root } from "react-dom/client";
import { page, userEvent } from "vitest/browser";
import { openEditor, selectDocument } from "../tooling/editorHarness";
import { formFixture } from "./core/fixtures";
import { encryptedFixture } from "../tooling/encryptedFixture";
import { deleteDraft, loadDraft, loadDrafts, saveDraft, draftSession } from "./services/drafts";

const offline = vi.hoisted(() => ({
  refresh: () => {},
  update: vi.fn(async () => {}),
}));
vi.mock("virtual:pwa-register", () => ({
  registerSW: (options: { onNeedRefresh: () => void }) => {
    offline.refresh = options.onNeedRefresh;
    return offline.update;
  },
}));

let root: Root | null = null;
beforeEach(async () => {
  await deleteDraft();
  offline.update.mockReset();
  // A native JavaScript popup is always a regression in these application flows.
  for (const method of ["alert", "confirm", "prompt"] as const)
    vi.spyOn(window, method).mockImplementation(() => {
      throw new Error(`Unexpected browser ${method}`);
    });
});
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  await deleteDraft();
});

it("cancels page deletion with Enter or Escape and deletes only after explicit confirmation, with undo", async () => {
  root = await openEditor(await formFixture());
  const remove = page.getByRole("button", { name: "Delete pages", exact: true });
  const dialog = page.getByRole("dialog", { name: "Delete page 1?", exact: true });
  await remove.click();
  await expect.element(dialog.getByRole("button", { name: "Cancel" })).toHaveFocus();
  await userEvent.keyboard("{Enter}");
  await expect.element(dialog).not.toBeInTheDocument();
  await expect.element(page.getByText("PAGE 1 OF 3", { exact: true })).toBeVisible();
  await expect.element(remove).toHaveFocus();
  await remove.click();
  await userEvent.keyboard("{Escape}");
  await expect.element(dialog).not.toBeInTheDocument();
  await expect.element(page.getByText("PAGE 1 OF 3", { exact: true })).toBeVisible();
  await remove.click();
  await dialog.getByRole("button", { name: "Delete page", exact: true }).click();
  await expect.element(page.getByText("PAGE 1 OF 2", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.element(page.getByText("PAGE 1 OF 3", { exact: true })).toBeVisible();
});

it("keeps edits in document tabs and cancels closing an edited document", async () => {
  const bytes = Uint8Array.from(await formFixture());
  root = await openEditor(bytes, "Original.pdf");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Keep this edit");
  const input = document.querySelector<HTMLInputElement>(".header-actions input")!;
  const next = new File([bytes], "Replacement.pdf", { type: "application/pdf" });
  await userEvent.upload(input, next);
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Original");
  await selectDocument("Original.pdf");
  const dialog = page.getByRole("dialog", { name: "Close Original.pdf?", exact: true });
  await page.getByRole("button", { name: "Close Original.pdf", exact: true }).click();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Keep this edit");
  await page.getByRole("button", { name: "Close Original.pdf", exact: true }).click();
  await dialog.getByRole("button", { name: "Close document", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Close Replacement.pdf", exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Original");
});

it("cancels individual document deletion and keeps other saved documents and the open editor", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Keep my draft");
  await expect
    .poll(async () => Object.values((await loadDraft())?.document.values ?? {}))
    .toContain("Keep my draft");
  await saveDraft(
    { ...(await loadDraft())!.document, name: "Other.pdf" },
    await draftSession("other")
  );
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const remove = page.getByRole("button", { name: "Delete test.pdf", exact: true });
  const dialog = page.getByRole("dialog", { name: "Delete test.pdf?", exact: true });
  await remove.click();
  await userEvent.keyboard("{Escape}");
  expect(await loadDrafts()).toHaveLength(2);
  await remove.click();
  await dialog.getByRole("button", { name: "Delete document", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Open Other.pdf", exact: true }))
    .toBeVisible();
  await expect
    .poll(async () => (await loadDrafts()).map((draft) => draft.document.name))
    .toEqual(["Other.pdf"]);
  await expect
    .element(page.getByRole("button", { name: "Close dialog", exact: true }))
    .toHaveFocus();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Keep my draft");
});

it("cancels unprotected project download without losing export settings or downloading bytes", async () => {
  root = await openEditor(await encryptedFixture("AES-256", ""));
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await page.getByRole("textbox", { name: "File name", exact: true }).fill("Private copy.pdf");
  const urls = vi.spyOn(URL, "createObjectURL");
  const project = page.getByRole("button", { name: "Download editing project", exact: true });
  await project.click();
  const dialog = page.getByRole("dialog", {
    name: "Download an unprotected project?",
    exact: true,
  });
  await expect.element(dialog).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect
    .element(page.getByRole("textbox", { name: "File name", exact: true }))
    .toHaveValue("Private copy.pdf");
  await expect.element(project).toBeEnabled();
  expect(
    urls.mock.calls.some(
      ([blob]) => blob instanceof Blob && blob.type === "application/octet-stream"
    )
  ).toBe(false);
  await expect.element(project).toHaveFocus();
});

it("cancels an update without reloading and surfaces failure after accepting", async () => {
  root = await openEditor(await formFixture());
  offline.refresh();
  const update = page.getByRole("button", { name: "Update", exact: true });
  const dialog = page.getByRole("dialog", { name: "Update and reload?", exact: true });
  await update.click();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect.element(update).toBeEnabled();
  expect(offline.update).not.toHaveBeenCalled();
  offline.update.mockRejectedValueOnce(new Error("offline"));
  await update.click();
  await dialog.getByRole("button", { name: "Update and reload", exact: true }).click();
  await page.getByRole("button", { name: "Offline unavailable", exact: true }).click();
  await expect
    .element(page.getByText("The update could not load.", { exact: false }))
    .toBeVisible();
  expect(offline.update).toHaveBeenCalledExactlyOnceWith(true);
  await expect.element(page.getByText("PAGE 1 OF 3", { exact: true })).toBeVisible();
});
