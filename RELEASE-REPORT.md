# PDFree release verification

2026-10-08; Linux and deployed-hostname verification with synthetic documents.
No user documents were uploaded. Real macOS/iOS Safari remains unverified.

The application fills native fields and static/scanned forms, places visible
signatures and initials, signs/certifies with local certificates, exports AES-256
password protection and reader permissions, authors fillable fields, annotates, organizes pages,
merges/inserts/extracts/splits, and exports PDF, PNG ZIP, and editable projects.
The production bundle contains its own fonts, PDF workers, character maps, image
codecs, security worker and service worker. Installation caches about 9.8 MiB of assets.

## Evidence

- Strict TypeScript and shared Ahara ESLint pass with zero warnings.
- `make ci` and the shared CI-style unit coverage run pass. Core unit coverage
  measures 90.38% statements, 92.16% lines and 85.25% branches; browser checks add behavioral
  evidence separately and are not included in those coverage percentages.
- 350 unit tests exercise actual saved PDFs, field/widget copying, identical names
  across merged sources, flattening, authored fields, project validation,
  coordinate/history/resize/range contracts, unsupported units, XFA and signature
  rejection, signature/certificate/password validation, worker cancellation and
  independently verified secured exports, and catalog-preservation boundaries. New regressions cover radio
  appearance identity, blank geometry, discarded source references, legal negative
  rotations, choice clearing, immutable object updates, ranges/history, project
  save/open constraints, invalid editor properties and worker failure/retry paths.
- 40 browser interaction/independent PDF.js tests pass in Chromium, Firefox,
  and WebKit. They cover import, native values, keyboard undo/delete, draft
  recovery, typed/image signatures, real worker export, Greek/accented text,
  split membership/rotation, PNG rendering and image-page import. Expanded checks
  cover checkbox extraction order, native text copying, stale image/clipboard
  state, rotated widget bounds and overlay-independent background rendering.
- Production checks pass in all three engines: the proposed CSP, desktop and
  390×844 touch layout, drawn signatures, individual split PDF and ZIP downloads,
  touch page reordering, portable projects, offline PDF export before and after reload, draft recovery,
  and visible storage-quota failure while PDF download remains available. An
  actual two-tab checks verify separate recovery slots, global-clear fencing,
  concurrent signature additions and overlapping addition/removal.
  Chromium also runs the large-scan import, extraction and full split workload;
  that single workload is explicitly skipped in Firefox and Linux WebKit.
- Nine production checks pass in Chromium; eight pass in Firefox and Linux WebKit,
  with the large-scan case skipped. A deliberately blocked main thread confirms
  that the split responsiveness probe detects a 700 ms stall in every engine.
- Axe WCAG 2 A/AA and 2.1 A/AA checks report zero violations in the populated
  desktop editor. This automated check does not establish complete accessibility
  or PDF document accessibility.
- The production privacy check observes only local-origin GET/blob requests;
  documents, field values, signatures and signing credentials have no upload or analytics path.

