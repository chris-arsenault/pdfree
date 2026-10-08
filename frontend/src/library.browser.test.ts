import { afterEach, beforeEach, expect, it } from "vitest";
import { type Root } from "react-dom/client";
import { page, userEvent } from "vitest/browser";
import { openEditor, editorDownload } from "../tooling/editorHarness";
import { formFixture } from "./core/fixtures";
import { deleteDraft, loadDrafts } from "./services/drafts";
import { clearSignatures, rememberSignature, savedSignatures } from "./services/signatures";
import { localPdf } from "./services/viewer";

let root: Root | null = null;
beforeEach(async () => {
  await deleteDraft();
  await clearSignatures();
});
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  await deleteDraft();
  await clearSignatures();
});

it("retains documents in tabs and focuses their library entries without duplicates", async () => {
  const bytes = Uint8Array.from(await formFixture());
  root = await openEditor(bytes, "First.pdf");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("First edit");
  await expect
    .poll(async () => Object.values((await loadDrafts())[0]?.document.values ?? {}), {
      timeout: 10_000,
    })
    .toContain("First edit");
  const firstId = (await loadDrafts())[0].id;
  await userEvent.upload(
    document.querySelector<HTMLInputElement>(".header-actions input")!,
    new File([bytes], "Second.pdf", { type: "application/pdf" })
  );
  await expect
    .element(page.getByRole("button", { name: "Close Second.pdf", exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Original");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Second edit");
  await expect
    .poll(
      async () =>
        Object.values(
          (await loadDrafts()).find((draft) => draft.document.name === "Second.pdf")?.document
            .values ?? {}
        ),
      { timeout: 10_000 }
    )
    .toContain("Second edit");
  expect(await loadDrafts()).toHaveLength(2);
  await page.getByRole("button", { name: "Library", exact: true }).click();
  const open = page.getByRole("button", { name: "Open First.pdf", exact: true });
  await open.click();
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("First edit");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Reopened edit");
  await expect
    .poll(
      async () =>
        Object.values((await loadDrafts()).find((draft) => draft.id === firstId)!.document.values),
      { timeout: 10_000 }
    )
    .toContain("Reopened edit");
  expect(await loadDrafts()).toHaveLength(2);
  expect(document.querySelectorAll(".document-tab")).toHaveLength(2);
  const pdf = await localPdf(await editorDownload("Download PDF", "application/pdf"));
  try {
    expect(pdf.numPages).toBe(3);
    const annotations = await (await pdf.getPage(1)).getAnnotations();
    expect(annotations.find((field) => field.fieldName === "name")?.fieldValue).toBe(
      "Reopened edit"
    );
  } finally {
    await pdf.destroy();
  }
});

it("previews, uses and individually removes signatures without removing placed marks", async () => {
  root = await openEditor(await formFixture());
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 20;
  canvas.getContext("2d")!.fillRect(0, 8, 80, 4);
  const blob = await new Promise<Blob>((resolve) => canvas.toBlob((value) => resolve(value!)));
  await rememberSignature({
    id: "typed",
    label: "Alice",
    asset: null,
    object: { kind: "text", text: "Alice", font: "signature", width: 200, height: 50 },
  });
  await rememberSignature({
    id: "image",
    label: "Image mark",
    asset: {
      id: "mark",
      name: "Image mark",
      mime: "image/png",
      data: new Uint8Array(await blob.arrayBuffer()),
    },
    object: { kind: "image", assetId: "mark", width: 160, height: 40 },
  });
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await expect.element(page.getByRole("img", { name: "Image mark" })).toBeVisible();
  await page.getByRole("button", { name: "Use Alice", exact: true }).click();
  await page
    .getByRole("region", { name: "PDF page", exact: true })
    .click({ position: { x: 100, y: 100 } });
  await expect
    .element(page.getByRole("button", { name: "text: Alice", exact: true }))
    .toBeVisible();
  await page.getByRole("button", { name: "Library", exact: true }).click();
  await page.getByRole("button", { name: "Delete signature Alice", exact: true }).click();
  await expect
    .element(page.getByRole("button", { name: "Use Alice", exact: true }))
    .not.toBeInTheDocument();
  expect((await savedSignatures()).map((saved) => saved.label)).toEqual(["Image mark"]);
  await page.getByRole("button", { name: "Use Image mark", exact: true }).click();
  await page
    .getByRole("region", { name: "PDF page", exact: true })
    .click({ position: { x: 100, y: 200 } });
  await expect
    .element(page.getByRole("button", { name: "image: object", exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole("button", { name: "text: Alice", exact: true }))
    .toBeVisible();
});
