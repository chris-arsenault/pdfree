import { en, type MessageKey } from "../src/i18n/en";

/** Build/dev HTML receives the same canonical copy as the application. */
export function catalogHtml(html: string): string {
  return html.replace(/__PDFREE_([\w.]+)__/g, (_match, key: MessageKey) => {
    if (!Object.hasOwn(en, key)) throw new Error("Unknown HTML catalog key: " + key);
    return en[key].replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  });
}
