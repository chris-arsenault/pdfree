import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { page, userEvent } from "vitest/browser";
import { set } from "idb-keyval";
import { PDFDocument, PDFName, PDFString } from "pdf-lib";
import App from "./App";
import { LanguagePicker } from "./components/LanguagePicker";
import { EditorContext } from "./hooks/editorContext";
import { useEditorState } from "./hooks/useEditorState";
import { useKeyboard } from "./hooks/useKeyboard";
import { useProcessing } from "./hooks/useProcessing";
import { useMessages } from "./i18n/react";
import { locales, type Locale } from "./i18n/locales";
import { loadCatalog } from "./i18n/catalogs";
import { message } from "./i18n/messages";
import {
  currentLocale,
  installCatalogLoader,
  selectLocale,
  startLocalePreferences,
  text,
} from "./i18n/runtime";
import { emptyDocument, type EditorDocument } from "./core/model";
import { appendSource, importPdf } from "./core/importPdf";
import { formFixture } from "./core/fixtures";
import { deleteDraft, loadDrafts } from "./services/drafts";
import { openEditor } from "../tooling/editorHarness";
import usFlag from "./assets/flags/us.svg?url";
import "./styles.css";

let root: Root | null = null;
let stopPreferences = () => {};
let restoreLoader = () => {};
let finish = () => {};
beforeEach(async () => {
  restoreLoader = installCatalogLoader(loadCatalog);
  await selectLocale("en", false);
  localStorage.removeItem("pdfree-language-v1");
  sessionStorage.removeItem("pdfree-open-documents");
  await deleteDraft();
});
afterEach(async () => {
  finish();
  finish = () => {};
  root?.unmount();
  root = null;
  stopPreferences();
  stopPreferences = () => {};
  vi.restoreAllMocks();
  restoreLoader();
  installCatalogLoader(loadCatalog);
  await selectLocale("en", false);
  localStorage.removeItem("pdfree-language-v1");
  document.body.replaceChildren();
  await deleteDraft();
});
function mount(component: typeof App | typeof Probe) {
  const host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
  root.render(createElement(component));
}
const trigger = () => document.querySelector<HTMLButtonElement>(".language-trigger")!;
async function choose(locale: Locale) {
  await userEvent.click(trigger());
  const optionFlag = document.querySelector<HTMLImageElement>(
    `.language-option:has(input[value="${locale}"]) img`
  )!.src;
  await page
    .getByRole("radio", { name: locales.find((item) => item.code === locale)!.name, exact: true })
    .click();
  await expect.poll(currentLocale).toBe(locale);
  await expect.poll(() => trigger().querySelector<HTMLImageElement>("img")?.src).toBe(optionFlag);
  await expect
    .poll(() => trigger().querySelector<HTMLImageElement>("img")?.naturalWidth)
    .toBeGreaterThan(0);
}

it("switches every language from the footer without replacing document content or canvas", async () => {
  root = await openEditor(await formFixture(), "Keep this filename.pdf");
  await page.getByRole("textbox", { name: "name", exact: true }).fill("Keep this field value");
  const surface = document.querySelector(".page-surface");
  for (const locale of locales) {
    await choose(locale.code);
    const catalog = await loadCatalog(locale.code);
    await expect
      .element(page.getByRole("button", { name: catalog["common.export"], exact: true }))
      .toBeVisible();
    expect(document.documentElement.lang).toBe(locale.code);
    expect(document.documentElement.dir).toBe("");
    expect(localStorage.getItem("pdfree-language-v1")).toBe(locale.code);
    expect(document.querySelector(".page-surface")).toBe(surface);
    await expect
      .element(page.getByRole("textbox", { name: "name", exact: true }))
      .toHaveValue("Keep this field value");
    expect(document.querySelector(".document-tab")?.textContent).toContain(
      "Keep this filename.pdf"
    );
  }
});

