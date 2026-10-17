import { failure, message } from "../i18n/messages";
import { PdfDict, type LoadOptions } from "@libpdf/core";
import { PdfRecipientError, type PdfRecipientIdentity } from "./pdfCredentials";
import { recipientIdentities, type RecipientIdentity } from "./recipientIdentity";
import { recipientKey } from "./recipientKey";

export type PublicKeyResult = ReturnType<NonNullable<LoadOptions["publicKeyDecrypt"]>>;
type Encryption = PublicKeyResult["encryption"];
export { PublicKeyDictionary } from "./publicKeyDictionary";
function keyBits(dictionary: PdfDict, version: number, fallback: number) {
  const raw = dictionary.getNumber("Length")?.value ?? fallback;
  // Public-key CF Length is in bits; accept byte lengths used by other producers.
  const bits = raw < 40 && version >= 4 ? raw * 8 : raw;
  if (!Number.isInteger(bits) || bits < 40 || bits > 256 || bits % 8)
    throw failure("errors.encryptionKeyLength");
  return bits;
}
export function encryptionConfig(dictionary: PdfDict): Encryption {
  const version = dictionary.getNumber("V")?.value ?? 1;
  if (![1, 2, 4, 5].includes(version)) throw failure("errors.encryptionVersion");
  const subfilter = dictionary.getName("SubFilter")?.value;
  if (!["adbe.pkcs7.s3", "adbe.pkcs7.s4", "adbe.pkcs7.s5"].includes(subfilter ?? ""))
    throw failure("errors.encryptionSubfilter");
  const revisions = { 1: 2, 2: 3, 4: 4, 5: 6 } as const;
  const supported = version as keyof typeof revisions;
  return {
    filter: "Standard",
    version: supported,
    revision: revisions[supported],
    keyLengthBits: keyBits(dictionary, version, version === 5 ? 256 : 40),
    ownerHash: new Uint8Array(0),
    userHash: new Uint8Array(0),
    permissionsRaw: -1,
    // This configuration feeds object ciphers, not a permission enforcement policy.
    permissions: {
      print: true,
      printHighQuality: true,
      modify: true,
      copy: true,
      annotate: true,
      fillForms: true,
      accessibility: true,
      assemble: true,
    },
    encryptMetadata: dictionary.getBool("EncryptMetadata")?.value ?? true,
    algorithm: "RC4",
  };
}
function cryptFilter(value: PdfDict, encryption: Encryption) {
  const cfm = value.getName("CFM")?.value ?? "None";
  if (!["None", "V2", "AESV2", "AESV3"].includes(cfm)) throw failure("errors.cryptMethod");
  const length = keyBits(value, encryption.version, encryption.keyLengthBits);
  const valid = { None: true, V2: length <= 128, AESV2: length === 128, AESV3: length === 256 };
  const method = cfm as keyof typeof valid;
  if (!valid[method]) throw failure("errors.cryptKeyLength");
  return { cfm: method, length: length / 8 };
}
async function cryptFilters(
  dictionary: PdfDict,
  encryption: Encryption,
  identities: RecipientIdentity[]
) {
  const filters: NonNullable<Encryption["cryptFilters"]> = new Map();
  const keys = new Map<string, Uint8Array>();
  for (const [name, value] of dictionary.getDict("CF") ?? []) {
    if (!(value instanceof PdfDict)) throw failure("errors.cryptFilter");
    const filter = cryptFilter(value, encryption);
    filters.set(name.value, filter);
    if (filter.cfm !== "None")
      keys.set(
        name.value,
        await recipientKey(dictionary, value, identities, encryption.version, filter.length * 8)
      );
  }
  return { filters, keys };
}
export async function publicKeyPdf(
  dictionary: PdfDict,
  identity?: PdfRecipientIdentity
): Promise<PublicKeyResult> {
  if (!identity) throw new PdfRecipientError(message("errors.recipientIdentityRequired"));
  const identities = recipientIdentities(identity);
  const encryption = encryptionConfig(dictionary);
  if (encryption.version < 4)
    return {
      encryption,
      key: await recipientKey(
        dictionary,
        dictionary,
        identities,
        encryption.version,
        encryption.keyLengthBits
      ),
    };
  return filteredPdf(dictionary, encryption, identities);
}
async function filteredPdf(
  dictionary: PdfDict,
  encryption: Encryption,
  identities: RecipientIdentity[]
): Promise<PublicKeyResult> {
  filterNames(dictionary, encryption);
  const { filters, keys } = await cryptFilters(dictionary, encryption, identities);
  encryption.cryptFilters = filters;
  for (const name of [
    encryption.streamFilter,
    encryption.stringFilter,
    encryption.embeddedFileFilter,
  ]) {
    if (name && name !== "Identity" && !filters.has(name))
      throw failure("errors.cryptFilterMissing");
  }
  const [firstName, firstKey] = keys.entries().next().value ?? [];
  if (!firstName || !firstKey) throw failure("errors.recipientContentMissing");
  const algorithms = { AESV3: "AES-256", AESV2: "AES-128", V2: "RC4", None: "RC4" } as const;
  encryption.algorithm = algorithms[filters.get(firstName)!.cfm];
  encryption.keyLengthBits = firstKey.length * 8;
  return { encryption, key: firstKey, filterKeys: keys };
}
function filterNames(dictionary: PdfDict, encryption: Encryption) {
  encryption.streamFilter = dictionary.getName("StmF")?.value ?? "Identity";
  encryption.stringFilter = dictionary.getName("StrF")?.value ?? "Identity";
  encryption.embeddedFileFilter = dictionary.getName("EFF")?.value ?? encryption.streamFilter;
}
