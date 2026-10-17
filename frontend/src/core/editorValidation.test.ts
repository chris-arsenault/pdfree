import { message } from "../i18n/messages";
import { describe, expect, it } from "vitest";
import {
  choiceValues,
  documentNameError,
  fieldOptionsError,
  propertyNumber,
} from "./editorValidation";

describe("document names", () => {
  it("rejects an empty name before replacing the current document name", () => {
    expect(documentNameError("")).toEqual(message("validation.nameRequired"));
  });
  it("rejects whitespace-only names", () => {
    expect(documentNameError(" \t ")).toEqual(message("validation.nameRequired"));
  });
  it("accepts a name exactly at the durable limit", () => {
    expect(documentNameError("a".repeat(255))).toBeNull();
  });
  it("reports the name limit in readable language", () => {
    expect(documentNameError("a".repeat(256))).toEqual(
      message("validation.nameLength", { count: 255 })
    );
  });
});
describe("numeric editing", () => {
  it.each(["", " ", "not a number", "NaN", "Infinity", "-Infinity"])(
    "rejects intermediate or non-finite value %j without committing it",
    (value) => {
      expect(() => propertyNumber(value, "Width", 0.01, 100_000)).toThrow(
        "Width must be a number."
      );
    }
  );
  it.each(["0", "-1", "100001"])("rejects an out-of-bounds size %s", (value) => {
    expect(() => propertyNumber(value, "Width", 0.01, 100_000)).toThrow(
      "Width must be between 0.01 and 100000."
    );
  });
  it("accepts both inclusive size boundaries", () => {
    expect(propertyNumber(".01", "Width", 0.01, 100_000)).toBe(0.01);
    expect(propertyNumber("100000", "Width", 0.01, 100_000)).toBe(100_000);
  });
  it("keeps fractional values instead of silently rounding dimensions", () => {
    expect(propertyNumber("18.375", "Height", 0.01, 100_000)).toBe(18.375);
  });
  it("accepts signed rotation values", () => {
    expect(propertyNumber("-90", "Rotation", -360, 360)).toBe(-90);
  });
  it("enforces the durable font limit", () => {
    expect(() => propertyNumber("1001", "Font size", 1, 1000)).toThrow(
      "Font size must be between 1 and 1000."
    );
  });
});
describe("choice fields", () => {
  it("uses an empty selection for the placeholder", () => {
    expect(choiceValues([""])).toEqual([]);
  });
  it("preserves multiple selected options and their values", () => {
    expect(choiceValues(["East", "West"])).toEqual(["East", "West"]);
  });
  it("retains nonempty values containing spaces", () => {
    expect(choiceValues([" ", " North "])).toEqual([" ", " North "]);
  });
  it("rejects empty authored options", () => {
    expect(fieldOptionsError(["East", ""])).toEqual(message("validation.optionRequired"));
  });
  it("rejects duplicate authored options", () => {
    expect(fieldOptionsError(["East", "East"])).toEqual(message("validation.optionUnique"));
  });
  it("rejects more options than the project format supports", () => {
    expect(fieldOptionsError(Array.from({ length: 1001 }, (_, index) => String(index)))).toEqual(
      message("validation.optionLimit", { count: 1000 })
    );
  });
  it("accepts distinct named options", () => {
    expect(fieldOptionsError(["East", "West"])).toBeNull();
  });
});
