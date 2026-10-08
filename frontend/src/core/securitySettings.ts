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
  protectionMode: "password" | "recipients";
  recipients: File[];
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
  protectionMode: "password",
  recipients: [],
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
  const protection = await protectionCredentials(settings);
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
async function protectionCredentials(
  settings: SecuritySettings
): Promise<PdfSecurity["protection"]> {
  if (!settings.protect) return null;
  if (settings.protectionMode === "recipients") {
    if (
      !settings.recipients.length ||
      settings.recipients.length > 32 ||
      settings.recipients.some((file) => !file.size || file.size > certificateSizeLimit)
    )
      throw new Error(
        "Choose between 1 and 32 X.509 recipient certificates, each no larger than 2 MiB."
      );
    return {
      recipients: await Promise.all(
        settings.recipients.map(async (file) => new Uint8Array(await file.arrayBuffer()))
      ),
      permissions: settings.permissions,
    };
  }
  if (
    settings.protect &&
    (settings.userPassword !== settings.userConfirmation ||
      settings.ownerPassword !== settings.ownerConfirmation)
  )
    throw new Error("The opening and owner password confirmations must match.");
  return settings.protect
    ? {
        userPassword: settings.userPassword,
        ownerPassword: settings.ownerPassword,
        permissions: settings.permissions,
      }
    : null;
}
