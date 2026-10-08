# Signing, certification and protection

## Choose the operation

| Operation                          | Mechanism and result                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------- |
| Visible signature/initials         | Drawn, typed or imported page content; communicates a visible mark                 |
| Digitally sign                     | Detached CMS certificate signature covering the exported PDF bytes                 |
| Certify: no changes                | DocMDP policy 1 and field lock; validating readers assess subsequent changes       |
| Certify: forms/signatures          | DocMDP policy 2 permits form filling and additional signatures                     |
| Certify: forms/signatures/comments | DocMDP policy 3 additionally permits annotations                                   |
| Protect PDF                        | AES-256 opening/owner passwords or recipient certificates, with reader permissions |

Visible marks and flattened fields alone provide no cryptographic signing.
Certification records allowed changes; it does not prevent rewriting a file.
Readers evaluate byte integrity, certificate trust and policy compliance.

## Sign or certify

In Export choose Digitally sign or a Certify policy. Supply a local PKCS#12
`.p12`/`.pfx` file containing the certificate/private key and enter its password.
RSA and ECDSA identities are supported, up to 2 MiB. PDFree checks certificate
validity dates, key usage when present, and certificate/private-key match. Reason
and location are optional, up to 1,024 characters each.

PDFree reuses an eligible empty signature field or creates an invisible field.
Add a visible mark before export if desired. Existing visible widget geometry
remains intact. Preserve the original editing project for later work:
already-signed PDFs cannot be reopened for editing here because editing would
invalidate their signatures. Unsigned encrypted PDFs can be opened with credentials.

## Open encrypted documents

Standard password encryption revisions 2–6 are supported: RC4-40/128, AES-128
and AES-256. Empty opening passwords work automatically, including permission-only
documents. Supply an opening or owner password when prompted. Valid credentials
allow editing; reader permission flags are advisory.

Adobe.PubSec recipient encryption uses a local PKCS#12 `.p12`/`.pfx` identity
containing the matching private key and its password. RSA key transport, RSA-OAEP
and ECDH agreement are supported. Decryption does not require that an old
recipient certificate still be valid for new signatures. Unsupported handlers
or malformed encryption fail explicitly; PDFree never treats ciphertext as plaintext.

## Protect with passwords and permissions

Enable Protect PDF with passwords and permissions. The optional opening password
controls viewing. A distinct, required owner password bypasses reader permission
restrictions. Leaving the opening password empty permits anyone to view the PDF.
Both passwords accept up to 127 UTF-8 bytes; null characters are rejected.

Configure printing, high-quality printing, copying, editing, comments, form
filling and page assembly. High-quality printing requires printing enabled.
Accessible extraction stays enabled. Permissions depend on reader cooperation;
use an opening password when confidentiality matters.

Signing and protection can be combined. The export pipeline encrypts before
signing the final bytes so encryption does not invalidate the signature.

## Protect for certificate recipients

Select Recipient certificates under Encryption credentials. Choose 1–32 public
X.509 certificates in DER `.cer`/`.crt` or PEM format, each up to 2 MiB. Export
uses AES-256 with RSA-OAEP or ECDH envelopes. Include your own recipient certificate
if you need access later. Each recipient opens the output with their corresponding
private identity; the public certificate alone cannot unlock it. Reader permissions
have the same advisory semantics as password protection.

## Credentials and output scope

Security settings apply to the Export dialog's PDF download and direct PDF save.
Projects, drafts, PNGs, print and Split outputs are unprotected. Certificate files,
keys and passwords stay in transient dialog/worker state and are excluded from
projects, drafts and local storage. Closing the dialog clears settings and cancels
pending secured export, including preparation before its worker starts.

Encrypted sources retain immutable original bytes and an unprotected working
copy in memory. Editing projects contain both and require confirmation before
download. Local decrypted drafts are disabled until explicitly enabled in
Document details; revoking consent fences queued writes. Deleting a document in
Library removes its existing local copy while retaining open documents in memory.
Re-protection is an explicit PDF export choice.

Each credential-bearing import or export owns a worker that terminates after
success, failure or cancellation.
Certificate byte buffers are cleared where possible; JavaScript heap zeroization
is not guaranteed. Source PDF bytes remain intact.

Application assets load from the same origin. The shared
[`security-headers.json`](../frontend/security-headers.json) configures CSP,
anti-framing, nosniff, referrer, HTTPS and device-permission restrictions in both
production hosting and production-bundle tests. `connect-src 'self'` bounds
network connections; runtime privacy is also verified through request inspection.
The application has no document upload or credential submission endpoint.

### Limitations

Certificate trust remains the reader's responsibility. Self-signed fixtures
verify cryptographic bytes but do not establish a trusted signer. PDFree uses
the device clock and performs no online timestamp, revocation or missing-chain
requests. It makes no advanced PAdES or long-term validation claim.

Signing rejects existing signatures and seed/lock requirements it cannot safely
honor. Multiple incremental signing revisions are outside the export pipeline.
Reader permissions are advisory. Visual covers/highlights are not redaction and
leave underlying content accessible. Encryption protects the secured output,
not the source project, local drafts or other export formats. Custom DRM handlers,
hardware-token identities and uncommon CMS algorithms outside the supported
envelopes are rejected; see [compatibility](compatibility.md).

Independent verification and manual reader checks are documented in
[development](development.md)
and [the backlog](backlog.md). Rationale lives in
[ADR 0005](adr/0005-secured-export-pipeline.md) and
[ADR 0007](adr/0007-encrypted-document-lifecycle.md).
