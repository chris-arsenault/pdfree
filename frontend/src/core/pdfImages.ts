import {
  PDFArray,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFRawStream,
  PDFRef,
  decodePDFRawStream,
} from "pdf-lib";

export type ImageResource = { stream: PDFRawStream; ref: PDFRef };
function directImages(pdf: PDFDocument, resources: PDFDict) {
  const objects = resources.lookupMaybe(PDFName.of("XObject"), PDFDict);
  return (objects?.entries() ?? []).flatMap(([, reference]) => {
    const stream = pdf.context.lookup(reference);
    return stream instanceof PDFRawStream ? [{ reference, stream }] : [];
  });
}
export function imageResources(pdf: PDFDocument) {
  const images: ImageResource[] = [],
    seen = new Set<PDFDict>();
  const visit = (resources: PDFDict | undefined, depth: number) => {
    if (!resources || seen.has(resources)) return;
    if (depth > 50) throw new Error("Image resource nesting is too deep.");
    seen.add(resources);
    for (const { reference, stream } of directImages(pdf, resources)) {
      const subtype = stream.dict.get(PDFName.of("Subtype"))?.toString();
      if (
        subtype === "/Image" &&
        reference instanceof PDFRef &&
        !images.some((image) => image.ref.toString() === reference.toString())
      )
        images.push({ stream, ref: reference });
      if (subtype === "/Form")
        visit(stream.dict.lookupMaybe(PDFName.of("Resources"), PDFDict), depth + 1);
    }
  };
  pdf.getPages().forEach((page) => visit(page.node.Resources(), 0));
  return images;
}
const numeric = (dict: PDFDict, name: string) =>
  dict.lookupMaybe(PDFName.of(name), PDFNumber)?.asNumber() ?? 0;
