# PDFree internationalization plan

> Historical record, archived 2026-10-20. M0–M5 are complete; the implementation
> was committed in `536108d` and country-flag artwork followed in `e038d62`.
> Baseline descriptions, counts, publication statements and implementation
> instructions below retain their execution-time context. Current contracts live
> in [architecture](../architecture.md#interface-messages-and-languages),
> [usage](../user-guide.md#choose-a-language),
> [development](../development.md#interface-copy) and
> [ADR 0011](../adr/0011-browser-local-internationalization.md).

Status: M0–M5 complete. Publication authorized on 2026-10-17.
Prepared: 2026-10-16, against `b06f3a4`.
Sulion plan: `ee0a1e9d-dbdd-4e1e-a8ef-388cb35b0a25`.

## Outcome and scope

Extract every PDFree-owned interface string into translation catalogs, prevent
new hard-coded UI copy through normal CI, translate the interface into major
languages, and let users switch languages from a flag button in the bottom
status bar. Switching must preserve the open documents, edits, selections,
history, pending work and local recovery state.

On 2026-10-17 the user authorized execution of all six milestones. Implementation
and validation were in scope; the user separately authorized commit and push
on 2026-10-17.

Keep the existing layout, positions and reading direction. RTL mirroring,
vertical text layouts and redesign for translated text expansion are deferred.
Arabic translations are included without claiming a completed RTL experience.
Also exclude PDF-content translation, new OCR languages, PDF font/shaping work,
translated documentation and localized social-preview artwork.

Documents, credentials, translation catalogs and language preferences remain
within the existing browser/static-assets boundary. No application backend,
translation API, external font dependency or hosted translation service is
needed. Language is an application preference, not part of a PDF or project.

## Baseline sources and reuse

| Source                                                                                      | Observed behavior and implication                                                                                                                            |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/main.tsx`, `frontend/package.json`                                            | React entry point; no localization dependency is declared. Initialize one application translation instance and bind React to it.                             |
| `frontend/src/components/Footer.tsx`                                                        | Composes draft and offline status. Add the language control here without moving existing tools.                                                              |
| `frontend/src/components/ui/ActionPopover.tsx`, `Tooltip.tsx`                               | Existing Floating UI positioning, dismissal and focus behavior can support the picker and its accessible label. Extend these only where the picker needs it. |
| `frontend/src/components/DraftStatus.tsx`, `EditorNotifications.tsx`                        | English status strings currently drive comparisons and branching. Introduce semantic states before translating them.                                         |
| `frontend/src/hooks/useTask.ts`                                                             | Busy labels, notifications and errors are raw strings, including displayed `Error.message`. This is a central message boundary.                              |
| `frontend/src/services/pdfWorker.ts`, `securityWorker.ts`, `ocrWorker.ts` and their clients | Workers send string errors/progress. Move to serializable message descriptors; preserve credential error codes, cancellation and worker termination.         |
| `frontend/src/core/importPdf.ts`, `model.ts`, `exportPdf.ts`                                | Warning text is stored on sources, used to classify structures, and inserted into export errors. Replace behavioral prose with stable diagnostic codes.      |
| `frontend/src/core/projects.ts`, `projectSchema.ts`, `refreshSources.ts`                    | Project versions 1–4 store source descriptors and regenerate source-derived warnings on load. Keep these formats readable.                                   |
| `frontend/src/services/drafts.ts`                                                           | Draft model revision 5 stores the full editor document. A changed warning shape needs an explicit revision and backward migration.                           |
| `frontend/src/services/settings.ts`                                                         | Existing local preference subscription pattern includes same-tab and cross-tab updates and storage-failure handling. Reuse the pattern for language.         |
| `frontend/src/hooks/usePlacement.ts`, `components/CommentEntry.tsx`, `EmptyWorkspace.tsx`   | Date displays currently use the browser default locale. Centralize display formatting and make newly inserted dates use the selected locale.                 |
| `frontend/eslint.config.ts`, `vitest.config.ts`                                             | Extend existing AST-based lint and Vitest checks; do not create a second test runner.                                                                        |
| `frontend/vite.config.ts`, `services/offline.ts`                                            | Offline access is opt-in and precaches compiled JavaScript. Locale modules must remain available in an installed offline copy.                               |

The source inspection identifies the affected boundaries; it is not a completed
string inventory. M1 must inspect every production UI/message producer, including
helpers outside the component directory.

## Design decisions

### Catalogs and runtime

Use `i18next` with `react-i18next`, pinned through pnpm during M0. They supply
React updates, language fallback, plural selection and TypeScript integration
without a custom translation engine. Keep the wrapper small and select the
typed API supported by the pinned versions. Verify React/TypeScript compatibility
at that milestone rather than recording an untested version here.

Create `frontend/src/i18n/` with the locale registry, initialization, formatting
helpers, types and catalogs. English is the canonical catalog and fallback.
Use semantic keys, complete sentences, named interpolation values and native
plural forms. Do not concatenate translated sentence fragments or use English
prose as keys. Render translations through React; do not introduce raw HTML.

Use TypeScript catalog modules so Vite emits ordinary application JavaScript.
Load English and the selected locale, with other locale modules loaded on
demand from the same origin. Include every locale chunk in the existing opt-in
offline package. Do not download every language on an ordinary online visit.
Provide localized loading/failure messages from the already available catalog;
do not replace the active language until the requested catalog is ready.

Use `Intl` with the active locale for displayed dates, times, counts, sizes,
percentages and lists. Keep machine values, numeric parsing, serialized formats,
PDF coordinates and existing document text independent of UI formatting.

### Messages, state and compatibility

Define a typed, structured-clone-safe message descriptor containing a stable key
and permitted interpolation values. UI state and worker responses carry the
descriptor, not already translated prose. Translate at the rendering boundary,
so open notifications and ongoing progress follow language changes.

Represent task kinds, draft phases and structural diagnostic categories with
stable IDs. Replace comparisons such as `busy === "Opening files"` and
`status.startsWith("Removed from library.")` with those IDs. Translation must
not influence cancellation, recovery, composition checks or supported-PDF rules.

Catalog all PDFree-owned errors, warnings, validation messages, confirmation
copy and progress. Map known third-party/Tesseract/Zod failures and statuses to
application message keys. Unknown failures use a localized operation-specific
fallback. Do not display arbitrary raw exception prose as normal UI copy or
guess an error's meaning by translating/parsing its English text.

Source warning codes are derived metadata. When changing their stored shape,
increment the draft model revision and regenerate diagnostics for old drafts
from their existing source/working bytes through the established migration path.
Preserve ciphertext, encryption metadata, stable page IDs, geometry, user edits
and credentials' transient lifetime. Project versions 1–4 remain readable; their
source-derived diagnostics are regenerated on opening, so this change should
not require a new project ZIP version. Confirm that assumption in M0.

Locale changes never translate or rewrite PDF contents, field names/options,
comments, bookmarks, entered text, source titles/authors or existing filenames.
Localize newly created application defaults where appropriate, then treat a
created document value as content. Switching language must not rewrite it.

### Language selection

Use one registry of BCP 47 codes, English names and native names:

| Code      | Language             | Picker name        |
| --------- | -------------------- | ------------------ |
| `en`      | English              | English            |
| `es`      | Spanish              | Español            |
| `fr`      | French               | Français           |
| `de`      | German               | Deutsch            |
| `it`      | Italian              | Italiano           |
| `pt-BR`   | Brazilian Portuguese | Português (Brasil) |
| `ru`      | Russian              | Русский            |
| `zh-Hans` | Simplified Chinese   | 简体中文           |
| `zh-Hant` | Traditional Chinese  | 繁體中文           |
| `ja`      | Japanese             | 日本語             |
| `ko`      | Korean               | 한국어             |
| `hi`      | Hindi                | हिन्दी             |
| `ar`      | Arabic               | العربية            |
| `bn`      | Bengali              | বাংলা              |
| `id`      | Indonesian           | Bahasa Indonesia   |
| `tr`      | Turkish              | Türkçe             |
| `vi`      | Vietnamese           | Tiếng Việt         |

Initial selection uses a valid saved choice, then the ordered browser language
preferences, then English. Resolve regional/script variants through an explicit
tested mapping, including Chinese script selection and the available Portuguese
variant. Unsupported or corrupt preferences fall back safely.

Add a compact flag-icon button at the end of the bottom status bar using the
existing icon set. It opens a popover above the footer with a visible language
heading, native names, optional English secondary names and a selected check.
The flag is the trigger; readable names identify languages. The trigger's
localized accessible name includes the current language.

Reuse Floating UI focus/dismissal behavior. Support keyboard selection, Escape,
outside-click dismissal and focus return. Selecting a language updates interface
text and `document.documentElement.lang` immediately after loading, without a
reload. Keep the existing direction/layout. Persist the choice locally and
update other open PDFree tabs using the existing preference subscription pattern.
If storage fails, switching still works for the current page and reports that
the preference could not be saved.

### Hard-coded string guard

Add one tested AST rule/check to the existing lint pipeline and exercise it in
Vitest. Cover JSX text, text-bearing attributes, accessible names, tooltips,
placeholders, dialog/menu labels, option labels, UI configuration objects,
template literals, notifications, confirmations, errors and progress producers.
Include literals assigned to local variables before rendering, not only inline
JSX. Pair the rule with typed message boundaries for hooks, workers and derived
diagnostics so application copy cannot bypass the catalog through plain strings.

Do not rely on an English-word regex or claim that static analysis proves the
origin of every arbitrary runtime string. The guard, typed boundaries, fixture
tests and M1 producer inventory establish the enforced boundary together.

Allow catalogs, test/fixture text, document/user content, proper names, keyboard
tokens, and machine strings such as imports, IDs, CSS selectors, MIME types,
PDF dictionary names and protocol values. Express technical exceptions by
syntax/known boundary; keep unavoidable individual exemptions narrow and
reasoned. Do not exempt whole production directories, ignore legacy UI copy,
or add a general prose allowlist.

Catalog checks require complete logical key coverage, nonempty values,
matching interpolation variables and the plural forms required by each locale.
Different languages may have different plural suffix sets. English fallback is
a runtime recovery mechanism, not permission to ship incomplete catalogs.

## Milestones and acceptance

### M0 — Localization foundation

Scope: typed catalogs/runtime, registry and locale negotiation, message/state
contracts, formatting, and the draft-warning compatibility design. Prove one
representative component and worker failure can use the same message contract.

Acceptance: the selected language and English fallback resolve deterministically;
unsupported locales and storage failures are safe; interpolation/plurals are
typed/tested; worker messages serialize without credentials or document bytes in
their parameters; old draft diagnostics have a tested migration path. Record
the string-ownership rules that M1 and M2 will enforce.

Evidence: focused unit tests and source review of task states, warning
classification, security errors and persistence. Check a controlled legacy draft
against the proposed current shape before the broad extraction.

### M1 — Complete string extraction [depends on M0]

Scope: inventory and extract every PDFree-owned runtime string across components,
hooks, services and core error/validation/progress producers. Include empty
states, forms, dialogs, tooltips, accessibility text, offline/update UI, batch
results, signing/encryption, scan tools and library/recovery. Remove prose-based
control flow. Generate static HTML/PWA fallback copy from the canonical catalog
where applicable rather than maintaining duplicate hard-coded prose; update
runtime page metadata through the selected locale.

Acceptance: all application UI copy resolves through the English catalog;
document/user content remains untouched; notifications and warnings use message
descriptors; unknown third-party failures have localized fallbacks; existing
English behavior, credential retry, composition rejection, cancellation, drafts
and projects still work. Any derived warning shape change uses the established
revision/migration contract. No remaining first-party UI string is excused as
legacy debt.

Evidence: inspect every producer from the inventory, run focused error/worker and
persistence contracts, then the existing unit/browser checks. Test a worker
failure and recovered legacy draft warning through actual UI rendering.

### M2 — Hard-coded string guard [depends on M1]

Scope: enable the AST guard and catalog-integrity tests as errors in normal
`make ci` and the shared CI path. The rule may be developed alongside M1, but
this milestone is complete only when extraction passes without a legacy baseline.

Acceptance: intentional hard-coded visible text, a tooltip, an ARIA label, a
template message, an indirect label variable, and a worker error/progress message
each fail a fixture test. Equivalent catalog-driven examples pass. Machine
identifiers, document-derived labels and test fixtures remain valid. Missing
keys, placeholders and required plurals fail catalog tests. Normal CI is green.

Evidence: positive and negative Vitest fixtures against the rule/check, catalog
mutation fixtures, and the production-source scan through the normal commands.

### M3 — Major-language translations [depends on M1, M2]

Scope: complete the other 16 catalogs, preserving full messages, interpolation,
plural rules, contextual labels and language-native terminology. Establish a
small shared glossary for PDF fields, annotations, certificate signing,
certification, encryption, recipient credentials, flattening, drafts and OCR.

Acceptance: every locale has every logical message and required plural form;
no placeholder or English fallback masks an untranslated entry. Security and
destructive-action copy retains its meaning. Review short ambiguous controls
in context. Do not claim native-speaker review unless it occurred; track any
linguistic uncertainty in the working plan without substituting it for missing
translations. Arabic coverage does not depend on the deferred RTL work.

Evidence: catalog-integrity tests, plural/interpolation cases per language family,
and contextual review of representative workflows and terminology. Checks prove
catalog integrity, not translation quality by themselves.

### M4 — Footer language switching [depends on M0, M3]

Scope: the flag button and language popover, immediate updates, local persistence,
cross-tab updates, metadata language, and same-origin/offline catalog loading.

Acceptance: all 17 choices are discoverable and keyboard-accessible from the
bottom status bar; the selected choice survives reload; language changes do not
reload the app, remount the editor, cancel a worker or alter document/history
state. Open notifications update. Failed preference writes retain the current
page's selected language. An installed offline copy can select any language
without a network connection. Plain visits still do not install a service worker.
Existing layout and reading direction remain as requested.

Evidence: browser interaction/accessibility tests for the trigger/popover,
preference/negotiation tests, and production-bundle offline tests covering locale
chunks and installation/update behavior.

### M5 — Cross-locale release checks [depends on M2, M3, M4]

Scope: run every locale through representative UI states and exercise switching
with active edits, tabs, a pending operation, source warnings and draft recovery.
Document the supported languages and explicitly deferred layout/direction work
in existing usage/architecture documentation and the changelog.

Acceptance: no raw translation keys, missing copy or unexpected English fallback;
required locale glyphs render using the established browser font boundary; no
locale or translated diagnostic leaks into project content. Generated PDF text,
field values, comments and signatures remain the intended document content.
Current unit, browser, production and applicable security checks pass. Translation
expansion/RTL layout defects may be recorded for the deferred work, but missing
strings, broken controls or changed document semantics are not deferred.

Evidence: a parameterized smoke test for all locales, deeper switching/error
journeys in Chromium/Firefox/WebKit, offline tests, and independent readers for
saved PDF/project content. Compare immutable source bytes and canonical editing
content; do not demand identical regenerated PDF bytes when existing metadata or
signature timestamps make exports nondeterministic.

## Sulion mapping

| Milestone | Phase ID                               | State    |
| --------- | -------------------------------------- | -------- |
| M0        | `b16869a7-35de-46b7-9bfd-3ab0fb76c9d1` | Complete |
| M1        | `c9b74d9c-607b-43d8-a8d7-79d02ff8bab1` | Complete |
| M2        | `ac10023d-2168-4308-9565-1502b4717c16` | Complete |
| M3        | `0ef689b1-29a3-401d-b0fa-3d4d7395d3d1` | Complete |
| M4        | `6395ba94-ebe2-45cf-97df-972b21ddf01d` | Complete |
| M5        | `9fe80327-0049-442b-91c2-10bd85328b18` | Complete |

## Scope decisions and deferred work

The completed feature uses the 17-locale roster above as the plan's interpretation
of “major languages.” Catalog/runtime work remains independent of future roster
changes. No native-speaker review has occurred.

Use the existing Flag icon for the requested trigger. A later preference for
country-flag artwork can change that presentation without changing language IDs
or requiring a redesign. No such artwork choice blocks this plan.

M0 established pinned i18next versions, the typed API and draft migration.
The user owns any future scope expansion to layout/RTL, OCR languages,
PDF-content translation or hosted services. The completed milestone expansions
and their evidence follow.

## M0 execution

Sulion expansion: `4a04c2e1-9381-40e7-8087-2b8a3bf32e28`.

1. Message contract and catalogs (`66aaf49b-52cf-4055-983e-074eb7ee9027`).
   Add a semantic English catalog, typed interpolation and plain message
   descriptors in `frontend/src/i18n/`. Define diagnostic codes independently
   of rendered text. Verify serialization and interpolation with focused tests.
2. Locale runtime (`a3ee9aa5-ba69-45e5-9636-e695ca41dc22`).
   Add pinned i18next/React bindings, explicit locale negotiation, atomic catalog
   loading, browser-local preference subscriptions and Intl display helpers.
   Verify fallback, races, storage failure and the React update boundary.
3. Compatibility and verification (`e5c3f0c7-901b-470a-9640-b047c53c6169`).
   Replace structural warning prose with diagnostic IDs, migrate draft revision
   5 to revision 6 without changing source bytes or edits, and retain project
   formats 1–4. Verify legacy warnings, geometry and encrypted-source retention.

M0 evidence: strict type checking and focused foundation, worker-client,
export/utility unit checks pass. Chromium draft migration checks pass, including
a revision-5 encrypted-source snapshot: original ciphertext, working bytes,
encryption metadata, page geometry and edits are retained while old warning prose
is regenerated. Draft revision is now 6; project ZIP versions remain 1–4.
During M0 the worker protocol temporarily accepted the previous string field.
M1 removed that compatibility path; the final protocol carries descriptors only.

Technical references checked during planning:
[i18next TypeScript](https://www.i18next.com/overview/typescript),
[plural handling](https://www.i18next.com/translation-function/plurals),
[language fallback](https://www.i18next.com/principles/fallback), and
[React bindings](https://react.i18next.com/latest/usetranslation-hook).

## M1 execution

Sulion expansion: `731668a1-4f90-4dfd-aa1b-0d17230f4b6e`.

1. Core and worker messages: semantic errors, validation and progress descriptors;
   credential retry codes remain independent of language. Invalid worker responses
   reject with a localized fallback; source warning IDs remain derived metadata.
2. UI copy and semantic states: catalog component copy and complete dynamic messages,
   preserve descriptors in task/confirmation/error state, and remove English-controlled
   behavior. Localize new defaults and display formatting without rewriting content.
3. Static copy and verification: generate HTML/PWA metadata from the canonical catalog,
   inspect remaining producers, and run unit/browser and type/lint checks. The AST
   guard is developed alongside extraction to identify missed indirect producers.

M1 evidence: `make ci` passed 566 tests with one skip across 61 files,
including Chromium interaction checks. `make build` passed; actual generated
HTML resolves canonical metadata without placeholder tokens. Core/worker errors,
credential retries, cancellation, local drafts and projects retain their existing
contracts. The extraction guard runs without a legacy-copy baseline. Shared lint
warnings remain warnings; no lint errors remain. Display numbers now use the
selected locale while numeric input values and document serialization remain
machine values. No publication occurred.

## M2 execution

Sulion expansion: `cc77d698-f5bd-46d4-af36-c47a594fb191`.

1. Guard enforcement (`51bc5cf0-86b9-450b-985e-613e8a8f949b`): the
   TypeScript AST guard in `frontend/tooling/uiCopyGuard.ts` runs as an ESLint
   error. It traces local label variables, checks JSX/config/message producers,
   and rejects translations evaluated at module initialization. Technical
   exceptions name products, the bundled font, a standard paper size and keyboard
   notation. Catalogs and test fixtures are explicit ownership boundaries.
2. Catalog contracts (`a7ba06aa-d4c7-4493-8fc0-1f0b3ed1ea28`): integrity
   checks require logical keys, nonempty copy, matching interpolation and the
   forms from `Intl.PluralRules`. English physical plural suffixes do not constrain
   other languages. Translation coverage is added to these checks in M3.

M2 evidence: negative/positive AST fixtures, catalog mutation fixtures, locale
negotiation, worker-message serialization and actual HTML transformation pass.
The normal `make ci` path passes with the guard enabled and no legacy baseline.
Static checks and typed boundaries enforce owned copy; they cannot establish the
origin of arbitrary runtime document strings, which remain intentionally opaque.

## M3 execution

Sulion expansion: `e00f8630-689a-45ba-afac-4a39275ae973`.

1. Catalog authoring (`0f07c9c7-3aa2-44ea-8913-9bf17cb2e57c`): author
   the 16 non-English catalogs as semantic-key TypeScript data. Preserve complete
   messages, named interpolation, credential/destructive-action meaning and native
   plural forms. Catalogs do not spread English fallback data. Split by the same
   message domains when useful; load one compiled locale module on demand.
2. Coverage and terminology (`db32d142-5388-4f59-ab2f-3e3f3e5f77d6`): run
   integrity checks for every registered locale, review terminology in representative
   editing, scan, library and security workflows, and test interpolation/plural
   families. Machine checks establish structural coverage, not native-speaker review.

Translation glossary: distinguish visual signature marks from certificate signing;
certification applies PDF permission restrictions; encryption protects output bytes;
recipient credentials unlock certificate-protected inputs; flattening makes form
values part of page content; drafts are editable device-local recovery copies;
OCR recognizes existing scan text and does not translate document content.

### Exportable defaults prerequisite

Sulion branch: `71d8f2c9-dd85-41b9-b5be-45e5ca3678e9`.

1. Default content boundary (`622c79c6-78dd-4fa0-a3ed-abc61e59f83f`):
   the actual bundled Noto Sans PDF font lacks CJK, Hindi, Arabic and Bengali
   glyphs, including Arabic/Bengali digits. Keep UI formatting fully localized.
   New document dates use the locale's numeric date order with Latin digits and
   omit format-control characters. Stamp templates use translated text where
   exportable and explicit `APPROVED` document content where the existing font
   cannot export the local script. This is document-template policy, not missing
   UI translation or an English catalog fallback.
2. Font and content checks (`8cdcaad0-b742-4432-a0a7-c364e23d9424`):
   check all locale date formats against the actual bundled font, verify
   representative date orders, and check each complete catalog's stamp glyphs.
   Existing document strings are never changed by switching language.

M3 implementation adaptations: TypeScript exceeded its complexity limit on a
thousand-variant recursive message union. Opaque descriptors now enforce factory
construction without enumerating that union; factories still type-check keys
and required interpolation, and worker payloads validate their exact shape.
Translation review also exposed English fragment/plural assumptions in OCR and
document/compression summaries. These now use complete plural messages and
nested descriptors before other languages are authored.

Default prerequisite evidence: all 18 date/font tests pass, covering all 17 locale
codes and representative date order. Strict TypeScript checks pass. Complete
catalog tests also check stamp glyphs against the real bundled font; their full
17-language coverage remains part of M3. No PDF fonts or shaping behavior changed.

M3 evidence: all 16 non-English catalogs are complete. All 45 focused catalog,
foundation, document-default and integrity checks pass, including all 17 locale
modules, native plural families, nested summaries, exact interpolation and actual
PDF stamp-font glyph coverage. Strict TypeScript and localization lint pass.
Contextual review retained credential limits, protection scope, visual versus
certificate signatures, destructive-action meaning and English-only OCR.
Portuguese includes explicit zero forms in addition to its CLDR categories.
Russian groups its four native plural forms in a typed catalog-data helper;
the same helper supports languages with one category without copying English
plural forms.
Count-neutral sentences can declare one invariant value for every native plural
category; messages whose grammar changes declare each form explicitly. Arabic
uses all six CLDR categories, including distinct zero, singular, dual and plural
word/page/file labels. No native-speaker review has occurred.

## M4 execution

Sulion expansion: `a6898785-c0a8-4ba8-9e78-eb9cf759fdd3`.

1. Footer picker and startup: extend the existing popover with optional icon-only
   presentation and placement while preserving its defaults. Add the footer Flag
   control with native radio choices, selected state, keyboard dismissal and focus
   return. Initialize local/browser preferences before first rendering; switching
   updates translations without replacing the document session tree.
2. Interaction and failure checks: test all choices, preferences, cross-tab updates,
   failed loading/storage, active edits/history/selection and translated progress.
   Verify opt-in offline catalog switching against the actual production bundle.
   Keep normal visits free of service-worker registration.

M4 evidence: five interaction checks pass in Chromium, Firefox and containerized
WebKit. Production checks pass in Chromium and WebKit: all 17 choices work with
network access disabled, preferences survive reload, source bytes and entered
PDF/project content remain unchanged, and another tab updates live OCR progress
without canceling its worker. WebKit also passes representative script-glyph and
picker accessibility checks. The actual build emits 16 lazy non-English chunks;
the opt-in offline package includes them. Host WebKit lacks system libraries;
the established Playwright Docker target supplies the required environment.

## M5 execution

Sulion expansion: `366ec8a8-838b-43e9-b509-1ace30151686`.

1. Contracts and regression coverage: document supported languages, preference
   precedence, semantic messages/diagnostics, draft revision 6 and deferred
   layout/PDF-font scope in existing documentation and an ADR. Exercise recovered
   legacy diagnostics through the translated UI and keep parser resources explicit
   for independent saved-byte reading.
2. Final gates and review: run the normal CI gate, all browser engines, production
   bundle journeys and native security verifiers. Review the final diff for copy
   ownership, credentials, immutable content and unrelated changes. Record actual
   results and limitations in this plan and chat; no publication is authorized.

M5 evidence: `make ci` passes 609 tests with one skip across 64 files, with no
lint errors and passing TypeScript, frontend formatting and Terraform formatting.
All 117 browser interaction tests pass in Chromium, Firefox and WebKit. The
production suite covers 32 checks in Chromium and 31 in each other engine, with
the existing Chromium-only large-scan check skipped in Firefox/WebKit. Chromium's
initial run exposed one stale OCR `(s)` selector; its corrected assertion and
affected suite pass on rerun. The final test edits also pass lint, types and
formatting. The mock-provider hosting test passes against the actual build.

Production journeys verify all 17 languages offline, representative script glyphs,
picker accessibility, preference reload, unchanged source bytes and entered
PDF/project content, and live cross-tab OCR progress without cancellation. A real
PDF worker's XFA rejection renders in French and changes to Spanish while its
banner remains open. Recovered revision-5 source warnings render in French while
saved values, page IDs and source bytes remain intact. The independent PDF.js
reader uses explicit local standard-font resources; parser resource warnings no
longer appear in these checks.

All 45 native security/PDF checks pass, including OpenSSL, qpdf, Poppler and
PDFBox readers for signatures, encryption, comments and utility output. Final
review retains immutable source bytes, credential lifetimes and unchanged project
formats. No infrastructure, deployment workflow or other repository was changed.
Temporary test servers and containers are stopped. Translation quality has not
received native-speaker review; RTL/layout, OCR languages and PDF font/shaping
changes remain deferred as scoped. The current-branch changes are local and
unpublished.
