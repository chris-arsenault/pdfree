import { en } from "./en";
import { failure } from "./messages";
import { type Locale } from "./locales";
import { type Catalog } from "./runtime";

/** Vite emits one on-demand same-origin module per language. */
const chunks = import.meta.glob<Catalog>("./catalogs/*.ts", { import: "default" });
export async function loadCatalog(locale: Locale): Promise<Catalog> {
  if (locale === "en") return en;
  const load = chunks[`./catalogs/${locale}.ts`];
  if (!load) throw failure("language.loadFailed");
  return load();
}
