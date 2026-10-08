# 0004 — Portable projects, local recovery and retained PWA

- Status: Accepted
- Encrypted project/draft lifecycle extended by [0007](0007-encrypted-document-lifecycle.md).
- Date: 2026-10-08

## Context

PDF exports materialize placed objects as page content. Users need a portable
format to continue editing and local recovery across reloads. Browser storage
can be evicted, and multiple tabs can overwrite or resurrect data without
transactional ownership/clearing rules.

The initial implementation also added offline packaging. The user clarified
that no backend does not require offline operation, then explicitly instructed
that existing offline work remain while architecture and quality were reviewed.

## Decision

Use a versioned `.pdfree` ZIP with a validated manifest, original PDFs and placed
assets as the explicit editable backup. Enforce archive, expansion, manifest and
reference budgets symmetrically on save/open. Use IndexedDB for local library
documents and optional remembered signatures, with transactional revisions,
generation fencing and atomic signature updates. Keep each tab's active entry
for reload recovery. Replacement documents get independent entries; reopening
updates the selected entry. Concurrent revisions retain both working copies.

Native comments extend new manifests to version 3 and local drafts to model
revision 4. Store comment identities, source annotation indices, page anchors,
metadata and reply parents explicitly. Empty arrays retain deletions across
recovery; older manifests/drafts derive missing records from immutable sources.

Document utilities extend new manifests to version 4 and drafts to revision 5.
Store recognition boxes, processed scan assets/parameters, internal destinations,
bookmark hierarchy and page rules explicitly. Document sessions own independent
history and draft identities; remember saved open IDs and the active ID for reload.

Retain the existing PWA asset cache and explicit update prompt. Browser-only
processing is the required boundary; offline operation is a retained capability,
not an interpretation that adds requirements to all future features.

## Alternatives considered

- **PDF as the only save format:** cannot recover movable editor objects and the
  full editing model from completed page content.
- **Browser storage as the only durable save:** eviction, quota and device changes
  can destroy the user's only copy.
- **One global draft slot/unconditional clear:** loses tab ownership or allows
  delayed writes to recreate cleared drafts.
- **Remove the PWA immediately:** conflicts with the user's explicit instruction
  to keep it pending review.

## Consequences

Projects include original content and are unprotected unless secured separately.
Draft failures remain visible and users need explicit project backups. Individual
library deletion pauses autosave only for that entry without discarding open
documents from memory. Other documents continue saving. The next edit resumes
saving for an open deleted entry.
PWA tests describe retained behavior; they do not redefine the no-backend request.
See [user guide](../user-guide.md) and [architecture](../architecture.md).
