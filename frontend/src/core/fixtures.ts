import { PDFDocument, StandardFonts, degrees } from "pdf-lib";

export async function formFixture(label = "Sample") {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = [pdf.addPage([612, 792]), pdf.addPage([612, 792]), pdf.addPage([792, 612])];
  pages.forEach((page, index) =>
    page.drawText(`${label} page ${index + 1}`, { x: 48, y: 550, font })
  );
  const form = pdf.getForm();
  const name = form.createTextField("name");
  name.setText("Original");
  name.addToPage(pages[0], { x: 48, y: 450, width: 220, height: 28 });
  name.addToPage(pages[1], { x: 48, y: 450, width: 220, height: 28 });
  const agree = form.createCheckBox("agree");
  agree.addToPage(pages[0], { x: 48, y: 390, width: 20, height: 20 });
  const radio = form.createRadioGroup("choice");
  radio.addOptionToPage("A", pages[0], { x: 90, y: 390 });
  radio.addOptionToPage("B", pages[1], { x: 90, y: 390 });
  const dropdown = form.createDropdown("country");
  dropdown.addOptions(["Canada", "France"]);
  dropdown.addToPage(pages[1], { x: 48, y: 350, width: 180, height: 24 });
  pages[2].setRotation(degrees(90));
  return pdf.save();
}
