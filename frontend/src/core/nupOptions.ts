export type NupOptions = {
  count: 1 | 2 | 4 | 6;
  paper: "letter" | "a4" | "legal";
  landscape: boolean;
  order: "rows" | "columns";
  margin: number;
};
export const defaultNup: NupOptions = {
  count: 1,
  paper: "letter",
  landscape: false,
  order: "rows",
  margin: 18,
};
