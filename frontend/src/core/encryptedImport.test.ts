import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { strFromU8, unzipSync, zipSync, strToU8 } from "fflate";
import {
  encryptionAlgorithms,
  encryptedFixture as strongFixture,
} from "../../tooling/encryptedFixture";
import { appendSource, importPdf } from "./importPdf";
import { exportPdf } from "./exportPdf";
import { emptyDocument, fieldKey, defaultObject } from "./model";
import { readProject, writeProject } from "./projects";
import { rotatePages, duplicatePages } from "./pageOperations";
import { refreshSources } from "./refreshSources";
import { PdfPasswordError } from "./unlockPdf";

async function encryptedFixture(
  algorithm: (typeof encryptionAlgorithms)[number] = "AES-256",
  opening = "reader-fixture"
) {
  if (algorithm === "AES-256") return strongFixture(algorithm, opening);
  const revision = { "RC4-40": "R2", "RC4-128": "R3", "AES-128": "R4-AES" }[algorithm];
  return new Uint8Array(
    await readFile(`tooling/fixtures/encryption/${revision}-${opening ? "password" : "empty"}.pdf`)
  );
}

describe.each(encryptionAlgorithms)("%s encrypted input", (algorithm) => {
  it("opens an empty opening password without prompting and retains the original ciphertext", async () => {
    const bytes = await encryptedFixture(algorithm, ""),
      immutable = bytes.slice();
    const { source, pages } = await importPdf(bytes, "encrypted.pdf");
    expect(source.bytes).toEqual(immutable);
    expect(source.encryption?.algorithm).toBe(algorithm);
    expect(source.decryptedBytes).not.toEqual(bytes);
    expect(pages).toHaveLength(3);
    expect(source.fields.find((field) => field.name === "name")?.value).toBe("Original");
    expect((await PDFDocument.load(source.decryptedBytes!)).isEncrypted).toBe(false);
  });
  it.each([undefined, "wrong-fixture"])(
    "requests credentials for %s instead of accepting unreadable bytes",
    async (password) => {
      await expect(
        importPdf(await encryptedFixture(algorithm), "locked.pdf", password)
      ).rejects.toBeInstanceOf(PdfPasswordError);
    }
  );
  it.each(["reader-fixture", "owner-fixture"])(
    "edits and independently renders content opened with %s",
    async (password) => {
      const bytes = await encryptedFixture(algorithm),
        immutable = bytes.slice();
      let doc = appendSource(emptyDocument(), await importPdf(bytes, "locked.pdf", password));
      doc.values[fieldKey(doc.sources[0].id, "name")] = "Unlocked Ada";
      doc.pages[0].objects.push({
        ...defaultObject("text", { x: 70, y: 320 }),
        text: "Unlocked mark",
      });
      doc = rotatePages(doc, [doc.pages[0].id]);
      const output = await exportPdf(doc);
      const pdf = await getDocument({ data: output.slice() }).promise;
      try {
        expect(pdf.numPages).toBe(3);
        const page = await pdf.getPage(1);
        expect(page.rotate).toBe(90);
        expect(
          (await page.getAnnotations()).find((field) => field.fieldName === "name")?.fieldValue
        ).toBe("Unlocked Ada");
        expect(
          (await page.getTextContent()).items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" ")
        ).toContain("Unlocked mark");
      } finally {
        await pdf.destroy();
      }
      expect(doc.sources[0].bytes).toEqual(immutable);
      expect(JSON.stringify(doc)).not.toContain(password);
    }
  );
});

