# PDF compatibility and limits

## Supported documents

PDFree edits scanned/static pages and AcroForms containing text, multiline text,
checkboxes, radio groups, dropdowns and lists. Mixed page sizes, cropped pages,
quarter-turn page rotation and repeated field widgets are supported. Empty
signature fields can be reused for signing when their requirements are supported.
Passive pushbuttons retain their appearance and are not executed in the editor.

Native Text notes and replies support reading, authoring, editing and deletion.
Existing markup comment text can be read and replied to; locked notes, annotation
states/groups and other markup remain read only. Authors, dates and Unicode
comment text are preserved. Source appearances and unsupported annotations remain
intact. Comment anchors support cropped and quarter-turn-rotated pages. New notes
use page locations; text-selection comments and rich formatting are not supported.

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
path remaps supported outline hierarchies and named/explicit internal destinations.
It rejects referenced sources with unsupported navigation, attachments,
tagged accessibility structures or comment relationships across pages that it cannot safely
remap. Export the complete original document or use a compatible source.
Styled or structure-linked outlines retain their original catalog and are not
editable in PDFree. Supported editing preserves hierarchy and destination details.
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
redaction. English OCR adds searchable/selectable invisible text to scans; recognition
accuracy and reading order require review. Pages already containing PDF text are
skipped. OCR does not provide handwriting guarantees, paragraph editing or PDF/UA.

Scan image processing supports a single upright direct image with optional OCR
text, 8-bit DeviceRGB/DeviceGray, JPEG or plain/Flate samples without masks or
predictors. Cleanup rejects mixed vector layouts, nested forms, rotated image
placements and unsafe annotation geometry; such pages can still be trimmed.
Automatic analysis measures tilt from text lines, so pages that are mostly
photographs, blank or without line structure keep their angle and are not
whitened. Detected edge trimming covers dark bands that touch the page edge and
span at most 20% of it. Crop hides content and is not redaction.
Deskew supports whole-page destinations, numeric XYZ positions and numeric FitR
regions; other positioned destinations must first become whole-page bookmarks.
Compression retains unsupported image resources and reports targets it cannot
reach; it never rasterizes entire pages to reduce size.

N-up provides 2/4/6 pages per sheet on Letter/A4/Legal paper. This explicit print
derivative flattens fields and bakes supported annotation appearances, retaining
vector/text page content. Interactive fields, comment threads and navigation are
absent from the derivative. An annotation without a supported visible appearance
blocks N-up; links and popup windows do not produce print marks.

## Resource boundaries

| Boundary                         | Value                                                      | Source                                      |
| -------------------------------- | ---------------------------------------------------------- | ------------------------------------------- |
| PDF/project name                 | 255 characters                                             | `editorValidation.ts`                       |
| Project archive                  | 256 MiB                                                    | `projectLimits.ts`                          |
| Expanded project                 | 512 MiB                                                    | `projectLimits.ts`                          |
| Project manifest                 | 8 MiB                                                      | `projectLimits.ts`                          |
| ZIP entries                      | 2,001                                                      | `projectLimits.ts`                          |
| Project source PDFs / assets     | 1,000 each                                                 | `projectSchema.ts`                          |
| Project pages / objects per page | 10,000 each                                                | `projectSchema.ts`                          |
| Comments per page / comment text | 10,000 / 100,000 characters                                | `projectSchema.ts`, `importComments.ts`     |
| Main viewer canvas longest edge  | 4,096 pixels                                               | `rasterBudget.ts`                           |
| PNG export                       | 108 dpi; 8,192 pixels per edge; 33,554,432 pixels per page | `rasterBudget.ts`                           |
| PNG archive image data           | 128 MiB                                                    | `rasterBudget.ts`                           |
| PKCS#12 identity                 | 2 MiB                                                      | `pdfSecurity.ts`                            |
| Opening/owner password           | 127 UTF-8 bytes each                                       | `pdfSecurity.ts`                            |
| Export recipient certificates    | 1–32, each up to 2 MiB                                     | `pdfSecurity.ts`                            |
| OCR raster                       | 4,096 pixels per edge; 12 Mi pixels; up to 216 dpi         | `services/ocr.ts`                           |
| Processed scan image             | 8,192 pixels per edge; 32 Mi pixels                        | `core/pdfImages.ts`                         |
| Utility batch output             | 128 MiB, sequential file processing                        | `services/batchUtilities.ts`                |
| Bookmark hierarchy               | 50 levels                                                  | `core/utilityModel.ts`, `core/bookmarks.ts` |

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
