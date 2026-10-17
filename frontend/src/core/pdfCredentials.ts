export type PdfRecipientIdentity = { bytes: Uint8Array; password: string };
export type PdfCredential = string | PdfRecipientIdentity;

export class PdfPasswordError extends MessageError {
  readonly code = "PDF_PASSWORD";
}
export class PdfRecipientError extends MessageError {
  readonly code = "PDF_RECIPIENT";
}
import { MessageError } from "../i18n/messages";
