import { beforeAll, expect, it } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { recipientSeed } from "./recipientEnvelope";
import { recipientIdentities } from "./recipientIdentity";
import { securePdf } from "./securePdf";
import { formFixture } from "./fixtures";
import { importPdf } from "./importPdf";
import { defaultPermissions } from "./pdfSecurity";
import { ContentInfo, EnvelopedData, RSAESOAEPParams, KeyTransRecipientInfo } from "pkijs";
import { oaepOptions } from "./recipientCipher";

const run = promisify(execFile);
const base = "test-results/recipient-cms";
const fixtureBase = "tooling/fixtures/encryption";
const seed = Uint8Array.from({ length: 20 }, (_, index) => index + 1);
beforeAll(async () => {
  await mkdir(base, { recursive: true });
  await writeFile(`${base}/seed.bin`, new Uint8Array([...seed, 0, 0, 15, 61]));
  await run("openssl", [
    "req",
    "-x509",
    "-newkey",
    "ec",
    "-pkeyopt",
    "ec_paramgen_curve:P-256",
    "-nodes",
    "-keyout",
    `${base}/ec.key`,
    "-out",
    `${base}/ec.crt`,
    "-days",
    "3650",
    "-subj",
    "/CN=Public PDFree EC Recipient",
  ]);
  await run("openssl", [
    "pkcs12",
    "-export",
    "-inkey",
    `${base}/ec.key`,
    "-in",
    `${base}/ec.crt`,
    "-out",
    `${base}/ec.p12`,
    "-passout",
    "pass:identity-fixture",
  ]);
});
const algorithms = ["aes128", "aes192", "aes256", "des", "des3", "rc2", "rc2-40", "rc2-64", "rc4"];
it.each(algorithms)(
  "decrypts independent OpenSSL RSA/%s recipient envelopes",
  async (algorithm) => {
    const output = `${base}/${algorithm}.der`;
    await run("openssl", [
      "cms",
      "-encrypt",
      "-binary",
      "-provider",
      "default",
      "-provider",
      "legacy",
      "-outform",
      "DER",
      "-in",
      `${base}/seed.bin`,
      "-out",
      output,
      `-${algorithm}`,
      `${fixtureBase}/recipient.crt`,
    ]);
    const identities = recipientIdentities({
      bytes: new Uint8Array(await readFile(`${fixtureBase}/recipient.p12`)),
      password: "identity-fixture",
    });
    expect(await recipientSeed(new Uint8Array(await readFile(output)), identities)).toEqual(seed);
  }
);
it("decrypts independent OpenSSL RSA-OAEP SHA-256/MGF1-SHA-256 envelopes", async () => {
  await run("openssl", [
    "cms",
    "-encrypt",
    "-binary",
    "-outform",
    "DER",
    "-in",
    `${base}/seed.bin`,
    "-out",
    `${base}/oaep.der`,
    "-aes256",
    "-recip",
    `${fixtureBase}/recipient.crt`,
    "-keyopt",
    "rsa_padding_mode:oaep",
    "-keyopt",
    "rsa_oaep_md:sha256",
    "-keyopt",
    "rsa_mgf1_md:sha256",
  ]);
  const info = new EnvelopedData({
    schema: ContentInfo.fromBER(Uint8Array.from(await readFile(`${base}/oaep.der`)).buffer).content,
  });
  const recipient = info.recipientInfos[0].value;
  if (!(recipient instanceof KeyTransRecipientInfo)) throw new Error("Expected RSA recipient");
  const params = new RSAESOAEPParams({ schema: recipient.keyEncryptionAlgorithm.algorithmParams });
  const options = oaepOptions(params);
  expect([options.md.algorithm, options.mgf1.md.algorithm, options.label]).toEqual([
    "sha256",
    "sha256",
    "",
  ]);
  expect(
    await recipientSeed(
      new Uint8Array(await readFile(`${base}/oaep.der`)),
      recipientIdentities({
        bytes: new Uint8Array(await readFile(`${fixtureBase}/recipient.p12`)),
        password: "identity-fixture",
      })
    )
  ).toEqual(seed);
});
it("decrypts independent OpenSSL ECDH recipient envelopes", async () => {
  await run("openssl", [
    "cms",
    "-encrypt",
    "-binary",
    "-outform",
    "DER",
    "-in",
    `${base}/seed.bin`,
    "-out",
    `${base}/ec.der`,
    "-aes256",
    `${base}/ec.crt`,
  ]);
  expect(
    await recipientSeed(
      new Uint8Array(await readFile(`${base}/ec.der`)),
      recipientIdentities({
        bytes: new Uint8Array(await readFile(`${base}/ec.p12`)),
        password: "identity-fixture",
      })
    )
  ).toEqual(seed);
});
it("exports to an EC recipient and opens the result without signing-certificate restrictions", async () => {
  const bytes = await securePdf(await formFixture("EC recipient"), {
    signing: null,
    protection: {
      recipients: [new Uint8Array(await readFile(`${base}/ec.crt`))],
      permissions: defaultPermissions(),
    },
  });
  const result = await importPdf(bytes, "ec.pdf", {
    bytes: new Uint8Array(await readFile(`${base}/ec.p12`)),
    password: "identity-fixture",
  });
  expect(result.source.fields.find((field) => field.name === "name")?.value).toBe("Original");
  expect(result.pages).toHaveLength(3);
});
