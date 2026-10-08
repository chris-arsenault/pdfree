import { PDF } from "@libpdf/core";
import { type PdfProtection } from "./pdfSecurity";
import { recipientProtection } from "./recipientProtection";

export async function protectPdf(bytes: Uint8Array, protection: PdfProtection) {
  if ("recipients" in protection) return recipientProtection(bytes, protection);
  const pdf = await PDF.load(bytes);
  pdf.setProtection({
    ...protection,
    algorithm: "AES-256",
    encryptMetadata: true,
    permissions: {
      ...protection.permissions,
      printHighQuality: protection.permissions.print && protection.permissions.printHighQuality,
      accessibility: true,
    },
  });
  return pdf.save({ useXRefStream: false });
}