it("opens above the footer, selects by keyboard and dismisses without clearing editor selection", async () => {
  root = await openEditor(await formFixture());
  await page.getByRole("button", { name: "Text", exact: true }).click();
  await page
    .getByRole("region", { name: "PDF page", exact: true })
    .click({ position: { x: 260, y: 300 } });
  await page.getByRole("textbox", { name: "Object text", exact: true }).fill("Keep selected");
  const placed = document.querySelector(".placed-object");
  trigger().focus();
  await userEvent.keyboard("{Enter}");
  await expect.element(page.getByRole("radio", { name: "English", exact: true })).toBeChecked();
  await expect.poll(() => document.activeElement?.getAttribute("value")).toBe("en");
  expect(
    document.querySelector(".action-popover")!.getBoundingClientRect().bottom
  ).toBeLessThanOrEqual(trigger().getBoundingClientRect().top);
  expect(document.querySelectorAll(".language-panel input")).toHaveLength(17);
  expect(document.querySelectorAll(".language-option img")).toHaveLength(17);
  expect(trigger().querySelector<HTMLImageElement>("img")?.src).toBe(
    new URL(usFlag, location.href).href
  );
  await userEvent.keyboard("{ArrowDown}");
  await expect.poll(currentLocale).toBe("es");
  await expect.poll(() => document.activeElement === trigger()).toBe(true);
  await userEvent.click(trigger());
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => document.querySelector(".language-panel")).toBeNull();
  await expect.poll(() => document.activeElement === trigger()).toBe(true);
  expect(document.querySelector(".placed-object")).toBe(placed);
  await expect
    .element(page.getByRole("button", { name: "Texto: Keep selected", exact: true }))
    .toHaveAttribute("aria-pressed", "true");
  await userEvent.click(trigger());
  await page.getByRole("button", { name: "Seleccionar", exact: true }).click();
  await expect.poll(() => document.querySelector(".language-panel")).toBeNull();
});

it("restores saved preferences and receives another tab's language without a reload", async () => {
  localStorage.setItem("pdfree-language-v1", "fr");
  const preferences = startLocalePreferences();
  stopPreferences = preferences.stop;
  await preferences.ready;
  mount(App);
  await expect.element(page.getByText("Ouvrir un PDF", { exact: true })).toBeVisible();
  const shell = document.querySelector(".app-shell");
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "pdfree-language-v1",
      newValue: "de",
      storageArea: localStorage,
    })
  );
  await expect.element(page.getByText("PDF öffnen", { exact: true })).toBeVisible();
  expect(document.querySelector(".app-shell")).toBe(shell);
  expect(document.documentElement.lang).toBe("de");
});

it("keeps the active language on load failure and keeps the new page language on storage failure", async () => {
  mount(App);
  await expect.element(page.getByText("Your paperwork.")).toBeVisible();
  installCatalogLoader(async (locale) => {
    if (locale === "fr") throw new Error("Unavailable language chunk");
    return loadCatalog(locale);
  });
  await userEvent.click(trigger());
  await page.getByRole("radio", { name: "Français", exact: true }).click();
  await expect
    .element(page.getByRole("status").filter({ hasText: "The language could not load" }))
    .toBeVisible();
  expect(currentLocale()).toBe("en");
  await expect.element(page.getByRole("radio", { name: "English", exact: true })).toBeChecked();
  const setItem = Storage.prototype.setItem;
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (this: Storage, key, value) {
    if (key === "pdfree-language-v1")
      throw new DOMException("Storage blocked", "QuotaExceededError");
    setItem.call(this, key, value);
  });
  await page.getByRole("radio", { name: "Español", exact: true }).click();
  await expect.poll(currentLocale).toBe("es");
  await expect.element(page.getByRole("radio", { name: "Español", exact: true })).toBeChecked();
  await expect.element(page.getByText(text("language.saveFailed"), { exact: true })).toBeVisible();
  expect(localStorage.getItem("pdfree-language-v1")).toBeNull();
});

