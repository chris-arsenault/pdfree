# 0002 — One editing model with immutable source PDFs

- Status: Accepted
- Date: 2026-10-08

## Context

Native fields, ad hoc marks, page operations, undo/redo, local drafts and exported
projects must describe the same document. Cropped/rotated pages and repeated field
widgets require stable identities and explicit coordinate transforms.

## Decision

Use `EditorDocument` version 1 as the shared durable shape. Retain immutable source
bytes and source IDs, stable page/object/asset IDs, source-index references,
page-space geometry and source-qualified native field values. Rendering, history,
page operations, projects, drafts and writers consume this model.

Keep selection, clipboard coordination and export credentials outside durable
document state. Derive source field/geometry descriptors from the original PDFs
when reopening projects or migrating legacy drafts. Validate model/reference
boundaries at UI and persistence/export entry points.

## Alternatives considered

- **Mutate the source PDF after each edit:** couples editing/history to writer
  serialization and loses an immutable original for recovery and repeat exports.
- **Separate models per UI/export format:** permits geometry, values and page
  membership to drift between preview, project recovery and downloads.
- **Screen-pixel geometry:** changes meaning under zoom, crop and page rotation;
  PDF page coordinates provide a stable export contract.

## Consequences

Exports materialize the model rather than overwrite original bytes. Projects
carry their original sources and assets, increasing file size. Transforms and
identity/reference validation are architectural contracts with regression tests.
Version changes require explicit compatible migration or rejection.
See [architecture](../architecture.md).
