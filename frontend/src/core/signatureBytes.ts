const encoder = new TextEncoder();
function find(bytes: Uint8Array, text: string, start = 0) {
  const pattern = encoder.encode(text);
  for (let index = start; index <= bytes.length - pattern.length; index++) {
    if (pattern.every((value, offset) => bytes[index + offset] === value)) return index;
  }
  throw new Error("The PDF signature placeholder could not be located.");
}

export function signatureRanges(bytes: Uint8Array, marker: string) {
  const token = find(bytes, `/${marker}A`);
  let rangeStart = token;
  while (rangeStart > 0 && bytes[rangeStart] !== 91) rangeStart--;
  const rangeEnd = bytes.indexOf(93, token);
  const contents = find(bytes, "/Contents", rangeEnd);
  const contentsStart = bytes.indexOf(60, contents);
  const contentsEnd = bytes.indexOf(62, contentsStart) + 1;
  if (!rangeStart || rangeEnd < 0 || contentsStart < 0 || contentsEnd <= contentsStart)
    throw new Error("The PDF signature placeholder is invalid.");
  const range = [0, contentsStart, contentsEnd, bytes.length - contentsEnd];
  const replacement = `[${range.join(" ")}]`;
  const width = rangeEnd - rangeStart + 1;
  if (replacement.length > width)
    throw new Error("The PDF is too large for its signature byte range.");
  bytes.set(encoder.encode(replacement.padEnd(width, " ")), rangeStart);
  return { range, contentsStart, contentsEnd };
}

export function signedBytes(bytes: Uint8Array, range: number[]) {
  const result = new Uint8Array(range[1] + range[3]);
  result.set(bytes.subarray(0, range[1]));
  result.set(bytes.subarray(range[2]), range[1]);
  return result;
}

export function insertSignature(
  bytes: Uint8Array,
  cms: Uint8Array,
  slot: ReturnType<typeof signatureRanges>
) {
  const hex = Array.from(cms, (value) => value.toString(16).padStart(2, "0")).join("");
  const capacity = slot.contentsEnd - slot.contentsStart - 2;
  if (hex.length > capacity)
    throw new Error("The certificate chain exceeds the PDF signature space.");
  bytes.set(encoder.encode(hex.padEnd(capacity, "0")), slot.contentsStart + 1);
  return bytes;
}
