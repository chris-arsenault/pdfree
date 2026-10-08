import { expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { importPdf, appendSource } from "./importPdf";
import { emptyDocument, fieldKey } from "./model";
import { exportPdf } from "./exportPdf";
import { PDFDocument } from "pdf-lib";
import { readProject, writeProject } from "./projects";
import { PdfRecipientError } from "./pdfCredentials";
import { recipientPermissionWord } from "./recipientProtection";
import { defaultPermissions } from "./pdfSecurity";

const fixture = async (name: string) =>
  new Uint8Array(
    await readFile(new URL(`../../tooling/fixtures/encryption/${name}`, import.meta.url))
  );
it.each(["40", "128", "AES128", "256"])(
  "requests a recipient identity for PubSec %s without claiming a PDF password is required",
  async (bits) => {
    await expect(
      importPdf(await fixture(`pubsec-${bits}.pdf`), "recipient.pdf")
    ).rejects.toBeInstanceOf(PdfRecipientError);
  }
);
it.each(["40", "128", "AES128", "256"])(
  "edits and persists independently produced PubSec %s",
  async (bits) => {
    const bytes = await fixture(`pubsec-${bits}.pdf`);
    const imported = await importPdf(bytes, "recipient.pdf", {
      bytes: await fixture("recipient.p12"),
      password: "identity-fixture",
    });
    expect(imported.pages).toHaveLength(3);
    expect(imported.source.bytes).toEqual(bytes);
    expect(imported.source.encryption?.authenticatedAs).toBe("recipient");
    const doc = appendSource(emptyDocument(), imported);
    doc.values[fieldKey(imported.source.id, "name")] = "Certificate Ada";
    const restored = await readProject(await writeProject(doc));
    const exported = await PDFDocument.load(await exportPdf(restored));
    expect(exported.isEncrypted).toBe(false);
    expect(exported.getForm().getTextField("name").getText()).toBe("Certificate Ada");
    expect(exported.getPageCount()).toBe(3);
    expect(JSON.stringify(restored)).not.toContain("identity-fixture");
  }
);
it("keeps recipient passwords out of failed imports", async () => {
  await expect(
    importPdf(await fixture("pubsec-256.pdf"), "recipient.pdf", {
      bytes: await fixture("recipient.p12"),
      password: "wrong-secret",
    })
  ).rejects.toThrow("identity could not be unlocked");
});
it("encodes Acrobat-compatible recipient permissions without granting administrator access", () => {
  expect(recipientPermissionWord(defaultPermissions())).toBe(0xf3d);
  expect(
    recipientPermissionWord({ ...defaultPermissions(), print: false, copy: false, modify: false })
  ).toBe(0x721);
});
