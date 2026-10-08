import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { page, userEvent } from "vitest/browser";
import { EditorContext } from "./hooks/editorContext";
import { useEditorState } from "./hooks/useEditorState";
import { useKeyboard } from "./hooks/useKeyboard";
import { emptyDocument, defaultObject, type EditorDocument } from "./core/model";
import {
  deleteDraft,
  draftSession,
  loadDrafts,
  saveDraft,
  removeRecoveredDraft,
} from "./services/drafts";
import App from "./App";
import { formFixture } from "./core/fixtures";
import { DraftStatus } from "./components/DraftStatus";

let root: Root | null = null;
let finishTask: (() => void) | null = null;
function BusyProbe() {
  const editor = useEditorState();
  return createElement(
    EditorContext.Provider,
    { value: editor },
    createElement(DraftStatus),
    createElement(
      "button",
      {
        onClick: () =>
          editor.task.run(
            "Waiting",
            () =>
              new Promise<void>((resolve) => {
                finishTask = resolve;
              })
          ),
      },
      "Block"
    )
  );
}
function documentFixture(name = "First.pdf"): EditorDocument {
  return {
    ...emptyDocument(),
    name,
    pages: [
      {
        id: name,
        sourceId: "",
        sourceIndex: 0,
        rotation: 0,
        box: { x: 0, y: 0, width: 600, height: 800 },
        objects: [{ ...defaultObject("text", { x: 10, y: 20 }), id: "selected", text: "Object" }],
      },
    ],
  };
}
function Keyboard() {
  useKeyboard();
  return null;
}
function StateProbe() {
  const editor = useEditorState();
  return createElement(
    EditorContext.Provider,
    { value: editor },
    createElement(Keyboard),
    createElement("span", { id: "copy-text" }, "Original PDF text"),
    createElement(
      "output",
      { "data-testid": "state" },
      JSON.stringify({
        tool: editor.tool,
        pending: editor.pendingObject,
        pages: editor.pageIds,
        objects: editor.objectIds,
        dialog: editor.dialog,
        count: editor.page?.objects.length ?? 0,
      })
    ),
    createElement(
      "button",
      {
        onClick: () => {
          editor.replace(documentFixture());
          editor.setObjectIds(["selected"]);
        },
      },
      "First"
    ),
    createElement(
      "button",
      {
        onClick: () => {
          editor.setTool("image");
          editor.setPendingObject({ assetId: "old-asset" });
          editor.setPageIds(["First.pdf"]);
          editor.setDialog("signature");
        },
      },
      "Prepare"
    ),
    createElement(
      "button",
      { onClick: () => editor.replace(documentFixture("Second.pdf")) },
      "Replace"
    )
  );
}
function mount(component: typeof App | typeof StateProbe) {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  root.render(createElement(component));
}
beforeEach(async () => {
  await deleteDraft();
});
afterEach(async () => {
  finishTask?.();
  finishTask = null;
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  window.getSelection()?.removeAllRanges();
  await deleteDraft();
});

