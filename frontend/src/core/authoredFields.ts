import {
  PDFDocument,
  PDFPage,
  PDFTextField,
  PDFCheckBox,
  PDFDropdown,
  PDFOptionList,
  PDFRadioGroup,
  degrees,
} from "pdf-lib";
import { type PlacedObject, type Page } from "./model";
import { type Fonts, pdfColor } from "./drawObjects";
import { objectRotationError } from "./editorValidation";

function createField(pdf: PDFDocument, object: PlacedObject) {
  const form = pdf.getForm(),
    name = object.fieldName.trim();
  if (!name) throw new Error("Give each new form field a name.");
  if (form.getFieldMaybe(name))
    throw new Error(`Field name ${name} already exists. Choose a unique name.`);
  if (object.fieldKind === "checkbox") return form.createCheckBox(name);
  if (object.fieldKind === "radio") return form.createRadioGroup(name);
  if (object.fieldKind === "dropdown") return form.createDropdown(name);
  if (object.fieldKind === "list") return form.createOptionList(name);
  return form.createTextField(name);
}
function addOptions(field: PDFDropdown | PDFOptionList, object: PlacedObject) {
  if (!object.options.length) throw new Error(`Add options to ${object.fieldName}, one per line.`);
  field.addOptions(object.options);
  if (object.text) {
    if (!object.options.includes(object.text)) {
      throw new Error(`The value of ${object.fieldName} is not one of its options.`);
    }
    field.select(object.text);
  }
}
function writeField(pdf: PDFDocument, page: PDFPage, object: PlacedObject, fonts: Fonts) {
  const error = objectRotationError(object);
  if (error) throw new Error(error);
  const field = createField(pdf, object);
  const appearance = {
    x: object.x,
    y: object.y,
    width: object.width,
    height: object.height,
    rotate: degrees(((object.rotation % 360) + 360) % 360),
    textColor: pdfColor(object.color),
    borderWidth: 1,
    font: fonts.sans,
  };
  if (object.required) field.enableRequired();
  if (field instanceof PDFTextField) {
    if (object.text.includes("\n")) field.enableMultiline();
    field.setText(object.text);
    field.addToPage(page, appearance);
    field.setFontSize(object.fontSize);
  }
  if (field instanceof PDFCheckBox) {
    field.addToPage(page, appearance);
    if (object.text === "true") field.check();
  }
  if (field instanceof PDFDropdown || field instanceof PDFOptionList) {
    addOptions(field, object);
    field.addToPage(page, appearance);
  }
  if (field instanceof PDFRadioGroup) addRadio(field, page, object, fonts);
}
function addRadio(field: PDFRadioGroup, page: PDFPage, object: PlacedObject, fonts: Fonts) {
  if (!object.options.length)
    throw new Error(`Add radio options to ${object.fieldName}, one per line.`);
  if (object.rotation % 360)
    throw new Error(
      "Radio groups currently require zero object rotation. Page rotation is supported."
    );
  const height = object.height / object.options.length,
    size = Math.min(16, height - 2);
  if (size < 8) throw new Error(`Enlarge the radio group ${object.fieldName} to fit its options.`);
  object.options.forEach((option, index) => {
    const y = object.y + object.height - height * (index + 1);
    field.addOptionToPage(option, page, {
      x: object.x,
      y,
      width: size,
      height: size,
      borderWidth: 1,
    });
    page.drawText(option, {
      x: object.x + size + 5,
      y: y + 2,
      size: Math.min(object.fontSize, size),
      font: fonts.sans,
      color: pdfColor(object.color),
    });
  });
  if (object.text) {
    if (!object.options.includes(object.text)) {
      throw new Error(`The value of ${object.fieldName} is not one of its options.`);
    }
    field.select(object.text);
  }
}
export function addAuthoredFields(pdf: PDFDocument, pages: Page[], fonts: Fonts) {
  pages.forEach((page, index) =>
    page.objects
      .filter((object) => object.kind === "field")
      .forEach((object) => writeField(pdf, pdf.getPage(index), object, fonts))
  );
}
