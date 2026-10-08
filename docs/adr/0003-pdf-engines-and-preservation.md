# 0003 — Independent viewing and preservation-aware writing

- Status: Accepted
- Encrypted-input rejection partially superseded by [0007](0007-encrypted-document-lifecycle.md).
- Date: 2026-10-08

## Context

The filler must retain text/vector content and native forms while organizing
pages. pdf-lib supports browser writing but page copying alone does not preserve
the complete form graph, and unsupported catalog remapping can discard content.
The initial engine phase established real round trips before building the editor.

## Decision

Use PDF.js for viewing and independent export inspection, with worker-hosted
pdf-lib for ordinary writing. Preserve the original catalog when every page of
one source appears exactly once. For composition, explicitly graft forms/widgets,
namespace cross-source fields and map values. Reject referenced sources with
catalog/page-link structures the writer cannot safely remap.

Generate supported Unicode appearances with bundled fonts and validate glyphs
and overflow. Flatten only when requested and remove captured field-widget
references while retaining ordinary annotations. Reject encrypted, XFA, signed
and other unsupported editing inputs before destructive library access.

## Alternatives considered

- **Rasterize all pages:** simplifies visible output but loses searchable text,
  vectors, editable fields and original structure; incompatible with preservation.
- **Blind page copy/field flattening:** hides form graph/catalog losses and changes
  the requested retained-field behavior.
- **Change writer to MuPDF/WASM:** a researched candidate if core contracts failed;
  its APIs and licensing required separate review. Proven supported round trips
  allowed the chosen writer without changing project licensing.

## Consequences

Supported PDFs preserve their actual content and field relationships. Complex
composition can fail explicitly despite full-document export being supported.
Field copying, appearances, flattening and page geometry need saved-byte and
independent-rendering tests. Generated/widgetless signing fields use combined
field/widget dictionaries for older-reader compatibility while existing visible
widgets retain structure. See [compatibility](../compatibility.md).
