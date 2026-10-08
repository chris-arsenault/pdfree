import {
  PDFDocument,
  PDFDropdown,
  PDFOptionList,
  PDFHexString,
  PDFName,
  PDFFont,
  defaultDropdownAppearanceProvider,
  defaultOptionListAppearanceProvider,
} from "pdf-lib";
import { type ChoiceOption, type FieldValue } from "./model";

type ChoiceField = PDFDropdown | PDFOptionList;
export function choiceOptions(field: ChoiceField): ChoiceOption[] {
  return field.acroField.getOptions().map(({ value, display }) => ({
    value: value.decodeText(),
    label: display.decodeText(),
  }));
}

function selectedValues(value: FieldValue): string[] {
  if (Array.isArray(value)) return [...new Set(value.filter((option) => option !== ""))];
  if (typeof value === "string" && value) return [value];
  return [];
}

function storeSelection(field: ChoiceField, selected: { value: string; index: number }[]) {
  const dict = field.acroField.dict;
  const values = selected.map((item) => PDFHexString.fromText(item.value));
  // pdf-lib's select/setValues APIs validate display labels and can change flags.
  // Write export values in the same option order as /I without altering /Opt or /Ff.
  if (!values.length) dict.delete(PDFName.of("V"));
  else dict.set(PDFName.of("V"), values.length === 1 ? values[0] : dict.context.obj(values));
  if (values.length > 1 && selected.every((item) => item.index >= 0))
    dict.set(PDFName.of("I"), dict.context.obj(selected.map((item) => item.index)));
  else dict.delete(PDFName.of("I"));
}

export function writeChoices(field: ChoiceField, value: FieldValue) {
  const selected = selectedValues(value);
  if (selected.length > 1 && !field.isMultiselect())
    throw new Error(`The field ${field.getName()} accepts only one selected option.`);
  const options = choiceOptions(field);
  const entries = selected.map((item) => ({
    value: item,
    index: options.findIndex((option) => option.value === item),
  }));
  if (
    entries.some((item) => item.index < 0) &&
    !(field instanceof PDFDropdown && field.isEditable())
  )
    throw new Error(`The value of ${field.getName()} is not one of its options.`);
  storeSelection(
    field,
    entries.sort((a, b) => a.index - b.index)
  );
}

function appearanceChoice<T extends ChoiceField>(field: T): T {
  const options = choiceOptions(field);
  const selected = field
    .getSelected()
    .map((value) => options.find((option) => option.value === value)?.label ?? value);
  // The default appearance providers consume getSelected() as display text.
  // This read-only facade supplies labels; the actual field keeps its export values.
  const appearance = Object.create(field) as T;
  appearance.getSelected = () => selected;
  return appearance;
}

export function updateChoiceAppearances(pdf: PDFDocument, font: PDFFont) {
  for (const field of pdf.getForm().getFields()) {
    if (field instanceof PDFDropdown)
      field.updateAppearances(font, (choice, widget, appearanceFont) =>
        defaultDropdownAppearanceProvider(appearanceChoice(choice), widget, appearanceFont)
      );
    if (field instanceof PDFOptionList)
      field.updateAppearances(font, (choice, widget, appearanceFont) =>
        defaultOptionListAppearanceProvider(appearanceChoice(choice), widget, appearanceFont)
      );
  }
}
