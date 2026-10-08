import { PDF } from "@libpdf/core";
import { formFixture } from "../src/core/fixtures";

export const encryptionAlgorithms = ["RC4-40", "RC4-128", "AES-128", "AES-256"] as const;
export async function encryptedFixture(
  algorithm: (typeof encryptionAlgorithms)[number] = "AES-256",
  opening = "reader-fixture",
  owner = "owner-fixture"
) {
  const pdf = await PDF.load(await formFixture("Encrypted fixture"));
  pdf.setProtection({
    algorithm,
    userPassword: opening,
    ownerPassword: owner,
    permissions: { modify: false, assemble: false, annotate: false, fillForms: true },
  });
  return pdf.save({ useXRefStream: false });
}
