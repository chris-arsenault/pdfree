import { PDFDocument, PDFHexString } from "pdf-lib";

export async function choiceFixture(kind: "dropdown" | "list", multiSelect = false) {
  const pdf = await PDFDocument.create(),
    page = pdf.addPage();
  const field =
    kind === "dropdown"
      ? pdf.getForm().createDropdown("state")
      : pdf.getForm().createOptionList("state");
  field.addOptions(["CA", "NY"]);
  if (multiSelect) field.enableMultiselect();
  field.select("CA");
  field.addToPage(page, { x: 50, y: 500, width: 200, height: 50 });
  field.acroField.setOptions([
    { value: PDFHexString.fromText("CA"), display: PDFHexString.fromText("California") },
    { value: PDFHexString.fromText("NY"), display: PDFHexString.fromText("New York") },
  ]);
  return pdf.save({ updateFieldAppearances: false });
}
