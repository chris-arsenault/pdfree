import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { type Root } from "react-dom/client";
import { page } from "vitest/browser";
import { formFixture } from "./core/fixtures";
import { deleteDraft } from "./services/drafts";
import { openEditor } from "../tooling/editorHarness";
import { type OfflineEvents } from "./services/offline";

// The real service worker only exists in production builds; release tests cover it.
const offline = vi.hoisted(() => ({
  chosen: false,
  installable: false,
  stored: 0,
  finish: () => {},
  enable: vi.fn<(events: OfflineEvents) => Promise<() => Promise<void>>>(),
  keep: vi.fn(async () => true),
  remove: vi.fn(async () => {}),
  install: vi.fn(async () => true),
}));
vi.mock("./services/offline", () => ({
  offlineSupported: () => true,
  offlineChosen: async () => offline.chosen,
  offlineSize: async () => ({ files: 240, bytes: 29 * 1024 * 1024 }),
  precachedFiles: async () => offline.stored,
  enableOffline: offline.enable,
  keepOfflineCopy: offline.keep,
  offlineCopyKept: async () => true,
  removeOffline: offline.remove,
  canInstallApp: () => offline.installable,
  onInstallChange: () => () => {},
  installApp: offline.install,
}));

let root: Root | null = null;
beforeEach(async () => {
  await deleteDraft();
  Object.assign(offline, { chosen: false, installable: false, stored: 0 });
  offline.enable.mockReset();
  offline.enable.mockImplementation(
    () =>
      new Promise((resolve) => {
        offline.finish = () => resolve(async () => {});
      })
  );
  for (const mock of [offline.keep, offline.remove, offline.install]) mock.mockClear();
});
afterEach(async () => {
  root?.unmount();
  root = null;
  document.body.replaceChildren();
  await deleteDraft();
});

it("stays online-only until the user opts in, then saves, reports progress and removes", async () => {
  root = await openEditor(await formFixture());
  const trigger = page.getByRole("button", { name: "Use offline", exact: true });
  await expect.element(trigger).toBeVisible();
  expect(offline.enable).not.toHaveBeenCalled();
  await trigger.click();
  await expect.element(page.getByText(/loads from the internet on each visit/)).toBeVisible();
  await expect.element(page.getByText(/29 MB, including text recognition/)).toBeVisible();
  await page.getByRole("button", { name: "Make available offline", exact: true }).click();
  expect(offline.enable).toHaveBeenCalledOnce();
  offline.stored = 120;
  await expect
    .element(page.getByRole("button", { name: "Saving for offline 50%", exact: true }))
    .toBeVisible();
  offline.stored = 240;
  offline.finish();
  const ready = page.getByRole("button", { name: "Works offline", exact: true });
  await expect.element(ready).toBeVisible();
  expect(offline.keep).toHaveBeenCalledOnce();
  // The panel stays open while saving, so it now offers removal directly.
  await expect.element(page.getByText(/opens without a connection/)).toBeVisible();
  await page.getByRole("button", { name: "Remove offline copy", exact: true }).click();
  const confirm = page.getByRole("dialog", { name: "Remove offline copy?", exact: true });
  await confirm.getByRole("button", { name: "Remove offline copy", exact: true }).click();
  await expect.element(trigger).toBeVisible();
  expect(offline.remove).toHaveBeenCalledOnce();
});

it("keeps an earlier offline choice working without asking again", async () => {
  offline.chosen = true;
  offline.enable.mockImplementation(async () => async () => {});
  root = await openEditor(await formFixture());
  await expect
    .element(page.getByRole("button", { name: "Works offline", exact: true }))
    .toBeVisible();
  expect(offline.enable).toHaveBeenCalledOnce();
  // Persistent storage is only requested when the user opts in, not on every visit.
  expect(offline.keep).not.toHaveBeenCalled();
});

it("saves the offline copy when the user installs the app", async () => {
  offline.installable = true;
  root = await openEditor(await formFixture());
  await page.getByRole("button", { name: "Use offline", exact: true }).click();
  await page.getByRole("button", { name: "Install app", exact: true }).click();
  await expect.poll(() => offline.enable.mock.calls.length).toBe(1);
  expect(offline.install).toHaveBeenCalledOnce();
});
