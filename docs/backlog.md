# Backlog

These are future candidates and verification work, not commitments or current
feature claims. Implementation requires scope and engine compatibility review.

The seven selected M/L utilities have now been implemented locally: OCR,
compression, outline editing, scan cleanup, repeated operations, N-up and document
tabs. Their implemented limits are in [compatibility](compatibility.md), and their
controls are in [the user guide](user-guide.md). The research and estimates below
remain the original scope rationale. Comparison stays deferred.

## Research and sizing

Reviewed on 2026-10-08 against PDFree's current model, import/export, navigation,
project format, raster budgets and print flow. Market evidence is qualitative:
recurring user requests establish useful workflows, not market share or a measured
popularity ranking. Technical approaches below are proposals based on source
inspection and primary documentation. Selected implementations now have focused
processing and persistence checks; the estimates remain provisional historical sizing.

LOE means engineering effort for the stated scope, including UI, integration,
durable state where needed, documentation and relevant browser/native-reader
checks. These rough bands assume one experienced engineer familiar with this repo;
they are not delivery dates. Confidence reflects the evidence available now.

| Size | Approximate effort | Typical boundary                                                    |
| ---- | ------------------ | ------------------------------------------------------------------- |
| XS   | Under 2 days       | One existing path with little compatibility work                    |
| S    | 2–5 days           | Focused feature using established components                        |
| M    | 1–2 weeks          | Several existing subsystems and meaningful edge cases               |
| L    | 3–6 weeks          | New data shape or processing pipeline with compatibility work       |
| XL   | 6–12 weeks         | New engine capability or broad preservation work                    |
| XXL  | More than 12 weeks | Engine/layout research; prototype needed before a reliable estimate |

All designs keep document processing local, source bytes immutable and credential
handling transient. Editing features use the shared model/history and migrate
projects/drafts. Export transformations run before signing/encryption. Unsupported
structures fail explicitly; whole-page rasterization is not a preservation fallback.
New tools use existing locations, icon tooltips and small dialogs or panels.

| Candidate                                   | LOE | Confidence | Priority / dependency                                          |
| ------------------------------------------- | --- | ---------- | -------------------------------------------------------------- |
| Searchable scans / OCR                      | L   | Medium     | Recommended next substantial feature                           |
| Compression with quality preview            | L   | Medium     | Follow OCR; shares image handling with scan cleanup            |
| Bookmark and outline editing                | L   | Medium     | Includes the bookmark/destination portion of catalog remapping |
| True redaction and explicit sanitization    | XL  | Low        | Requires a verified content-removal engine                     |
| Original-text correction and find/replace   | XXL | Low        | Requires content rewriting and font handling                   |
| Compare two PDFs                            | L   | Medium     | Independent read-only workflow                                 |
| Repeated operations across pages/files      | M   | Medium     | Orchestration only; depends on each underlying operation       |
| Scan cleanup                                | L   | Low        | Shares image decoding and coordinate work with OCR/compression |
| Multiple pages per printed sheet            | M   | Medium     | Explicit printable derivative                                  |
| Switch between open documents               | M   | Medium     | Per-document session and lifecycle isolation                   |
| Word import/export                          | XXL | Low        | Deferred; browser layout/conversion engine unresolved          |
| General catalog remapping                   | XL  | Low        | Existing backlog; overlaps bookmark work                       |
| Incremental multiple signatures             | XL  | Low        | Existing backlog; signed-document path required                |
| Trusted timestamps and long-term validation | XL  | Low        | Existing backlog; network/trust boundary unresolved            |

Do not add these estimates mechanically: shared image processing, catalog
remapping and writer capabilities overlap. Batch sizing excludes implementing OCR,
compression or redaction itself. Recommended sequence remains OCR, compression,
then bookmark editing; redaction needs a separate engine feasibility decision.

## Document capabilities

### Searchable scans / OCR — L

