import { PDFDocument, PDFHexString } from "pdf-lib";
import { formFixture } from "./fixtures";

export async function commentFixture() {
  const pdf = await PDFDocument.load(await formFixture());
  const root = pdf.context.obj({
    Type: "Annot",
    Subtype: "Text",
    Rect: [80, 600, 104, 624],
    Contents: PDFHexString.fromText("Review café 東京"),
    T: PDFHexString.fromText("Zoë"),
    CreationDate: PDFHexString.fromText("D:20261008120000Z"),
    NM: PDFHexString.fromText("original-note"),
  });
  const rootRef = pdf.context.register(root);
  const popup = pdf.context.register(
    pdf.context.obj({
      Type: "Annot",
      Subtype: "Popup",
      Rect: [100, 400, 300, 600],
      Parent: rootRef,
    })
  );
  root.set(pdf.context.obj("Popup"), popup);
  const reply = pdf.context.register(
    pdf.context.obj({
      Type: "Annot",
      Subtype: "Text",
      Rect: [80, 600, 104, 624],
      Contents: PDFHexString.fromText("Original reply"),
      T: PDFHexString.fromText("Ada"),
      IRT: rootRef,
      RT: "R",
    })
  );
  const highlight = pdf.context.register(
    pdf.context.obj({
      Type: "Annot",
      Subtype: "Highlight",
      Rect: [50, 500, 150, 520],
      QuadPoints: [50, 520, 150, 520, 50, 500, 150, 500],
      Contents: PDFHexString.fromText("Highlighted passage"),
      C: [1, 1, 0],
    })
  );
  const link = pdf.context.register(
    pdf.context.obj({
      Type: "Annot",
      Subtype: "Link",
      Rect: [50, 450, 150, 470],
      A: { S: "URI", URI: PDFHexString.fromText("https://example.org/") },
    })
  );
  for (const ref of [rootRef, popup, reply, highlight, link]) pdf.getPage(0).node.addAnnot(ref);
  return pdf.save();
}
