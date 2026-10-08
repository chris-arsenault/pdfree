import { beforeAll, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PDFDocument, PDFDict, PDFName, PDFArray, PDFNumber, PDFHexString } from "pdf-lib";
import { securePdf } from "./securePdf";
import { type Certification, type PdfSecurity, defaultPermissions } from "./pdfSecurity";
import { formFixture } from "./fixtures";
import { inspectSignature } from "../../tooling/signatureInspection";
import { importPdf, appendSource } from "./importPdf";
import { exportPdf } from "./exportPdf";
import { emptyDocument } from "./model";

const run = promisify(execFile);
let certificate: Uint8Array;
beforeAll(async () => {
  certificate = new Uint8Array(await readFile("tooling/fixtures/signer.p12"));
  await mkdir("test-results/security", { recursive: true });
  await run("openssl", ["version"]);
  await run("qpdf", ["--version"]);
  await run("pdfsig", ["-v"]);
});
const signing = (certification: Certification) => ({
  certificate,
  password: "fixture-password",
  certification,
  reason: "Approval after filling",
  location: "Montréal",
});
const protection = () => ({
  userPassword: "reader-password",
  ownerPassword: "owner-password",
  permissions: { ...defaultPermissions(), copy: false, modify: false, assemble: false },
});
async function output(name: string, security: PdfSecurity) {
  const original = await formFixture();
  const pdf = await PDFDocument.load(original);
  pdf.getForm().getTextField("name").setText("Signed Ada");
  const bytes = await securePdf(await pdf.save(), security);
  const path = `test-results/security/${name}.pdf`;
  await writeFile(path, bytes);
  return { bytes, path };
}
async function verifyCms(name: string, bytes: Uint8Array) {
  const signature = inspectSignature(bytes);
  const base = `test-results/security/${name}`;
  await writeFile(`${base}.der`, signature.cms);
  await writeFile(`${base}.bin`, signature.signed);
  const result = await run("openssl", [
    "cms",
    "-verify",
    "-binary",
    "-inform",
    "DER",
    "-in",
    `${base}.der`,
    "-content",
    `${base}.bin`,
    "-noverify",
    "-out",
    `${base}-verified.bin`,
  ]);
  expect(result.stderr).toContain("CMS Verification successful");
  const tampered = signature.signed.slice();
  tampered[10] ^= 1;
  await writeFile(`${base}-tampered.bin`, tampered);
  await expect(
    run("openssl", [
      "cms",
      "-verify",
      "-binary",
      "-inform",
      "DER",
      "-in",
      `${base}.der`,
      "-content",
      `${base}-tampered.bin`,
      "-noverify",
      "-out",
      `${base}-invalid.bin`,
    ])
  ).rejects.toThrow();
}

it.each([0, 1, 2, 3] as const)(
  "verifies approval/certification policy %s and rejects tampering independently",
  async (policy) => {
    const { bytes, path } = await output(`policy-${policy}`, {
      protection: null,
      signing: signing(policy),
    });
    await verifyCms(`policy-${policy}`, bytes);
    expect((await run("pdfsig", ["-nocert", path])).stdout).toContain("Signature is Valid");
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getForm().getTextField("name").getText()).toBe("Signed Ada");
    const perms = pdf.catalog.lookupMaybe(PDFName.of("Perms"), PDFDict);
    if (!policy) expect(perms).toBeUndefined();
    else {
      const signature = perms!.lookup(PDFName.of("DocMDP"), PDFDict);
      const reference = signature.lookup(PDFName.of("Reference"), PDFArray).lookup(0, PDFDict);
      expect(
        reference
          .lookup(PDFName.of("TransformParams"), PDFDict)
          .lookup(PDFName.of("P"), PDFNumber)
          .asNumber()
      ).toBe(policy);
      expect(reference.get(PDFName.of("Data"))).toEqual(pdf.context.trailerInfo.Root);
    }
  }
);

it("writes AES-256 opening/owner passwords and permissions readable by qpdf", async () => {
  const { path } = await output("encrypted", { protection: protection(), signing: null });
  const encryption = (await run("qpdf", ["--password=reader-password", "--show-encryption", path]))
    .stdout;
  expect(encryption).toContain("R = 6");
  expect(encryption).toContain("AESv3");
  expect(encryption).toContain("extract for any purpose: not allowed");
  expect(encryption).toContain("modify other: not allowed");
  await expect(run("qpdf", ["--password=wrong", "--check", path])).rejects.toThrow();
  expect(
    (await run("qpdf", ["--password=owner-password", "--show-encryption", path])).stdout
  ).toContain("Supplied password is owner password");
});