it("disables draft recovery and clearing while another document task is running", async () => {
  await saveDraft(documentFixture("Recovery.pdf"), await draftSession("closed-tab"));
  mount(BusyProbe);
  await expect
    .element(page.getByRole("button", { name: "Recover draft", exact: true }))
    .toBeEnabled();
  await page.getByRole("button", { name: "Block", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Recover draft", exact: true }))
    .toBeDisabled();
  await page.getByRole("button", { name: "Local data", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Clear local data", exact: true }))
    .toBeDisabled();
});

it("resets placement, selection, and dialog state on document replacement", async () => {
  mount(StateProbe);
  await page.getByRole("button", { name: "First", exact: true }).click();
  await page.getByRole("button", { name: "Prepare", exact: true }).click();
  await expect.element(page.getByTestId("state")).toHaveTextContent("old-asset");
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  await expect
    .element(page.getByTestId("state"))
    .toHaveTextContent(
      JSON.stringify({ tool: "select", pending: {}, pages: [], objects: [], dialog: "", count: 1 })
    );
});

it("copies selected PDF text normally and clears the object clipboard when replacing a document", async () => {
  mount(StateProbe);
  await page.getByRole("button", { name: "First", exact: true }).click();
  const span = document.querySelector("#copy-text")!;
  const range = document.createRange();
  range.selectNodeContents(span);
  window.getSelection()?.addRange(range);
  const textCopy = new KeyboardEvent("keydown", {
    key: "c",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
  span.dispatchEvent(textCopy);
  expect(textCopy.defaultPrevented).toBe(false);
  window.getSelection()?.removeAllRanges();
  const objectCopy = new KeyboardEvent("keydown", {
    key: "c",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
  span.dispatchEvent(objectCopy);
  expect(objectCopy.defaultPrevented).toBe(true);
  await page.getByRole("button", { name: "Replace", exact: true }).click();
  const paste = new KeyboardEvent("keydown", {
    key: "v",
    ctrlKey: true,
    bubbles: true,
    cancelable: true,
  });
  span.dispatchEvent(paste);
  expect(paste.defaultPrevented).toBe(false);
  await expect.element(page.getByTestId("state")).toHaveTextContent('"count":1');
});

it("does not place an image prepared in a document that has been replaced", async () => {
  mount(App);
  await expect.element(page.getByRole("heading", { name: /^Your paperwork/ })).toBeVisible();
  const bytes = Uint8Array.from(await formFixture());
  await userEvent.upload(
    document.querySelector<HTMLInputElement>(".drop-card input")!,
    new File([bytes], "First.pdf", { type: "application/pdf" })
  );
  await expect.element(page.getByText("PAGE 1 OF 3", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Image", exact: true }).click();
  const canvas = document.createElement("canvas");
  canvas.width = 10;
  canvas.height = 10;
  canvas.getContext("2d")!.fillRect(0, 0, 10, 10);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!)));
  await userEvent.upload(
    document.querySelector<HTMLInputElement>('input[accept="image/png,image/jpeg"]')!,
    new File([blob], "synthetic.png", { type: "image/png" })
  );
  await expect.element(page.getByText("Opening image…", { exact: true })).not.toBeInTheDocument();
  await userEvent.upload(
    document.querySelector<HTMLInputElement>(".header-actions input")!,
    new File([bytes], "Second.pdf", { type: "application/pdf" })
  );
  await page
    .getByRole("dialog", { name: "Open a new document?", exact: true })
    .getByRole("button", { name: "Open document", exact: true })
    .click();
  await expect.element(page.getByText("Second.pdf", { exact: false })).toBeVisible();
  await page.getByRole("region", { name: "PDF page", exact: true }).click({
    position: { x: 100, y: 100 },
  });
  expect(document.querySelectorAll(".placed-object")).toHaveLength(0);
  await expect
    .element(page.getByRole("button", { name: "Select", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
});

it("keeps two live draft owners independent and lists both recovery documents", async () => {
  const first = await draftSession("first-tab"),
    second = await draftSession("second-tab");
  await Promise.all([
    saveDraft(documentFixture("First.pdf"), first),
    saveDraft(documentFixture("Second.pdf"), second),
  ]);
  expect((await loadDrafts()).map((draft) => draft.document.name).sort()).toEqual([
    "First.pdf",
    "Second.pdf",
  ]);
});

it("fences a queued write from before global clear and allows a new generation", async () => {
  const old = await draftSession("old-tab");
  await saveDraft(documentFixture(), old);
  await deleteDraft();
  expect(await saveDraft(documentFixture("Queued old edit.pdf"), old)).toBe(false);
  expect(await loadDrafts()).toEqual([]);
  expect(await saveDraft(documentFixture("New edit.pdf"), await draftSession("old-tab"))).toBe(
    true
  );
  expect((await loadDrafts())[0].document.name).toBe("New edit.pdf");
});

it("removes an adopted recovery only after its replacement has been saved", async () => {
  await saveDraft(documentFixture("Recovered.pdf"), await draftSession("closed-tab"));
  const old = (await loadDrafts())[0],
    destination = await draftSession("new-tab");
  expect(await saveDraft(old.document, destination)).toBe(true);
  await removeRecoveredDraft(old, destination.id);
  const remaining = await loadDrafts();
  expect(remaining).toHaveLength(1);
  expect(remaining[0].id).toBe(destination.id);
});

it("does not remove a recovery slot another tab has updated after it was read", async () => {
  const clock = vi.spyOn(Date, "now").mockReturnValue(1000);
  try {
    const active = await draftSession("active-tab");
    await saveDraft(documentFixture(), active);
    const snapshot = (await loadDrafts())[0];
    await saveDraft(documentFixture("Later edit.pdf"), active);
    await removeRecoveredDraft(snapshot, "new-tab");
    expect((await loadDrafts())[0].document.name).toBe("Later edit.pdf");
  } finally {
    clock.mockRestore();
  }
});
