# 0007 — Encrypted document lifecycle and recipient protection

- Status: Accepted
- Date: 2026-10-08
- Partially supersedes: [0003](0003-pdf-engines-and-preservation.md),
  [0004](0004-projects-drafts-and-retained-pwa.md),
  [0005](0005-secured-export-pipeline.md)

## Context

Encrypted-input rejection prevented editing permission-only PDFs even when no
opening password was required. The user requested general password encryption
support and explicitly included Adobe.PubSec certificate-recipient encryption.
pdf-lib cannot authenticate these inputs. The pinned LibPDF engine required
authentication-order, encoding and crypt-filter corrections, and PKIjs defaults
failed independent RSA-OAEP/ECDH CMS interoperability checks.

## Decision

Authenticate Standard revisions 2–6 and supported Adobe.PubSec envelopes in a
dedicated worker per import. Retry typed password/identity failures and terminate
the worker on success, failure or cancellation. Never persist opening passwords,
PKCS#12 files or private keys in the editing model, projects or drafts.

Keep immutable original ciphertext alongside a decrypted working PDF and cipher
metadata. All editing, viewing and ordinary exports consume working bytes.
Valid opening credentials permit editing; PDF permission flags are advisory.
Passive pushbuttons retain their appearance without executing their actions.

Use project manifest version 2 only when decrypted working entries are present;
continue reading/writing version 1 for plain sources. Both restore editing model
version 1. Project saves confirm that working content is unprotected. Encrypted
local drafts require explicit consent, checked again inside the write transaction.
Draft model revision 3 normalizes earlier data without changing saved edits.

Offer explicit AES-256 password or certificate-recipient protection on PDF export.
Recipient protection uses public X.509 certificates and RSA-OAEP/ECDH CMS
envelopes; opening uses matching private PKCS#12 identities. Encryption still
precedes signing. Signed-input restrictions remain because encryption support
does not establish safe preservation of existing signatures.

Maintain small, frozen pnpm patches for LibPDF and PKIjs alongside independent
qpdf, OpenSSL, Poppler and PDFBox regressions. Docker supplies native verification
tools only. Application processing and dependencies remain browser-local.

## Alternatives considered

- **Ignore encryption in pdf-lib:** bypasses authentication without producing
  valid plaintext and can corrupt saved content.
- **Discard encrypted originals:** prevents faithful original recovery.
- **Store credentials to reopen projects:** unnecessarily persists secrets;
  working copies provide resumability with an explicit plaintext boundary.
- **Implement a second complete PDF parser:** duplicates the existing engine;
  explicit cipher hooks and independent tests provide the required support.

## Consequences

Permission-only, password and recipient-encrypted documents can be edited and
re-protected locally. Projects and opted-in drafts contain plaintext; credentials
do not. Unsupported proprietary handlers and CMS algorithms fail explicitly.
Dependency upgrades must pass the interoperability regressions before patches
are removed. Current limits live in [compatibility](../compatibility.md).
