import { beforeAll, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { importPdf, appendSource } from "./importPdf";
import { emptyDocument, fieldKey } from "./model";
import { formFixture } from "./fixtures";
import { exportPdf } from "./exportPdf";
import { securePdf } from "./securePdf";
import { defaultPermissions } from "./pdfSecurity";

const run = promisify(execFile);
const base = "test-results/encrypted-input";
const revisions = [
  { name: "R2", bits: "40", flags: [] },
  { name: "R3", bits: "128", flags: ["--use-aes=n"] },
  { name: "R4-RC4", bits: "128", flags: ["--use-aes=n", "--force-V4"] },
  { name: "R4-AES", bits: "128", flags: ["--use-aes=y"] },
  { name: "R5", bits: "256", flags: ["--force-R5"] },
  { name: "R6", bits: "256", flags: [] },
];
beforeAll(async () => {
  await mkdir(base, { recursive: true });
  await writeFile(`${base}/original.pdf`, await formFixture("Independent encryption"));
});
async function encrypted(
  name: string,
  bits: string,
  flags: string[],
  opening: string,
  owner: string
) {
  const path = `${base}/${name}.pdf`;
  await run("qpdf", [
    "--allow-weak-crypto",
    "--encrypt",
    opening,
    owner,
    bits,
    ...flags,
    "--",
    `${base}/original.pdf`,
    path,
  ]);
  return new Uint8Array(await readFile(path));
}
it.each(revisions)(
  "opens qpdf $name with empty, opening and owner credentials",
  async ({ name, bits, flags }) => {
    for (const opening of ["", "reader-fixture"]) {
      const bytes = await encrypted(
        `${name}-${opening ? "password" : "empty"}`,
        bits,
        flags,
        opening,
        "owner-fixture"
      );
      for (const password of [opening, "owner-fixture"]) {
        const doc = appendSource(emptyDocument(), await importPdf(bytes, `${name}.pdf`, password));
        doc.values[fieldKey(doc.sources[0].id, "name")] = "Independent Ada";
        const path = `${base}/${name}-edited.pdf`;
        await writeFile(path, await exportPdf(doc));
        expect((await run("qpdf", ["--check", path])).stdout).toContain(
          "No syntax or stream encoding errors"
        );
        expect((await run("pdftotext", [path, "-"])).stdout).toContain(
          "Independent encryption page 3"
        );
        expect(
          (await PDFDocument.load(new Uint8Array(await readFile(path))))
            .getForm()
            .getTextField("name")
            .getText()
        ).toBe("Independent Ada");
      }
      await expect(importPdf(bytes, `${name}.pdf`, "wrong-fixture")).rejects.toThrow("password");
    }
  }
);
it.each(revisions)(
  "opens qpdf $name non-ASCII opening and owner passwords",
  async ({ name, bits, flags }) => {
    const opening = bits === "256" ? "Montréal-東京" : "Montréal-€",
      owner = bits === "256" ? "maître-🔒" : "maître-£";
    const bytes = await encrypted(`${name}-unicode`, bits, flags, opening, owner);
    for (const password of [opening, owner]) {
      const { source, pages } = await importPdf(bytes, "unicode.pdf", password);
      expect(pages).toHaveLength(3);
      expect(source.fields.find((field) => field.name === "name")?.value).toBe("Original");
    }
  }
);
it("re-encrypts edited imported content and verifies the new password with qpdf", async () => {
  const bytes = await encrypted("reencrypt-input", "256", [], "reader-fixture", "owner-fixture");
  const doc = appendSource(
    emptyDocument(),
    await importPdf(bytes, "protected.pdf", "reader-fixture")
  );
  doc.values[fieldKey(doc.sources[0].id, "name")] = "Reencrypted Ada";
  const secured = await securePdf(await exportPdf(doc), {
    signing: null,
    protection: {
      userPassword: "next-reader",
      ownerPassword: "next-owner",
      permissions: defaultPermissions(),
    },
  });
  const path = `${base}/reencrypted.pdf`;
  await writeFile(path, secured);
  expect((await run("qpdf", ["--password=next-reader", "--check", path])).stdout).toContain(
    "No syntax or stream encoding errors"
  );
  await expect(run("qpdf", ["--password=reader-fixture", "--check", path])).rejects.toThrow();
  expect((await run("pdftotext", ["-upw", "next-reader", path, "-"])).stdout).toContain(
    "Independent encryption page 3"
  );
});
