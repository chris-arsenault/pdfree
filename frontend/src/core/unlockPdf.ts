import { PdfPasswordError, type PdfCredential } from "./pdfCredentials";
export { PdfPasswordError, PdfRecipientError } from "./pdfCredentials";
export type SourceEncryption = {
  algorithm: string;
  revision: number;
  authenticatedAs: "user" | "owner" | "recipient";
};

export async function unlockPdf(bytes: Uint8Array, credential?: PdfCredential) {
  const { PDF } = await import("@libpdf/core");
  const { PublicKeyDictionary, publicKeyPdf } = await import("./publicKeyPdf");
  const password = typeof credential === "string" ? credential : undefined;
  let recipient = false;
  const pdf = await PDF.load(bytes, {
    credentials: password,
    lenient: false,
    publicKeyDecrypt: (dictionary) => {
      throw new PublicKeyDictionary(dictionary);
    },
  })
    .catch(async (error: unknown) => {
      if (error instanceof PublicKeyDictionary) {
        const result = await publicKeyPdf(
          error.dictionary,
          typeof credential === "object" ? credential : undefined
        );
        recipient = true;
        return PDF.load(bytes, { lenient: false, publicKeyDecrypt: () => result });
      }
      throw error;
    })
    .catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === "PDF_PASSWORD")
        throw new PdfPasswordError(
          password === undefined
            ? "Enter this PDF's opening or owner password."
            : "That password did not unlock this PDF. Try its opening or owner password."
        );
      throw error;
    });
  if (!pdf.isEncrypted) return { bytes, encryption: undefined };
  const handler = pdf.context.info.securityHandler;
  if (!handler) throw new Error("This PDF uses an unsupported or invalid encryption handler.");
  if (!pdf.isAuthenticated)
    throw new PdfPasswordError(
      password === undefined
        ? "Enter this PDF's opening or owner password."
        : "That password did not unlock this PDF. Try its opening or owner password."
    );
  const info = pdf.getSecurity();
  let authenticatedAs: SourceEncryption["authenticatedAs"] =
    info.authenticatedAs === "owner" ? "owner" : "user";
  if (recipient) authenticatedAs = "recipient";
  const encryption: SourceEncryption = {
    algorithm: info.algorithm ?? "Unknown",
    revision: info.revision ?? 0,
    authenticatedAs,
  };
  // Opening credentials decrypt the content; reader permission flags are advisory.
  pdf.removeProtection({ ignorePermissions: true });
  const decrypted = await pdf.save({ useXRefStream: false });
  return { bytes: decrypted, encryption };
}