it("renders migrated legacy source warnings in the selected language without replacing saved content", async () => {
  const pdf = await PDFDocument.load(await formFixture());
  pdf
    .getForm()
    .getTextField("name")
    .acroField.dict.set(
      PDFName.of("AA"),
      pdf.context.obj({
        K: { S: PDFName.of("JavaScript"), JS: PDFString.of("event.value = event.value;") },
      })
    );
  pdf.catalog.set(PDFName.of("StructTreeRoot"), pdf.context.obj({ Type: "StructTreeRoot", K: [] }));
  const bytes = await pdf.save();
  const saved = appendSource(
    emptyDocument(),
    await importPdf(bytes, "Recovered user filename.pdf")
  );
  const field = saved.sources[0].fields.find((item) => item.name === "name")!;
  saved.values[field.id] = "Retained recovered value";
  Reflect.set(saved.sources[0], "warnings", ["Legacy English warning prose"]);
  Reflect.set(saved.sources[0], "structuralWarnings", ["Legacy structural prose"]);
  await set("pdfree-draft-v2:localized-legacy", {
    version: 1,
    modelRevision: 5,
    revision: "old",
    document: saved,
    savedAt: 123,
  });
  sessionStorage.setItem(
    "pdfree-open-documents",
    JSON.stringify({ ids: ["localized-legacy"], activeDraftId: "localized-legacy" })
  );
  await selectLocale("fr", false);
  mount(App);
  await expect
    .element(page.getByRole("textbox", { name: "name", exact: true }))
    .toHaveValue("Retained recovered value");
  await page.getByRole("button", { name: "Document", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: text("document.details"), exact: true });
  await expect
    .element(dialog)
    .toHaveTextContent("Les scripts de formulaire intégrés ne sont pas exécutés");
  await expect.element(dialog).toHaveTextContent("structure d’accessibilité");
  await expect.element(dialog).not.toHaveTextContent("Legacy English");
  await expect.element(dialog).toHaveTextContent("Recovered user filename.pdf");
  const restored = (await loadDrafts()).find((draft) => draft.id === "localized-legacy")!;
  expect(restored.modelRevision).toBe(6);
  expect(restored.document.sources[0].bytes).toEqual(bytes);
  expect(restored.document.pages.map((item) => item.id)).toEqual(
    saved.pages.map((item) => item.id)
  );
  expect(restored.document.sources[0].warnings).toEqual(["scripts"]);
  expect(restored.document.sources[0].structuralWarnings).toEqual(["accessibility"]);
});

let initial: EditorDocument;
let observed: ReturnType<typeof useEditorState>;
let processing: ReturnType<typeof useProcessing>;
function Keyboard() {
  useKeyboard();
  return null;
}
function Probe() {
  useMessages();
  const editor = useEditorState(initial),
    job = useProcessing();
  useEffect(() => {
    observed = editor;
    processing = job;
  }, [editor, job]);
  return createElement(
    EditorContext.Provider,
    { value: editor },
    createElement(LanguagePicker),
    createElement(Keyboard),
    createElement("output", { id: "task-copy" }, editor.task.busy || editor.task.message),
    createElement("output", { id: "progress-copy" }, job.message)
  );
}
it("preserves history, diagnostics, selections and pending processing while messages change language", async () => {
  const bytes = await formFixture();
  initial = appendSource(emptyDocument(), await importPdf(bytes, "User content.pdf"));
  initial.sources[0].warnings = ["scripts"];
  mount(Probe);
  await expect.poll(() => !!observed).toBe(true);
  observed.commit({ ...initial, name: "Edited filename.pdf" });
  observed.setPageIds([initial.pages[0].id]);
  observed.setObjectIds(["retained-selection"]);
  observed.task.notify(message("errors.pagesRequired"));
  await expect.element(page.getByText("Choose at least one page.", { exact: true })).toBeVisible();
  const history = observed.history,
    document = observed.document;
  const operation = processing.run(
    async (signal, progress) => {
      progress(message("progress.page", { index: 1, count: 3 }));
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      expect(signal.aborted).toBe(false);
      return "completed";
    },
    () => {}
  );
  await expect.element(page.getByText("Page 1 of 3", { exact: true })).toBeVisible();
  await choose("es");
  await expect.element(page.getByText("Elige al menos una página.", { exact: true })).toBeVisible();
  await expect.element(page.getByText("Página 1 de 3", { exact: true })).toBeVisible();
  expect(processing.busy).toBe(true);
  expect(observed.history).toBe(history);
  expect(observed.document).toBe(document);
  expect(observed.pageIds).toEqual([initial.pages[0].id]);
  expect(observed.objectIds).toEqual(["retained-selection"]);
  expect(observed.document.sources[0].bytes).toEqual(bytes);
  expect(observed.document.sources[0].warnings).toEqual(["scripts"]);
  finish();
  await operation;
  observed.dispatch({ type: "undo" });
  await expect.poll(() => observed.document.name).toBe("User content.pdf");
});
