import { type PdfSecurity, validatePdfSecurity } from "./pdfSecurity";
import { protectPdf } from "./protectPdf";
import { signingIdentity } from "./signingIdentity";
import { signaturePlaceholder } from "./signaturePlaceholder";
import { signatureRanges, signedBytes, insertSignature } from "./signatureBytes";
import { signatureCms } from "./signatureCms";

export async function securePdf(bytes: Uint8Array, security: PdfSecurity) {
  validatePdfSecurity(security);
  if (!security.signing)
    return security.protection ? protectPdf(bytes, security.protection) : bytes;
  const identity = await signingIdentity(security.signing);
  const reserved = Math.max(
    16384,
    identity.signer.certificate.length +
      identity.signer.certificateChain.reduce((size, cert) => size + cert.length, 0) +
      8192
  );
  const placeholder = await signaturePlaceholder(bytes, security.signing, identity.name, reserved);
  const prepared = security.protection
    ? await protectPdf(placeholder.bytes, security.protection)
    : placeholder.bytes;
  const slot = signatureRanges(prepared, placeholder.marker);
  const cms = await signatureCms(signedBytes(prepared, slot.range), identity);
  return insertSignature(prepared, cms, slot);
}
