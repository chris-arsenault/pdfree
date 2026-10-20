# 0012 — Standard deferred loading and shared PDF worker

- Status: Accepted
- Date: 2026-10-20

## Context

The welcome screen needs less code and font transfer than a document workspace.
Loading improvements must preserve session ownership, document throughput,
browser-local processing and complete opt-in offline use.

The loading work explored custom module caching, failed-import recovery and
mandatory project download before reload. The user directed their removal in
favor of normal web behavior. The user also directed removal of proposed byte
budgets and statistical gates: performance goals guide measurement, while
correctness and security checks remain required.

A separate rendering worker made cold selected-page export about 1.4 times
slower in the paired 2,000-page comparison by losing warmed writer initialization.
The implementation retained a shared rendering/ordinary-export worker.

## Decision

Use module-level React.lazy components, Suspense and a normal error boundary
with browser reload. Keep session, history, task and draft owners mounted.
Preserve normal draft saving and browser unsaved-change warnings during failure.

Keep disposable import and secured-export workers separate from the persistent
rendering/ordinary-export worker. Defer recipient cryptography until strict
parser detection; retain credential cleanup and worker termination.

Deliver UI Noto Sans as a checked-in WOFF2 representation of the original font,
preserving coverage and metrics. Keep the original TTF for PDF embedding and
request the signature font only when needed. Preserve complete-font defaults
for callers that omit options. Use standard Vite asset hashes and the existing
complete opt-in offline package.

Record large-document timings through the existing Playwright/Vitest test host.
Use observations to investigate slowdowns, without adding runtime caps,
mandatory recovery workflows or hard performance budgets.

## Alternatives considered

- **Eager editor and font loading:** simple, but transfers document resources
  before a visitor opens a PDF.
- **Custom import caching and retry orchestration:** adds recovery states around
  browser module behavior and was explicitly rejected by the user.
- **Require a project download before reload:** makes recovery a mandatory
  workflow; existing autosave and browser warnings provide the chosen behavior.
- **Separate rendering and ordinary-export workers:** reduced dependency scope
  but regressed measured cold export by losing warm initialization.
- **Enforce byte or statistical timing budgets:** turns optimization goals into
  brittle gates and was explicitly rejected by the user.

## Consequences

First use of a deferred view can add latency. One Chromium sample of the final
loading changes added about 0.54 seconds to real-document opening and
0.33–0.35 seconds to first extraction, while welcome transfer fell from
1.15 MB to 0.38 MB. Full export, project save and split were similar. Those
samples do not establish repeatable cross-engine or total-memory performance.

Runtime contracts live in [loading](../loading.md); further measurement lives in
the [backlog](../backlog.md#document-performance-measurement). Closing the loading
plans does not represent unperformed performance acceptance as completed.
