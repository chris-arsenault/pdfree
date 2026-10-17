import { failure, message, type UiMessage } from "../i18n/messages";
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
  if (!value.trim()) return message("validation.nameRequired");
  if (value.length > editorLimits.name)
    return message("validation.nameLength", { count: editorLimits.name });
  return null;
}

export function propertyNumber(
  value: string,
  name: string | UiMessage,
  minimum: number,
  maximum: number
) {
  const label = typeof name === "string" ? name : [name];
  const number = Number(value);
  if (!value.trim() || !Number.isFinite(number)) throw failure("validation.number", { label });
  if (number < minimum || number > maximum)
    throw failure("validation.range", { label, minimum, maximum });
  return number;
}

export function choiceValues(values: string[]) {
  return values.filter((value) => value !== "");
}

export function fieldOptionsError(options: string[]) {
  if (options.length > editorLimits.options)
    return message("validation.optionLimit", { count: editorLimits.options });
  if (options.some((option) => !option.trim())) return message("validation.optionRequired");
  if (new Set(options).size !== options.length) return message("validation.optionUnique");
  return null;
}

export function objectRotationError(object: PlacedObject) {
  if (object.kind !== "field") return null;
  if (!Number.isFinite(object.rotation) || object.rotation % 90 !== 0)
    return message("validation.fieldRotation");
  if (object.fieldKind === "radio" && object.rotation % 360 !== 0)
    return message("validation.radioRotation");
  return null;
}
