# 0005 — Transient secured-export pipeline

- Status: Accepted
- Encrypted-input and recipient-protection boundaries extended by [0007](0007-encrypted-document-lifecycle.md).
- Date: 2026-10-08

## Context

The user separately authorized certificate signing, sign-and-lock/certification,
encryption and reader permissions. pdf-lib has no specialized signing/encryption
API. A combined signed/encrypted export must cover final bytes and preserve the
ordinary writer's fields, appearances, scans and page geometry.

## Decision

Finish ordinary PDF export first. Use pinned LibPDF 0.5.2 for AES-256 protection
and PKCS#12 decoding, with PKIjs 3.4.1, ASN1js 3.0.10 and Web Crypto for detached
CMS/certificate operations. Validate certificate dates, key usage when present
and private-key match. Reserve a standard signature slot, encrypt if selected,
then sign the final byte ranges without further serialization.

Keep credentials outside the document/project/draft model. One secured export
owns one worker, terminated after success, failure or cancellation. Cancellation
begins before asynchronous preparation so closing the dialog prevents a later
worker/download. Apply security only to this dialog's PDF save/download.

DocMDP records permitted subsequent changes; reader validation evaluates policy
and trust. AES-256 opening passwords provide confidentiality; owner permissions
are reader-enforced restrictions. Keys and credentials stay local, with no online
timestamp, revocation or missing-chain retrieval.

## Alternatives considered

- **Visible mark or flattening as signing/locking:** provides neither certificate
  integrity nor certification semantics.
- **Sign then encrypt:** changes signed bytes and invalidates the signature.
- **Server signing/encryption:** violates the browser-only processing boundary.
- **Persist credentials in projects/drafts:** exposes private keys/passwords in
  portable or evictable local state unrelated to the editing contract.
- **Long-lived security worker:** retains key/password/parsed-document state
  beyond an individual export and complicates cancellation ownership.

## Consequences

Unsigned originals/projects remain editable; secured outputs are terminal exports
for this editor. Trust, permitted subsequent revisions and advanced validation
are separate reader capabilities. JavaScript heap zeroization is not guaranteed.
The cryptographic/parser gates must verify actual bytes with independent tools.
See [security](../security.md) and [ADR 0006](0006-independent-verification.md).
