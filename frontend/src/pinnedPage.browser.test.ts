import { afterEach, expect, it, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import App from "./App";
import { page, userEvent } from "vitest/browser";
import { openEditor, selectDocument, editorDownload } from "../tooling/editorHarness";
import { formFixture } from "./core/fixtures";
import { commentFixture } from "./core/commentFixture";
import { deleteDraft, loadDraft } from "./services/drafts";
import { readProject } from "./core/projects";
import { localPdf } from "./services/viewer";

let root: Root | null = null;
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  window.getSelection()?.removeAllRanges();
  await deleteDraft();
  await page.viewport(1280, 720);
});
const button = (name: string) => page.getByRole("button", { name, exact: true });
const reference = () => document.querySelector<HTMLElement>(".pinned-page")!;
const referenceScroll = () => document.querySelector<HTMLElement>(".reference-scroll")!;
const mainScroll = () => document.querySelector<HTMLElement>(".page-scroll")!;
function chrome() {
  return [
    ".app-header",
    ".document-tabs",
    ".toolbar",
    ".navigator",
    ".app-footer",
    ".page-sidebar",
  ].map((selector) => document.querySelector(selector)!.getBoundingClientRect().toJSON());
}
function key(element: HTMLElement, value: string, options: KeyboardEventInit = {}) {
  element.focus();
  element.dispatchEvent(
    new KeyboardEvent("keydown", { key: value, bubbles: true, cancelable: true, ...options })
  );
}
function readingPoint(area: HTMLElement) {
  const bounds = area.getBoundingClientRect();
  const surface = area.querySelector(".page-surface")!.getBoundingClientRect();
  return {
    x: (bounds.left + area.clientWidth / 2 - surface.left) / surface.width,
    y: (bounds.top + area.clientHeight / 2 - surface.top) / surface.height,
  };
}
async function pin(number: number) {
  await button(`Pin page ${number}`).click();
  await expect.element(page.getByText(`Pinned page ${number}`, { exact: true })).toBeVisible();
}

it("pins a nonsequential page without navigating, replaces it and keeps chrome fixed", async () => {
  root = await openEditor(await formFixture());
  const initial = chrome();
  const undoState = button("Undo").element().getAttribute("aria-disabled");
  await pin(3);
  await expect.element(page.getByText("PAGE 1 OF 3", { exact: true })).toBeVisible();
  await expect.element(button("Pin page 3")).toHaveAttribute("aria-pressed", "true");
  expect(document.querySelectorAll(".pinned-page")).toHaveLength(1);
  expect(chrome()).toEqual(initial);
  expect(button("Undo").element().getAttribute("aria-disabled")).toBe(undoState);
  const referenceZoom = page.getByRole("combobox", { name: "Pinned page zoom", exact: true });
  await referenceZoom.selectOptions("200");
  await pin(3);
  await expect.element(referenceZoom).toHaveValue("200");
  await pin(2);
  await expect.element(button("Fit pinned page")).toHaveAttribute("aria-pressed", "true");
  expect(document.querySelectorAll(".pinned-page")).toHaveLength(1);
  await button("Next page").click();
  await expect.element(page.getByText("PAGE 2 OF 3", { exact: true })).toBeVisible();
  await expect.element(page.getByText("Pinned page 2", { exact: true })).toBeVisible();
  await button("Unpin page").click();
  expect(document.querySelector(".pinned-page")).toBeNull();
  expect(chrome()).toEqual(initial);
});