it("preserves encrypted originals and decrypted working sources in version-4 projects without credentials", async () => {
  let doc = appendSource(
    emptyDocument(),
    await importPdf(await encryptedFixture(), "locked.pdf", "reader-fixture")
  );
  doc.values[fieldKey(doc.sources[0].id, "name")] = "Recovered Ada";
  doc = duplicatePages(doc, [doc.pages[0].id]);
  const archive = writeProject(doc),
    files = unzipSync(archive);
  expect(JSON.parse(strFromU8(files["manifest.json"])).version).toBe(4);
  const restored = await readProject(archive);
  expect(restored.pages).toEqual(doc.pages);
  expect(restored.values).toEqual(doc.values);
  expect(restored.sources[0].bytes).toEqual(doc.sources[0].bytes);
  expect(restored.sources[0].decryptedBytes).toEqual(doc.sources[0].decryptedBytes);
  expect(restored.sources[0].encryption).toEqual(doc.sources[0].encryption);
  expect(JSON.stringify(restored)).not.toMatch(/reader-fixture|owner-fixture/);
  expect((await PDFDocument.load(await exportPdf(restored))).getPageCount()).toBe(4);
});
it("ignores legacy document consent and excludes autosave preferences from projects", async () => {
  const doc = appendSource(
    emptyDocument(),
    await importPdf(await encryptedFixture("AES-256", ""), "locked.pdf")
  );
  const files = unzipSync(writeProject(doc));
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  expect(manifest).not.toHaveProperty("allowDecryptedDrafts");
  for (const consent of [false, true]) {
    manifest.allowDecryptedDrafts = consent;
    const restored = await readProject(
      zipSync({ ...files, "manifest.json": strToU8(JSON.stringify(manifest)) })
    );
    expect(restored).not.toHaveProperty("allowDecryptedDrafts");
    expect(restored.sources[0].bytes).toEqual(doc.sources[0].bytes);
    expect(restored.pages).toEqual(doc.pages);
    expect(
      JSON.parse(strFromU8(unzipSync(writeProject(restored))["manifest.json"]))
    ).not.toHaveProperty("allowDecryptedDrafts");
  }
});
it.each(["R2", "R3", "R4-RC4", "R4-AES", "R5", "R6"])(
  "opens independently generated %s legacy/Unicode credentials",
  async (revision) => {
    const bytes = new Uint8Array(
      await readFile(`tooling/fixtures/encryption/${revision}-unicode.pdf`)
    );
    const credentials = ["R5", "R6"].includes(revision)
      ? ["Montréal-東京", "maître-🔒"]
      : ["Montréal-€", "maître-£"];
    for (const password of credentials) {
      const imported = await importPdf(bytes, "unicode.pdf", password);
      expect(imported.pages).toHaveLength(3);
      expect(imported.source.fields.find((field) => field.name === "name")?.value).toBe("Original");
    }
  }
);
it("refreshes encrypted source descriptors from working bytes while retaining original IDs and ciphertext", async () => {
  const doc = appendSource(
    emptyDocument(),
    await importPdf(await encryptedFixture(), "locked.pdf", "reader-fixture")
  );
  const refreshed = await refreshSources(doc.sources, doc.pages);
  expect(refreshed.sources[0].bytes).toEqual(doc.sources[0].bytes);
  expect(refreshed.sources[0].encryption).toEqual(doc.sources[0].encryption);
  expect(refreshed.sources[0].fields.map((field) => field.id)).toEqual(
    doc.sources[0].fields.map((field) => field.id)
  );
});
it("rejects missing working entries and version-1 manifests carrying encrypted source extensions", async () => {
  const doc = appendSource(
    emptyDocument(),
    await importPdf(await encryptedFixture(), "locked.pdf", "reader-fixture")
  );
  const files = unzipSync(writeProject(doc));
  const manifest = JSON.parse(strFromU8(files["manifest.json"]));
  manifest.version = 1;
  await expect(
    readProject(zipSync({ ...files, "manifest.json": strToU8(JSON.stringify(manifest)) }))
  ).rejects.toThrow("supported PDFree");
  delete files["working/0.pdf"];
  await expect(readProject(zipSync(files))).rejects.toThrow("missing working/0.pdf");
});
it.runIf(Boolean(process.env.PDFREE_SAMPLE_PATH))(
  "round-trips an optional private permission-encrypted sample without publishing its contents",
  async () => {
    const bytes = new Uint8Array(await readFile(process.env.PDFREE_SAMPLE_PATH!));
    const imported = await importPdf(bytes, "private-sample.pdf");
    expect(imported.source.encryption).not.toBe(null);
    expect(imported.pages.length).toBeGreaterThan(0);
    const doc = appendSource(emptyDocument(), imported);
    const field = imported.source.fields.find((candidate) => candidate.kind === "text");
    expect(field).toBeDefined();
    doc.values[fieldKey(imported.source.id, field!.name)] = "PDFree regression";
    const output = await exportPdf(doc);
    const reader = await getDocument({ data: output.slice() }).promise;
    try {
      expect(reader.numPages).toBe(imported.pages.length);
      const fields = (
        await Promise.all(
          Array.from({ length: reader.numPages }, async (_, index) =>
            (await reader.getPage(index + 1)).getAnnotations()
          )
        )
      ).flat();
      expect(fields.find((candidate) => candidate.fieldName === field!.name)?.fieldValue).toBe(
        "PDFree regression"
      );
      expect(imported.source.bytes).toEqual(bytes);
    } finally {
      await reader.destroy();
    }
  },
  30_000
);
