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

Use images/stamps, ink, rectangles, lines/arrows and highlights. With Highlight,
drag across PDF or recognized text to highlight that text, or drag elsewhere to
highlight an area; text already selected on the page is highlighted as soon as
you choose Highlight. Covering content with shapes
does not remove it. Use the Field tool to author genuine fillable fields; configure
their names, options and required flags in the inspector, and use its Tab order
control to move a field earlier or later among the page's authored fields. Other
added objects offer Bring to front instead.

The bar above the document changes the view only: the Pages and Bookmarks panel
toggles, text search, page position, zoom and fit page/width (fit width is hidden
on phones), and the Properties and Comments toggles. Search includes existing PDF
text, recognized words, entered text and repeated labels.

Open another document with Open, the plus icon beside the document tabs or by
dropping files onto the editor; each opens in its own tab. To add a dropped PDF's
pages to the current document instead, drop it onto the Pages thumbnail list,
which appends them at the end. Each document
keeps its own edits, undo, selection and clipboard. Closing an edited document asks
for confirmation; saved library entries remain available.

## Scan and repeated tools

Recognize text and Clean up scans sit in the Scan tools group at the right of the
toolbar; on phones they are in the toolbar's Add menu. When the current page is a
scanned image without text, a notice above the page offers both. Repeat across
pages is in the Pages panel's More menu, and Process multiple PDFs is in the menu
beside Open. Each tool shows the page-scope control. Recognition and cleanup start
from the checked thumbnails, or all pages when none are checked; repeated rules
start from all pages.

Recognize text runs English recognition on this device and adds
searchable/selectable text without changing the scanned image. Its Recognize view
lists what will happen to the chosen pages: pages to recognize, pages already
recognized (kept unless you choose to recognize them again) and pages that
already have PDF text or are blank. After a run, Results shows the words found
and average confidence per page, flags uncertain words, and previews the
recognized text. Copy text copies it, Show on page outlines recognized words on
the page (uncertain words in amber), and Remove text deletes recognition; Undo
restores it. Reopening Recognize text on recognized pages opens Results. The page
notice shows the word count and a Show words toggle; recognized thumbnails carry
a small badge.

Clean up scans analyzes a preview page, the first page in scope by default; use
the arrows or page list to preview another page. It reports what it found and
proposes four corrections, each with an on/off switch: Straighten (detected tilt),
Whiten paper (grey or tinted paper), Darken text (faded ink) and Trim edges (dark
scanner borders, measured after straightening). The preview shows the cleaned
page live; switch to Original to compare, or turn on the alignment grid to judge
straightness. Fine-tune rotation, whitening and contrast with the − and +
buttons, and drag the page edges in the preview, or focus an edge and use the
arrow keys, to adjust trimming.

With several pages, Detect for each page analyzes and cleans every page with its
own settings. Adjusting a value switches to Same settings on every page, starting
from the previewed page. Pages that are not a single plain scan image can only be
trimmed; the dialog names them. Apply is one undoable edit and reports how many
pages were straightened, whitened, darkened and trimmed. Restore original pages
removes earlier cleanup. Trimming hides content; it does not remove sensitive
data.

Repeat across pages adds numbering/Bates prefixes, watermarks or stamps. Numbering
follows the current page order; selected scopes follow page identities, including
duplicates. Process multiple PDFs applies numbering, OCR or compression sequentially,
reports errors per file and downloads successful PDFs individually or as ZIP.
Password/certificate prompts are not supported in this batch flow; open protected
documents individually.

Bookmarks shares the left panel with Pages. It lists the document outline; choose
an entry to go to its page. Edit bookmarks switches the panel to editing: add the
current page, rename, choose a target/parent, reorder by drag or arrow buttons and
save, or cancel to discard the changes. Deleted targets remove
their bookmarks and disable incoming internal links. Duplicates keep existing
bookmarks targeting the original page.

## Comments

In the Comments panel, Add comment opens a note at the centre of the part of the
current page that is in view, without closing the panel. Write your note and
post it.

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

Use Pages above the document to show thumbnails and every operation that changes
the page set. On touch screens, it opens a drawer. The scope control at the top
says Current page when no thumbnails are checked, the selected count, or All
pages. Open it to choose All pages, Current page or a page range; these update
the thumbnail checkboxes. Rotate, Duplicate and Delete apply to that scope.

Insert adds a Blank page or Pages from file (PDF, PNG or JPG) after the current
page, or Merge PDFs at the end. Dropping files onto the thumbnail list also
appends them. More holds Extract, Split and Repeat across pages; Extract and
Split open Export.

Thumbnails select, navigate and reorder pages. Page numbers refer to the current
physical page order, beginning at 1, rather than printed labels on the original
form.

