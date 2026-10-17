import { currentLocale } from "./runtime";

export const formatNumber = (value: number, options: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat(currentLocale(), options).format(value);
export const formatDate = (value: Date | number, options: Intl.DateTimeFormatOptions = {}) =>
  new Intl.DateTimeFormat(currentLocale(), options).format(value);
export const formatList = (items: string[]) =>
  new Intl.ListFormat(currentLocale(), { style: "long", type: "conjunction" }).format(items);

/** New PDF text uses local date order within the existing bundled font's glyphs. */
export const formatDocumentDate = (value: Date) =>
  new Intl.DateTimeFormat(currentLocale(), { calendar: "gregory", numberingSystem: "latn" })
    .format(value)
    .replace(/[\u200e\u200f\u061c]/g, "");
