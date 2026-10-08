# PDF compatibility and limits

## Supported documents

PDFree edits scanned/static pages and AcroForms containing text, multiline text,
checkboxes, radio groups, dropdowns and lists. Mixed page sizes, cropped pages,
quarter-turn page rotation and repeated field widgets are supported. Empty
signature fields can be reused for signing when their requirements are supported.
Passive pushbuttons retain their appearance and are not executed in the editor.

Encrypted input supports Standard revisions 2–6 (RC4-40/128, AES-128 and AES-256),
empty/opening/owner passwords and Adobe.PubSec `adbe.pkcs7.s3/s4/s5` recipient
handlers. Recipient identities use PKCS#12, with RSA PKCS#1 v1.5, RSA-OAEP or ECDH.
RSA CMS envelopes accept AES-CBC, DES/3DES, RC4 and RC2 at conventional 40/64/128
effective-bit lengths; ECDH uses the AES CMS path. Custom DRM, hardware tokens,
unrecognized encryption methods and unusual RC2 parameter encodings fail explicitly.
New protected exports use AES-256 with passwords or selected recipient certificates.

Complete exports containing every page from a single original source exactly
once preserve its catalog structures, including when pages are reordered.
Extraction, duplication, insertion and merging use the composition path. That
path rejects referenced sources with bookmarks, named destinations/attachments,
tagged accessibility structures or internal page links that it cannot safely
remap. Export the complete original document or use a compatible source.
Unused sources do not block an export.

### Limitations

XFA forms, existing certificate signatures, unsupported form
controls/widget rotations and nonstandard page units are rejected before editing.
Signing rejects seed values or field-lock requirements it cannot honor. Original
PDF text is preserved as source content; it is not directly replaced. Embedded
scripts are not executed, and calculated fields need manual review.

Bundled fonts cover Latin/Greek/Cyrillic. Missing glyphs and overflowing added
text produce errors rather than silent substitution or clipping. New fields
accept quarter-turn object angles; new radio groups require zero object rotation.
Their pages can still rotate. Visible cover shapes are not content-removing
redaction. Image-only scans have no searchable text layer supplied by PDFree.

## Resource boundaries

| Boundary                         | Value                                                      | Source                |
| -------------------------------- | ---------------------------------------------------------- | --------------------- |
| PDF/project name                 | 255 characters                                             | `editorValidation.ts` |
| Project archive                  | 256 MiB                                                    | `projectLimits.ts`    |
| Expanded project                 | 512 MiB                                                    | `projectLimits.ts`    |
| Project manifest                 | 8 MiB                                                      | `projectLimits.ts`    |
| ZIP entries                      | 2,001                                                      | `projectLimits.ts`    |
| Project source PDFs / assets     | 1,000 each                                                 | `projectSchema.ts`    |
| Project pages / objects per page | 10,000 each                                                | `projectSchema.ts`    |
| Main viewer canvas longest edge  | 4,096 pixels                                               | `rasterBudget.ts`     |
| PNG export                       | 108 dpi; 8,192 pixels per edge; 33,554,432 pixels per page | `rasterBudget.ts`     |
| PNG archive image data           | 128 MiB                                                    | `rasterBudget.ts`     |
| PKCS#12 identity                 | 2 MiB                                                      | `pdfSecurity.ts`      |
| Opening/owner password           | 127 UTF-8 bytes each                                       | `pdfSecurity.ts`      |
| Export recipient certificates    | 1–32, each up to 2 MiB                                     | `pdfSecurity.ts`      |

Core sources are under `frontend/src/core/`; raster budgets are under
`frontend/src/services/`. Save and import enforce project budgets and validate
references. Browser memory and storage may impose smaller practical limits;
these bounds do not promise every PDF below them will open on every device.
Use PDF export or select fewer pages when PNG export exceeds its allocation limit.

## Verified environments

Automated browser checks cover Chromium, Firefox and Linux WebKit. Linux WebKit
does not establish real macOS/iOS Safari compatibility. Reader checks use
independent PDF.js, OpenSSL, qpdf, Poppler and PDFBox, including Poppler 24.02 generated
signature compatibility. Certificate trust and subsequent certification-policy
enforcement depend on the consuming reader.

See [development](development.md) for repeatable checks and
[the manual verification backlog](backlog.md#manual-verification)
for Apple Safari, Acrobat, printing, direct saving and update checks.
