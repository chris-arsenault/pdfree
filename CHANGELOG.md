# Changelog

Notable user-visible changes, grouped by application version. Version headings
identify the application version; they do not imply a published Git tag.

## Unreleased

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
  version-2 editing projects. Credentials remain transient. Decrypted local
  drafts require consent and unprotected project saves require confirmation.
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
