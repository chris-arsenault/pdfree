import { type PdfSecurity } from "../core/pdfSecurity";
import { type PdfCredential } from "../core/pdfCredentials";
export type SecurityRequest =
  | { kind: "secure"; bytes: Uint8Array; security: PdfSecurity }
  | { kind: "import"; bytes: Uint8Array; name: string; credential: PdfCredential | null };
