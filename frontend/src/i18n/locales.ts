export const locales = [
  { code: "en", name: "English", country: "us" },
  { code: "es", name: "Español", country: "es" },
  { code: "fr", name: "Français", country: "fr" },
  { code: "de", name: "Deutsch", country: "de" },
  { code: "it", name: "Italiano", country: "it" },
  { code: "pt-BR", name: "Português (Brasil)", country: "br" },
  { code: "ru", name: "Русский", country: "ru" },
  { code: "zh-Hans", name: "简体中文", country: "cn" },
  { code: "zh-Hant", name: "繁體中文", country: "tw" },
  { code: "ja", name: "日本語", country: "jp" },
  { code: "ko", name: "한국어", country: "kr" },
  { code: "hi", name: "हिन्दी", country: "in" },
  { code: "ar", name: "العربية", country: "sa" },
  { code: "bn", name: "বাংলা", country: "bd" },
  { code: "id", name: "Bahasa Indonesia", country: "id" },
  { code: "tr", name: "Türkçe", country: "tr" },
  { code: "vi", name: "Tiếng Việt", country: "vn" },
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
