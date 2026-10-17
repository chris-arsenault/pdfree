import { failure, message } from "../i18n/messages";
import {
  ContentInfo,
  EnvelopedData,
  IssuerAndSerialNumber,
  KeyTransRecipientInfo,
  RSAESOAEPParams,
  type RecipientInfo,
} from "pkijs";
import { OctetString } from "asn1js";
import { binary, bufferOf, type RecipientIdentity } from "./recipientIdentity";
import { PdfRecipientError } from "./pdfCredentials";
import { decryptRecipientContent, oaepOptions } from "./recipientCipher";

function matches(info: KeyTransRecipientInfo, identity: RecipientIdentity) {
  const rid = info.rid;
  if (rid instanceof IssuerAndSerialNumber)
    return (
      rid.issuer.isEqual(identity.certificate.issuer) &&
      rid.serialNumber.isEqual(identity.certificate.serialNumber)
    );
  const ski = identity.certificate.extensions?.find(
    (extension) => extension.extnID === "2.5.29.14"
  )?.parsedValue;
  return rid instanceof OctetString && ski instanceof OctetString && ski.isEqual(rid);
}
function rsaKey(info: KeyTransRecipientInfo, identity: RecipientIdentity) {
  if (!identity.rsa) throw failure("errors.rsaPrivateKey");
  const ciphertext = binary(new Uint8Array(info.encryptedKey.getValue()));
  const algorithm = info.keyEncryptionAlgorithm;
  if (algorithm.algorithmId === "1.2.840.113549.1.1.1")
    return identity.rsa.decrypt(ciphertext, "RSAES-PKCS1-V1_5");
  if (algorithm.algorithmId !== "1.2.840.113549.1.1.7") throw failure("errors.recipientTransport");
  const params = new RSAESOAEPParams(
    algorithm.algorithmParams ? { schema: algorithm.algorithmParams } : {}
  );
  return identity.rsa.decrypt(ciphertext, "RSA-OAEP", oaepOptions(params));
}
async function decryptEntry(
  envelope: EnvelopedData,
  recipient: RecipientInfo,
  index: number,
  identity: RecipientIdentity
) {
  if (recipient.value instanceof KeyTransRecipientInfo) {
    if (!matches(recipient.value, identity)) return null;
    return decryptRecipientContent(envelope, rsaKey(recipient.value, identity));
  }
  return new Uint8Array(
    await envelope.decrypt(index, {
      recipientCertificate: identity.certificate,
      recipientPrivateKey: identity.privateKey,
    })
  );
}
export async function recipientSeed(encoded: Uint8Array, identities: RecipientIdentity[]) {
  const content = ContentInfo.fromBER(bufferOf(encoded));
  if (content.contentType !== ContentInfo.ENVELOPED_DATA) throw failure("errors.envelopeType");
  const envelope = new EnvelopedData({ schema: content.content });
  let cause: unknown;
  for (const identity of identities)
    for (const [index, recipient] of envelope.recipientInfos.entries()) {
      try {
        const plaintext = await decryptEntry(envelope, recipient, index, identity);
        if (!plaintext) continue;
        if (plaintext.length !== 20 && plaintext.length !== 24)
          throw failure("errors.recipientSeed");
        const seed = plaintext.slice(0, 20);
        plaintext.fill(0);
        return seed;
      } catch (error) {
        cause = error;
      }
    }
  throw new PdfRecipientError(message("errors.recipientDecrypt"), { cause });
}
