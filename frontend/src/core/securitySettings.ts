import {
  certificateSizeLimit,
  defaultPermissions,
  type PdfPermissions,
  type PdfSecurity,
  validatePdfSecurity,
  type Certification,
} from "./pdfSecurity";

export type SigningMode = "none" | "approval" | "1" | "2" | "3";
export type SecuritySettings = {
  protect: boolean;
  userPassword: string;
  userConfirmation: string;
  ownerPassword: string;
  ownerConfirmation: string;
  permissions: PdfPermissions;
  mode: SigningMode;
  certificate: File | null;
  certificatePassword: string;
  reason: string;
  location: string;
};
export const defaultSecuritySettings = (): SecuritySettings => ({
  protect: false,
  userPassword: "",
  userConfirmation: "",
  ownerPassword: "",
  ownerConfirmation: "",
  permissions: defaultPermissions(),
  mode: "none",
  certificate: null,
  certificatePassword: "",
  reason: "",
  location: "",
});
export const hasSecurity = (settings: SecuritySettings) =>
  settings.protect || settings.mode !== "none";

export async function securityCredentials(settings: SecuritySettings): Promise<PdfSecurity> {
  if (
    settings.protect &&
    (settings.userPassword !== settings.userConfirmation ||
      settings.ownerPassword !== settings.ownerConfirmation)
  )
    throw new Error("The opening and owner password confirmations must match.");
  const protection = settings.protect
    ? {
        userPassword: settings.userPassword,
        ownerPassword: settings.ownerPassword,
        permissions: settings.permissions,
      }
    : null;
  validatePdfSecurity({ protection, signing: null });
  let signing: PdfSecurity["signing"] = null;
  if (settings.mode !== "none") {
    const file = settings.certificate;
    if (!file || !file.size || file.size > certificateSizeLimit)
      throw new Error("Choose a PKCS#12 (.p12/.pfx) certificate no larger than 2 MiB.");
    signing = {
      certificate: new Uint8Array(await file.arrayBuffer()),
      password: settings.certificatePassword,
      certification: settings.mode === "approval" ? 0 : (Number(settings.mode) as Certification),
      reason: settings.reason,
      location: settings.location,
    };
  }
  const result = { protection, signing };
  validatePdfSecurity(result);
  return result;
}
