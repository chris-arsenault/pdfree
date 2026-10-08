import { beforeAll, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { importPdf, appendSource } from "./importPdf";
import { emptyDocument, fieldKey } from "./model";
import { formFixture } from "./fixtures";
import { exportPdf } from "./exportPdf";
import { writeProject, readProject } from "./projects";
import { securePdf } from "./securePdf";
import { defaultPermissions } from "./pdfSecurity";
import { verifyDownloadedSignature } from "../../tooling/verifySignature";

const run = promisify(execFile);
const base = "test-results/recipient-input";
const jar = process.env.PDFREE_PDFBOX_JAR;
beforeAll(async () => {
  if (!jar)
    throw new Error(
      "Set PDFREE_PDFBOX_JAR to the verified PDFBox app 3.0.6 jar; certificate tests require an independent producer."
    );
  await mkdir(base, { recursive: true });
  await writeFile(`${base}/original.pdf`, await formFixture("Independent recipient"));
  for (const name of ["recipient", "other"]) {
    await run("openssl", [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-nodes",
      "-keyout",
      `${base}/${name}.key`,
      "-out",
      `${base}/${name}.crt`,
      "-days",
      "3650",
      "-subj",
      `/CN=Public PDFree ${name} Fixture`,
    ]);
    await run("openssl", [
      "pkcs12",
      "-export",
      "-inkey",
      `${base}/${name}.key`,
      "-in",
      `${base}/${name}.crt`,
      "-out",
      `${base}/${name}.p12`,
      "-passout",
      "pass:identity-fixture",
    ]);
  }
  for (const bits of [40, 128, 256]) {
    await run("java", [
      "--class-path",
      jar,
      "tooling/RecipientFixtures.java",
      `${base}/original.pdf`,
      `${base}/pubsec-${bits}.pdf`,
      String(bits),
      "false",
      `${base}/recipient.crt`,
      `${base}/other.crt`,
    ]);
  }
  await run("java", [
    "--class-path",
    jar,
    "tooling/RecipientFixtures.java",
    `${base}/original.pdf`,
    `${base}/pubsec-AES128.pdf`,
    "128",
    "true",
    `${base}/recipient.crt`,
  ]);
});
it("opens PDFBox AES-128 certificate encryption", async () => {
  const imported = await importPdf(
    new Uint8Array(await readFile(`${base}/pubsec-AES128.pdf`)),
    "recipient.pdf",
    { bytes: new Uint8Array(await readFile(`${base}/recipient.p12`)), password: "identity-fixture" }
  );
  expect(imported.source.encryption?.algorithm).toBe("AES-128");
  expect(imported.pages).toHaveLength(3);
  expect(imported.source.fields.find((field) => field.name === "name")?.value).toBe("Original");
});
it.each([40, 128, 256])(
  "opens PDFBox certificate encryption with %i-bit keys, preserves fields and reopens projects",
  async (bits) => {
    const bytes = new Uint8Array(await readFile(`${base}/pubsec-${bits}.pdf`));
    await expect(importPdf(bytes, "recipient.pdf")).rejects.toThrow("recipient .p12");
    for (const name of ["recipient", "other"]) {
      const identity = {
        bytes: new Uint8Array(await readFile(`${base}/${name}.p12`)),
        password: "identity-fixture",
      };
      const imported = await importPdf(bytes, "recipient.pdf", identity);
      expect(imported.source.encryption?.authenticatedAs).toBe("recipient");
      expect(imported.pages).toHaveLength(3);
      expect(imported.source.bytes).toEqual(bytes);
      const doc = appendSource(emptyDocument(), imported);
      doc.values[fieldKey(imported.source.id, "name")] = "Recipient Ada";
      const restored = await readProject(await writeProject(doc));
      expect(restored.sources[0].bytes).toEqual(bytes);
      expect(restored.sources[0].encryption?.authenticatedAs).toBe("recipient");
      const path = `${base}/edited-${bits}-${name}.pdf`;
      await writeFile(path, await exportPdf(restored));
      expect((await run("qpdf", ["--check", path])).stdout).toContain(
        "No syntax or stream encoding errors"
      );
      const text = (await run("pdftotext", [path, "-"])).stdout;
      expect(text).toContain("Recipient Ada");
      expect(text).toContain("Independent recipient page 3");
      expect(JSON.stringify(restored)).not.toContain("identity-fixture");
    }
  }
);
it("rejects the wrong identity password and a certificate that is not a recipient", async () => {
  const bytes = new Uint8Array(await readFile(`${base}/pubsec-256.pdf`));
  const identity = new Uint8Array(await readFile(`${base}/recipient.p12`));
  await expect(
    importPdf(bytes, "recipient.pdf", { bytes: identity, password: "wrong" })
  ).rejects.toThrow("identity could not be unlocked");
  await run("java", [
    "-jar",
    jar!,
    "encrypt",
    "-i",
    `${base}/original.pdf`,
    "-o",
    `${base}/only-other.pdf`,
    "-certFile",
    `${base}/other.crt`,
  ]);
  await expect(
    importPdf(new Uint8Array(await readFile(`${base}/only-other.pdf`)), "recipient.pdf", {
      bytes: identity,
      password: "identity-fixture",
    })
  ).rejects.toThrow("not an authorized recipient");
});
it("creates AES-256 recipient exports that PDFBox independently decrypts for each recipient", async () => {
  const certificates = await Promise.all(
    ["recipient", "other"].map(
      async (name) => new Uint8Array(await readFile(`${base}/${name}.crt`))
    )
  );
  const encrypted = await securePdf(await formFixture("Recipient export"), {
    signing: null,
    protection: {
      recipients: certificates,
      permissions: { ...defaultPermissions(), copy: false, modify: false },
    },
  });
  await writeFile(`${base}/export.pdf`, encrypted);
  for (const name of ["recipient", "other"]) {
    const path = `${base}/export-${name}-decrypted.pdf`;
    await run("java", [
      "--class-path",
      jar!,
      "tooling/ReadRecipient.java",
      `${base}/export.pdf`,
      `${base}/${name}.p12`,
      "identity-fixture",
      path,
    ]);
    expect((await run("qpdf", ["--check", path])).stdout).toContain(
      "No syntax or stream encoding errors"
    );
    expect((await run("pdftotext", [path, "-"])).stdout).toContain("Recipient export page 3");
    const reopened = await importPdf(encrypted, "export.pdf", {
      bytes: new Uint8Array(await readFile(`${base}/${name}.p12`)),
      password: "identity-fixture",
    });
    expect(reopened.source.encryption?.algorithm).toBe("AES-256");
    expect(reopened.source.fields.find((field) => field.name === "name")?.value).toBe("Original");
  }
});
it("signs the final certificate-encrypted bytes and permits independent recipient decryption", async () => {
  const encrypted = await securePdf(await formFixture("Signed recipient"), {
    signing: {
      certificate: new Uint8Array(await readFile("tooling/fixtures/signer.p12")),
      password: "fixture-password",
      certification: 1,
      reason: "Regression",
      location: "",
    },
    protection: {
      recipients: [new Uint8Array(await readFile(`${base}/recipient.crt`))],
      permissions: { ...defaultPermissions(), copy: false, modify: false },
    },
  });
  expect(verifyDownloadedSignature(encrypted)).toBe(true);
  const changed = encrypted.slice();
  changed[10] ^= 1;
  expect(verifyDownloadedSignature(changed)).toBe(false);
  await writeFile(`${base}/signed-export.pdf`, encrypted);
  const decrypted = `${base}/signed-export-decrypted.pdf`;
  await run("java", [
    "--class-path",
    jar!,
    "tooling/ReadRecipient.java",
    `${base}/signed-export.pdf`,
    `${base}/recipient.p12`,
    "identity-fixture",
    decrypted,
  ]);
  expect((await run("qpdf", ["--check", decrypted])).stdout).toContain(
    "No syntax or stream encoding errors"
  );
  expect((await run("pdftotext", [decrypted, "-"])).stdout).toContain("Signed recipient page 3");
});