it("shows current native values read-only and keeps repeated radio widgets independent", async () => {
  root = await openEditor(await formFixture());
  await pin(2);
  const main = page.getByRole("region", { name: "PDF page", exact: true });
  const pinned = page.getByRole("region", { name: "Pinned PDF page", exact: true });
  await main.getByRole("textbox", { name: "name", exact: true }).fill("Live reference value");
  await expect
    .element(pinned.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Live reference value");
  expect(
    pinned.getByRole("textbox", { name: "name", exact: true }).element().hasAttribute("readonly")
  ).toBe(true);
  await expect
    .element(pinned.getByRole("combobox", { name: "country", exact: true }))
    .toBeDisabled();
  await main.getByRole("radio", { name: "choice: A", exact: true }).click();
  await expect.element(main.getByRole("radio", { name: "choice: A", exact: true })).toBeChecked();
  await expect
    .element(pinned.getByRole("radio", { name: "choice: B", exact: true }))
    .not.toBeChecked();
  await button("Undo").click();
  await button("Undo").click();
  await expect
    .element(pinned.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Original");
  const diagnostics = vi.spyOn(console, "warn");
  const parserLog = vi.spyOn(console, "log");
  const parserErrors = vi.spyOn(console, "error");
  try {
    const bytes = await editorDownload("Download PDF", "application/pdf");
    const saved = await PDFDocument.load(bytes);
    expect(saved.getForm().getTextField("name").getText()).toBe("Original");
    expect(saved.getForm().getTextField("name").acroField.getWidgets()).toHaveLength(2);
    const reader = await localPdf(bytes.slice());
    try {
      expect(reader.numPages).toBe(3);
      for (const number of [1, 2]) {
        const annotations = await (await reader.getPage(number)).getAnnotations();
        expect(annotations.find((item) => item.fieldName === "name")?.fieldValue).toBe("Original");
      }
    } finally {
      await reader.destroy();
    }
    expect(diagnostics).not.toHaveBeenCalled();
    expect(parserLog.mock.calls.filter((args) => /Warning:|Error:/i.test(args.join(" ")))).toEqual(
      []
    );
    expect(parserErrors).not.toHaveBeenCalled();
  } finally {
    diagnostics.mockRestore();
    parserLog.mockRestore();
    parserErrors.mockRestore();
  }
});

it("isolates zoom and scroll, preserves the reading position through pop-out and resizing", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("combobox", { name: "Zoom", exact: true }).selectOptions("200");
  mainScroll().scrollTo(150, 300);
  mainScroll().dispatchEvent(new Event("scroll"));
  const mainPosition = readingPoint(mainScroll());
  const initial = chrome();
  await pin(2);
  await expect
    .poll(() => Math.abs(readingPoint(mainScroll()).x - mainPosition.x))
    .toBeLessThan(0.01);
  await page.getByRole("combobox", { name: "Pinned page zoom", exact: true }).selectOptions("200");
  referenceScroll().scrollTo(120, 340);
  referenceScroll().dispatchEvent(new Event("scroll"));
  const top = mainScroll().scrollTop;
  const before = referenceScroll().scrollTop;
  await button("Pop out pinned page").click();
  await expect
    .element(page.getByRole("dialog", { name: "Pinned page", exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole("combobox", { name: "Pinned page zoom", exact: true }))
    .toHaveValue("200");
  await expect.poll(() => Math.abs(referenceScroll().scrollTop - before)).toBeLessThan(3);
  const move = button("Move pinned viewer").element() as HTMLElement;
  const oldX = reference().getBoundingClientRect().x;
  key(move, "ArrowRight");
  await expect.poll(() => reference().getBoundingClientRect().x).toBe(oldX + 10);
  const resize = button("Resize pinned viewer").element() as HTMLElement;
  const oldWidth = reference().getBoundingClientRect().width;
  key(resize, "ArrowRight");
  await expect.poll(() => reference().getBoundingClientRect().width).toBe(oldWidth + 10);
  key(resize, "Escape");
  await expect
    .element(page.getByRole("region", { name: "Pinned page", exact: true }))
    .toBeVisible();
  const divider = page
    .getByRole("separator", { name: "Pinned page width", exact: true })
    .element() as HTMLElement;
  const oldSplit = Number(divider.getAttribute("aria-valuenow"));
  key(divider, "ArrowLeft");
  await expect.poll(() => Number(divider.getAttribute("aria-valuenow"))).toBe(oldSplit + 10);
  key(divider, "Enter");
  expect(mainScroll().scrollTop).toBe(top);
  expect(chrome()).toEqual(initial);
  await page.screenshot({ path: "../test-results/pinned-page-desktop.png" });
});

it("updates added objects live and prevents reference keys from editing the main selection", async () => {
  root = await openEditor(await commentFixture());
  await button("Text").click();
  await page
    .getByRole("region", { name: "PDF page", exact: true })
    .click({ position: { x: 80, y: 100 } });
  await page
    .getByRole("textbox", { name: "Object text", exact: true })
    .fill("Reference annotation");
  await button("Pin page").click();
  await expect
    .element(page.getByText("Reference annotation", { exact: true }).last())
    .toBeVisible();
  const object = document.querySelector<HTMLElement>(".reference-object")!;
  key(referenceScroll(), "Delete");
  key(referenceScroll(), "ArrowRight");
  key(referenceScroll(), "v", { ctrlKey: true });
  expect(document.querySelectorAll(".main-page-view .placed-object")).toHaveLength(1);
  expect(object.textContent).toBe("Reference annotation");
  expect(document.querySelector(".reference-surface .comment-marker")).not.toBeNull();
  await page.getByRole("textbox", { name: "Object text", exact: true }).fill("Updated reference");
  await expect
    .poll(() => document.querySelector(".reference-object")?.textContent)
    .toBe("Updated reference");
  await button("Undo").click();
  await expect
    .poll(() => document.querySelector(".reference-object")?.textContent)
    .toBe("Reference annotation");
});

it("pans by pointer and Space-drag, selects source text and resizes the split by pointer", async () => {
  root = await openEditor(await formFixture());
  const initial = chrome();
  await pin(2);
  await page.getByRole("combobox", { name: "Pinned page zoom", exact: true }).selectOptions("200");
  const scroll = referenceScroll();
  scroll.scrollTo(180, 400);
  scroll.dispatchEvent(new Event("scroll"));
  const mainTop = mainScroll().scrollTop;
  await button("Pan pinned page").click();
  const before = scroll.scrollTop;
  await userEvent.dragAndDrop(scroll, scroll, {
    sourcePosition: { x: 180, y: 240 },
    targetPosition: { x: 120, y: 160 },
  });
  expect(scroll.scrollTop).toBeGreaterThan(before + 50);
  await button("Pan pinned page").click();
  key(scroll, " ", { code: "Space" });
  const temporaryTop = scroll.scrollTop;
  await userEvent.dragAndDrop(scroll, scroll, {
    sourcePosition: { x: 180, y: 240 },
    targetPosition: { x: 120, y: 160 },
  });
  expect(scroll.scrollTop).toBeGreaterThan(temporaryTop + 50);
  window.dispatchEvent(new KeyboardEvent("keyup", { key: " ", code: "Space" }));
  await expect.poll(() => scroll.classList.contains("panning")).toBe(false);
  await expect
    .poll(() => document.querySelector(".reference-surface .textLayer span")?.textContent)
    .toBe("Sample page 2");
  const text = document.querySelector(".reference-surface .textLayer span")!;
  const range = document.createRange();
  range.selectNodeContents(text);
  window.getSelection()?.addRange(range);
  const copy = new KeyboardEvent("keydown", {
    key: "c",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
  text.dispatchEvent(copy);
  expect(window.getSelection()?.toString()).toBe("Sample page 2");
  expect(copy.defaultPrevented).toBe(false);
  const divider = page.getByRole("separator", { name: "Pinned page width", exact: true }).element();
  const oldWidth = reference().getBoundingClientRect().width;
  await userEvent.dragAndDrop(divider, document.querySelector(".reference-layout")!, {
    sourcePosition: { x: 4, y: 100 },
    targetPosition: { x: 500, y: 100 },
  });
  expect(reference().getBoundingClientRect().width).toBeGreaterThan(oldWidth);
  expect(mainScroll().scrollTop).toBe(mainTop);
  expect(chrome()).toEqual(initial);
});

it("pins a thumbnail from the phone drawer and closes the modal with Escape", async () => {
  await page.viewport(390, 720);
  root = await openEditor(await formFixture());
  await button("Pages").click();
  await pin(3);
  expect(document.querySelector(".side-drawer")).toBeNull();
  await expect
    .element(page.getByRole("dialog", { name: "Pinned page", exact: true }))
    .toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect.element(button("Show pinned page 3")).toBeVisible();
  await expect.element(page.getByText("PAGE 1 OF 3", { exact: true })).toBeVisible();
});

it("follows page identity through reorder and rotation, clears deletion and stays clear after undo", async () => {
  root = await openEditor(await formFixture());
  await pin(2);
  const thumbnail = button("Pin page 2").element().closest(".thumbnail-item")!;
  await userEvent.click(
    thumbnail.querySelector<HTMLButtonElement>('[aria-label="Move page earlier"]')!
  );
  await expect.element(page.getByText("Pinned page 1", { exact: true })).toBeVisible();
  await button("Go to pinned page").click();
  const width = document.querySelector<HTMLElement>(".reference-surface")!.offsetWidth;
  await button("Rotate").click();
  await expect
    .poll(() => document.querySelector<HTMLElement>(".reference-surface")!.offsetWidth)
    .not.toBe(width);
  await button("Duplicate").click();
  await expect.element(page.getByText("Pinned page 1", { exact: true })).toBeVisible();
  await button("Delete pages").click();
  await button("Delete page").click();
  await expect.poll(() => document.querySelector(".pinned-page")).toBeNull();
  await expect
    .element(page.getByText("The pinned page was deleted.", { exact: true }))
    .toBeVisible();
  await button("Undo").click();
  expect(document.querySelector(".pinned-page")).toBeNull();
});

it("retains reference state per document and excludes it from portable projects and drafts", async () => {
  const bytes = await formFixture();
  root = await openEditor(bytes, "First.pdf");
  await pin(3);
  await page.getByRole("combobox", { name: "Pinned page zoom", exact: true }).selectOptions("150");
  referenceScroll().scrollTo(100, 200);
  referenceScroll().dispatchEvent(new Event("scroll"));
  const referenceTop = referenceScroll().scrollTop;
  await userEvent.upload(
    document.querySelector<HTMLInputElement>(".header-actions input")!,
    new File([Uint8Array.from(bytes)], "Second.pdf", { type: "application/pdf" })
  );
  await expect.element(button("Close Second.pdf")).toBeVisible();
  expect(document.querySelector(".pinned-page")).toBeNull();
  await pin(2);
  await selectDocument("First.pdf");
  await expect.element(page.getByText("Pinned page 3", { exact: true })).toBeVisible();
  await expect
    .element(page.getByRole("combobox", { name: "Pinned page zoom", exact: true }))
    .toHaveValue("150");
  await expect.poll(() => Math.abs(referenceScroll().scrollTop - referenceTop)).toBeLessThan(3);
  const project = await readProject(
    await editorDownload("Download editing project", "application/octet-stream")
  );
  expect(project.sources[0].bytes).toEqual(bytes);
  expect(Object.keys(project)).not.toContain("pinned");
  await expect.poll(async () => !!(await loadDraft())).toBe(true);
  expect(Object.keys((await loadDraft())!.document)).not.toContain("pinned");
  await button("Close First.pdf").click();
  await expect.element(page.getByText("Pinned page 2", { exact: true })).toBeVisible();
});

it("recovers document edits after reload without recovering the reference", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Recover this edit");
  await pin(2);
  await expect
    .poll(async () => Object.values((await loadDraft())?.document.values ?? {}))
    .toContain("Recover this edit");
  const host = document.querySelector(".app-shell")!.parentElement!;
  root.unmount();
  root = createRoot(host);
  root.render(createElement(App));
  await expect.element(page.getByRole("main", { name: "Document editor" })).toBeVisible();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Recover this edit");
  expect(document.querySelector(".pinned-page")).toBeNull();
});

it.each([390, 760])(
  "uses a reopenable modal at %ipx and restores the desktop split",
  async (width) => {
    await page.viewport(width, 720);
    root = await openEditor(await formFixture());
    await button("Pin page").click();
    await expect
      .element(page.getByRole("dialog", { name: "Pinned page", exact: true }))
      .toBeVisible();
    await page
      .getByRole("combobox", { name: "Pinned page zoom", exact: true })
      .selectOptions("150");
    referenceScroll().scrollTo(100, 200);
    referenceScroll().dispatchEvent(new Event("scroll"));
    const referenceTop = referenceScroll().scrollTop;
    await button("Close pinned viewer").click();
    await expect.element(button("Show pinned page 1")).toBeVisible();
    await button("Show pinned page 1").click();
    await expect
      .element(page.getByRole("combobox", { name: "Pinned page zoom", exact: true }))
      .toHaveValue("150");
    await expect.poll(() => Math.abs(referenceScroll().scrollTop - referenceTop)).toBeLessThan(3);
    await page.screenshot({ path: `../test-results/pinned-page-modal-${width}.png` });
    await page.viewport(1280, 720);
    await expect
      .element(page.getByRole("region", { name: "Pinned page", exact: true }))
      .toBeVisible();
    expect(document.querySelector(".reference-modal")).toBeNull();
  }
);
