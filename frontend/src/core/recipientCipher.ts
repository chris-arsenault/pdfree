import forge from "node-forge";
import { type EnvelopedData, RSAESOAEPParams } from "pkijs";
import { OctetString, Sequence, Integer, ObjectIdentifier } from "asn1js";
import { binary, bytesOf } from "./recipientIdentity";

const hashes: Record<string, string> = {
  "1.3.14.3.2.26": "sha1",
  "2.16.840.1.101.3.4.2.1": "sha256",
  "2.16.840.1.101.3.4.2.2": "sha384",
  "2.16.840.1.101.3.4.2.3": "sha512",
};
export function oaepOptions(params: RSAESOAEPParams) {
  const hash = hashes[params.hashAlgorithm.algorithmId];
  const mgfParams = params.maskGenAlgorithm.algorithmParams;
  const oid =
    mgfParams instanceof Sequence && mgfParams.valueBlock.value[0] instanceof ObjectIdentifier
      ? mgfParams.valueBlock.value[0].valueBlock.toString()
      : "1.3.14.3.2.26";
  const mgf = hashes[oid];
  if (
    !hash ||
    !mgf ||
    params.maskGenAlgorithm.algorithmId !== "1.2.840.113549.1.1.8" ||
    params.pSourceAlgorithm.algorithmId !== "1.2.840.113549.1.1.9"
  )
    throw new Error("Unsupported RSA-OAEP parameters");
  const label =
    params.pSourceAlgorithm.algorithmParams instanceof OctetString
      ? binary(new Uint8Array(params.pSourceAlgorithm.algorithmParams.getValue()))
      : "";
  return {
    md: forge.md[hash as "sha1"].create(),
    mgf1: { md: forge.md[mgf as "sha1"].create() },
    label,
  };
}
function rc2Cipher(parameters: Sequence, key: string) {
  const values = parameters.valueBlock.value;
  const version = values[0] instanceof Integer ? values[0].valueBlock.valueDec : undefined;
  const bits =
    version === undefined
      ? 32
      : (({ 58: 128, 120: 64, 160: 40 } as Record<number, number>)[version] ?? version);
  if (version !== undefined && version < 256 && ![58, 120, 160].includes(version))
    throw new Error("Unsupported RC2 effective key length");
  const iv = values.at(-1);
  if (!(iv instanceof OctetString)) throw new Error("Missing RC2 IV");
  const cipher = forge.rc2.createDecryptionCipher(key, bits);
  cipher.start(binary(new Uint8Array(iv.getValue())));
  return cipher;
}
function contentCipher(algorithm: string, parameters: unknown, key: string) {
  if (algorithm === "1.2.840.113549.3.2" && parameters instanceof Sequence)
    return rc2Cipher(parameters, key);
  const algorithms: Record<string, forge.cipher.Algorithm> = {
    "2.16.840.1.101.3.4.1.2": "AES-CBC",
    "2.16.840.1.101.3.4.1.22": "AES-CBC",
    "2.16.840.1.101.3.4.1.42": "AES-CBC",
    "1.3.14.3.2.7": "DES-CBC",
    "1.2.840.113549.3.7": "3DES-CBC",
  };
  const name = algorithms[algorithm];
  if (!name || !(parameters instanceof OctetString))
    throw new Error("Unsupported recipient content encryption");
  const cipher = forge.cipher.createDecipher(name, key);
  cipher.start({ iv: binary(new Uint8Array(parameters.getValue())) });
  return cipher;
}
function rc4(data: Uint8Array, key: Uint8Array) {
  const table = Uint8Array.from({ length: 256 }, (_, index) => index);
  let second = 0;
  for (let index = 0; index < 256; index++) {
    second = (second + table[index] + key[index % key.length]) & 255;
    [table[index], table[second]] = [table[second], table[index]];
  }
  let first = 0;
  second = 0;
  return data.map((value) => {
    first = (first + 1) & 255;
    second = (second + table[first]) & 255;
    [table[first], table[second]] = [table[second], table[first]];
    return value ^ table[(table[first] + table[second]) & 255];
  });
}
export function decryptRecipientContent(envelope: EnvelopedData, key: string) {
  const info = envelope.encryptedContentInfo;
  if (!info.encryptedContent) throw new Error("Missing encrypted envelope content");
  const data = new Uint8Array(info.getEncryptedContent());
  const algorithm = info.contentEncryptionAlgorithm;
  if (algorithm.algorithmId === "1.2.840.113549.3.4") return rc4(data, bytesOf(key));
  const cipher = contentCipher(algorithm.algorithmId, algorithm.algorithmParams, key);
  cipher.update(forge.util.createBuffer(binary(data)));
  if (!cipher.finish()) throw new Error("Invalid recipient envelope padding");
  return bytesOf(cipher.output.getBytes());
}
