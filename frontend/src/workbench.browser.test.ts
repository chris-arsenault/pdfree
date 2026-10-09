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
  await expect
    .element(page.getByRole("radio", { name: "Selected pages", exact: true }))
    .toBeChecked();
  await page.getByRole("radio", { name: "Page range", exact: true }).click();
  await page.getByRole("textbox", { name: "Pages to include", exact: true }).fill("99");
  await expect.element(page.getByText("Page range 99 must be between 1 and 3.")).toBeVisible();
  await expect
    .element(page.getByRole("checkbox", { name: "Select page 3", exact: true }))
    .toBeChecked();
  await page.getByRole("textbox", { name: "Pages to include", exact: true }).fill("2-3");
  await expect
    .element(page.getByRole("checkbox", { name: "Select page 1", exact: true }))
    .not.toBeChecked();
  await expect
    .element(page.getByRole("checkbox", { name: "Select page 2", exact: true }))
    .toBeChecked();
  await page.getByRole("radio", { name: "Current page", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Current page", exact: true }))
    .toBeVisible();
  await userEvent.keyboard("{Escape}");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  await expect.element(page.getByRole("radio", { name: "All pages", exact: true })).toBeChecked();
  await expect.element(page.getByText("3 of 3 page(s)")).toBeVisible();
});

it("starts Extract with the page selection and Export with the whole document", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("checkbox", { name: "Select page 2", exact: true }).click();
  await page.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("button", { name: "Extract", exact: true }).click();
  await expect
    .element(page.getByRole("radio", { name: "Selected pages", exact: true }))
    .toBeChecked();
  await expect.element(page.getByText("1 of 3 page(s)")).toBeVisible();
  await page.getByRole("radio", { name: "Printable sheets", exact: true }).click();
  await page.getByRole("combobox", { name: "Pages per sheet", exact: true }).selectOptions("4");
  await expect
    .element(page.getByRole("button", { name: "Download 4-up PDF", exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Download PDF", exact: true }))
    .not.toBeInTheDocument();
  await page.getByRole("radio", { name: "Split into files", exact: true }).click();
  await expect.element(page.getByRole("radio", { name: "All pages" })).not.toBeInTheDocument();
  await expect
    .element(page.getByRole("button", { name: "Download 2 PDFs as ZIP", exact: true }))
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
