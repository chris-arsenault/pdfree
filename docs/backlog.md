# Backlog

These are future candidates and verification work, not commitments or current
feature claims. Implementation requires scope and engine compatibility review.

Current features and their limits live in [the user guide](user-guide.md) and
[compatibility](compatibility.md). This backlog contains extensions to that
behavior and work requiring further verification.

## Research and sizing

The candidate research dates to 2026-10-08; this list was reconciled with shipped
behavior on 2026-10-20. Market evidence is qualitative:
recurring user requests establish useful workflows, not market share or a measured
popularity ranking. Technical approaches below are proposals based on source
inspection and linked technical documentation. Estimates are provisional;
dependency APIs and licensing need verification when a candidate is taken up.

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

| Candidate                                   | LOE | Confidence | Priority / dependency                                 |
| ------------------------------------------- | --- | ---------- | ----------------------------------------------------- |
| True redaction and explicit sanitization    | XL  | Low        | Requires a verified content-removal engine            |
| Original-text correction and find/replace   | XXL | Low        | Requires content rewriting and font handling          |
| Compare two PDFs                            | L   | Medium     | Independent read-only workflow                        |
| Word import/export                          | XXL | Low        | Deferred; browser layout/conversion engine unresolved |
| General catalog remapping                   | XL  | Low        | Extend existing bookmark/destination support          |
| Incremental multiple signatures             | XL  | Low        | Existing backlog; signed-document path required       |
| Trusted timestamps and long-term validation | XL  | Low        | Existing backlog; network/trust boundary unresolved   |

Do not add these estimates mechanically: content rewriting, catalog remapping
and writer capabilities overlap. Redaction needs an engine feasibility decision
before implementation scope can be narrowed.

## Document capabilities

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

**Scope/design:** Extend safe merge/extract/duplicate to unsupported styled or
structure-linked outlines, name-tree entries such as attachments, tagged
structures and cross-page comment relationships. Supported plain bookmark
hierarchies and named/explicit internal destinations already remap. Preserve
each additional structure explicitly while retaining guards for the rest.

**Approach/uncertainty:** Extend the source-object/page-to-output map and typed
remappers with policies for deleted and duplicated targets. Attachment name
collisions, structure trees and cross-page relationships require separate
compatibility work. Existing guards stay for unsupported structures. Verify live
output references and reading
order with independent readers. Reuse the existing bookmark/destination mapping;
tagged accessibility preservation is the largest uncertainty and may expand this
to XXL.

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

## Languages and document fonts

- Review all 17 interface catalogs with native speakers, especially credential,
  certification and destructive-action terminology.
- Add RTL mirroring, vertical reading layouts and translated-text layout checks
  as separately scoped interface work.
- Add OCR languages with bundled same-origin data and independently verified
  PDF glyph coverage/shaping. Keep UI language separate from recognition language.
- Extend PDF font/script support for authored text and translated date/stamp
  templates. Preserve existing document content when changing interface language.
- Assess PDF-content translation separately from application localization.

## Document performance measurement

Repeat preserved-baseline/current-build comparisons for real and mixed
2,000-page documents on the same quiet host, including Firefox and WebKit.
Investigate real-document opening and first-extraction latency: the existing
single Chromium samples show about +0.54 seconds for opening and +0.33–0.35
seconds for first extraction. Full export, project save and split were similar.
Those samples do not establish a reproducible regression or general acceptance.

Measure completed page rendering and browser/worker memory if assessing those
properties; the current target measures navigation UI response and does not
collect total memory. Keep measurements observational and preserve correctness
checks. Use the existing [performance commands](development.md#production-and-manual-checks)
and [loading contract](loading.md), without reviving removed hard budgets or
custom recovery machinery.

## Workflow and information architecture

- Give phones an in-place document rename so the Document dialog no longer
  needs its own rename field.
- Let the Highlight tool select text by touch; touch drags currently draw area
  highlights because the page surface disables touch scrolling while a tool is
  active.
- Fit the navigation bar on 320px screens in two rows while preserving page
  position, pinning, search, zoom and panel controls.

## Test reliability

Investigate the 5-second timeout in `src/i18n/catalogs.test.ts` for native plural
forms and digits during combined unit/Chromium `make ci` runs. Two runs on
2026-10-20 timed out there; all 19 catalog tests passed in isolation. The cause
is unverified. Preserve the assertions while investigating execution behavior.

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
