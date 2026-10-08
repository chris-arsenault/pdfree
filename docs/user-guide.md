# Using PDFree

## Open and fill

Open a local PDF through the file picker or drag/drop. Click native text,
checkbox, radio, dropdown or list fields to fill them. Controls retain the PDF's
export values while showing its choice labels. Review calculated fields manually:
the editor does not execute embedded form scripts.

Permission-only encrypted PDFs open automatically when their opening password
is empty. Other password-encrypted PDFs prompt for an opening or owner password.
Certificate-encrypted PDFs instead prompt for a matching recipient `.p12`/`.pfx`
identity and its password. Wrong credentials can be retried; Cancel opening
preserves the current document. Credentials are never saved with edits.
Action buttons retain their appearance but their embedded actions do not run.

For static or scanned forms, choose Text, Date, Check or Cross and click the
page. Use the inspector to set text, font, size, color, alignment and opacity.
Choose Signature or Initials to draw with mouse/touch/pen, type with a bundled
font, or import a PNG/JPG. Remembering a signature on this device is optional.
Visible signature marks are page content; certificate signing is configured
separately in [Export](security.md).

## Edit and annotate

Drag, resize, rotate, duplicate and align added objects. Shift-click selects
multiple objects; arrow keys nudge, Delete removes, Ctrl/⌘ Z undoes and Ctrl/⌘ C/V
copies/pastes. Native text selection remains available for copying PDF text.

Use images/stamps, ink, rectangles, lines/arrows and area highlights. Select PDF
text for text highlights where a text layer exists. Covering content with shapes
does not remove it. Use the Field tool to author genuine fillable fields; configure
their names, options, required flags and tab order in the inspector.

Search includes existing PDF text and entered text. Image-only scans require
manual navigation. Zoom, fit width/page, thumbnails, page jump and available
document outlines navigate the document.

## Organize and split pages

Thumbnails select, navigate and reorder pages. Rotate selected pages or the whole
document; duplicate, delete or extract pages. Merge PDFs and insert PDFs,
PNG/JPG images or blank pages. Page numbers refer to the current physical page
order, beginning at 1, rather than printed labels on the original form.

Split after page numbers, every N pages, into individual pages or by output
ranges. Splitting after `3,7` produces pages 1–3, 4–7 and 8–end. Explicit ranges
such as `1-3; 5-end` produce two outputs. Review previews and omitted-page notices,
then download individual PDFs or all outputs as ZIP. Outputs contain current
field values, page rotations and added objects. See
[composition restrictions](compatibility.md#supported-documents) for complex PDFs.

## Save and export

| Output               | What it preserves                                                      |
| -------------------- | ---------------------------------------------------------------------- |
| PDF, retained fields | Completed page content and supported interactive fields                |
| PDF, flattened       | Field appearances embedded in page content                             |
| `.pdfree` project    | Original sources, movable objects, assets, field values and page edits |
| PNG ZIP              | Raster images of selected pages at 108 dpi                             |
| Print                | Prepared page output for the browser print flow                        |

Export the whole document or selected pages. Download works across supported
browsers; direct file saving is an optional browser enhancement. Added marks in
a PDF export reopen as PDF page content, not movable PDFree objects. Save a
`.pdfree` project to continue editing. A flattened PDF alone provides neither
certificate signing nor tamper protection.

The Export dialog can also [sign, certify or protect its PDF output](security.md).
Those settings apply to PDF download and direct PDF save only; projects, drafts,
PNGs, print and Split outputs are unprotected.

Encryption is not automatically carried into a new PDF: enable password or
recipient protection for its PDF export. Projects retain the encrypted original
and a decrypted working copy, so saving one requires confirmation and reopening
it requires no PDF password. Keep these projects private.

## Local storage and updates

Drafts autosave in IndexedDB with a separate recovery slot for each tab. Recovery
is offered after reload; storage failures are visible. Download an editing
project for durable backup because browsers can evict stored data.

Decrypted documents do not autosave by default. In Document details, explicitly
enable “Save decrypted drafts on this device” to allow unprotected recovery.
Disabling it stops future writes; Clear local data removes previously saved
drafts. Downloaded projects are separate files and are not removed by clearing.

Clear local data removes stored drafts and remembered signatures after
confirmation. Other open tabs retain their in-memory documents and pause
autosaving until the next edit. Queued writes cannot restore cleared drafts.

The retained PWA caches application assets. After “Ready to work offline,”
editing and downloads can run without an origin connection. Updates prompt
before reloading; save an editing project before accepting the update.

Consult [compatibility](compatibility.md) for input, font and export limits.
