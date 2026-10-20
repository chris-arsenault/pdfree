# Loading and font delivery

The welcome screen loads its shell and UI font. Editor views, PDF engines,
expensive dialogs and document fonts load when used. Documents, signatures,
credentials and drafts stay in the browser.

## Implementation

- Session, history, task and draft providers stay mounted while module-level
  React.lazy/Suspense boundaries load editor views and dialogs. An error boundary
  offers browser reload; normal autosave and unsaved-change warnings apply.
- Current-draft listing stays independent of PDF engines. Legacy migration
  loads source-refresh code on demand; pure model helpers stay engine-independent.
- Each import and secured export owns a disposable worker with strict parsing,
  transient credentials and termination on completion, failure or cancellation.
  Recipient cryptography loads after parser detection. Rendering preparation and
  ordinary export share a persistent PDF worker.
- UI Noto Sans uses WOFF2 with the original coverage and metrics. PDF embedding
  uses the original TTF. `fontData()` includes both document fonts by default;
  export consumers request Caveat when selected objects require it.
- Vite content hashes identify assets. Browser caching reuses immutable assets;
  the opt-in offline package includes all locales, OCR variants and required fonts.

See [ADR 0012](adr/0012-standard-deferred-loading.md) for the loading decisions,
and [security](security.md#credentials-and-output-scope) for draft/project handling.

## Cache behavior

Reusing a build preserves its asset filenames. Rebuilding with identical source,
locked dependencies, tool versions and build settings preserves content hashes.
A dependency chunk's changed filename can also change the hashes of importers.
HTML, the service worker and web manifest use no-cache delivery; ordinary assets
use immutable one-year metadata. The production loading check verifies that a
warm reload reuses welcome assets. [Deployment](deployment.md#state-and-hosting-contracts)
describes the shared hosting headers.

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

The measurement target records timings and verifies saved output. Timing and
transfer observations inform investigation; correctness and security assertions
remain enforced. [Development](development.md#production-and-manual-checks)
defines the measured intervals and their limits. Repeated document measurements
are tracked in the [backlog](backlog.md#document-performance-measurement).

Build and test sequentially because config startup regenerates shared assets.
Production tests cover resource deferral, immutable-asset reuse, font metrics,
offline fonts and reload after a failed dialog load. Browser and native saved-PDF
checks cover editing, persistence, credentials and output integrity.
