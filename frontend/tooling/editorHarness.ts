import { createRoot } from "react-dom/client";
import { createElement } from "react";
import { expect, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import App from "../src/App";
import "../src/styles.css";

export async function openEditor(bytes: Uint8Array, name = "test.pdf") {
  const host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  root.render(createElement(App));
  try {
    await expect.element(page.getByText("Your paperwork.")).toBeVisible();
    await userEvent.upload(
      document.querySelector<HTMLInputElement>(".drop-card input")!,
      new File([Uint8Array.from(bytes)], name, { type: "application/pdf" })
    );
    await expect.element(page.getByRole("main", { name: "Document editor" })).toBeVisible();
    return root;
  } catch (error) {
    root.unmount();
    throw error;
  }
}

export async function editorDownload(
  buttonName: string,
  mime: string,
  action = "Export",
  flatten = false
) {
  const create = URL.createObjectURL.bind(URL),
    files: Promise<ArrayBuffer>[] = [];
  const spy = vi.spyOn(URL, "createObjectURL").mockImplementation((object) => {
    if (object instanceof Blob && object.type === mime) files.push(object.arrayBuffer());
    return create(object);
  });
  try {
    if (action) await page.getByRole("button", { name: action, exact: true }).click();
    if (flatten) await page.getByRole("checkbox", { name: /Flatten/ }).click();
    await page.getByRole("button", { name: buttonName, exact: true }).click();
    // Certificate parsing and password key derivation can outlast the default poll timeout.
    await expect.poll(() => files.length, { timeout: 10_000 }).toBe(1);
    return new Uint8Array(await files[0]);
  } finally {
    spy.mockRestore();
  }
}
