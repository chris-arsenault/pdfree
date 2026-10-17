import { type PdfDict } from "@libpdf/core";

// The strict parser supplies this dictionary only for PubSec encryption.
// Ordinary PDFs need neither recipient identities nor their crypto modules.
export class PublicKeyDictionary extends Error {
  constructor(readonly dictionary: PdfDict) {
    super("PublicKeyDictionary");
  }
}
