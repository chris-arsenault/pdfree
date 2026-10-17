import { failure } from "../i18n/messages";
import { P12Signer } from "@libpdf/core";
import { Certificate, AlgorithmIdentifier, getCrypto } from "pkijs";
import { fromBER, Null, OctetString, BitString } from "asn1js";
import { type PdfSigning } from "./pdfSecurity";

export const arrayBuffer = (bytes: Uint8Array): ArrayBuffer => Uint8Array.from(bytes).buffer;
export function signingAlgorithm(signer: P12Signer) {
  if (signer.signatureAlgorithm === "RSASSA-PKCS1-v1_5")
    return new AlgorithmIdentifier({
      algorithmId: "1.2.840.113549.1.1.1",
      algorithmParams: new Null(),
    });
  if (signer.signatureAlgorithm === "ECDSA")
    return new AlgorithmIdentifier({ algorithmId: "1.2.840.10045.4.3.2" });
  throw failure("errors.signingAlgorithm");
}

export function readCertificate(bytes: Uint8Array) {
  const parsed = fromBER(arrayBuffer(bytes));
  if (parsed.offset === -1) throw failure("errors.signingCertificateRead");
  return new Certificate({ schema: parsed.result });
}

export function validateCertificate(certificate: Certificate, now = new Date()) {
  if (now < certificate.notBefore.value || now > certificate.notAfter.value)
    throw failure("errors.signingCertificateValidity");
  const usage = certificate.extensions?.find((extension) => extension.extnID === "2.5.29.15");
  if (usage && !(usage.parsedValue instanceof BitString))
    throw failure("errors.signingKeyUsageRead");
  if (usage && !(usage.parsedValue.valueBlock.valueHexView[0] & 0xc0))
    throw failure("errors.signingKeyUsage");
}

export async function signingIdentity(options: PdfSigning) {
  let signer: P12Signer;
  try {
    signer = await P12Signer.create(options.certificate, options.password, { buildChain: false });
  } catch {
    throw failure("errors.signingIdentityUnlock");
  }
  const certificate = readCertificate(signer.certificate);
  validateCertificate(certificate);
  const challenge = crypto.getRandomValues(new Uint8Array(32));
  const signature = await signer.sign(challenge, "SHA-256");
  const algorithm = signingAlgorithm(signer);
  const matches = await getCrypto(true)
    .verifyWithPublicKey(
      arrayBuffer(challenge),
      new OctetString({ valueHex: arrayBuffer(signature) }),
      certificate.subjectPublicKeyInfo,
      algorithm,
      "SHA-256"
    )
    .catch(() => false);
  if (!matches) throw failure("errors.signingKeyMismatch");
  const commonName = certificate.subject.typesAndValues.find((value) => value.type === "2.5.4.3");
  const name = commonName?.value.valueBlock.value ?? "Certificate signer";
  return { signer, certificate, name: String(name) };
}
