export const locales = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt-BR", name: "Português (Brasil)" },
  { code: "ru", name: "Русский" },
  { code: "zh-Hans", name: "简体中文" },
  { code: "zh-Hant", name: "繁體中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "hi", name: "हिन्दी" },
  { code: "ar", name: "العربية" },
  { code: "bn", name: "বাংলা" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "tr", name: "Türkçe" },
  { code: "vi", name: "Tiếng Việt" },
] as const;
export type Locale = (typeof locales)[number]["code"];
export function matchLocale(input: string): Locale | null {
  const normalized = input.replaceAll("_", "-").toLowerCase();
  const exact = locales.find((item) => item.code.toLowerCase() === normalized);
  if (exact) return exact.code;
  const parts = normalized.split("-");
  if (parts[0] === "zh" && parts.includes("hans")) return "zh-Hans";
  if (parts[0] === "zh")
    return parts.includes("hant") || parts.some((part) => ["tw", "hk", "mo"].includes(part))
      ? "zh-Hant"
      : "zh-Hans";
  if (parts[0] === "pt") return "pt-BR";
  return locales.find((item) => item.code === parts[0])?.code ?? null;
}
export function negotiateLocale(saved: string | null, preferences: readonly string[]): Locale {
  if (saved && locales.some((item) => item.code === saved)) return saved as Locale;
  for (const preference of preferences) {
    const match = matchLocale(preference);
    if (match) return match;
  }
  return "en";
}
