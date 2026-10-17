import { failure } from "./messages";

/** Author native plural forms together while keeping each catalog key explicit. */
export function pluralCatalog<
  const Categories extends readonly string[],
  const Messages extends Record<string, string | { readonly [Index in keyof Categories]: string }>,
>(categories: Categories, messages: Messages) {
  const entries = Object.entries(messages).flatMap(([key, forms]) => {
    const values =
      typeof forms === "string" ? categories.map(() => forms) : (forms as readonly string[]);
    if (values.length !== categories.length || !categories.includes("other")) {
      throw failure("errors.operation");
    }
    return [
      [key, values[categories.indexOf("other")]!],
      ...categories.map((category, index) => [`${key}_${category}`, values[index]!]),
    ];
  });
  return Object.fromEntries(entries) as {
    [Key in keyof Messages & string as Key | `${Key}_${Categories[number]}`]: string;
  };
}
