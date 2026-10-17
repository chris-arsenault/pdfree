import { failure, message } from "../i18n/messages";
import { PdfDict, PdfString } from "@libpdf/core";
import { PdfRecipientError } from "./pdfCredentials";
import { type RecipientIdentity, bufferOf } from "./recipientIdentity";
import { recipientSeed } from "./recipientEnvelope";

function recipients(dictionary: PdfDict) {
  const values = dictionary.getArray("Recipients");
  if (!values?.length) throw failure("errors.recipientList");
  return Array.from(values, (value) => {
    if (!(value instanceof PdfString)) throw failure("errors.recipientEntry");
    return value.bytes;
  });
}
async function seedFor(entries: Uint8Array[], identities: RecipientIdentity[]) {
  let cause: unknown;
  for (const entry of entries) {
    try {
      return await recipientSeed(entry, identities);
    } catch (error) {
      if (!(error instanceof PdfRecipientError)) throw error;
      if (error.cause) cause = error.cause;
    }
  }
  throw new PdfRecipientError(message("errors.recipientUnauthorized"), { cause });
}
export async function recipientKey(
  dictionary: PdfDict,
  filter: PdfDict,
  identities: RecipientIdentity[],
  version: number,
  length: number
) {
  const entries = recipients(filter);
  const seed = await seedFor(entries, identities);
  const metadata =
    filter.getBool("EncryptMetadata")?.value ??
    dictionary.getBool("EncryptMetadata")?.value ??
    true;
  const pieces = [seed, ...entries];
  if (!metadata && version >= 4) pieces.push(new Uint8Array([255, 255, 255, 255]));
  const input = new Uint8Array(pieces.reduce((size, piece) => size + piece.length, 0));
  let offset = 0;
  for (const piece of pieces) {
    input.set(piece, offset);
    offset += piece.length;
  }
  try {
    return new Uint8Array(
      await crypto.subtle.digest(version === 5 ? "SHA-256" : "SHA-1", bufferOf(input))
    ).slice(0, length / 8);
  } finally {
    seed.fill(0);
    input.fill(0);
  }
}
