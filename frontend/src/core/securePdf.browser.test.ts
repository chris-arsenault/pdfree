import { expect, it } from "vitest";
import * as pdfjs from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import rsaUrl from "../../tooling/fixtures/signer.p12?url";
import ecUrl from "../../tooling/fixtures/ec-signer.p12?url";
import { assetBytes } from "../services/resources";
import { runSecurityWorker } from "../services/securityClient";
import { defaultPermissions } from "./pdfSecurity";
import { formFixture } from "./fixtures";
import { inspectSignature } from "../../tooling/signatureInspection";
import { PDFDocument, degrees } from "pdf-lib";

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
for (const [keyType, url] of [
  ["RSA", rsaUrl],
  ["ECDSA", ecUrl],
]) {
  it(`signs and encrypts with a local ${keyType} certificate in a real one-export worker`, async () => {
    const bytes = await runSecurityWorker(await formFixture(), {
      protection: {
        userPassword: "reader-password",
        ownerPassword: "owner-password",
        permissions: { ...defaultPermissions(), copy: false, modify: false, assemble: false },
      },
      signing: {
        certificate: await assetBytes(url),
        password: "fixture-password",
        certification: 1,
        reason: "Local approval",
        location: "Montréal",
      },
    });
    const signature = inspectSignature(bytes);
    expect(
      await signature.data.verify({ signer: 0, data: signature.signed.buffer, checkChain: false })
    ).toBe(true);
    const tampered = signature.signed.slice();
    tampered[10] ^= 1;
    await expect(
      signature.data.verify({ signer: 0, data: tampered.buffer, checkChain: false })
    ).rejects.toThrow("Message digest doesn't match");
    const pdf = await pdfjs.getDocument({ data: bytes.slice(), password: "reader-password" })
      .promise;
    try {
      expect(pdf.numPages).toBe(3);
      const annotations = await (await pdf.getPage(1)).getAnnotations();
      expect(annotations.find((field) => field.fieldName === "name")?.fieldValue).toBe("Original");
      expect(await pdf.getPermissions()).not.toContain(pdfjs.PermissionFlag.COPY);
      expect(await pdf.getPermissions()).not.toContain(pdfjs.PermissionFlag.MODIFY_CONTENTS);
      const text = await (await pdf.getPage(1)).getTextContent();
      expect(text.items.some((item) => "str" in item && item.str === "Sample page 1")).toBe(true);
    } finally {
      await pdf.destroy();
    }
    const invalid = pdfjs.getDocument({ data: bytes.slice(), password: "wrong" });
    try {
      await expect(invalid.promise).rejects.toThrow("Incorrect Password");
    } finally {
      await invalid.destroy();
    }
  });
}

it("fails a bad certificate password and lets the next security worker export succeed", async () => {
  await expect(
    runSecurityWorker(await formFixture(), {
      protection: null,
      signing: {
        certificate: await assetBytes(rsaUrl),
        password: "wrong",
        certification: 0,
        reason: "",
        location: "",
      },
    })
  ).rejects.toThrow("could not be unlocked");
  const output = await runSecurityWorker(await formFixture(), {
    protection: null,
    signing: {
      certificate: await assetBytes(rsaUrl),
      password: "fixture-password",
      certification: 0,
      reason: "",
      location: "",
    },
  });
  const signature = inspectSignature(output);
  expect(
    await signature.data.verify({ signer: 0, data: signature.signed.buffer, checkChain: false })
  ).toBe(true);
});

it("retains scanned pixels and page rotation through signing and encryption", async () => {
  const scan = document.createElement("canvas");
  scan.width = 20;
  scan.height = 20;
  const scanContext = scan.getContext("2d")!;
  scanContext.fillStyle = "#ff0000";
  scanContext.fillRect(0, 0, 20, 20);
  const original = await PDFDocument.create();
  const originalPage = original.addPage([100, 200]);
  originalPage.setRotation(degrees(90));
  originalPage.drawImage(await original.embedPng(scan.toDataURL("image/png")), {
    x: 10,
    y: 20,
    width: 30,
    height: 40,
  });
  const bytes = await runSecurityWorker(await original.save(), {
    protection: {
      userPassword: "reader-password",
      ownerPassword: "owner-password",
      permissions: defaultPermissions(),
    },
    signing: {
      certificate: await assetBytes(rsaUrl),
      password: "fixture-password",
      certification: 1,
      reason: "",
      location: "",
    },
  });
  const pdf = await pdfjs.getDocument({ data: bytes, password: "reader-password" }).promise;
  try {
    const savedPage = await pdf.getPage(1),
      viewport = savedPage.getViewport({ scale: 1 });
    expect(savedPage.rotate).toBe(90);
    const output = document.createElement("canvas");
    output.width = viewport.width;
    output.height = viewport.height;
    const context = output.getContext("2d")!;
    await savedPage.render({ canvasContext: context, canvas: output, viewport }).promise;
    expect(Array.from(context.getImageData(40, 25, 1, 1).data)).toEqual([255, 0, 0, 255]);
    expect(Array.from(context.getImageData(10, 80, 1, 1).data)).toEqual([255, 255, 255, 255]);
  } finally {
    await pdf.destroy();
  }
});
