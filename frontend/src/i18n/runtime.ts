import { createInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { en, type MessageKey } from "./en";
import { type UiMessage, message, type MessageValues } from "./messages";
import { loadCatalog } from "./catalogs";
import { type Locale, negotiateLocale } from "./locales";

export const i18n = createInstance();
i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  keySeparator: false,
  resources: { en: { translation: en } },
  initAsync: false,
  interpolation: { escapeValue: false },
});
export type LogicalKey = Exclude<
  MessageKey,
  `${string}_${"zero" | "one" | "two" | "few" | "many" | "other"}`
>;
export type Catalog = Record<LogicalKey, string> & Record<string, string>;
const preferenceKey = "pdfree-language-v1";
const listeners = new Set<() => void>();
let active: Locale = "en";
let generation = 0;
let issue: UiMessage | null = null;
type Loader = (locale: Locale) => Promise<Catalog>;
let loader: Loader = loadCatalog;
export const installCatalogLoader = (load: Loader) => {
  const previous = loader;
  loader = load;
  return () => {
    loader = previous;
  };
};
export const currentLocale = () => active;
export const languageIssue = () => issue;
export function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
const publish = () => listeners.forEach((listener) => listener());
export function text<K extends MessageKey>(
  key: K,
  ...args: keyof MessageValues<K> extends never ? [] : [values: MessageValues<K>]
): string {
  return renderMessage({ key, values: args[0] ?? {} } as UiMessage);
}
export function renderMessage(ui: UiMessage): string {
  const values = Object.fromEntries(
    Object.entries(ui.values).map(([key, value]) => [key, displayValue(value)])
  );
  // Keep count numeric for plural selection and format only interpolation values.
  return i18n.t(ui.key, { ...ui.values, replace: values });
}
function displayValue(value: string | number | UiMessage[]) {
  if (Array.isArray(value)) return new Intl.ListFormat(active).format(value.map(renderMessage));
  return typeof value === "number" ? new Intl.NumberFormat(active).format(value) : value;
}
export async function selectLocale(locale: Locale, persist = true) {
  const ticket = ++generation;
  let catalog: Catalog;
  try {
    catalog = await loader(locale);
  } catch {
    if (ticket === generation) {
      issue = message("language.loadFailed");
      publish();
    }
    return false;
  }
  if (ticket !== generation) return false;
  i18n.addResourceBundle(locale, "translation", catalog, true, true);
  active = locale;
  await i18n.changeLanguage(locale);
  issue = null;
  if (typeof document !== "undefined") updatePageMetadata(locale);
  if (persist) {
    try {
      localStorage.setItem(preferenceKey, locale);
    } catch {
      issue = message("language.saveFailed");
    }
  }
  publish();
  return true;
}
export function startLocalePreferences() {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(preferenceKey);
  } catch {
    /* Page preference still works. */
  }
  const preferred = negotiateLocale(saved, navigator.languages);
  const ready = selectLocale(preferred, false);
  const storage = (event: StorageEvent) => {
    if (event.key !== preferenceKey && event.key !== null) return;
    void selectLocale(negotiateLocale(event.newValue, navigator.languages), false);
  };
  window.addEventListener("storage", storage);
  return { ready, stop: () => window.removeEventListener("storage", storage) };
}
function updatePageMetadata(locale: Locale) {
  document.documentElement.lang = locale;
  document.title = text("page.title");
  const metadata = [
    ['meta[name="description"]', "page.description"],
    ['meta[property="og:description"]', "page.socialDescription"],
    ['meta[property="og:title"]', "page.title"],
    ['meta[name="twitter:title"]', "page.title"],
    ['meta[name="twitter:description"]', "page.twitterDescription"],
    ['meta[property="og:image:alt"]', "page.imageAlt"],
    ['meta[name="twitter:image:alt"]', "page.imageAlt"],
  ] as const;
  metadata.forEach(([selector, key]) =>
    document.querySelector(selector)?.setAttribute("content", text(key))
  );
}
