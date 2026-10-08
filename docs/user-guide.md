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

Common editing tools sit in the top toolbar. Hover an icon or focus it with
the keyboard for its name and instructions. On narrow screens, Select, Text
and Sign stay visible; Add opens the other tools with labels.

Properties opens for selected objects and closes without clearing the selection.
Use the Properties button above the document to reopen it. Multiple selections
show group actions; Duplicate creates another object immediately. On touch
screens, properties occupies a scrollable sheet below the document.

Drag, resize, rotate, duplicate and align added objects. Shift-click selects
multiple objects; arrow keys nudge, Delete removes, Ctrl/⌘ Z undoes and Ctrl/⌘ C/V
copies/pastes. Native text selection remains available for copying PDF text.

Use images/stamps, ink, rectangles, lines/arrows and area highlights. Select PDF
text for text highlights where a text layer exists. Covering content with shapes
does not remove it. Use the Field tool to author genuine fillable fields; configure
their names, options, required flags and tab order in the inspector.

Search includes existing PDF text, recognized words, entered text and repeated labels.
Zoom, fit width/page, thumbnails, page jump and available
document outlines navigate the document.

Open another document with the plus icon beside the document tabs. Each document
keeps its own edits, undo, selection and clipboard. Closing an edited document asks
for confirmation; saved library entries remain available.

## Scan and repeated tools

Tools opens Recognize text, Clean up scans, Repeat across pages and Process multiple
PDFs. Recognition and cleanup default to the current page selection; repeated
rules default to all pages. Recognition starts with English and adds searchable/selectable text
without changing the scanned image. Existing PDF text is skipped. Review recognition
accuracy; Remove recognition and Undo leave the source image intact.

Clean up scans offers crop, deskew, contrast and background cleanup, with a preview
of the first selected page before applying one undoable edit. Reset settings and
apply the preview to restore source geometry/appearance. Unsupported mixed layouts
and annotations that cannot safely rotate produce an explicit error. Crop hides
content; it does not remove sensitive data.

Repeat across pages adds numbering/Bates prefixes, watermarks or stamps. Numbering
follows the current page order; selected scopes follow page identities, including
duplicates. Process multiple PDFs applies numbering, OCR or compression sequentially,
reports errors per file and downloads successful PDFs individually or as ZIP.
Password/certificate prompts are not supported in this batch flow; open protected
documents individually.

Edit bookmarks in the Pages outline control. Add the current page, rename, choose
a target/parent, reorder by drag or arrow buttons and save. Deleted targets remove
their bookmarks and disable incoming internal links. Duplicates keep existing
bookmarks targeting the original page.

## Comments

Choose Comment in the toolbar (under Add on narrow screens), click a location
on the page, write your note and post it. A name is optional. Comments above the
document opens the list; selecting a note jumps to its page and shows its replies.
Small page markers open the same thread. Edit and delete actions have icon tooltips.
Deleting a note removes its replies after confirmation; Undo restores the thread.

Existing PDF notes retain their authors, dates and reply relationships. Locked
notes, state annotations and other markup appear read only; their original
appearance stays intact. Replies can be added to existing markup. Text-selection
comments and rich formatting are not included.

Comments save as native PDF annotations, including when form fields are flattened.
They reopen as comments in PDFree and remain available to readers that support
PDF annotations. Projects and local drafts retain them alongside page edits.
Page rotation and reorder keep their anchors; duplication creates independent
threads. PDFs with comment relationships across pages require complete-document
export and expose those linked notes read only.

## Organize and split pages

Use Pages above the document to show thumbnails and page operations. On touch
screens, it opens a drawer. The scope control says Current page when no page
checkboxes are selected, or shows the selected count. It also offers all-page
and range selection. More contains Extract, Split, Merge PDFs (append at the
end), and Insert pages (insert after the current page).

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

| Output               | What it preserves                                                                |
| -------------------- | -------------------------------------------------------------------------------- |
| PDF, retained fields | Completed page content, comments and supported interactive fields                |
| PDF, flattened       | Field appearances embedded in page content; comments remain annotations          |
| `.pdfree` project    | Original sources, movable objects, comments, assets, field values and page edits |
| PNG ZIP              | Raster images of selected pages at 108 dpi                                       |
| Print                | Prepared page output for the browser print flow                                  |

Export the whole document or selected pages. Download works across supported
browsers; direct file saving is an optional browser enhancement. Added marks in
a PDF export reopen as PDF page content, not movable PDFree objects. Save a
`.pdfree` project to continue editing. A flattened PDF alone provides neither
certificate signing nor tamper protection.

The Export dialog can also [sign, certify or protect its PDF output](security.md).
PDF size and quality offers supported-image compression and an actual byte-size
preview. Unsupported image resources keep their quality; a target size is not a
promise. Pages per printed sheet creates a separate 2/4/6-up PDF with paper,
orientation, ordering and margin controls. Review its first-sheet preview and print
at actual size. It bakes field/comment appearances but omits interactive fields,
threads and navigation. Keep an ordinary PDF or editing project for those features.

Those settings apply to PDF download and direct PDF save only; projects, drafts,
PNGs, print and Split outputs are unprotected.

Encryption is not automatically carried into a new PDF: enable password or
recipient protection for its PDF export. Projects retain the encrypted original
and a decrypted working copy, so saving one requires confirmation and reopening
it requires no PDF password. Keep these projects private.

## Local storage and updates

Documents autosave in this browser. Open Library in the bottom status strip to
view saved documents, reopen one or delete it individually. Opening a replacement
keeps previously saved documents in the library; reopening updates the same entry.
Saved open documents and the active tab restore after reload. Library also offers
other saved documents. Download an editing project for durable backup
because browsers can evict stored data.

Decrypted documents do not autosave by default. In Document details, explicitly
enable “Save decrypted drafts on this device” to allow unprotected recovery.
Disabling it stops future writes; delete the document in Library to remove its
previously saved local copy. Downloaded projects are separate files and are kept.

Library also previews remembered signatures. Use one in the open document or
delete it individually; deleting a remembered signature keeps already placed
marks. Document deletion requires confirmation and keeps the open document in
memory. Saving that document resumes after the next edit; other saved documents
are unaffected. Queued writes cannot recreate a deleted entry.
The Document action opens source information and draft consent settings. The
offline indicator opens application-cache status. Storage failures, encrypted-input
draft notices and update prompts remain visible in the strip.

The retained PWA caches application assets. After “Ready to work offline,”
editing, English OCR and downloads can run without an origin connection. Updates prompt
before reloading; save an editing project before accepting the update.

Opening a replacement or saved document, deleting pages or a saved document, downloading
an unprotected project and applying an update use custom confirmation dialogs.
Cancel is focused first; Escape cancels and returns to the current work.
The unsaved-edit warning when closing or reloading the tab remains a
browser-controlled dialog. File selection, direct file saving and printing also
use the browser's platform controls.

Consult [compatibility](compatibility.md) for input, font and export limits.
