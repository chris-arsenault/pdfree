import { afterEach, expect, it } from "vitest";
import { type Root } from "react-dom/client";
import { page, userEvent } from "vitest/browser";
import { formFixture } from "./core/fixtures";
import { deleteDraft } from "./services/drafts";
import { openEditor } from "../tooling/editorHarness";

let root: Root | null = null;
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  await deleteDraft();
});

it("explains unavailable icon actions on keyboard focus and dismisses tooltips with Escape", async () => {
  root = await openEditor(await formFixture());
  const redo = page.getByRole("button", { name: "Redo", exact: true });
  redo.element().focus();
  await expect.element(page.getByRole("tooltip")).toHaveTextContent("No edits to redo.");
  await expect.element(redo).toHaveAttribute("aria-disabled", "true");
  const describedBy = redo.element().getAttribute("aria-describedby");
  expect(document.getElementById(describedBy!)?.getAttribute("role")).toBe("tooltip");
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.getElementById(describedBy!)).toBeNull();
  await userEvent.keyboard("{Enter}");
  expect(document.querySelectorAll(".placed-object")).toHaveLength(0);
});

it("distinguishes current-page actions from selected-page actions and rejects invalid ranges", async () => {
  root = await openEditor(await formFixture());
  await expect
    .element(page.getByRole("button", { name: "Current page", exact: true }))
    .toBeVisible();
  await page.getByRole("checkbox", { name: "Select page 3", exact: true }).click();
  await page.getByRole("checkbox", { name: "Select page 1", exact: true }).click();
  await page.getByRole("button", { name: "2 selected pages", exact: true }).click();
  await page.getByRole("textbox", { name: "Page range", exact: true }).fill("99");
  await page.getByRole("button", { name: "Select range", exact: true }).click();
  await expect.element(page.getByRole("alert")).toBeVisible();
  await expect
    .element(page.getByRole("checkbox", { name: "Select page 3", exact: true }))
    .toBeChecked();
  await page.getByRole("button", { name: "Use current page", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Current page", exact: true }))
    .toBeVisible();
  await page.getByRole("button", { name: "Dismiss error", exact: true }).click();
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect
    .element(page.getByRole("checkbox", { name: "Export current page (1)", exact: true }))
    .toBeVisible();
});

it("closes properties without losing selection and exposes only group actions for multiple objects", async () => {
  root = await openEditor(await formFixture());
  expect(document.querySelector(".inspector")).toBeNull();
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page
    .getByRole("region", { name: "PDF page", exact: true })
    .click({ position: { x: 70, y: 100 } });
  await page.getByRole("textbox", { name: "Object text", exact: true }).fill("Added text");
  await page.getByRole("button", { name: "Hide properties", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "text: Added text", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Properties", exact: true }).click();
  await expect
    .element(page.getByRole("textbox", { name: "Object text", exact: true }))
    .toHaveValue("Added text");
  await page.getByRole("button", { name: "Duplicate objects", exact: true }).click();
  await userEvent.keyboard("{Control>}a{/Control}");
  await expect.element(page.getByText("2 objects selected", { exact: true })).toBeVisible();
  await expect
    .element(page.getByRole("textbox", { name: "Object text", exact: true }))
    .not.toBeInTheDocument();
  await page.getByRole("button", { name: "More", exact: true }).click();
  await userEvent.keyboard("{Delete}");
  expect(document.querySelectorAll(".placed-object")).toHaveLength(2);
  await userEvent.keyboard("{Escape}");
  await page.getByRole("button", { name: "Align objects left", exact: true }).click();
  await page.getByRole("button", { name: "Delete objects", exact: true }).click();
  expect(document.querySelectorAll(".placed-object")).toHaveLength(0);
});
