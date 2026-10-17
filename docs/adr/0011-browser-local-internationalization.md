# 0011 — Browser-local interface internationalization

- Status: Accepted
- Date: 2026-10-17
- Extends the derived-diagnostic and draft contract in [0004](0004-projects-drafts-and-retained-pwa.md).

## Context

PDFree needs translated application copy and a footer language picker while
preserving browser-only processing and current layout. English status strings
previously controlled some task and diagnostic behavior. Source warnings also
appeared in persisted drafts, so changing them requires a migration rather than
translating stored prose. Existing PDF fonts do not cover every UI script.

## Decision

Use pinned i18next and React bindings with semantic English keys, typed named
values, complete native-language catalogs and Intl formatting. Resolve messages
when rendered. State and worker replies carry validated `{ key, values }`
descriptors; task kinds, credential retry codes, cancellation and source
diagnostic categories remain stable IDs. Unknown library errors receive
localized operation-specific messages.

Load locale JavaScript from the existing static origin on demand and precache
all locale chunks only in the opt-in offline copy. Store the language preference
in browser local storage, outside editing state. Resolve saved preference,
ordered browser preferences, then English. Change language without remounting
the session tree. Preserve the active language on load failure and the current
page's new language on preference-write failure.

Advance drafts to model revision 6. Regenerate older source diagnostics from
existing working/original bytes while preserving ciphertext, encryption
metadata, IDs, saved geometry and edits. Portable project versions 1–4 remain
readable and retain their formats.

Use the existing Flag icon and popover for native-name language choices.
Extend shared UI controls through optional properties with preserving defaults.
Enforce copy ownership with an AST lint rule, typed message boundaries and
catalog/plural/interpolation tests. Do not permit a legacy-copy baseline or
English spreads to conceal missing translations.

Treat created document defaults as content. New dates use locale order with
Gregorian dates and Latin digits; stamp templates are translated where the
existing PDF font supports them, otherwise use explicit `APPROVED` content.
Never rewrite existing document text when language changes. Browser font
fallback handles interface scripts independently of PDF fonts.

## Alternatives considered

- Translating stored English prose couples behavior and persistence to language
  and prevents existing notifications from updating correctly.
- Eagerly downloading every language increases ordinary-visit transfer for a
  feature whose catalogs can be loaded independently.
- A translation backend or hosted service crosses the existing static/browser
  boundary without being needed for language selection.
- Expanding PDF font shaping or RTL layout during extraction changes separate
  document/layout requirements that the user explicitly deferred.

## Consequences

All 17 catalogs must stay complete when application copy changes. Machine checks
establish structure and execution, not native-speaker review. Browser font
availability still depends on the platform. Arabic is translated without
claiming an RTL layout; vertical reading order, document translation, additional
OCR languages and PDF font/shaping changes remain separate work.

See [architecture](../architecture.md), [usage](../user-guide.md#choose-a-language)
and [development](../development.md#interface-copy).
