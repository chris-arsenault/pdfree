# Loading performance

Reduce the work required for the welcome screen and ordinary PDF opening while
preserving document editing performance, including real 2,000-page documents.
Keep documents, signatures, credentials and drafts in the browser.

## Implementation

- Keep session, history, task and draft providers mounted. Declare lazy editor
  and dialog components at module scope and use React.lazy/Suspense. A normal
  error boundary offers reload; existing draft saving and browser unsaved-change
  warnings apply. No mandatory recovery workflow or custom module loader.
- Keep current-draft listing independent of PDF engines; load legacy migration
  code only when required. Pure model helpers do not import readers or writers.
- Separate disposable import and secured-export workers, preserving strict
  parsing, credentials, ciphertext, consent and termination behavior. Load
  recipient handling only after strict parser detection. Retain the shared
  render/export worker to reuse writer initialization.
- Serve UI Noto Sans as WOFF2 with the original coverage and metrics. Retain the
  original TTF for PDF embedding. Optional font-loading parameters preserve the
  complete font set by default; export consumers request the signature font
  when their selected content needs it.
- Retain Vite content hashes, browser caching and the complete opt-in offline
  package, including every locale, OCR variant and required font.

## Measurement

Use the existing Vitest/Playwright production test server. The optional
`make test-performance` target measures real and mixed 2,000-page inputs and
checks extracted text, PDF page counts, projects and split output. See
[development](development.md) for commands and measurement boundaries. Compare
preserved builds serially on the same machine; repeat uncertain differences.
Timings are observations, not CI budgets or runtime limits.

The real source is the redistributable R 4.6.1 reference manual: 3,993 pages and
10,402,568 bytes. [Fixture provenance](../frontend/tooling/fixtures/performance/README.md)
records its URL, permission and checksum. Generated excerpts retain the notice;
the original remains unchanged. The existing 64-page scan test separately
exercises large input-byte volume.

Document throughput takes priority over shaving download bytes. Investigate
material slowdowns rather than adding runtime caps, mandatory workflows, custom
loaders or arbitrary enforcement. Keep correctness and security checks. The
previous proposed byte budgets and statistical gates have been removed at the
user's direction.

Build and test sequentially because config startup regenerates shared assets.
Existing browser, production/offline and native saved-PDF checks remain useful;
this work authorizes no deployment or shared infrastructure changes.
