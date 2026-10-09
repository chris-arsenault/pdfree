# 0009 — Scan tools in the toolbar and analyzed cleanup

- Status: Accepted; amends the toolbar row of [ADR 0008](0008-workflow-regions.md)
- Date: 2026-10-09

## Context

ADR 0008 placed Recognize text and Clean up scans in the Pages panel More menu.
A 2026-10-09 review found that people did not find them there, and that both
dialogs left their outcome unclear:

- After OCR the dialog looked the same apart from a status line; it did not say
  whether any words were found, and its primary button ran recognition again.
- Reopening OCR on a recognized document gave no sign of the earlier run.
- Cleanup asked for deskew angle, contrast, background and crop margins as raw
  numbers, with no indication of what a page needed.

## Decision

The toolbar answers "What do I do to the page content?". Placement tools stay
icon-only. A labelled Scan tools group at the end of the toolbar holds
Recognize text and Clean up scans. On phones both appear in the Add menu.

A notice above the page reports scan state for the current page. An image-only
page without text offers Recognize text and Clean up scan. A recognized page
shows its word count and confidence, plus a toggle that outlines recognized
words, tinted by confidence. Recognized thumbnails carry a badge.

OCR state comes from the durable model (`page.recognition`) and a cached
classification of each source page (PDF text, scan, vector graphics or empty).
The OCR dialog has two views. Recognize shows what a run will do per page and
keeps earlier recognition unless the user opts to replace it. Results lists
words, confidence, uncertain words and the recognized text per page. The dialog
opens on Results when the scope already has recognition.

Cleanup analyzes a rendered sample page, by default the first in scope, and
proposes corrections: projection-profile deskew, whitening and contrast from
paper and ink levels, and trimming of dark scanner edges measured after
straightening. A live preview reuses the export pixel adjustment and rotation
centre. Trim edges are draggable, keyboard-accessible sliders. By default every
page in scope is analyzed and cleaned with its own detected settings. Adjusting
a value switches to one shared setting for all pages.

## Alternatives

- **Keep OCR and cleanup in the Pages panel More menu.** Rejected: that menu is
  for changing the page set, and people did not look there for content tools.
- **A Scan side panel beside Properties and Comments.** Rejected: the right
  panel describes the selection, and a persistent panel costs page width for
  occasional work. The page notice carries per-page status instead.
- **Analyze only the sample and apply its settings everywhere.** Rejected as
  the default: tilt and edges differ page by page in real scan batches. It
  remains available as the shared-settings choice.

## Consequences

- The toolbar holds two labelled buttons beside icon-only tools; those labels
  are what make the scan tools easy to find.
- Opening Clean up scans renders and analyzes the sample page on the main
  thread. Applying with per-page settings renders every page in scope once.
- Re-cleaning a page replaces its processed image asset rather than adding one.
