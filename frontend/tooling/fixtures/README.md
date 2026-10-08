# Public signing fixtures

`signer.p12` and `ec-signer.p12` are synthetic, self-signed PKCS#12 identities
generated with OpenSSL for regression tests on 2026-10-08. Their corresponding
public certificates are `signer-cert.pem` and `ec-signer-cert.pem`. The password
for both test files is `fixture-password`. These are public test keys, never
production credentials. Do not use them to sign real documents.

The RSA key is 2048 bits; the ECDSA key uses P-256. Certificates allow digital
signing and have a ten-year validity window. Tests use the real PKCS#12 decoder
and Web Crypto implementation, then verify saved PDF signatures independently
with OpenSSL and Poppler. qpdf checks encryption and reader permission bits.

To regenerate, use OpenSSL `req -x509 -newkey rsa:2048` or a P-256 EC key,
set `keyUsage=digitalSignature`, and use `pkcs12 -export` with the public fixture
password above. Delete the intermediate raw key after creating the PKCS#12 file.
Update both the PKCS#12 and matching PEM certificate together. These files are
imported by tests only and must never appear in the production bundle.
