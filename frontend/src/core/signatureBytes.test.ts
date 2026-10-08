import { expect, it } from "vitest";
import { signatureRanges, signedBytes, insertSignature } from "./signatureBytes";

const encoded = (text: string) => new TextEncoder().encode(text);
const placeholder = () =>
  encoded(
    "%PDF-1.7\n/ByteRange [0 /LongMarkerA /LongMarkerB /LongMarkerC]\n/Contents <0000000000000000>\n%%EOF"
  );
it("covers every byte except the exact signature hex slot", () => {
  const bytes = placeholder();
  const slot = signatureRanges(bytes, "LongMarker");
  expect(slot.range).toEqual([
    0,
    slot.contentsStart,
    slot.contentsEnd,
    bytes.length - slot.contentsEnd,
  ]);
  expect(new TextDecoder().decode(signedBytes(bytes, slot.range))).toBe(
    new TextDecoder().decode(bytes.slice(0, slot.contentsStart)) +
      new TextDecoder().decode(bytes.slice(slot.contentsEnd))
  );
  const before = signedBytes(bytes, slot.range);
  insertSignature(bytes, new Uint8Array([0xab, 0xcd]), slot);
  expect(signedBytes(bytes, slot.range)).toEqual(before);
  expect(new TextDecoder().decode(bytes.slice(slot.contentsStart, slot.contentsEnd))).toBe(
    "<abcd000000000000>"
  );
});
it("rejects a certificate chain that does not fit without changing signed bytes", () => {
  const bytes = placeholder(),
    slot = signatureRanges(bytes, "LongMarker"),
    before = bytes.slice();
  expect(() => insertSignature(bytes, new Uint8Array(9), slot)).toThrow("exceeds");
  expect(bytes).toEqual(before);
});
it.each([
  "no marker",
  "%PDF\n/ByteRange /LongMarkerA]\n/Contents <00>",
  "%PDF\n/ByteRange [0 /LongMarkerA /B /C\n/Contents <00>",
  "%PDF\n/ByteRange [0 /LongMarkerA /LongMarkerB /LongMarkerC]\n/Contents <00",
])("rejects incomplete signature placeholders: %s", (value) => {
  expect(() => signatureRanges(encoded(value), "LongMarker")).toThrow(/placeholder/);
});