Split (in Export) after page numbers, every N pages, into individual pages or by output
ranges. Splitting after `3,7` produces pages 1–3, 4–7 and 8–end. Explicit ranges
such as `1-3; 5-end` produce two outputs. Review previews and omitted-page notices,
then download individual PDFs or all outputs as ZIP. Outputs contain current
field values, page rotations and added objects. See
[composition restrictions](compatibility.md#supported-documents) for complex PDFs.

## Save and export

Export starts with an output choice. Each output shows only the settings that
change its file, and the main button names what it downloads.

| Output           | What it preserves                                                                     | Main button                 |
| ---------------- | ------------------------------------------------------------------------------------- | --------------------------- |
| PDF              | Page content, comments and supported interactive fields; flatten to bake field values | Download PDF                |
| Printable sheets | 2, 4 or 6 pages per sheet with baked field and comment appearances                    | Download 2-up PDF (or 4, 6) |
| Split into files | Several PDFs with current fields and edits                                            | Download N PDFs as ZIP      |
| Page images      | Raster images of the chosen pages at 108 dpi                                          | Download page images (ZIP)  |
| Editing project  | Original sources, movable objects, comments, assets, field values and page edits      | Download editing project    |

PDF, Printable sheets and Page images use the page-scope control: All pages
(the default), Current page, Selected pages or a page range, with the resulting
page count shown below it. Extract in the Pages panel opens Export as PDF with
the selected pages. Split in the Pages panel opens Export with Split into files.

PDF and Printable sheets also offer Print and, in browsers that support it, Save
to file. Added marks in a PDF reopen as PDF page content, not movable PDFree
objects; download an editing project to continue editing. A flattened PDF alone
provides neither certificate signing nor tamper protection.

PDF and Printable sheets can [sign, certify or protect the output](security.md).
PDF size and quality offers supported-image compression and an actual byte-size
preview. Unsupported image resources keep their quality; a target size is not a
promise. Printable sheets offers paper, orientation, ordering and margin controls
and a first-sheet preview; print it at actual size. Sheets omit interactive
fields, threads and navigation, so keep an ordinary PDF or editing project for
those features.

Signing and protection apply to PDF and Printable sheets downloads and direct
saves only; projects, drafts, page images, print and split files are unprotected.

Encryption is not automatically carried into a new PDF: enable password or
recipient protection for its PDF export. Projects retain the encrypted original
and a decrypted working copy, so saving one requires confirmation and reopening
it requires no PDF password. Keep these projects private.

## Local storage and updates

Documents autosave in this browser. Open Library from the menu beside Open to
view saved documents, reopen one or delete it individually. With no document
open, the start screen offers the most recent saved document (Recover draft) and
links to Saved documents and Process multiple PDFs. Opening a replacement keeps
previously saved documents in the library; reopening updates the same entry.
Saved open documents and the active tab restore after reload. Download an editing
project for durable backup because browsers can evict stored data.

Protected PDFs also autosave by default; saved drafts contain unlocked content.
Library's Storage section has “Don't autosave protected documents.” This
browser-wide option is off by default and applies to all open documents,
including background tabs. Turning it on stops new saves for protected PDFs;
delete a document in Library to remove its existing local copy. Turning it off
resumes saving. Downloaded projects remain separate files.

Library also previews remembered signatures. Use one in the open document or
delete it individually; deleting a remembered signature keeps already placed
marks. Document deletion requires confirmation and keeps the open document in
memory. Saving that document resumes after the next edit; other saved documents
are unaffected. Queued writes cannot recreate a deleted entry.
Rename the document in place by editing its name in the header; Enter keeps the
name and Escape restores it. The Document action opens source information and
also offers rename on phones, where the header name is hidden. Storage settings
apply to this browser and stay outside document undo and editing projects. The
bottom strip reports status only: brief Saving/Saved feedback, storage failures,
an Autosave off control (which opens Library storage) when the restriction is
enabled, and update prompts. Browser-only processing is always active; there is
no cloud mode.

The app automatically caches its assets for offline use. Once installation completes,
editing, English OCR and downloads can run without an origin connection. Installation
failures appear in the strip. Updates prompt before reloading; save an editing project
before accepting the update.

Opening a replacement or saved document, deleting pages or a saved document, downloading
an unprotected project and applying an update use custom confirmation dialogs.
Cancel is focused first; Escape cancels and returns to the current work.
The unsaved-edit warning when closing or reloading the tab remains a
browser-controlled dialog. File selection, direct file saving and printing also
use the browser's platform controls.

Consult [compatibility](compatibility.md) for input, font and export limits.
