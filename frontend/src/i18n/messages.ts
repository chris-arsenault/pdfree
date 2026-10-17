import { en, type MessageKey } from "./en";

type Placeholders<S extends string> = S extends `${string}{{${infer Key}}}${infer Rest}`
  ? Key | Placeholders<Rest>
  : never;
export type MessageValues<K extends MessageKey> = Record<
  Placeholders<(typeof en)[K]>,
  string | number | UiMessage[]
>;
declare const messageDescriptor: unique symbol;
type MessageValue = string | number | UiMessage[];
/** Only factories or validated worker payloads can construct a descriptor. */
export type UiMessage<K extends MessageKey = MessageKey> = {
  readonly key: K;
  readonly values: Readonly<Record<string, MessageValue>>;
  readonly [messageDescriptor]: true;
};
export function message<K extends MessageKey>(
  key: K,
  ...args: Placeholders<(typeof en)[K]> extends never ? [] : [values: MessageValues<K>]
): UiMessage<K> {
  return { key, values: args[0] ?? {} } as UiMessage<K>;
}
export function failure<K extends MessageKey>(
  key: K,
  ...args: Placeholders<(typeof en)[K]> extends never ? [] : [values: MessageValues<K>]
) {
  return new MessageError({ key, values: args[0] ?? {} } as UiMessage);
}

/** An application failure retains its message descriptor across worker boundaries. */
export class MessageError extends Error {
  constructor(
    readonly ui: UiMessage,
    options: ErrorOptions = {}
  ) {
    super(english(ui), options);
    this.name = "MessageError";
  }
}
export class AbortMessageError extends DOMException {
  constructor(readonly ui: UiMessage = message("errors.canceled")) {
    super(english(ui), "AbortError");
  }
}
export function english(ui: UiMessage): string {
  return en[ui.key].replace(/{{(\w+)}}/g, (_, name: string) =>
    englishValue((ui.values as Record<string, string | number | UiMessage[]>)[name])
  );
}
function englishValue(value: string | number | UiMessage[]): string {
  return Array.isArray(value) ? value.map(english).join(", ") : String(value);
}
export function isMessage(value: unknown): value is UiMessage {
  return validMessage(value, 0);
}
function validMessage(value: unknown, depth: number): value is UiMessage {
  if (depth > 16) return false;
  if (!record(value) || !record(value.values)) return false;
  if (Object.keys(value).length !== 2 || !Object.hasOwn(value, "key")) return false;
  if (typeof value.key !== "string" || !Object.hasOwn(en, value.key)) return false;
  const values = value.values;
  const names = [
    ...new Set([...en[value.key as MessageKey].matchAll(/{{(\w+)}}/g)].map((match) => match[1])),
  ];
  if (Object.keys(values).length !== names.length) return false;
  return names.every((name) => Object.hasOwn(values, name) && validValue(values[name], depth));
}
function record(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function validValue(item: unknown, depth: number): boolean {
  return (
    typeof item === "string" ||
    (typeof item === "number" && Number.isFinite(item)) ||
    (Array.isArray(item) && item.every((value) => validMessage(value, depth + 1)))
  );
}
export function errorMessage(
  error: unknown,
  fallback: UiMessage = message("errors.operation")
): UiMessage {
  if (error instanceof MessageError) return error.ui;
  if (error && typeof error === "object" && "ui" in error && isMessage(error.ui)) return error.ui;
  if (error instanceof DOMException && error.name === "AbortError")
    return message("errors.canceled");
  return fallback;
}
