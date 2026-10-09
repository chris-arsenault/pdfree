import { type Page } from "playwright";

/** Opts in to the offline copy from the footer and waits until the worker controls the page. */
export async function enableOfflineCopy(page: Page) {
  await page.getByRole("button", { name: "Use offline", exact: true }).click();
  await page.getByRole("button", { name: "Make available offline", exact: true }).click();
  await page
    .getByRole("button", { name: "Works offline", exact: true })
    .waitFor({ timeout: 60_000 });
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await page.keyboard.press("Escape");
}

export const workerState = (page: Page) =>
  page.evaluate(async () => ({
    registrations: (await navigator.serviceWorker.getRegistrations()).length,
    caches: (await caches.keys()).filter((name) => name.startsWith("workbox")).length,
  }));
