import { ContentInfo, SignedData } from "pkijs";
import { fromBER } from "asn1js";

// Test reader does not call the writer's placeholder/range/CMS helpers.
export function inspectSignature(bytes: Uint8Array) {
  const text = new TextDecoder("latin1").decode(bytes);
  const range = /\/ByteRange\s*\[\s*(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*\]/.exec(text);
  if (!range) throw new Error("Downloaded PDF has no completed signature range.");
  const [start, length, second, remaining] = range.slice(1).map(Number);
  if (start !== 0 || second + remaining !== bytes.length)
    throw new Error("The signature does not cover the whole downloaded PDF.");
  const contents = /<([0-9a-fA-F]+)>/.exec(text.slice(length, second));
  if (!contents) throw new Error("Downloaded PDF has no signature contents.");
  const padded = Uint8Array.from(contents[1].match(/../g)!.map((hex) => parseInt(hex, 16)));
  const parsed = fromBER(padded.buffer);
  if (parsed.offset === -1) throw new Error("Downloaded signature is not valid ASN.1.");
  const cms = padded.slice(0, parsed.offset);
  const signed = new Uint8Array(length + remaining);
  signed.set(bytes.subarray(0, length));
  signed.set(bytes.subarray(second), length);
  const info = new ContentInfo({ schema: parsed.result });
  return { cms, signed, length, second, data: new SignedData({ schema: info.content }) };
}
