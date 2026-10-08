# PDFree

Fill, sign, annotate and organize PDFs entirely in your browser.
Ahara address: **https://pdf.ahara.io**.
Documents, entered values, signatures and drafts stay on your device. There is
no application backend, account requirement, remote PDF processing or analytics.

## Use the editor

Open a PDF through the file picker or drag/drop. Click native form fields to fill
them. For scanned/static forms, choose Text, a checkmark, a date, or a signature
and click the page. Signatures and initials can be drawn, typed or imported as
PNG/JPG; remembering them on this device is optional.

Drag, resize, rotate, duplicate and align added objects. Shift-click selects
multiple objects; arrow keys nudge, Delete removes, Ctrl/⌘ Z undoes, and Ctrl/⌘ C/V
copies/pastes. Other tools include images/stamps, ink, rectangles, lines/arrows,
area highlights, PDF text-selection highlights and genuine fillable fields.
The inspector configures new field names, options, required flags and tab order.

Thumbnails navigate and reorder pages. Select pages for rotation, duplication,
deletion or extraction. Merge PDFs; insert PDFs, images or blank pages. Split
after page numbers, every N pages, into individual pages, or by output ranges
such as `1-3; 5-end`. Preview physical page membership, review omitted pages,
then download an individual PDF or all outputs as ZIP. Search uses existing PDF
text plus entered text; scans require manual navigation until OCR is added.

Export the whole PDF or selected pages, retaining native fields or flattening
their appearances. Download an **editing project (`.pdfree`)** to preserve
movable objects, assets and original sources for later editing. PDF exports
contain completed content; added marks do not reopen as movable PDFree objects.
PNG page export, print preparation and optional direct file saving are available
in Export. Universal download works without enhanced browser file APIs.

Drafts autosave locally in separate slots for each tab and offer recovery on reload.
Storage errors are visible;
download an editing project for durable backup because browsers can evict data.
Clear local data removes stored drafts and remembered signatures after confirmation.
Other open tabs retain their documents in memory and pause autosaving until the
next edit. Queued writes cannot restore drafts deleted by that clear operation.
After “Ready to work offline,” editing and downloads work without an origin
connection. Version updates prompt before reloading; save your project first.

## Sign, certify and protect an export

In Export, choose **Digitally sign** or one of the **Certify** policies. Supply
your local PKCS#12 (`.p12`/`.pfx`) certificate/private key and its password.
RSA and ECDSA identities are supported; the file limit is 2 MiB. PDFree checks
certificate dates, signing key usage and the certificate/private-key match.
Signing reason and location are optional. An existing empty signature field is
reused; otherwise PDFree creates an invisible signature field. Add a visible
signature in the editor before exporting if you want both.

Certification records the PDF's DocMDP policy: no later changes (sign and lock),
form filling and additional signatures, or those changes plus comments. Readers
that validate PDF signatures detect changes and evaluate whether the policy
permits them. Certification does not prevent someone from rewriting the file.
Identity trust depends on the reader and certificate chain. Self-signed test
certificates show an untrusted identity. PDFree signs with the device's clock;
it does not request online timestamps, revocation checks or missing certificates.
No PAdES advanced-level or long-term validation claim is made.

Enable **Protect PDF with passwords and permissions** for AES-256 encryption.
An optional opening password controls viewing; a required, distinct owner
password grants unrestricted access. Leaving the opening password empty allows
anyone to view the PDF. Set printing quality, copying, editing, comments, form
filling and page-assembly permissions. Accessible extraction stays enabled.
Reader permissions can be ignored by software; use an opening password when
confidentiality matters. Passwords accept up to 127 UTF-8 bytes without silent
truncation. Signing and encryption can be combined in one export.

These settings apply to the PDF download and direct PDF save in this dialog.
Editing projects, drafts, PNG images, printed copies and Split downloads are
unprotected. Save your original editing project to continue editing later;
PDFree rejects encrypted or already-signed PDFs as editing inputs. Certificate
files and passwords are transient, disappear when the dialog closes, and are
excluded from drafts, projects and local storage. All processing stays in the
browser; closing the dialog cancels a pending secured export.

## Development and validation

Use Node 24 (pinned in `.node-version`) and pnpm 10.29.3. Install dependencies
with `pnpm install --frozen-lockfile` in `frontend/`. `make ci` runs shared Ahara
ESLint, strict TypeScript, Vitest, Prettier and Terraform formatting. `make build`
produces `frontend/dist`; `make dev` starts Vite when an interactive server is
wanted. All PDF/font/codec assets are bundled locally.

