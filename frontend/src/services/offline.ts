/**
 * Opt-in offline copy. PDFree registers its service worker only after the user
 * asks for offline access (or installs the app); a plain visit precaches nothing.
 */
const choiceKey = "pdfree-offline";
const precachePrefix = "workbox-precache";

export type OfflineSize = { files: number; bytes: number };
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const offlineSupported = () =>
  "serviceWorker" in navigator && "caches" in window && !import.meta.env.DEV;

function remember(on: boolean) {
  try {
    if (on) localStorage.setItem(choiceKey, "on");
    else localStorage.removeItem(choiceKey);
  } catch {
    // Without storage the choice is still carried by the service worker registration.
  }
}
function remembered() {
  try {
    return localStorage.getItem(choiceKey) === "on";
  } catch {
    return false;
  }
}
export const runningAsApp = () => window.matchMedia("(display-mode: standalone)").matches;

/**
 * Whether this visit should keep the offline copy: the user chose it, an earlier
 * version already registered the worker (treated as chosen), or the app is installed.
 */
export async function offlineChosen() {
  if (!offlineSupported()) return false;
  if (remembered() || runningAsApp()) return true;
  return Boolean(await navigator.serviceWorker.getRegistration());
}

export async function offlineSize(): Promise<OfflineSize | null> {
  try {
    const response = await window.fetch(`${import.meta.env.BASE_URL}offline-manifest.json`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    const size = (await response.json()) as Partial<OfflineSize>;
    return typeof size.files === "number" && typeof size.bytes === "number"
      ? { files: size.files, bytes: size.bytes }
      : null;
  } catch {
    return null;
  }
}

/** Files already stored by the service worker's precache. */
export async function precachedFiles() {
  let count = 0;
  for (const name of await caches.keys())
    if (name.startsWith(precachePrefix)) count += (await (await caches.open(name)).keys()).length;
  return count;
}

export type OfflineEvents = {
  onNeedRefresh: () => void;
  onRegisterError: (error: unknown) => void;
};
/**
 * Registers the worker and resolves once it is active, which is after its
 * install step has stored every precached file. Returns the update function.
 */
export async function enableOffline(events: OfflineEvents) {
  remember(true);
  const { registerSW } = await import("virtual:pwa-register");
  let fail: (error: unknown) => void = () => {};
  const failed = new Promise<never>((_, reject) => (fail = reject));
  const update = registerSW({
    immediate: true,
    onNeedRefresh: events.onNeedRefresh,
    onRegisterError: (error: unknown) => {
      remember(false);
      events.onRegisterError(error);
      fail(error ?? new Error("Registration failed."));
    },
  });
  await Promise.race([navigator.serviceWorker.ready, failed]);
  return update;
}

/**
 * Asks the browser not to evict the offline copy under storage pressure. Some
 * browsers prompt for this, so it is requested only when the user opts in.
 */
export async function keepOfflineCopy() {
  try {
    return (await navigator.storage?.persist?.()) ?? false;
  } catch {
    return false;
  }
}
export async function offlineCopyKept() {
  try {
    return (await navigator.storage?.persisted?.()) ?? false;
  } catch {
    return false;
  }
}

/** Unregisters the worker and deletes its caches; the page stays usable online. */
export async function removeOffline() {
  remember(false);
  for (const registration of await navigator.serviceWorker.getRegistrations())
    await registration.unregister();
  for (const name of await caches.keys())
    if (name.startsWith(precachePrefix) || name.startsWith("workbox-")) await caches.delete(name);
}

// The browser offers app installation once per page load; keep the event until asked.
let installPrompt: InstallPrompt | null = null;
const installListeners = new Set<() => void>();
const notifyInstall = () => installListeners.forEach((listener) => listener());
/** Call once at startup, before the browser fires its install prompt event. */
export function captureInstallPrompt() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event as InstallPrompt;
    notifyInstall();
  });
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    remember(true);
    notifyInstall();
  });
}
export const canInstallApp = () => installPrompt !== null;
export function onInstallChange(listener: () => void) {
  installListeners.add(listener);
  return () => {
    installListeners.delete(listener);
  };
}
/** Shows the browser's install prompt; true when the user installed the app. */
export async function installApp() {
  const prompt = installPrompt;
  if (!prompt) return false;
  installPrompt = null;
  notifyInstall();
  await prompt.prompt();
  return (await prompt.userChoice).outcome === "accepted";
}
