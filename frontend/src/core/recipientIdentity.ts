import forge from "node-forge";
import { Certificate } from "pkijs";
import { fromBER } from "asn1js";
import { PdfRecipientError, type PdfRecipientIdentity } from "./pdfCredentials";

export const binary = (bytes: Uint8Array) =>
  forge.util.createBuffer(Uint8Array.from(bytes).buffer).getBytes();
export const bytesOf = (value: string) => Uint8Array.from(value, (char) => char.charCodeAt(0));
export const bufferOf = (bytes: Uint8Array): ArrayBuffer => Uint8Array.from(bytes).buffer;
export type RecipientIdentity = {
  certificate: Certificate;
  privateKey: ArrayBuffer;
  rsa: forge.pki.rsa.PrivateKey | null;
};

export function recipientIdentities(input: PdfRecipientIdentity): RecipientIdentity[] {
  try {
    const pfx = forge.pkcs12.pkcs12FromAsn1(
      forge.asn1.fromDer(binary(input.bytes)),
      input.password
    );
    const bags = pfx.safeContents.flatMap((safe) => safe.safeBags);
    const certificates = bags
      .filter((bag) => bag.type === forge.pki.oids.certBag)
      .map((bag) => {
        const asn = bag.cert ? forge.pki.certificateToAsn1(bag.cert) : bag.asn1;
        if (!asn) throw new Error("Missing certificate");
        return new Certificate({
          schema: fromBER(bufferOf(bytesOf(forge.asn1.toDer(asn).getBytes()))).result,
        });
      });
    const keys = bags.filter(
      (bag) => bag.type === forge.pki.oids.keyBag || bag.type === forge.pki.oids.pkcs8ShroudedKeyBag
    );
    const identities = keys.flatMap((bag) => {
      const rsa = bag.key ?? null;
      const asn = rsa ? forge.pki.wrapRsaPrivateKey(forge.pki.privateKeyToAsn1(rsa)) : bag.asn1;
      if (!asn) return [];
      const privateKey = bufferOf(bytesOf(forge.asn1.toDer(asn).getBytes()));
      return certificates.map((certificate) => ({ certificate, privateKey, rsa }));
    });
    if (!identities.length) throw new Error("Missing certificate or private key");
    // Decryption does not require a currently valid signing certificate or a network trust lookup.
    return identities;
  } catch {
    throw new PdfRecipientError(
      "The recipient identity could not be unlocked. Check its password and certificate/private key."
    );
  }
}
