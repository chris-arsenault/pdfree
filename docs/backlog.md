# Backlog

These are future candidates and verification work, not commitments or current
feature claims. Implementation requires scope and engine compatibility review.

## Document capabilities

- Add browser-local OCR with bundled language assets, progress/cancel and a
  verified searchable PDF text layer.
- Add scan deskew, crop and contrast controls.
- Add image-downsampling compression with quality preview while preserving
  searchable text/vector content.
- Add content-removing redaction and sanitization verified through extraction
  and independent rendering.
- Add safe remapping of catalog structures for composed/extracted PDFs.
- Evaluate original-text replacement as a separate writer capability.

## Signing extensions

- Evaluate incremental multi-signature revisions without invalidating earlier
  signatures.
- Evaluate trusted timestamps, revocation evidence and long-term validation
  within the browser-only processing boundary.

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
