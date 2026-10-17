import { failure } from "../i18n/messages";
export type Certification = 0 | 1 | 2 | 3;
export type PdfPermissions = {
  print: boolean;
  printHighQuality: boolean;
  copy: boolean;
  modify: boolean;
  annotate: boolean;
  fillForms: boolean;
  assemble: boolean;
};
export type PdfPasswordProtection = {
  userPassword: string;
  ownerPassword: string;
  permissions: PdfPermissions;
};
export type PdfRecipientProtection = { recipients: Uint8Array[]; permissions: PdfPermissions };
export type PdfProtection = PdfPasswordProtection | PdfRecipientProtection;
export type PdfSigning = {
  certificate: Uint8Array;
  password: string;
  certification: Certification;
  reason: string;
  location: string;
};
// Export credentials deliberately live outside EditorDocument and its persistence schema.
export type PdfSecurity = { protection: PdfProtection | null; signing: PdfSigning | null };
export const certificateSizeLimit = 2 * 1024 * 1024;
export const defaultPermissions = (): PdfPermissions => ({
  print: true,
  printHighQuality: true,
  copy: true,
  modify: true,
  annotate: true,
  fillForms: true,
  assemble: true,
});

function validateProtection(protection: PdfProtection) {
  if ("recipients" in protection) {
    if (
      !protection.recipients.length ||
      protection.recipients.length > 32 ||
      protection.recipients.some(
        (certificate) => !certificate.length || certificate.length > certificateSizeLimit
      )
    )
      throw failure("errors.recipientCount");
    validatePermissions(protection.permissions);
    return;
  }
  if (!protection.ownerPassword) throw failure("errors.ownerPasswordRequired");
  if (protection.userPassword === protection.ownerPassword)
    throw failure("errors.passwordsDifferent");
  for (const password of [protection.userPassword, protection.ownerPassword]) {
    if (new TextEncoder().encode(password).length > 127) throw failure("errors.passwordByteLimit");
    if (password.includes("\0")) throw failure("errors.passwordNull");
  }
  validatePermissions(protection.permissions);
}
function validatePermissions(permissions: PdfPermissions) {
  if (
    Object.keys(defaultPermissions()).some(
      (key) => typeof permissions[key as keyof PdfPermissions] !== "boolean"
    )
  )
    throw failure("errors.permissions");
}

export function validatePdfSecurity(security: PdfSecurity) {
  if (security.protection) validateProtection(security.protection);
  const signing = security.signing;
  if (!signing) return;
  if (!signing.certificate.length || signing.certificate.length > certificateSizeLimit)
    throw failure("errors.certificateFile");
  if (![0, 1, 2, 3].includes(signing.certification)) throw failure("errors.certificationPolicy");
  if (signing.reason.length > 1024 || signing.location.length > 1024)
    throw failure("errors.signingMetadataLength");
  if (signing.password.length > 1024) throw failure("errors.certificatePasswordLength");
}
