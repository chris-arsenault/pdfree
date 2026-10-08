import { afterEach, expect, it } from "vitest";
import { page } from "vitest/browser";
import { type Root } from "react-dom/client";
import { localPdf } from "./services/viewer";
import { openEditor, editorDownload } from "../tooling/editorHarness";
import { commentFixture } from "./core/commentFixture";
import { readProject } from "./core/projects";
import { deleteDraft, loadDrafts } from "./services/drafts";

let root: Root | null = null;
afterEach(async () => {
  root?.unmount();
  root = null;
  await deleteDraft();
});
it("edits existing notes, posts a Unicode reply and saves real PDF annotations and drafts", async () => {
  root = await openEditor(await commentFixture());
  await page.getByRole("button", { name: "Comment: Review café 東京", exact: true }).click();
  await expect.element(page.getByText("Original reply", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Edit comment", exact: true }).click();
  await page.getByRole("textbox", { name: "Edit comment", exact: true }).fill("Reviewed Ελληνικά");
  await page.getByRole("button", { name: "Save comment", exact: true }).click();
  await page.getByRole("button", { name: "Reply", exact: true }).click();
  await page.getByRole("textbox", { name: "Reply", exact: true }).fill("Thanks 東京");
  await page.getByRole("textbox", { name: "Name (optional)", exact: true }).fill("Renée");
  await page.getByRole("button", { name: "Post reply", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await loadDrafts()).some((draft) =>
          draft.document.pages[0].comments.some((comment) => comment.text === "Thanks 東京")
        ),
      { timeout: 10_000 }
    )
    .toBe(true);
  const bytes = await editorDownload("Download PDF", "application/pdf");
  const pdf = await localPdf(bytes);
  try {
    const annotations = await (await pdf.getPage(1)).getAnnotations();
    const note = annotations.find((item) => item.contentsObj?.str === "Reviewed Ελληνικά");
    const reply = annotations.find((item) => item.contentsObj?.str === "Thanks 東京");
    expect(note?.subtype).toBe("Text");
    expect(reply?.titleObj.str).toBe("Renée");
    expect(reply?.inReplyTo).toBe(note?.id);
    expect(reply?.replyType).toBe("R");
    expect(reply?.annotationFlags).toBe(4);
  } finally {
    await pdf.destroy();
  }
}, 20_000);

it("places comments, undoes and restores them, cancels deletion and saves projects", async () => {
  root = await openEditor(await commentFixture());
  await page.getByRole("button", { name: "Comment", exact: true }).click();
  document
    .querySelector<HTMLElement>(".page-surface")!
    .dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: 400, clientY: 400 }));
  await page.getByRole("textbox", { name: "New comment", exact: true }).fill("A new note");
  await page.getByRole("button", { name: "Post comment", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Comment: A new note", exact: true }))
    .toBeVisible();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Comment: A new note", exact: true }))
    .not.toBeInTheDocument();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByRole("button", { name: "Delete comment", exact: true }).click();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Comment: A new note", exact: true }))
    .toBeVisible();
  const project = await readProject(
    await editorDownload("Download editing project", "application/octet-stream")
  );
  expect(project.pages[0].comments.some((comment) => comment.text === "A new note")).toBe(true);
}, 20_000);