**Scope/design:** Select pages and a supported language, run OCR with progress and
Cancel, then search/select text and download a searchable PDF. Store word text,
bounding boxes, confidence and recognition provenance by stable page ID; expose
results to search/text selection and persist them through projects, drafts and page
operations. Do not add paragraph editing or promise handwriting recognition.

**Approach/uncertainty:** Render bounded page images with PDF.js, recognize them in
a dedicated Tesseract.js worker, and add an invisible Unicode text layer without
replacing original page content. Bundle/cache engine and supported language assets
on the app origin. Tesseract.js does not accept PDF input directly. Recognition
coordinates, reading order, fonts, existing text layers and mobile memory drive the
effort. Initial language coverage follows verified bundled fonts; broader scripts
need additional font/shaping work. Check exported text extraction and selection
alignment on cropped/rotated scans; searchable output alone does not imply PDF/UA.

Evidence: [searchable-output request](https://community.pdfgear.com/d/5-ocr-and-making-files-searchable).
Technical basis: [Tesseract.js scope and worker lifecycle](https://github.com/naptha/tesseract.js),
[PDF.js page rendering/text APIs](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html).

### Compression with quality preview — L

**Scope/design:** An Export option with quality presets, optional target size and
a before/after preview. Display actual size and explain when a target cannot be
met acceptably. Keep the smaller successful output; never silently discard text,
forms, comments or vector content to reach a size target.

**Approach/uncertainty:** Inventory image resources and effective resolution, then
downsample/re-encode supported images on an export copy. Process shared resources
once; retain unsupported encodings and report limited savings. Browser canvas can
encode JPEG, but a PDF image decoder/resource rewriter is still needed. Masks,
colorspaces, nested Form XObjects and highly optimized inputs dominate uncertainty.
Compare small print/signatures and verify text, fields and comments independently.
OCR is complementary, not a prerequisite or a guarantee of smaller files.

Evidence: [strict upload-size workflow](https://www.reddit.com/r/pdf/comments/1r0yjm2/how_do_you_reliably_compress_pdfs_to_strict_size/).
Technical basis: [browser image encoding](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob).

### Bookmark and outline editing — L

**Scope/design:** Extend the existing outline control with add, rename, delete,
nest and drag-reorder. Bookmarks target a stable page ID and optional page location;
edits participate in undo and persistence. Import hierarchy and destination details
rather than using the current flattened navigation list as the editing model.

**Approach/uncertainty:** Write native outline dictionaries and resolve supported
named/explicit destinations. Define visible policies for removed targets and
duplicated sections; remap targets during merge/extract/reorder. Include internal
links that use the supported destination map. Preserve unsupported catalog
structures or continue rejecting affected composition. This size includes the
bookmark/destination subset of general catalog remapping, not tagged-PDF repair,
attachment merging or automatic heading detection. Verify links in saved PDFs.

Evidence: [persistent research-reader requests](https://forums.zotero.org/discussion/95515/feature-request-create-bookmarks-in-the-integrated-pdf-viewer),
[visual bookmark-editing request](https://github.com/Stirling-Tools/Stirling-PDF/issues/8086).
Repo basis: `services/navigation.ts`, `core/importPdf.ts`, `core/exportPdf.ts`.

### True redaction and explicit sanitization — XL

**Scope/design:** Mark regions or text matches, review them and export a redacted
PDF. Keep editable redaction intentions in the model; remove intersecting text,
image pixels, relevant vector content, OCR text and affected annotation/field data
from the output. Offer explicit removal choices for metadata, attachments and
embedded actions. Automated personal-information detection is outside this size.

**Approach/uncertainty:** Evaluate a browser content-removal engine in a worker;
MuPDF documents text/image/vector redaction, but it is only a candidate. Its
AGPL/commercial licensing and compatibility with PDFree's MIT distribution need
resolution before adoption. Apply after authored content and write a fresh output
without retained obsolete objects or earlier revisions. Check raw object contents,
extraction and independent rendering, including nested/shared resources and layers.
Keep untouched searchable/vector content. A cover rectangle does not qualify.

Projects/drafts retain original source bytes and must not be presented as sanitized
sharing artifacts. The redacted PDF is the sharing output; opening it as a new
document creates a separate editing source. Writer support and security verification
make this estimate low confidence even with a library API available.

Evidence: [direct redaction request](https://community.pdfgear.com/d/11-flatten-redact-pdf-feature).
Technical basis: [MuPDF redaction controls](https://mupdf.readthedocs.io/en/latest/reference/javascript/types/PDFPage.html),
[save APIs](https://mupdf.readthedocs.io/en/latest/reference/javascript/types/PDFDocument.html),
[licensing](https://mupdf.readthedocs.io/en/latest/license.html).

### Original-text correction and find/replace — XXL

**Scope/design:** Select existing text, correct a short run and preview the result;
find/replace supports match review and document-wide application. Record edits
against stable source/page content identities and reapply them deterministically.
Keep layout within the original text region; do not add Word-style pagination.

**Approach/uncertainty:** Build or adopt content-stream rewriting with glyph/run
mapping, font subset coverage, spacing and nested-resource handling. pdf-lib has no
public API for editing non-field page text. PDF.js extraction helps locate text
but does not provide a writer. Reject unsupported scripts/fonts and overflowing
replacements explicitly; a white box with new text is not replacement. Verify old
text is removed and surrounding appearance stays intact. An engine prototype on
representative PDFs is needed to narrow this estimate; redaction capability alone
does not supply layout-preserving text replacement.

Evidence: [repeated find/replace requests](https://www.reddit.com/r/PDFgear/comments/1bcm7vz/will_there_be_an_option_to_find_and_replace_text/).
Technical basis: [pdf-lib limitations](https://github.com/Hopding/pdf-lib#limitations).

### Compare two PDFs — L

**Scope/design:** Open two local files in a read-only comparison view, with
synchronized scrolling, visual differences, text differences and next/previous
change navigation. Show page insertions/deletions and allow manual page pairing.
Do not introduce collaborative review, change acceptance or document rewriting.

**Approach/uncertainty:** Reuse PDF.js rendering/text extraction in bounded workers;
pair pages using text/visual signatures, compare normalized text and page pixels,
and map differences to page coordinates. Keep comparison results transient.
Inserted pages, scan noise, antialiasing, mixed page sizes and graphics-only changes
drive false positives and alignment work. Validate meaningful changes and unchanged
pages across engines. OCR can later improve text comparison on scans; visual
comparison must work without it.

Evidence: [compare request](https://community.pdfgear.com/d/14-compare-pdfs),
[visual differences missed by text comparison](https://github.com/Stirling-Tools/Stirling-PDF/issues/6089).
Technical basis: [PDF.js page APIs](https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib-PDFPageProxy.html).

### Repeated operations across pages/files — M, plus operation dependencies

**Scope/design:** Apply supported numbering, watermarks or stamps to selected/all
pages with one preview and one undo action. For multiple PDFs, choose files, apply
one operation/settings set and download separate outputs or a ZIP. Include start
number, prefix/padding and continuing/resetting numbering for Bates-style work.
Keep the UI to an operation dialog rather than a workflow designer.

**Approach/uncertainty:** Store document-level rules with stable page scope;
derive numbering from current order so page operations do not leave stale labels.
Reuse worker export and ZIP handling, process files sequentially with per-file
errors and cancellation, and keep originals unchanged. Do not persist a job queue
or signing credentials. Underlying OCR/compression/redaction engines and their
multi-file controls are separate dependencies. Check mixed page boxes, numbering
boundaries, Unicode fonts and filename collisions.

Evidence: [Bates-numbering and batch-redaction demand](https://github.com/Stirling-Tools/Stirling-PDF/discussions/467),
[repeated merge/watermark workflow](https://github.com/paperless-ngx/paperless-ngx/discussions/7559).
Repo basis: `core/exportBatch.ts`, `core/drawObjects.ts`, `core/pageOperations.ts`.

### Scan cleanup — L

**Scope/design:** A page tool for crop, fine deskew, contrast and background cleanup
with a before/after preview, reset and selected-page application. Save transform
parameters and processed scan assets through the model/history; preserve existing
OCR text, bookmarks and page relationships.

**Approach/uncertainty:** Crop using page boxes; crop hides content and is not
redaction. For scan cleanup, transform supported scan images and the corresponding
OCR geometry together. Keep image decoding shared with compression and avoid
rasterizing mixed vector/form pages. Explicitly reject unsupported scan layouts.
Shared images, masks, artwork, oblique rotations and existing annotations make
preservation harder than a canvas filter. Validate output appearance and search
alignment after crop/deskew; reject changes that cannot retain other content.

Evidence: [cleanup without losing text/bookmarks](https://www.reddit.com/r/software/comments/1on3a9a/looking_for_free_software_to_clean_background_of/).
Technical basis: [browser image encoding](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas/convertToBlob).

### Multiple pages per printed sheet — M

**Scope/design:** Offer 2/4/6 pages per sheet, paper size, orientation, ordering,
margins and a sheet preview in Print/Export. Produce an explicitly printable PDF;
the ordinary editable PDF/project remains separate. Booklet and poster printing
are outside this size.

**Approach/uncertainty:** Prepare current page content, explicitly bake visible
field/annotation appearances for the print derivative, and place pages as scaled
Form XObjects on new sheets with pdf-lib. Do not depend on browser-specific print
settings or use page screenshots. Check mixed sizes, crop/rotation, final partial
sheets and physical output. New sheet layout does not retain interactive fields,
comment threads or original navigation; expose that output contract in the dialog.

Evidence: [N-up request](https://community.pdfgear.com/d/13-n-up-pdfs).
Technical basis: [pdf-lib page embedding](https://pdf-lib.js.org/docs/api/classes/pdfdocument#embedpages).
Repo basis: `services/print.ts`, `core/exportPdf.ts`.

### Switch between open documents — M

**Scope/design:** A small document-tab strip with names, unsaved indicators and
close actions. Keep Library for saved documents. Each open document retains its
history, page position, zoom and selection without adding side-by-side workspaces.

**Approach/uncertainty:** Give each document an isolated editor session and library
identity. Mount only the active viewer; release inactive canvases and bound cached
PDF handles. Scope clipboard/assets, pending dialogs, queued autosaves and worker
responses to the owning session. Preserve the browser close/reload safeguard.
The existing global editor orchestration makes this more than a visual tab strip;
check switches during export, credential prompts, autosave and cancellation, and
close/recovery of several documents without state crossing between them.

Evidence: [tabs request](https://community.pdfgear.com/d/2-open-files-in-tabs).
Repo basis: `App.tsx`, `hooks/useEditorUi.ts`, `services/drafts.ts`, `services/viewer.ts`.

### Word import/export — XXL, deferred

**Scope/design:** Import DOCX as rendered PDF pages and export a PDF to DOCX for
editing elsewhere. Keep PDFree's editing tools unchanged; do not add Word editing.

**Approach/uncertainty:** Two separate conversions need assessment: DOCX pagination,
fonts, tables and headers on import; semantic/layout reconstruction on export,
including scans via OCR. No suitable browser-only engine has been selected or
tested. Text extraction or an HTML preview does not establish conversion fidelity.
Keep this candidate deferred as agreed; validate representative documents before
giving a narrower LOE. Its size excludes a server conversion service because that
would change PDFree's processing boundary.

Evidence: [conversion-fidelity request and developer response](https://community.pdfgear.com/d/4-whats-the-most-reliable-way-to-convert-pdf-to-docx-without-ruining-the-formatting).

### General catalog remapping — XL, existing architectural backlog

**Scope/design:** Allow safe merge/extract/duplicate of sources currently blocked
by bookmarks, named destinations/attachments, internal links, tagged structures
or cross-page comment relationships. Preserve supported structures explicitly;
do not remove all composition guards at once.

**Approach/uncertainty:** Build a source-object/page-to-output map and typed
remappers with policies for deleted and duplicated targets. Bookmarks/internal
destinations are the first subset; attachment name collisions, structure trees
and cross-page relationships require separate compatibility work. Existing
guards stay for unsupported structures. Verify live output references and reading
order with independent readers. This estimate includes bookmark remapping, so do
not count both estimates in full. Tagged accessibility preservation is the largest
uncertainty and may expand this to XXL.

Repo basis: `core/importPdf.ts`, `core/exportPdf.ts`, `core/copyForms.ts`,
`core/copyAnnotations.ts`, [preservation contracts](architecture.md#ordinary-pdf-and-split-export).

## Signing extensions

### Incremental multiple signatures — XL, low confidence

Add a dedicated signed-document path that appends an allowed approval signature
without rewriting earlier signed bytes. Retain credential isolation, validate
DocMDP/field locks, and distinguish cryptographic validity from permitted changes.
Current import rejects existing signatures and ordinary export rewrites PDFs, so
this requires more than changing a save flag. Evaluate LibPDF incremental APIs
against the installed version and our maintained patches; verify each revision
and signature independently. Signed-document editing and catalog composition
remain separate capabilities until proven safe.

Technical lead: [LibPDF incremental/signing capabilities](https://libpdf.documenso.com/).
Repo basis: `core/signedPdf.ts`, `core/importPdf.ts`, `core/securePdf.ts`.

### Trusted timestamps and long-term validation — XL, low confidence

Extend signing with timestamp tokens and embedded certificate/revocation evidence;
distinguish timestamped output from independently validated long-term signatures.
Evaluate LibPDF's documented PAdES capabilities against the installed version.
Timestamp/OCSP/CRL access introduces endpoint, CORS, trust, outage and possible
authentication requirements. Documents and private keys stay local; any network
exchange needs an explicit data contract. The LOE assumes compatible user-selected
endpoints and excludes a PDFree proxy/backend. If browser access cannot meet those
requirements, pause for an architectural decision rather than inventing a service.

Technical lead: [LibPDF PAdES capabilities](https://libpdf.documenso.com/).
Repo basis: `core/securePdf.ts`, `core/signatureCms.ts`, `services/securityClient.ts`.

## Workflow and information architecture

The 2026-10-09 workflow review is implemented; its findings and region model are
recorded in [ADR 0008](adr/0008-workflow-regions.md) and the shipped controls in
the [user guide](user-guide.md). Remaining follow-ups:

- Give phones an in-place document rename so the Document dialog no longer
  needs its own rename field.
- Let the Highlight tool select text by touch; touch drags currently draw area
  highlights because the page surface disables touch scrolling while a tool is
  active.
- Fit the navigation bar on 320px screens in two rows; page position, zoom and
  the panel toggles currently wrap to a third row.

## Manual verification

- Exercise real macOS/iOS Safari with native fields, touch signatures,
  projects and combined signing/encryption.
- Check Acrobat approval/certification policies, trusted CA identities and
  permitted subsequent edits.
- Verify physical print output with mixed-size and rotated pages.
- Verify enhanced direct file-picker saving on a browser that supports it.
- Exercise an actual two-version service-worker update with an open document
  and confirm the save/reload prompt.
- Assess keyboard, screen-reader and PDF document accessibility beyond automated
  Axe checks.
- Check native file drag-and-drop from the desktop into the editor and onto the
  Pages thumbnail list in Chromium, Firefox and Safari; browser tests synthesize
  the drop events.
