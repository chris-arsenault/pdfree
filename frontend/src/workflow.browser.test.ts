import { afterEach, beforeEach, expect, it } from "vitest";
import { type Root } from "react-dom/client";
import { PDFDocument } from "pdf-lib";
import { page, userEvent } from "vitest/browser";
import { formFixture } from "./core/fixtures";
import { deleteDraft } from "./services/drafts";
import { openEditor } from "../tooling/editorHarness";

let root: Root | null = null;
beforeEach(async () => {
  await deleteDraft();
});
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  await deleteDraft();
});

async function pdfFile(name: string, label = "Dropped") {
  return new File([Uint8Array.from(await formFixture(label))], name, {
    type: "application/pdf",
  });
}
function drop(target: Element, files: File[]) {
  const data = new DataTransfer();
  files.forEach((file) => data.items.add(file));
  for (const type of ["dragenter", "dragover", "drop"])
    target.dispatchEvent(
      new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: data })
    );
}

it("opens a PDF dropped on the editor as a new document tab", async () => {
  root = await openEditor(await formFixture(), "First.pdf");
  drop(document.querySelector("main.workspace")!, [await pdfFile("Second.pdf")]);
  await expect
    .element(page.getByRole("button", { name: "Close Second.pdf", exact: true }))
    .toBeVisible();
  await expect.element(page.getByText("PAGE 1 OF 3")).toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Close First.pdf", exact: true }))
    .toBeVisible();
});

it("keeps page operations in the Pages panel and file sources beside Open", async () => {
  root = await openEditor(await formFixture());
  await expect
    .element(page.getByRole("button", { name: "Tools", exact: true }))
    .not.toBeInTheDocument();
  await page.getByRole("button", { name: "Insert", exact: true }).click();
  await page.getByRole("button", { name: "Blank page", exact: true }).click();
  await expect.element(page.getByText("PAGE 1 OF 4")).toBeVisible();
  for (const [item, dialog] of [
    ["Repeat across pages", "Repeat across pages"],
    ["Clean up scans", "Clean up scans"],
    ["Recognize text", "Recognize scanned text"],
  ]) {
    await page.getByRole("button", { name: "More", exact: true }).click();
    await page.getByRole("button", { name: item, exact: true }).click();
    await expect.element(page.getByRole("dialog", { name: dialog, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  }
  await page.getByRole("button", { name: "Open options", exact: true }).click();
  await page.getByRole("button", { name: "Process multiple PDFs", exact: true }).click();
  await expect
    .element(page.getByRole("dialog", { name: "Process multiple PDFs", exact: true }))
    .toBeVisible();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  const footer = document.querySelector(".app-footer")!;
  expect(footer.querySelector(".zoom-controls")).toBeNull();
  expect(footer.querySelectorAll("button:not(.popover-trigger)")).toHaveLength(0);
});

it("renames the document in place and reverts an invalid name", async () => {
  root = await openEditor(await formFixture(), "First.pdf");
  const name = page.getByRole("textbox", { name: "Rename document", exact: true });
  await name.fill("Renamed.pdf");
  await userEvent.keyboard("{Enter}");
  await expect
    .element(page.getByRole("button", { name: "Close Renamed.pdf", exact: true }))
    .toBeVisible();
  await name.fill("");
  await expect.element(page.getByRole("alert")).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect.element(name).toHaveValue("Renamed.pdf");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect.element(name).toHaveValue("First.pdf");
});

async function textPdf() {
  const pdf = await PDFDocument.create();
  pdf.addPage([400, 300]).drawText("Highlight this sentence", { x: 40, y: 200, size: 18 });
  return pdf.save();
}
function selectText(span: Element) {
  const range = document.createRange();
  range.selectNodeContents(span);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(range);
}
const highlights = () =>
  [...document.querySelectorAll(".placed-object")].filter((item) =>
    item.getAttribute("aria-label")?.startsWith("highlight")
  );

it("highlights PDF text with the Highlight tool when the drag starts on text", async () => {
  root = await openEditor(await textPdf());
  await expect
    .poll(() => document.querySelector(".textLayer span")?.textContent)
    .toContain("Highlight this sentence");
  await expect
    .element(page.getByRole("button", { name: "Highlight selected text" }))
    .not.toBeInTheDocument();
  await page.getByRole("button", { name: "Highlight", exact: true }).click();
  const span = document.querySelector(".textLayer span")!;
  span.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, pointerId: 1 }));
  selectText(span);
  span.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }));
  await expect.poll(() => highlights().length).toBeGreaterThan(0);
  await expect
    .element(page.getByRole("button", { name: "Select", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  const count = highlights().length;
  selectText(document.querySelector(".textLayer span")!);
  await page.getByRole("button", { name: "Highlight", exact: true }).click();
  await expect.poll(() => highlights().length).toBeGreaterThan(count);
});

it("browses and edits bookmarks in the left panel", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("button", { name: "Bookmarks", exact: true }).click();
  await expect
    .element(page.getByRole("tab", { name: "Bookmarks" }))
    .toHaveAttribute("aria-selected", "true");
  await expect.element(page.getByText("This document has no bookmarks.")).toBeVisible();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await page.getByRole("button", { name: "Edit bookmarks", exact: true }).click();
  await page.getByRole("button", { name: "Add current page", exact: true }).click();
  await page.getByRole("textbox", { name: "Bookmark 1 title", exact: true }).fill("Signatures");
  await page.getByRole("button", { name: "Save bookmarks", exact: true }).click();
  const outline = page.getByRole("list", { name: "Document outline", exact: true });
  await expect.element(outline).toHaveTextContent("Signatures");
  await page.getByRole("button", { name: "Previous page", exact: true }).click();
  await expect.element(page.getByText("PAGE 2 OF 3")).toBeVisible();
  await outline.getByRole("button").click();
  await expect.element(page.getByText("PAGE 3 OF 3")).toBeVisible();
  await page.getByRole("button", { name: "Pages", exact: true }).click();
  await expect
    .element(page.getByRole("tab", { name: /^Pages/ }))
    .toHaveAttribute("aria-selected", "true");
  await page.getByRole("searchbox", { name: "Find text", exact: true }).fill("Sample");
  await page.getByRole("button", { name: "Find", exact: true }).click();
  await expect.element(page.getByRole("region", { name: "Search results" })).toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Edit bookmarks" }))
    .not.toBeInTheDocument();
});

