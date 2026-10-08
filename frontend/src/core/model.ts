export type Maybe<T> = T | null;
export type FieldValue = string | string[] | boolean;
export type FieldKind = "text" | "checkbox" | "radio" | "dropdown" | "list";
export type Tool =
  | "select"
  | "text"
  | "check"
  | "cross"
  | "date"
  | "signature"
  | "initials"
  | "image"
  | "stamp"
  | "ink"
  | "highlight"
  | "rectangle"
  | "line"
  | "arrow"
  | "field";
export type Point = { x: number; y: number };
export type Box = Point & { width: number; height: number; rotation: number };
export type Widget = Box & { pageIndex: number; option: string };
export type ChoiceOption = { value: string; label: string };
export type NativeField = {
  id: string;
  name: string;
  kind: FieldKind;
  value: FieldValue;
  widgets: Widget[];
  required: boolean;
  readOnly: boolean;
  multiline: boolean;
  maxLength: number;
  options: string[];
  choiceOptions: ChoiceOption[];
  multiSelect: boolean;
};
export type Source = {
  id: string;
  name: string;
  bytes: Uint8Array;
  pageCount: number;
  fields: NativeField[];
  warnings: string[];
  structuralWarnings: string[];
  title: string;
  author: string;
};
export type PlacedObject = Box & {
  id: string;
  kind: Exclude<Tool, "select" | "date" | "signature" | "initials">;
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  align: "left" | "center" | "right";
  font: "sans" | "signature";
  assetId: string;
  points: Point[];
  strokeWidth: number;
  fieldKind: FieldKind;
  fieldName: string;
  options: string[];
  required: boolean;
};
export type Page = {
  id: string;
  sourceId: string;
  sourceIndex: number;
  rotation: number;
  box: { x: number; y: number; width: number; height: number };
  objects: PlacedObject[];
};
export type Asset = { id: string; name: string; data: Uint8Array; mime: string };
export type EditorDocument = {
  version: 1;
  name: string;
  sources: Source[];
  pages: Page[];
  values: Record<string, FieldValue>;
  assets: Asset[];
};
export const newId = () => crypto.randomUUID();
export const emptyDocument = (): EditorDocument => ({
  version: 1,
  name: "Untitled.pdf",
  sources: [],
  pages: [],
  values: {},
  assets: [],
});
export const fieldKey = (sourceId: string, name: string) => `${sourceId}:${name}`;
export const defaultObject = (kind: PlacedObject["kind"], point: Point): PlacedObject => ({
  id: newId(),
  kind,
  ...point,
  width: 150,
  height: 28,
  rotation: 0,
  text: kind === "stamp" ? "APPROVED" : "",
  fontSize: 14,
  color: "#172c45",
  opacity: kind === "highlight" ? 0.3 : 1,
  align: "left",
  font: "sans",
  assetId: "",
  points: [],
  strokeWidth: 2,
  fieldKind: "text",
  fieldName: "",
  options: [],
  required: false,
});