it("combines encryption and locked certification without invalidating the signature", async () => {
  const { bytes, path } = await output("encrypted-certified", {
    protection: protection(),
    signing: signing(1),
  });
  await verifyCms("encrypted-certified", bytes);
  const result = await run("pdfsig", ["-nocert", "-upw", "reader-password", path]);
  expect(result.stdout).toContain("Signature is Valid");
  expect((await run("qpdf", ["--password=reader-password", "--check", path])).stdout).toContain(
    "No syntax or stream encoding errors"
  );
});

it("verifies ECDSA output independently with OpenSSL and Poppler", async () => {
  const ec = new Uint8Array(await readFile("tooling/fixtures/ec-signer.p12"));
  const { bytes, path } = await output("ecdsa", {
    protection: null,
    signing: { ...signing(2), certificate: ec },
  });
  await verifyCms("ecdsa", bytes);
  expect((await run("pdfsig", ["-nocert", path])).stdout).toContain("Signature is Valid");
});

it("allows viewing without an opening password while enforcing every reader permission bit", async () => {
  const permissions = {
    print: false,
    printHighQuality: true,
    copy: false,
    modify: false,
    annotate: false,
    fillForms: false,
    assemble: false,
  };
  const { path } = await output("owner-only", {
    protection: { ...protection(), userPassword: "", permissions },
    signing: null,
  });
  const result = (await run("qpdf", ["--show-encryption", path])).stdout;
  for (const permission of [
    "extract for any purpose",
    "print low resolution",
    "print high resolution",
    "modify document assembly",
    "modify forms",
    "modify annotations",
    "modify other",
  ])
    expect(result).toContain(`${permission}: not allowed`);
  expect(result).toContain("extract for accessibility: allowed");
  expect((await run("qpdf", ["--check", path])).stdout).toContain(
    "No syntax or stream encoding errors"
  );
});

it("round-trips non-ASCII passwords through an independent reader", async () => {
  const { path } = await output("unicode-password", {
    protection: { ...protection(), userPassword: "Montréal-東京", ownerPassword: "maître-🔒" },
    signing: null,
  });
  expect((await run("qpdf", ["--password=Montréal-東京", "--check", path])).stdout).toContain(
    "No syntax or stream encoding errors"
  );
  expect((await run("qpdf", ["--password=maître-🔒", "--show-encryption", path])).stdout).toContain(
    "Supplied password is owner password"
  );
});

it("reuses an empty signature field and rejects subsequent attempts to rewrite signed bytes", async () => {
  const pdf = await PDFDocument.load(await formFixture());
  const field = pdf.context.obj({ FT: "Sig", T: PDFHexString.fromText("Existing approval") });
  pdf.getForm().acroForm.addField(pdf.context.register(field));
  const original = await pdf.save(),
    immutable = original.slice();
  const document = appendSource(emptyDocument(), await importPdf(original, "empty-signature.pdf"));
  const signed = await securePdf(await exportPdf(document), {
    protection: null,
    signing: signing(0),
  });
  await verifyCms("existing-field", signed);
  const reopened = await PDFDocument.load(signed);
  expect(
    reopened
      .getForm()
      .getFields()
      .filter((item) => item.acroField.dict.get(PDFName.of("FT"))?.toString() === "/Sig")
      .map((item) => item.getName())
  ).toEqual(["Existing approval"]);
  expect(original).toEqual(immutable);
  await expect(importPdf(signed, "signed.pdf")).rejects.toThrow("Editing could invalidate");
  await expect(securePdf(signed, { protection: null, signing: signing(1) })).rejects.toThrow(
    "unsigned PDF"
  );
});

it("signs a flattened filled form with the filled appearance intact", async () => {
  const original = await formFixture();
  const document = appendSource(emptyDocument(), await importPdf(original, "filled.pdf"));
  document.values[document.sources[0].fields.find((field) => field.name === "name")!.id] =
    "Flattened Ada";
  const signed = await securePdf(await exportPdf(document, true), {
    protection: null,
    signing: signing(1),
  });
  await verifyCms("flattened", signed);
  const pdf = await PDFDocument.load(signed);
  expect(pdf.getForm().getFields()).toHaveLength(1);
  const path = "test-results/security/flattened.pdf";
  await writeFile(path, signed);
  expect((await run("pdfsig", ["-nocert", path])).stdout).toContain("Signature is Valid");
  expect((await run("pdftotext", [path, "-"])).stdout).toContain("Flattened Ada");
});
