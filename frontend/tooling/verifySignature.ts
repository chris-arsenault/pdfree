import { createHash, verify, X509Certificate } from "node:crypto";
import { Certificate } from "pkijs";
import { inspectSignature } from "./signatureInspection";

// Node/OpenSSL-backed crypto verifies downloaded CMS without the signing engine.
export function verifyDownloadedSignature(bytes: Uint8Array) {
  const parsed = inspectSignature(bytes);
  const signer = parsed.data.signerInfos[0];
  const certificate = parsed.data.certificates?.find((item) => item instanceof Certificate);
  if (!(certificate instanceof Certificate) || !signer.signedAttrs)
    throw new Error("The downloaded signature is missing its certificate or signed attributes.");
  const digest = signer.signedAttrs.attributes.find(
    (attribute) => attribute.type === "1.2.840.113549.1.9.4"
  );
  const expected = createHash("sha256").update(parsed.signed).digest();
  if (!digest || !expected.equals(Buffer.from(digest.values[0].valueBlock.valueHexView)))
    return false;
  const publicCertificate = new X509Certificate(Buffer.from(certificate.toSchema().toBER(false)));
  return verify(
    "sha256",
    Buffer.from(signer.signedAttrs.encodedValue),
    publicCertificate.publicKey,
    Buffer.from(signer.signature.valueBlock.valueHexView)
  );
}
