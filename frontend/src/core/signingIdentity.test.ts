import { expect, it, vi, afterEach } from "vitest";
import { readFile } from "node:fs/promises";
import { P12Signer } from "@libpdf/core";
import { BitString } from "asn1js";
import { readCertificate, signingIdentity, validateCertificate } from "./signingIdentity";

afterEach(() => vi.restoreAllMocks());
const identity = async () => ({
  certificate: new Uint8Array(await readFile("tooling/fixtures/signer.p12")),
  password: "fixture-password",
  certification: 0 as const,
  reason: "",
  location: "",
});
it("validates a real PKCS#12 identity against its embedded certificate", async () => {
  expect((await signingIdentity(await identity())).name).toBe("PDFree Synthetic Test Signer");
});
it.each(["wrong", ""])(
  "rejects a wrong certificate password without exposing it: %s",
  async (password) => {
    await expect(signingIdentity({ ...(await identity()), password })).rejects.toThrow(
      "could not be unlocked"
    );
  }
);
it("rejects corrupted PKCS#12 and certificate ASN.1", async () => {
  await expect(
    signingIdentity({ ...(await identity()), certificate: new Uint8Array([1, 2, 3]) })
  ).rejects.toThrow("could not be unlocked");
  expect(() => readCertificate(new Uint8Array([1, 2, 3]))).toThrow("could not be read");
});
it("rejects expired and future certificates instead of producing misleading signatures", async () => {
  const signer = await P12Signer.create((await identity()).certificate, "fixture-password", {
    buildChain: false,
  });
  const cert = readCertificate(signer.certificate);
  expect(() => validateCertificate(cert, new Date(cert.notAfter.value.getTime() + 1000))).toThrow(
    "expired or not yet valid"
  );
  expect(() => validateCertificate(cert, new Date(cert.notBefore.value.getTime() - 1000))).toThrow(
    "expired or not yet valid"
  );
});
it("rejects certificates whose key usage excludes signing", async () => {
  const signer = await P12Signer.create((await identity()).certificate, "fixture-password", {
    buildChain: false,
  });
  const cert = readCertificate(signer.certificate);
  cert.extensions!.find((extension) => extension.extnID === "2.5.29.15")!.parsedValue =
    new BitString({ valueHex: new Uint8Array([0x20]).buffer });
  expect(() => validateCertificate(cert)).toThrow("does not permit digital signatures");
});
it("detects a private key that does not match its certificate", async () => {
  const options = await identity();
  const rsa = await P12Signer.create(options.certificate, options.password, { buildChain: false });
  const ec = await P12Signer.create(
    new Uint8Array(await readFile("tooling/fixtures/ec-signer.p12")),
    "fixture-password",
    { buildChain: false }
  );
  const wrong = Object.create(rsa) as P12Signer;
  Object.defineProperty(wrong, "certificate", { value: ec.certificate });
  vi.spyOn(P12Signer, "create").mockResolvedValue(wrong);
  await expect(signingIdentity(options)).rejects.toThrow("does not match its private key");
});
