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
reference budgets symmetrically on save/open. Use IndexedDB for per-tab drafts
and optional remembered signatures, with transactional revisions, clear-generation
fencing and atomic signature updates.

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
Draft failures remain visible and users need explicit project backups. Clearing
local data pauses other tabs' autosave without discarding their memory state.
PWA tests describe retained behavior; they do not redefine the no-backend request.
See [user guide](../user-guide.md) and [architecture](../architecture.md).
