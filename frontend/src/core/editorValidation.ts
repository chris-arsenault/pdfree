import { type PlacedObject } from "./model";

export const editorLimits = {
  name: 255,
  text: 100_000,
  size: 100_000,
  fontSize: 1000,
  strokeWidth: 1000,
  options: 1000,
};

export function documentNameError(value: string) {
  if (!value.trim()) return "Give the document a name.";
  if (value.length > editorLimits.name)
    return `Document names can contain at most ${editorLimits.name} characters.`;
  return "";
}

export function propertyNumber(value: string, label: string, minimum: number, maximum: number) {
  const number = Number(value);
  if (!value.trim() || !Number.isFinite(number)) throw new Error(`${label} must be a number.`);
  if (number < minimum || number > maximum)
    throw new Error(`${label} must be between ${minimum} and ${maximum}.`);
  return number;
}

export function choiceValues(values: string[]) {
  return values.filter((value) => value !== "");
}

export function fieldOptionsError(options: string[]) {
  if (options.length > editorLimits.options) return `Use at most ${editorLimits.options} options.`;
  if (options.some((option) => !option.trim())) return "Give each option a value.";
  if (new Set(options).size !== options.length) return "Each option must be unique.";
  return "";
}

export function objectRotationError(object: PlacedObject) {
  if (object.kind !== "field") return "";
  if (!Number.isFinite(object.rotation) || object.rotation % 90 !== 0)
    return "Form fields support quarter-turn rotations (multiples of 90°).";
  if (object.fieldKind === "radio" && object.rotation % 360 !== 0)
    return "Radio groups support 0° object rotation. Rotate the page instead.";
  return "";
}
