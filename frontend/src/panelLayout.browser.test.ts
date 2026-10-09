import { afterEach, expect, it } from "vitest";
import { type Root } from "react-dom/client";
import { page, userEvent } from "vitest/browser";
import { openEditor } from "../tooling/editorHarness";
import { commentFixture } from "./core/commentFixture";
import { deleteDraft } from "./services/drafts";

let root: Root | null = null;
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  await deleteDraft();
  await page.viewport(1280, 720);
});

function chrome() {
  return [".app-header", ".document-tabs", ".toolbar", ".navigator", ".app-footer"].map(
    (selector) => {
      const bounds = document.querySelector(selector)!.getBoundingClientRect();
      return { selector, x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
    }
  );
}

it("keeps toolbars and navigation fixed when comments, properties and pages are toggled", async () => {
  await page.viewport(1024, 720);
  root = await openEditor(await commentFixture());
  const initial = chrome();
  const find = page.getByRole("searchbox", { name: "Find text", exact: true });
  const findBounds = find.element().getBoundingClientRect().toJSON();
  await page.getByRole("button", { name: "Comments", exact: true }).click();
  await expect
    .element(page.getByRole("complementary", { name: "Comments", exact: true }))
    .toBeVisible();
  expect(chrome()).toEqual(initial);
  expect(find.element().getBoundingClientRect().toJSON()).toEqual(findBounds);
  const panel = document.querySelector(".comments-panel")!.getBoundingClientRect();
  const navigator = document.querySelector(".navigator")!.getBoundingClientRect();
  expect(panel.top).toBeGreaterThanOrEqual(navigator.bottom);
  await page.getByRole("button", { name: "Properties", exact: true }).click();
  expect(chrome()).toEqual(initial);
  await page.getByRole("button", { name: "Hide properties", exact: true }).click();
  await page.getByRole("button", { name: "Hide pages", exact: true }).click();
  expect(chrome()).toEqual(initial);
});

it.each([1024, 390])("adds a comment without closing the panel at %ipx", async (width) => {
  await page.viewport(width, 720);
  root = await openEditor(await commentFixture());
  await page.getByRole("button", { name: "Comments", exact: true }).click();
  const initial = chrome();
  await page.getByRole("button", { name: "Add comment", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Hide comments", exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole("textbox", { name: "New comment", exact: true }))
    .toHaveFocus();
  await page.getByRole("textbox", { name: "New comment", exact: true }).fill("A panel note");
  await page.getByRole("button", { name: "Post comment", exact: true }).click();
  await expect.element(page.getByText("A panel note", { exact: true }).last()).toBeVisible();
  expect(chrome()).toEqual(initial);
  await page.getByRole("button", { name: "Hide comments", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Comment: A panel note", exact: true }))
    .toBeInTheDocument();
});

it("shows a placement notification without moving toolbars or resizing the page gutter", async () => {
  root = await openEditor(await commentFixture());
  await page.getByRole("button", { name: "Image", exact: true }).click();
  const initial = chrome();
  const sidebar = document.querySelector(".page-sidebar")!.getBoundingClientRect().toJSON();
  await userEvent.click(document.querySelector<HTMLElement>(".page-surface")!, {
    position: { x: 70, y: 100 },
  });
  await expect
    .element(page.getByText("Choose an image in the properties panel first.", { exact: false }))
    .toBeVisible();
  expect(chrome()).toEqual(initial);
  expect(document.querySelector(".page-sidebar")!.getBoundingClientRect().toJSON()).toEqual(
    sidebar
  );
  await page.getByRole("button", { name: "Dismiss notification", exact: true }).click();
  expect(chrome()).toEqual(initial);
});

it("keeps the mobile properties sheet below the toolbars and above the footer", async () => {
  await page.viewport(320, 600);
  root = await openEditor(await commentFixture());
  const initial = chrome();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "Image", exact: true }).click();
  expect(chrome()).toEqual(initial);
  const properties = document.querySelector(".inspector")!.getBoundingClientRect();
  const footer = document.querySelector(".app-footer")!.getBoundingClientRect();
  const navigator = document.querySelector(".navigator")!.getBoundingClientRect();
  expect(properties.top).toBeGreaterThanOrEqual(navigator.bottom);
  expect(properties.bottom).toBeLessThanOrEqual(footer.top);
});
