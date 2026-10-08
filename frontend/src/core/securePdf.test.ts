import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { getDocument, PermissionFlag } from "pdfjs-dist/legacy/build/pdf.mjs";
import { securePdf } from "./securePdf";
import { defaultPermissions } from "./pdfSecurity";
import { formFixture } from "./fixtures";
import { verifyDownloadedSignature } from "../../tooling/verifySignature";

it("leaves an export byte-for-byte unchanged when security is disabled", async () => {
  const original = await formFixture();
  expect(await securePdf(original, { protection: null, signing: null })).toEqual(original);
});
it("signs filled values without modifying source bytes and rejects altered content", async () => {
  const pdf = await PDFDocument.load(await formFixture());
  pdf.getForm().getTextField("name").setText("Approved Ada");
  const original = await pdf.save(),
    immutable = original.slice();
  const bytes = await securePdf(original, {
    protection: null,
    signing: {
      certificate: new Uint8Array(await readFile("tooling/fixtures/signer.p12")),
      password: "fixture-password",
      certification: 0,
      reason: "Approval",
      location: "Montréal",
    },
  });
  expect(original).toEqual(immutable);
  expect((await PDFDocument.load(bytes)).getForm().getTextField("name").getText()).toBe(
    "Approved Ada"
  );
  expect(verifyDownloadedSignature(bytes)).toBe(true);
  const altered = bytes.slice();
  altered[10] ^= 1;
  expect(verifyDownloadedSignature(altered)).toBe(false);
});
it("preserves owner-only viewing, accessible extraction and disabled print quality in signed encryption", async () => {
  const bytes = await securePdf(await formFixture(), {
    protection: {
      userPassword: "",
      ownerPassword: "owner-password",
      permissions: { ...defaultPermissions(), print: false, printHighQuality: true, copy: false },
    },
    signing: {
      certificate: new Uint8Array(await readFile("tooling/fixtures/ec-signer.p12")),
      password: "fixture-password",
      certification: 3,
      reason: "",
      location: "",
    },
  });
  expect(verifyDownloadedSignature(bytes)).toBe(true);
  const pdf = await getDocument({ data: bytes.slice() }).promise;
  try {
    const permissions = await pdf.getPermissions();
    expect(permissions).not.toContain(PermissionFlag.PRINT);
    expect(permissions).not.toContain(PermissionFlag.PRINT_HIGH_QUALITY);
    expect(permissions).not.toContain(PermissionFlag.COPY);
    expect(permissions).toContain(PermissionFlag.COPY_FOR_ACCESSIBILITY);
    expect(
      (await (await pdf.getPage(1)).getTextContent()).items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
    ).toContain("Sample page 1");
  } finally {
    await pdf.destroy();
  }
});
