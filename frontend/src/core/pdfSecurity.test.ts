import { expect, it } from "vitest";
import {
  certificateSizeLimit,
  defaultPermissions,
  validatePdfSecurity,
  type PdfSecurity,
} from "./pdfSecurity";
import { defaultSecuritySettings, hasSecurity, securityCredentials } from "./securitySettings";

const protection = () => ({
  userPassword: "reader",
  ownerPassword: "owner",
  permissions: defaultPermissions(),
});
const signing = () => ({
  certificate: new Uint8Array([1]),
  password: "",
  certification: 0 as const,
  reason: "",
  location: "",
});
it("allows security-free export and owner-only protection", () => {
  expect(() => validatePdfSecurity({ protection: null, signing: null })).not.toThrow();
  expect(() =>
    validatePdfSecurity({ protection: { ...protection(), userPassword: "" }, signing: null })
  ).not.toThrow();
});
it.each([
  [{ ownerPassword: "" }, "owner password"],
  [{ ownerPassword: "reader" }, "different"],
  [{ userPassword: "x".repeat(128) }, "127 UTF-8"],
  [{ ownerPassword: "é".repeat(64) }, "127 UTF-8"],
  [{ userPassword: "a\0b" }, "null character"],
  [{ permissions: { print: true } }, "valid PDF permissions"],
])("rejects invalid PDF credentials before serialization: %j", (changes, error) => {
  const security = { protection: { ...protection(), ...changes }, signing: null } as PdfSecurity;
  expect(() => validatePdfSecurity(security)).toThrow(error);
});
it("accepts exactly 127 UTF-8 bytes without truncating passwords", () => {
  expect(() =>
    validatePdfSecurity({
      protection: { ...protection(), userPassword: "é".repeat(63) + "x" },
      signing: null,
    })
  ).not.toThrow();
});
it.each([
  [{ certificate: new Uint8Array() }, "PKCS#12"],
  [{ certificate: new Uint8Array(certificateSizeLimit + 1) }, "2 MiB"],
  [{ certification: 4 }, "certification policy"],
  [{ reason: "x".repeat(1025) }, "reason and location"],
  [{ location: "x".repeat(1025) }, "reason and location"],
  [{ password: "x".repeat(1025) }, "Certificate passwords"],
])("rejects invalid signing configuration: %j", (changes, error) => {
  expect(() =>
    validatePdfSecurity({ protection: null, signing: { ...signing(), ...changes } } as PdfSecurity)
  ).toThrow(error);
});
it.each([0, 1, 2, 3] as const)("accepts PDF certification policy %i", (certification) => {
  expect(() =>
    validatePdfSecurity({ protection: null, signing: { ...signing(), certification } })
  ).not.toThrow();
});
it("ignores stale credentials when both options are disabled", async () => {
  const settings = {
    ...defaultSecuritySettings(),
    ownerPassword: "stale",
    certificatePassword: "secret",
  };
  expect(hasSecurity(settings)).toBe(false);
  expect(await securityCredentials(settings)).toEqual({ protection: null, signing: null });
});
it.each(["userConfirmation", "ownerConfirmation"] as const)(
  "requires matching %s",
  async (field) => {
    const settings = {
      ...defaultSecuritySettings(),
      protect: true,
      userPassword: "reader",
      userConfirmation: "reader",
      ownerPassword: "owner",
      ownerConfirmation: "owner",
      [field]: "different",
    };
    await expect(securityCredentials(settings)).rejects.toThrow("confirmations must match");
  }
);
it.each(["approval", "1", "2", "3"] as const)(
  "reads local signing credentials for mode %s",
  async (mode) => {
    const settings = {
      ...defaultSecuritySettings(),
      mode,
      certificate: new File([new Uint8Array([3, 4])], "identity.p12"),
      certificatePassword: "fixture-password",
      reason: "Reviewed",
      location: "Montréal",
    };
    const result = await securityCredentials(settings);
    expect(result.signing?.certificate).toEqual(new Uint8Array([3, 4]));
    expect(result.signing?.certification).toBe(mode === "approval" ? 0 : Number(mode));
    expect(result.signing?.reason).toBe("Reviewed");
  }
);
it("requires a nonempty certificate when signing is selected", async () => {
  await expect(
    securityCredentials({ ...defaultSecuritySettings(), mode: "approval" })
  ).rejects.toThrow("PKCS#12");
});
