export type PdfRecipientIdentity = { bytes: Uint8Array; password: string };
export type PdfCredential = string | PdfRecipientIdentity;

export class PdfPasswordError extends Error {
  readonly code = "PDF_PASSWORD";
}
export class PdfRecipientError extends Error {
  readonly code = "PDF_RECIPIENT";
}