it("orders authored fields with a dedicated tab-order control", async () => {
  root = await openEditor(await formFixture());
  const surface = page.getByRole("region", { name: "PDF page", exact: true });
  for (const y of [300, 360]) {
    await page.getByRole("button", { name: "Form field", exact: true }).click();
    await surface.click({ position: { x: 300, y } });
  }
  const order = page.getByRole("group", { name: "Field tab order", exact: true });
  await expect.element(order).toHaveTextContent("Tab order 2 of 2");
  await expect
    .element(page.getByRole("button", { name: "Bring to front", exact: true }))
    .not.toBeInTheDocument();
  await order.getByRole("button", { name: "Move earlier in tab order", exact: true }).click();
  await expect.element(order).toHaveTextContent("Tab order 1 of 2");
  await expect
    .element(order.getByRole("button", { name: "Move earlier in tab order", exact: true }))
    .toBeDisabled();
});

it("adds a panel comment in the visible part of a zoomed page", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("combobox", { name: "Zoom", exact: true }).selectOptions("300");
  const scroll = document.querySelector<HTMLElement>(".page-scroll")!;
  await expect.poll(() => scroll.scrollHeight > scroll.clientHeight * 2).toBe(true);
  scroll.scrollTo(scroll.scrollWidth, scroll.scrollHeight);
  await page.getByRole("button", { name: "Comments", exact: true }).click();
  await page.getByRole("button", { name: "Add comment", exact: true }).click();
  await page.getByRole("textbox", { name: "New comment", exact: true }).fill("Visible note");
  await page.getByRole("button", { name: "Post comment", exact: true }).click();
  const marker = page.getByRole("button", { name: "Comment: Visible note", exact: true });
  await expect.element(marker).toBeVisible();
  const shown = marker.element().getBoundingClientRect(),
    view = scroll.getBoundingClientRect();
  expect(shown.top).toBeGreaterThanOrEqual(view.top);
  expect(shown.bottom).toBeLessThanOrEqual(view.bottom);
  expect(shown.left).toBeGreaterThanOrEqual(view.left);
  expect(shown.right).toBeLessThanOrEqual(view.right);
});

it("appends a PDF dropped on the page list to the current document", async () => {
  root = await openEditor(await formFixture(), "First.pdf");
  const list = document.querySelector(".thumbnail-list")!;
  const data = new DataTransfer();
  data.items.add(await pdfFile("Second.pdf"));
  list.dispatchEvent(
    new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: data })
  );
  await expect.element(page.getByText("Drop to add pages at the end")).toBeVisible();
  list.dispatchEvent(
    new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: data })
  );
  await expect.element(page.getByText("PAGE 4 OF 6")).toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "Close Second.pdf", exact: true }))
    .not.toBeInTheDocument();
  await expect.element(page.getByText("Drop to add pages at the end")).not.toBeInTheDocument();
});
