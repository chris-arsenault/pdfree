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
export type PdfProtection = {
  userPassword: string;
  ownerPassword: string;
  permissions: PdfPermissions;
};
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
  if (!protection.ownerPassword)
    throw new Error("Enter an owner password to control PDF permissions.");
  if (protection.userPassword === protection.ownerPassword)
    throw new Error(
      "Use different opening and owner passwords; the owner password bypasses restrictions."
    );
  for (const password of [protection.userPassword, protection.ownerPassword]) {
    if (new TextEncoder().encode(password).length > 127)
      throw new Error("PDF passwords must be no longer than 127 UTF-8 bytes.");
    if (password.includes("\0")) throw new Error("PDF passwords cannot contain a null character.");
  }
  if (
    Object.keys(defaultPermissions()).some(
      (key) => typeof protection.permissions[key as keyof PdfPermissions] !== "boolean"
    )
  )
    throw new Error("Choose valid PDF permissions.");
}

export function validatePdfSecurity(security: PdfSecurity) {
  if (security.protection) validateProtection(security.protection);
  const signing = security.signing;
  if (!signing) return;
  if (!signing.certificate.length || signing.certificate.length > certificateSizeLimit)
    throw new Error("Choose a PKCS#12 (.p12/.pfx) certificate no larger than 2 MiB.");
  if (![0, 1, 2, 3].includes(signing.certification))
    throw new Error("Choose a valid PDF certification policy.");
  if (signing.reason.length > 1024 || signing.location.length > 1024)
    throw new Error("Signing reason and location must be no longer than 1024 characters.");
  if (signing.password.length > 1024)
    throw new Error("Certificate passwords must be no longer than 1024 characters.");
}
