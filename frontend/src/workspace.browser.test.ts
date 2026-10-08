import { afterEach, beforeEach, expect, it } from "vitest";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { userEvent, page } from "vitest/browser";
import App from "./App";
import { formFixture } from "./core/fixtures";
import "./styles.css";
import "./editor.css";
import { loadDraft, deleteDraft } from "./services/drafts";
let root: Root | null = null;
beforeEach(async () => {
  await deleteDraft();
});
afterEach(async () => {
  root?.unmount();
  document.body.replaceChildren();
  await deleteDraft();
});
it("recovers editable native values and a typed signature from the local draft", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  root.render(createElement(App));
  await expect.element(page.getByText("Your paperwork.")).toBeVisible();
  await userEvent.upload(
    document.querySelector<HTMLInputElement>(".drop-card input")!,
    new File([Uint8Array.from(await formFixture())], "draft.pdf", { type: "application/pdf" })
  );
  await expect.element(page.getByText("PAGE 1 OF 3")).toBeVisible();
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Draft value");
  await page.getByRole("button", { name: "Sign", exact: true }).click();
  await page.getByRole("button", { name: "Type", exact: true }).click();
  await page.getByRole("textbox", { name: "Your name or initials" }).fill("Ada");
  await page.getByRole("button", { name: "Use signature" }).click();
  await page.getByRole("region", { name: "PDF page", exact: true }).click({
    position: { x: 100, y: 130 },
  });
  await expect.element(page.getByRole("button", { name: "text: Ada", exact: true })).toBeVisible();
  await expect.poll(async () => (await loadDraft())?.document.pages[0].objects[0].text).toBe("Ada");
  root.unmount();
  root = createRoot(host);
  root.render(createElement(App));
  await page.getByRole("button", { name: "Recover draft" }).click();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Draft value");
  await expect.element(page.getByRole("button", { name: "text: Ada", exact: true })).toBeVisible();
});

it("opens a local form, renders a page, and navigates without uploading it", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  root.render(createElement(App));
  await expect.element(page.getByText("Your paperwork.")).toBeVisible();
  const input = document.querySelector<HTMLInputElement>(".drop-card input")!;
  await userEvent.upload(
    input,
    new File([Uint8Array.from(await formFixture())], "fixture.pdf", { type: "application/pdf" })
  );
  await expect.element(page.getByText("PAGE 1 OF 3")).toBeVisible();
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Ada Lovelace");
  await page.getByRole("button", { name: "Go to page 2" }).click();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Ada Lovelace");
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page
    .getByRole("region", { name: "PDF page", exact: true })
    .click({ position: { x: 100, y: 100 } });
  await expect.element(page.getByRole("textbox", { name: "Object text" })).toBeVisible();
  await page.getByRole("textbox", { name: "Object text" }).fill("Added text");
  await page.getByRole("button", { name: "text: Added text" }).click();
  await userEvent.keyboard("{Delete}");
  await expect
    .element(page.getByRole("button", { name: "text: Added text" }))
    .not.toBeInTheDocument();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.element(page.getByRole("button", { name: "text: Added text" })).toBeVisible();
  await page.getByRole("button", { name: "Go to page 3" }).click();
  await expect.element(page.getByText("PAGE 3 OF 3")).toBeVisible();
  const canvas = document.querySelector<HTMLCanvasElement>(".page-surface canvas")!;
  await expect.poll(() => canvas.width).toBeGreaterThan(0);
});
