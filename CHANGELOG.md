# Changelog

Notable user-visible changes, grouped by application version. Version headings
identify the application version; they do not imply a published Git tag.

## Unreleased

- PDFree no longer installs itself for offline use on every visit. Choose Use
  offline in the bottom strip to save it to the device (about 29 MB, including
  text recognition) with visible progress, install it as an app where the
  browser allows, or remove the offline copy later. Browsers that already had
  the offline copy keep it.

- Recognize text and Clean up scans now sit in a labelled Scan tools group in
  the toolbar (the Add menu on phones) instead of the Pages panel More menu. A
  notice above scanned pages without text offers both, and recognized pages show
  their word count with a Show words toggle and a thumbnail badge.
- Recognize text shows what a run will do to each page before it starts and
  keeps earlier recognition unless you choose to replace it. Results list the
  words found, confidence and uncertain words per page, preview the text, and
  offer Copy text, Show on page and Remove text. Reopening it on recognized pages
  shows those results instead of offering to run again.
- Clean up scans now analyzes a preview page and proposes Straighten, Whiten
  paper, Darken text and Trim edges with what it found. A live preview shows
  the result, with Original comparison, an alignment grid and draggable trim
  edges. By default each page is analyzed and cleaned with its own settings;
  adjusting a value applies one setting to every page. Restore original pages
  removes earlier cleanup, and re-cleaning no longer accumulates image copies.

- Dropping files on the editor now opens them in new document tabs, matching
  Open. Drop onto the Pages thumbnail list to append pages to the current
  document.
- Export now starts with an output choice (PDF, Printable sheets, Split into
  files, Page images, Editing project). Each shows only its own settings and its
  main button names the file it produces, so choosing pages per sheet no longer
  silently changes Download PDF. Extract and Split open Export.
- Added one page-scope control (All, Current, Selected or a range, with the page
  count) to the Pages panel, Export, Recognize text, Clean up scans and Repeat
  across pages. Export defaults to all pages; Extract starts from the selection.
- Moved Repeat across pages from the toolbar Tools menu into the Pages panel's
  More menu, and grouped Blank page, Pages from
  file and Merge PDFs under a Pages panel Insert menu. Process multiple PDFs and
  Library now sit in a menu beside Open.
- Settings is now Library's Storage section. The footer shows status only; draft
  recovery appears on the start screen and zoom sits beside page navigation.
  Rename the document directly in the header.
- The toolbar Highlight tool now highlights PDF or recognized text when dragged
  across it, replacing the separate Highlight selected text button.
- Bookmarks is now a left-panel tab beside Pages for browsing and editing the
  outline. Search results no longer show bookmark editing.
- Authored form fields have a Tab order control (earlier/later, with position)
  instead of a Bring to front button that changed meaning for fields. Comments
  panel Add comment places the note in the visible part of the page.
- Removed redundant privacy and offline-status dropdowns, mode-like editing/export
  labels and the empty header tagline. The footer keeps Library, zoom, brief draft
  save feedback and actionable warnings or updates.
- Comments now open a new-note composer inside the panel. Shared navigation
  stays above side panels, and task notifications overlay the document area
  so opening panels or showing notices does not resize or move editor rails.
- Fixed extra outer scrolling caused by PDF.js's text-measurement canvas.
  Update, offline and draft-storage notices now use compact footer controls
  with explanations in tooltips or popovers instead of expanding the bottom rail.
- Fixed deployment of bundled OCR language data by adding gzip asset support to
  the shared website module and updating the pinned revision.
- Protected PDFs now autosave by default. Added a browser-wide “Don't autosave
  protected documents” setting, off by default, replacing per-document consent.
  When enabled, a compact Autosave off control opens Settings without expanding
  the bottom rail. Existing projects and drafts remain readable.
- Added browser-local English OCR, supported-image compression with size preview,
  scan crop/deskew/contrast/background cleanup and editable native bookmarks.
- Added durable numbering/Bates labels, watermarks and stamps, sequential multi-PDF
  processing and 2/4/6-up vector print derivatives with baked appearances.
- Added isolated document tabs with separate undo, selection, clipboard and local
  recovery. Version-4 projects and revision-5 drafts retain utility state.

- Added native PDF notes and replies with page markers and a compact Comments
  panel. Edit, delete, undo and reopen comments while preserving incoming authors,
  dates, markup and reply links. Comments persist in version-3 projects and local
  drafts, survive page operations and remain annotations when fields are flattened.

- Replaced Clear local data with a simple Library for saved documents and
  signature previews. Reopen documents, reuse signatures and delete individual
  entries while keeping other saved items and open documents intact.
- Replaced browser confirmations for document replacement, page deletion,
  saved-document deletion, unprotected project downloads and application updates
  with accessible custom dialogs and keyboard-safe cancellation.
- Reorganized editor tools into stable icon groups with custom keyboard and
  hover tooltips, explicit page-action scope and contextual object properties.
- Moved page operations beside thumbnails, consolidated routine status, and
  added labelled touch tool choices, a Pages drawer and a Properties sheet.
- Clarified duplicate, merge/insert, highlight and field-order actions while
  preserving local-only document processing and export behavior.

- Added encrypted-input editing for Standard revisions 2–6: RC4, AES-128 and
  AES-256, including empty, opening, owner and Unicode passwords.
- Added Adobe.PubSec recipient encryption: open with a local PKCS#12 identity
  and export AES-256 protection for selected RSA/ECDH recipient certificates.
- Preserve original encrypted bytes alongside decrypted working sources in
  version-2 editing projects. Credentials remain transient; unprotected project
  saves require confirmation.
- Fixed permission-only PDFs being rejected, passive form buttons blocking
  import, authentication before encrypted object streams, legacy password
  encoding, and RSA-OAEP/ECDH CMS interoperability.
- Added independent OpenSSL/qpdf/Poppler/PDFBox regressions and a Docker test
  toolchain; application processing remains entirely in the browser.

## v1.0.0 - 2026-10-08

### Editing and forms

- Added native form filling and positioned text, dates, checkmarks and crosses
  for static or scanned forms.
- Added drawn, typed and imported signatures/initials, images, stamps, ink,
  shapes, arrows and text/area highlights.
- Added fillable-field authoring, object transforms, alignment, keyboard editing,
  multi-selection and undo/redo.

### Pages and saving

- Added page rotation, reorder, duplication, deletion, merge, insertion,
  extraction and page-number splitting with individual or ZIP downloads.
- Added retained-field and flattened PDF export, portable editable projects,
  PNG page export, printing and optional direct file saving.
- Added per-tab local recovery, optional remembered signatures and explicit
  local-data clearing, plus cached application assets and update prompts.
- Published the browser editor at `pdf.ahara.io` through Ahara.

### Signing and protection

- Added local RSA/ECDSA PKCS#12 certificate signing and all three DocMDP
  certification policies, including sign and lock.
- Added AES-256 opening/owner passwords and reader permissions, combined with
  certificate signing in the same export.

### Bug fixes

- Fixed field/widget copying, radio appearance identity, choice label/value
  preservation and clearing, and rotated/cropped page geometry.
- Fixed stale editor/clipboard state, concurrent draft/signature storage and
  clear-data fencing across tabs.
- Fixed project reference/size validation, filename boundaries, text validation,
  opacity rendering and excessive raster allocations.
- Fixed cancellation during secured export preparation, dangling flattened
  widget references and generated signature compatibility with older readers.

### Documentation

- Consolidated user, architecture, security, testing and deployment guidance,
  recorded architectural decisions, and archived implementation/release evidence.
