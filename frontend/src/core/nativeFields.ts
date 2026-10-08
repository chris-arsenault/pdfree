import {
  PDFCheckBox,
  PDFDropdown,
  PDFField,
  PDFOptionList,
  PDFRadioGroup,
  PDFTextField,
  PDFDocument,
  PDFWidgetAnnotation,
  PDFDict,
} from "pdf-lib";
import { fieldKey, type FieldKind, type FieldValue, type NativeField } from "./model";
import { choiceOptions, writeChoices } from "./choiceFields";

export function fieldKind(field: PDFField): FieldKind | null {
  if (field instanceof PDFTextField) return "text";
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFRadioGroup) return "radio";
  if (field instanceof PDFDropdown) return "dropdown";
  if (field instanceof PDFOptionList) return "list";
  return null;
}
export function readValue(field: PDFField): FieldValue {
  if (field instanceof PDFTextField) return field.getText() ?? "";
  if (field instanceof PDFCheckBox) return field.isChecked();
  if (field instanceof PDFRadioGroup) return field.getSelected() ?? "";
  if (field instanceof PDFDropdown || field instanceof PDFOptionList) return field.getSelected();
  return "";
}
function options(field: PDFField): string[] {
  if (field instanceof PDFRadioGroup) return field.getOptions();
  if (field instanceof PDFDropdown || field instanceof PDFOptionList)
    return choiceOptions(field).map((option) => option.value);
  return [];
}
export function describeFields(pdf: PDFDocument, sourceId: string): NativeField[] {
  return pdf
    .getForm()
    .getFields()
    .flatMap((field) => {
      const kind = fieldKind(field);
      if (!kind) return [];
      const choices = options(field);
      const widgets = field.acroField.getWidgets().map((widget, index) => ({
        ...widget.getRectangle(),
        rotation: widget.getAppearanceCharacteristics()?.getRotation() ?? 0,
        pageIndex: widgetPage(pdf, widget),
        option: choices[index] ?? "",
      }));
      return [
        {
          id: fieldKey(sourceId, field.getName()),
          name: field.getName(),
          kind,
          value: readValue(field),
          widgets,
          options: choices,
          choiceOptions:
            field instanceof PDFDropdown || field instanceof PDFOptionList
              ? choiceOptions(field)
              : [],
          required: field.isRequired(),
          readOnly: field.isReadOnly(),
          multiline: field instanceof PDFTextField && field.isMultiline(),
          maxLength: field instanceof PDFTextField ? (field.getMaxLength() ?? 0) : 0,
          multiSelect:
            (field instanceof PDFOptionList || field instanceof PDFDropdown) &&
            field.isMultiselect(),
        },
      ];
    });
}
function widgetPage(pdf: PDFDocument, widget: PDFWidgetAnnotation) {
  const pages = pdf.getPages(),
    reference = widget.P();
  if (reference) return pages.findIndex((page) => page.ref.toString() === reference.toString());
  return pages.findIndex((page) => {
    const annotations = page.node.Annots();
    if (!annotations) return false;
    for (let index = 0; index < annotations.size(); index++)
      if (annotations.lookup(index, PDFDict) === widget.dict) return true;
    return false;
  });
}
export function writeValue(field: PDFField, value: FieldValue) {
  if (field instanceof PDFTextField && typeof value === "string") field.setText(value);
  if (field instanceof PDFCheckBox) {
    if (value === true) field.check();
    else field.uncheck();
  }
  if (field instanceof PDFRadioGroup) {
    if (typeof value === "string" && value) field.select(value);
    else field.clear();
  }
  if (field instanceof PDFDropdown || field instanceof PDFOptionList) writeChoices(field, value);
}