Chromium/Firefox run on the host. WebKit runs in the official
`mcr.microsoft.com/playwright:v1.63.0-noble` container because this host lacks its
GTK/GStreamer dependencies. WebKit offline testing disconnects the temporary
origin and verifies an uncached request fails: Playwright's offline switch
[rejects service-worker responses in WebKit](https://github.com/microsoft/playwright/issues/42775).
Chromium and Firefox use the browser's offline switch. Temporary servers and
containers are stopped after each suite.

## Measured scan workload

Chromium loaded a 64-page synthetic RGB scan PDF of about 92.2 MB. A recorded
run imported it in 976 ms, extracted an edited page in 372 ms, produced a
1,447,235-byte PDF, and mounted six canvases. These are observations on this
machine, not limits or performance promises. Thumbnails use a bounded visible
window; main-page canvases cap their longest edge at 4,096 pixels. Writers still
hold source/output bytes in memory. Portable projects accept up to 256 MiB
compressed and 512 MiB expanded; browser memory/storage can impose lower limits.
The same workload split all 64 pages into a 92,506,974-byte ZIP in 2,843 ms
including download and ZIP inspection. The actual worker request/response
interval lasted 1,946 ms; a 50 ms browser timer advanced 37 times with a maximum
gap of 97 ms. The probe starts before `postMessage` cloning and stops on the
matching response; setup, download and Node ZIP inspection do not contribute
ticks. The test requires at least two ticks and gaps below 500 ms. The earlier
47-tick observation included time outside the operation and is withdrawn as
responsiveness evidence. The worker receives
one batch, parses each source once for composed outputs, and creates the ZIP;
saved-output unit checks and independent PDF.js browser checks verify membership
and field values. PNG export rejects excessive edge/area allocations before
creating a raster and releases canvases on failure.
An independent PDF.js reader verifies that the extraction and first split PDF
contain the added text and that the last split PDF does not.

Generated evidence is local in `frontend/test-results/`: engine screenshots,
accessibility JSON and `large-scan.json`. CI repeats browser checks in a matrix;
the shared coverage job runs unit tests without requiring installed browsers.

## Adversarial review repairs

New regressions reproduced the six reported categories before their repairs:

- Choice fields now keep export values distinct from labels, preserve editability
  and selection flags, and render labels in flattened appearances. Multi-select
  values and indices use matching option order.
- Editing geometry uses the visible intersection of CropBox and MediaBox, with
  MediaBox fallback for an empty intersection. Original PDF boxes remain intact.
- Authored fields accept supported quarter-turn angles; radio groups accept zero
  object rotation. Inspector validation, project validation and PDF writing apply
  the same constraint, with stable accessible labels after validation errors.
- Signature additions/removals use atomic IndexedDB updates, preserving concurrent
  changes within one tab and across two production browser tabs.
- Import, inspector and project save/open share a 255-character filename boundary.
  Tests cover both the actual long-name download flow and the maximum boundary.
- Rectangle borders and both arrowheads retain the selected opacity in independent
  PDF.js raster output.

Legacy drafts and projects rederive source geometry and paired choice descriptors
from original bytes while preserving edits and identities. Signature tests check
transparent pixels, visible strokes, exact asset recovery, PDF rendering, page
PNG export and image-page reimport. Separate ink and typed-signature pixel regions
are compared against exports with each object omitted, so unrelated page text
cannot satisfy those assertions. No assertion treats the old incorrect crop
dimensions as expected behavior.

## Compatibility and remaining manual checks

Password-encrypted inputs, XFA, existing certificate signatures and nonstandard page
units are rejected. Supported text fonts cover Latin/Greek/Cyrillic; unsupported
glyphs and overflowing added text produce errors. Radio groups require zero
object rotation, and other authored fields require quarter-turn object angles;
page rotation remains supported. Original PDF text is
preserved, not edited. Empty signature fields are accepted and reused, except
when their seed values or field-lock requirements cannot safely be honored.
Visible marks and flattening alone do not provide certificate signing or tamper
protection; Export's certificate controls provide that separate operation.
They do not remove covered content or provide redaction.

Complete single-source exports preserve catalog structures. Extraction, duplicate
pages or merging rejects sources with bookmarks, named destinations/attachments,
tagged accessibility structures or internal links whose references cannot safely
be remapped. Embedded scripts are not executed. OCR, encrypted-input editing,
compression and secure redaction remain unimplemented.

Real macOS/iOS Safari, Acrobat, physical printing, direct file-picker saving and
an actual two-version service-worker update remain manual checks. Updates prompt
before reload, remind users to save editable projects, and do not auto-activate
a waiting version. Browser drafts can be evicted and are not durable backups.
Hosting validation and publication state are recorded in `PDFREE-PLAN.md`.

## Digital signing and protection verification

OpenSSL independently verifies detached CMS for RSA and ECDSA signatures,
approval signatures and each of the three DocMDP policies. Altering covered
bytes fails verification. Poppler validates signed PDFs, including the combined
AES-256/locked-certification output. qpdf confirms encryption revision 6, AESv3,
opening and owner passwords, rejection of a wrong password, all permission bits,
owner-only viewing, accessible extraction and non-ASCII passwords. Eleven native
verifier tests pass. Poppler also extracts the filled appearance from a flattened
and signed form. The existing unsigned signature-field name and original source
bytes survive signing; already-signed inputs and a second signing attempt fail.

Browser tests exercise actual RSA/ECDSA workers, password failures and retry,
PDF.js decryption, filled values, permissions and retained original page text.
Independent rendering checks retain scanned pixels and page rotation after a
combined encrypted/certified export.
The real export dialog is tested for combined signing/encryption, confirmation
errors, bad certificate credentials, exclusion of credentials from projects and
drafts, clearing settings on close and cancellation before the security worker
starts. Unit tests verify termination after success, failure, transfer errors and
cancellation. Public synthetic PKCS#12 fixtures are excluded from production
assets. Test-only literal fixture passwords have a scoped ESLint exception;
production retains the hardcoded-password rule.

Production checks load the built security worker under the proposed CSP. Node's
OpenSSL-backed crypto independently checks the downloaded CMS signature and
content digest and rejects altered bytes. PDF.js decrypts the download, verifies
filled values, original page text and permission flags, and rejects a wrong
opening password. Axe checks the populated 390×844 security dialog, and network
inspection observes only same-origin GET/blob requests with no credential or
document upload. CI installs OpenSSL, qpdf and Poppler for the native checks and
runs production security exports in every browser engine.

Certificate trust remains the reader's responsibility; synthetic self-signed
identities verify their bytes but are not trusted identities. Certificate-chain
downloads, revocation lookups and online timestamps are disabled. No PAdES
advanced-level or long-term validation claim is made. Certification records
allowed changes; readers decide whether subsequent revisions comply. Owner
permissions can be ignored by software and are distinct from opening-password
confidentiality. Credentials stay outside the editor persistence model; a worker
is terminated after each secured export. JavaScript heap zeroization is not
guaranteed. Editing projects, drafts, images, printing and Split outputs are
unprotected. Acrobat policy enforcement, trusted CA identities, real Apple
Safari and enhanced direct saving remain manual checks.

During verification, concurrent test startup collided while copying generated
PDF assets; the suites were rerun sequentially. Firefox/WebKit's first dialog
exports exceeded the helper's default one-second download poll while the task
was still running. The helper now allows ten seconds and still requires one
actual download followed by signature/decryption/content assertions. Export
lifecycle review found that cancellation must start before font/PDF preparation;
closing the dialog now prevents a security worker or download from starting even
when preparation completes later. Test setup failures and the lifecycle repair
are recorded separately from the independent cryptographic checks.

## Deployment verification and reader diagnostics

Ahara registration deployed before PDFree publication. Infrastructure run
[37720545759](https://github.com/chris-arsenault/ahara-infra/actions/runs/37720545759)
and initial PDFree run
[37721396791](https://github.com/chris-arsenault/pdfree/actions/runs/37721396791)
passed. The latter includes all three browser engines, native security verifiers,
standard unit coverage, Terraform deployment and platform reporting.

At `https://pdf.ahara.io`, a temporary Chromium check opened a synthetic PDF,
filled its field, downloaded the three-page result and downloaded a combined
locked certification/AES-256 export. The original form value survived export;
the browser recorded no page errors and no document/credential upload requests.
qpdf verified AESv3 encryption and Poppler validated the complete signature.
Public DNS resolved the hostname while this workspace's configured resolver still
returned ENOTFOUND. The browser check used the public answer for that hostname;
no machine DNS or network settings changed. HTTPS also confirmed CSP, immutable
worker caching, no-cache service-worker delivery and JavaScript worker MIME type.

The first live signature produced Poppler widget syntax diagnostics despite
valid cryptographic bytes. Native tests had checked signature validity without
rejecting stderr diagnostics. They now reject syntax errors for RSA/ECDSA,
every certification policy, encrypted signing, reused fields and flattened forms.
The stricter gate also caught pdf-lib leaving annotation references to deleted
widgets after flattening. Both defects are repaired: zero-size signature widgets
have page/parent relationships, existing widget geometry stays intact, and
flattening removes only the known widget references while preserving comments.
The new widget-linkage/flattened-annotation assertions and tightened native checks
failed on the original code and pass after repair. Five added unit cases also
cover preserved geometry and comments. Local CI, eleven native verifiers and nine Chromium
production checks pass; the repaired release follows the standard deployment.

The first widget repair's CI run (`37722812856`) exposed an older-reader
compatibility issue: Ubuntu's Poppler 24.02 reported separate field/widget
signatures as unsigned while OpenSSL and the newer local Poppler validated them.
The exact Ubuntu package reproduced the failure in a temporary container.
Generated and widgetless signature fields now combine field and widget entries;
zero-size geometry and page relationships remain, and existing widgets retain
their original structure. All eight signed outputs validate without diagnostics
in Poppler 24.02, and the current local reader's eleven security checks pass.
The temporary container was removed. CI retains its original verifier package
and strict signature/parser assertions.
The final local checks pass 350 unit tests, 40 browser tests, eleven native
security tests and nine production checks. The workspace DNS resolver now also
resolves `pdf.ahara.io` normally.
