import {
  AlgorithmIdentifier,
  Attribute,
  ContentInfo,
  EncapsulatedContentInfo,
  IssuerAndSerialNumber,
  SignedAndUnsignedAttributes,
  SignedData,
  SignerInfo,
} from "pkijs";
import { ObjectIdentifier, OctetString, UTCTime, Null } from "asn1js";
import {
  arrayBuffer,
  readCertificate,
  signingAlgorithm,
  type signingIdentity,
} from "./signingIdentity";

export async function signatureCms(
  data: Uint8Array,
  identity: Awaited<ReturnType<typeof signingIdentity>>
) {
  const digest = await crypto.subtle.digest("SHA-256", arrayBuffer(data));
  const algorithm = new AlgorithmIdentifier({
    algorithmId: "2.16.840.1.101.3.4.2.1",
    algorithmParams: new Null(),
  });
  const attributes = new SignedAndUnsignedAttributes({
    type: 0,
    attributes: [
      new Attribute({
        type: "1.2.840.113549.1.9.3",
        values: [new ObjectIdentifier({ value: "1.2.840.113549.1.7.1" })],
      }),
      new Attribute({
        type: "1.2.840.113549.1.9.5",
        values: [new UTCTime({ valueDate: new Date() })],
      }),
      new Attribute({
        type: "1.2.840.113549.1.9.4",
        values: [new OctetString({ valueHex: digest })],
      }),
    ],
  });
  const encoded = new Uint8Array(attributes.toSchema().toBER(false));
  // CMS signs the DER SET tag (0x31), not the IMPLICIT [0] tag used in SignerInfo.
  encoded[0] = 0x31;
  const signature = await identity.signer.sign(encoded, "SHA-256");
  const cms = new SignedData({
    version: 1,
    digestAlgorithms: [algorithm],
    encapContentInfo: new EncapsulatedContentInfo({ eContentType: "1.2.840.113549.1.7.1" }),
    certificates: [identity.certificate, ...identity.signer.certificateChain.map(readCertificate)],
    signerInfos: [
      new SignerInfo({
        version: 1,
        sid: new IssuerAndSerialNumber({
          issuer: identity.certificate.issuer,
          serialNumber: identity.certificate.serialNumber,
        }),
        digestAlgorithm: algorithm,
        signedAttrs: attributes,
        signatureAlgorithm: signingAlgorithm(identity.signer),
        signature: new OctetString({ valueHex: arrayBuffer(signature) }),
      }),
    ],
  });
  return new Uint8Array(
    new ContentInfo({
      contentType: "1.2.840.113549.1.7.2",
      content: cms.toSchema(true),
    })
      .toSchema()
      .toBER(false)
  );
}