export function supportedImage(stream: PDFRawStream) {
  const dict = stream.dict;
  const width = numeric(dict, "Width"),
    height = numeric(dict, "Height");
  const color = dict.get(PDFName.of("ColorSpace"))?.toString();
  const filter = dict.get(PDFName.of("Filter"))?.toString();
  const rawParameters = dict.lookup(PDFName.of("DecodeParms"));
  if (rawParameters && !(rawParameters instanceof PDFDict)) return false;
  const parameters = rawParameters as PDFDict | undefined;
  const predictor = parameters ? numeric(parameters, "Predictor") : 1;
  const dimensions = [width, height].every(
    (value) => Number.isInteger(value) && value > 0 && value <= 8192
  );
  return [
    dimensions,
    width * height <= 32 * 1024 * 1024,
    numeric(dict, "BitsPerComponent") === 8,
    ["/DeviceRGB", "/DeviceGray"].includes(color ?? ""),
    ["/DCTDecode", "/FlateDecode", undefined].includes(filter),
    predictor <= 1,
    !["SMask", "Mask", "Decode", "ImageMask", "Alternates", "OPI"].some((key) =>
      dict.has(PDFName.of(key))
    ),
  ].every(Boolean);
}
export async function imageCanvas(stream: PDFRawStream) {
  if (!supportedImage(stream))
    throw new Error("This image encoding, color space or mask cannot be processed safely.");
  const width = numeric(stream.dict, "Width"),
    height = numeric(stream.dict, "Height");
  const canvas = new OffscreenCanvas(width, height),
    context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is unavailable in this browser.");
  if (stream.dict.get(PDFName.of("Filter"))?.toString() === "/DCTDecode") {
    const bitmap = await createImageBitmap(
      new Blob([new Uint8Array(stream.contents)], { type: "image/jpeg" })
    );
    try {
      context.drawImage(bitmap, 0, 0, width, height);
    } finally {
      bitmap.close();
    }
  } else {
    context.putImageData(decodedPixels(stream, context, width, height), 0, 0);
  }
  return canvas;
}
function decodedPixels(
  stream: PDFRawStream,
  context: OffscreenCanvasRenderingContext2D,
  width: number,
  height: number
) {
  const bytes = decodePDFRawStream(stream).decode();
  const channels = stream.dict.get(PDFName.of("ColorSpace"))?.toString() === "/DeviceGray" ? 1 : 3;
  if (bytes.length !== width * height * channels)
    throw new Error("Unexpected scan image data length.");
  const image = context.createImageData(width, height);
  for (let pixel = 0; pixel < width * height; pixel++) {
    const offset = pixel * channels;
    for (let channel = 0; channel < 3; channel++)
      image.data[pixel * 4 + channel] = bytes[offset + (channels === 1 ? 0 : channel)];
    image.data[pixel * 4 + 3] = 255;
  }
  return image;
}
export function replaceImage(
  pdf: PDFDocument,
  image: ImageResource,
  bytes: Uint8Array,
  width: number,
  height: number
) {
  const dict = image.stream.dict.clone(pdf.context);
  dict.set(PDFName.of("Width"), PDFNumber.of(width));
  dict.set(PDFName.of("Height"), PDFNumber.of(height));
  dict.set(PDFName.of("ColorSpace"), PDFName.of("DeviceRGB"));
  dict.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
  dict.delete(PDFName.of("DecodeParms"));
  dict.delete(PDFName.of("Length"));
  pdf.context.assign(image.ref, PDFRawStream.of(dict, bytes));
}
export function scanImage(pdf: PDFDocument, index: number) {
  const page = pdf.getPage(index),
    objects = page.node.Resources()?.lookupMaybe(PDFName.of("XObject"), PDFDict);
  const entries = objects?.entries() ?? [];
  if (entries.length !== 1)
    throw new Error(
      "Scan cleanup requires one direct scan image per page; mixed layouts are unsupported."
    );
  const [name, ref] = entries[0],
    stream = pdf.context.lookup(ref);
  if (
    !(ref instanceof PDFRef) ||
    !(stream instanceof PDFRawStream) ||
    stream.dict.get(PDFName.of("Subtype"))?.toString() !== "/Image" ||
    !supportedImage(stream)
  )
    throw new Error("This page does not contain a supported RGB or grayscale scan image.");
  validateScanContent(scanContent(page), name.toString());
  return { stream, ref, name };
}
function scanContent(page: ReturnType<PDFDocument["getPage"]>) {
  const contents = page.node.Contents();
  const streams =
    contents instanceof PDFArray
      ? Array.from({ length: contents.size() }, (_, i) => contents.lookup(i))
      : [contents];
  return streams
    .map((item) => {
      if (!(item instanceof PDFRawStream)) throw new Error("Unsupported scan content stream.");
      return new TextDecoder().decode(decodePDFRawStream(item).decode());
    })
    .join("\n");
}
function validateScanContent(content: string, imageName: string) {
  if (content.length > 1_000_000) throw new Error("Scan content exceeds the processing budget.");
  // The image may coexist with an existing OCR text layer. Paths, shading, inline
  // images and nested forms are rejected rather than flattened.
  const stripped = content.replace(/\([^()]*\)|<[^<>]*>|%[^\r\n]*|\/[^\s[\]()<>]+/g, " ");
  const operators = stripped.match(/[A-Za-z][A-Za-z0-9*']*/g) ?? [];
  const allowed = new Set([
    "q",
    "Q",
    "cm",
    "Do",
    "BT",
    "ET",
    "Tf",
    "Tr",
    "Tm",
    "Td",
    "TD",
    "Tj",
    "TJ",
    "T*",
    "Tc",
    "Tw",
    "Tz",
    "TL",
    "Ts",
    "g",
    "G",
    "rg",
    "RG",
    "gs",
  ]);
  if (
    operators.some((operator) => !allowed.has(operator)) ||
    operators.filter((operator) => operator === "Do").length !== 1
  )
    throw new Error("Scan cleanup cannot preserve this mixed page layout.");
  const tokens = content.trim().split(/\s+/);
  const imageIndex = tokens.indexOf(imageName);
  const matrix = tokens.slice(imageIndex - 7, imageIndex - 1).map(Number);
  if (!uprightMatrix(tokens[imageIndex - 1], matrix))
    throw new Error("Scan cleanup requires an upright image placement.");
  for (const [index, token] of tokens.entries())
    if (token === "cm" && !uprightMatrix(token, tokens.slice(index - 6, index).map(Number)))
      throw new Error("Scan cleanup requires upright image and page transforms.");
}
function uprightMatrix(operator: string, matrix: number[]) {
  return [
    operator === "cm",
    matrix.length === 6,
    matrix.every(Number.isFinite),
    matrix[1] === 0,
    matrix[2] === 0,
    matrix[0] > 0,
    matrix[3] > 0,
  ].every(Boolean);
}