Install the test browser with `pnpm exec playwright install chromium` in
`frontend/`. `make release-check` builds and tests the actual production bundle
with its proposed security headers. For another engine, set
`PDFREE_BROWSER=firefox` or `PDFREE_BROWSER=webkit` and install that engine first.
CI's separate browser matrix installs engines and runs browser/release checks;
the reusable Ahara coverage job runs unit tests without a browser dependency.
`make release-check` also requires OpenSSL, qpdf and Poppler's `pdfsig`/`pdftotext`.
`pnpm test:security` runs their independent signature/encryption checks. On this
Nix host, run `nix shell nixpkgs#openssl nixpkgs#qpdf nixpkgs#poppler-utils -c pnpm test:security`
from `frontend/`. Run build/test commands sequentially because configuration
startup generates shared PDF assets. CI installs these verifiers in its Chromium
job; production signing checks run in every browser job.

The viewer uses PDF.js, and a worker-hosted pdf-lib writer preserves source page
content and native form relationships. One versioned model feeds rendering,
history, page operations, projects, draft recovery and exports. Local tests use
real saved bytes and independent PDF.js reading/rendering. See
[RELEASE-REPORT.md](RELEASE-REPORT.md) for evidence and manual verification limits.
The expanded suite covers export correctness, editor state transitions, project
integrity and limits, invalid inputs, raster allocations, and worker failures.
Splitting sends one worker batch and reuses parsed sources between outputs.
Security exports use a separate worker for each operation with pinned LibPDF,
PKIjs and Web Crypto. It encrypts before signing the final bytes and terminates
after success, failure or cancellation. Original document bytes remain intact.

## Compatibility

Text/multiline, checkbox, radio, dropdown and list AcroForms, scanned pages,
mixed page sizes and cropped/rotated pages are supported. Password-encrypted
PDFs, XFA forms, existing certificate signatures and nonstandard page units are
rejected before editing. Empty signature fields are supported; signing rejects
fields with seed values or field-lock requirements it cannot safely honor.
Bundled fonts support Latin/Greek/Cyrillic; missing
glyphs and overflowing added text produce errors. Native choice controls display
labels while retaining the PDF's export values and selection flags. Editing uses
the visible intersection of page crop and media boxes. New fields support
quarter-turn object rotation; new radio groups require zero object rotation.
Their page can still rotate. PDF and project names accept up to 255 characters.
Project saves and imports both enforce a 256 MiB archive limit, 512 MiB expanded
limit, and 8 MiB manifest limit. Save rejects missing page/image references.
PNG export uses 108 dpi, caps each edge at 8,192 pixels, and limits a page to
33,554,432 pixels;
PNG archives accept up to 128 MiB of image data. Export large pages as PDFs or
select fewer pages when an image export exceeds those limits.

Complete single-source exports preserve catalog information. Extraction, page
duplication or merging rejects sources containing bookmarks, named
destinations/attachments, tagged accessibility structures or internal page links
that this writer cannot safely remap. These restrictions avoid silent loss.
Embedded PDF scripts are not executed; calculated fields need manual review.

Visible signatures and flattening alone provide no certificate signing or
tamper protection; use Export's certificate controls for digital signing.
Cover rectangles/highlights do not remove underlying content and are not
redaction. OCR, encrypted-PDF editing, compression, replacing original
page text and content-removing redaction are future extensions. Real Apple
Safari, Acrobat, physical printing, enhanced file saving and a two-version
update remain manual checks; Linux WebKit is tested.

## Ahara deployment

`platform.yml` declares TypeScript and Terraform. The project calls Ahara's
shared website module for private S3/OAC, CloudFront, ACM and DNS at
`pdf.ahara.io`, with the same CSP/security-header configuration used by production
tests. Assets use S3-managed encryption. The website provisions no WAF, new KMS
key, application service or database. `.github/workflows/ci.yml` calls Ahara's
standard reusable CI with deployment enabled on `main`; the supplemental browser
matrix checks Chromium, Firefox and WebKit.

Deployer registration is maintained in
`../ahara-infra/infrastructure/terraform/control/project-pdfree.tf` using the
existing managed-project module. It provisions the deployment role and repository
secrets `STATE_BUCKET`, `OIDC_ROLE` and `PREFIX`. Deploy that registration before
the first PDFree push. The website module is pinned to published revision
`6804de4fa112375eaa1c459cb7347871ce168c71`, which includes MIME entries for PDF.js
workers, character maps, binary fonts and ICC profiles with regression tests.

The website configuration validates and its mock-provider plan passes against
the real production build. Run `terraform -chdir=infrastructure/terraform test`
after building to validate actual asset MIME coverage and S3-managed encryption.
The GitHub workflow assumes the registered role through OIDC
and uses the platform's normal Terraform apply and CloudFront invalidation.

For an authorized manual deployment, `scripts/deploy.sh` is the parameterless
build/init/plan/apply entry point. In this environment invoke it through
`with-cred --`; other installations use ordinary AWS environment/profile
credentials. Shared state defaults to `tfstate-559098897826`, key
`projects/pdfree.tfstate`, with encryption and locking. See
[PDFREE-PLAN.md](PDFREE-PLAN.md) for the implementation and deployment record.

Licensed under [MIT](LICENSE). Bundled Noto Sans/Caveat licenses and upstream
PDF.js and cryptographic dependency licenses are included in the application assets.
