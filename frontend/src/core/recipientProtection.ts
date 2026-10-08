import { PDF, PdfArray, PdfDict, PdfName, PdfNumber, PdfString } from "@libpdf/core";
import { Certificate, ContentInfo, EnvelopedData, KeyTransRecipientInfo } from "pkijs";
import { type PdfRecipientProtection, type PdfPermissions } from "./pdfSecurity";
import { bufferOf } from "./recipientIdentity";
import { encryptionConfig } from "./publicKeyPdf";

function recipientCertificate(bytes: Uint8Array) {
  const text = new TextDecoder().decode(bytes);
  let der = bytes;
  if (text.includes("-----BEGIN CERTIFICATE-----")) {
    const base64 = text
      .match(/-----BEGIN CERTIFICATE-----([\s\S]*?)-----END CERTIFICATE-----/)?.[1]
      .replace(/\s/g, "");
    if (!base64) throw new Error("The recipient PEM certificate could not be read.");
    der = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
  }
  try {
    return Certificate.fromBER(bufferOf(der));
  } catch {
    throw new Error(
      "Choose X.509 recipient certificates (.cer, .crt or .pem), without private keys."
    );
  }
}
export function recipientPermissionWord(permissions: PdfPermissions) {
  // Acrobat-compatible PubSec flags and big-endian word, independently checked by PDFBox.
  let word = 1 | 512;
  const bits: [keyof PdfPermissions, number][] = [
    ["print", 4],
    ["modify", 8],
    ["copy", 16],
    ["annotate", 32],
    ["fillForms", 256],
    ["assemble", 1024],
  ];
  for (const [permission, bit] of bits) if (permissions[permission]) word |= bit;
  if (permissions.print && permissions.printHighQuality) word |= 2048;
  return word;
}
async function envelopes(certificates: Uint8Array[], payload: Uint8Array) {
  return Promise.all(
    certificates.map(async (bytes) => {
      const envelope = new EnvelopedData();
      const certificate = recipientCertificate(bytes);
      if (
        !envelope.addRecipientByCertificate(certificate, {
          oaepHashAlgorithm: "SHA-256",
          kdfAlgorithm: "SHA-256",
        })
      )
        throw new Error("This recipient's encryption key is unsupported.");
      const algorithm: AesKeyGenParams = { name: "AES-CBC", length: 256 };
      await envelope.encrypt(algorithm, bufferOf(payload));
      for (const recipient of envelope.recipientInfos) {
        if (
          recipient.value instanceof KeyTransRecipientInfo &&
          !recipient.value.encryptedKey.valueBlock.valueHexView.length
        )
          throw new Error("The recipient key could not encrypt this PDF.");
      }
      return new Uint8Array(
        new ContentInfo({ contentType: ContentInfo.ENVELOPED_DATA, content: envelope.toSchema() })
          .toSchema()
          .toBER(false)
      );
    })
  );
}
export async function recipientProtection(bytes: Uint8Array, protection: PdfRecipientProtection) {
  const seed = crypto.getRandomValues(new Uint8Array(20));
  const payload = new Uint8Array(24);
  payload.set(seed);
  new DataView(payload.buffer).setUint32(20, recipientPermissionWord(protection.permissions));
  try {
    const entries = await envelopes(protection.recipients, payload);
    const input = new Uint8Array(20 + entries.reduce((size, entry) => size + entry.length, 0));
    input.set(seed);
    let offset = 20;
    for (const entry of entries) {
      input.set(entry, offset);
      offset += entry.length;
    }
    const key = new Uint8Array(await crypto.subtle.digest("SHA-256", bufferOf(input)));
    input.fill(0);
    const filter = new PdfDict([
      ["CFM", PdfName.of("AESV3")],
      ["Length", PdfNumber.of(256)],
      ["Recipients", new PdfArray(entries.map((entry) => new PdfString(entry, "hex")))],
    ]);
    const dictionary = new PdfDict([
      ["Filter", PdfName.of("Adobe.PubSec")],
      ["SubFilter", PdfName.of("adbe.pkcs7.s5")],
      ["V", PdfNumber.of(5)],
      ["Length", PdfNumber.of(256)],
      ["CF", new PdfDict([["DefaultCryptFilter", filter]])],
      ["StmF", PdfName.of("DefaultCryptFilter")],
      ["StrF", PdfName.of("DefaultCryptFilter")],
    ]);
    const encryption = encryptionConfig(dictionary);
    encryption.algorithm = "AES-256";
    encryption.streamFilter = "DefaultCryptFilter";
    encryption.stringFilter = "DefaultCryptFilter";
    encryption.embeddedFileFilter = "DefaultCryptFilter";
    encryption.cryptFilters = new Map([["DefaultCryptFilter", { cfm: "AESV3", length: 32 }]]);
    try {
      const pdf = await PDF.load(bytes, { lenient: false });
      return await pdf.save({
        useXRefStream: false,
        publicKeyProtection: { dictionary, configuration: { encryption, key } },
      });
    } finally {
      key.fill(0);
    }
  } finally {
    seed.fill(0);
    payload.fill(0);
  }
}
