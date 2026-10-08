# PDFree: browser PDF filler plan

Prepared 2026-10-07. Implementation is authorized and underway.
Updated after reviewing the local Ahara integration guide, language standards,
shared workflow, and website module on the same date.

## Outcome and authorization

Build a browser application for filling interactive and scanned PDF forms, placing
visible signatures, organizing pages, splitting documents, and saving/exporting.
PDF bytes, entered values, signature assets, and drafts stay on the user's device.
The application will integrate with Ahara at `https://pdf.ahara.io`, using the
platform's static website deployment. CloudFront delivers application assets from
private S3; user documents are processed and saved locally. No PDF application
backend, upload service, or runtime cloud-processing dependency is required.
Publication is a separate action requiring authorization. Public use without
login is the recommended default, not a settled user requirement.

The user authorized execution of M0–M6 and correction of the removed-WAF claim in
Ahara's guide. Leave the shared website MIME handling unchanged unless an actual
failure establishes a required fix. The project began with no application code.

## Recommended product

One editor with a page-thumbnail sidebar, central document canvas, compact tool
toolbar, contextual object properties, and a persistent export action. Desktop and
tablet get the complete workspace; narrow screens use drawers and touch controls.
Open files through a picker or drag/drop. All tools act on the same document state.

### Required capabilities

- Native PDF forms: text, multiline text, checkboxes, radio groups, dropdowns, and
  lists. Highlight fields, support tab navigation, honor read-only/required flags
  and maximum lengths, and report overflowing values. Do not execute arbitrary
  embedded PDF JavaScript; unsupported scripted calculations must be identified.
- Ad hoc filling: place text anywhere on scanned or non-fillable pages. Move,
  resize, rotate, duplicate, and delete objects; change font, size, color,
  alignment, and multiline layout. Provide checkmarks, crosses, and dates.
- Signatures and initials: draw with mouse/touch/pen, type using bundled fonts,
  or import a local image. Trim whitespace, preserve transparent backgrounds,
  place and resize precisely, and optionally remember assets locally.
- Page rotation: persist 90/180/270-degree rotations for selected pages or the
  whole document. Existing fields and added objects must stay aligned.
- Splitting: split after specified physical page numbers, every N pages, into
  individual pages, or by explicit output ranges. For example, splitting after
  pages 3 and 7 produces pages 1–3, 4–7, and 8–end. Show output previews,
  validate ranges and omissions, and download separately or as one ZIP.
- Save/export: export the whole document or a selection; retain native fields
  or flatten their appearances into page content. Save a portable editing project
  separately so added objects remain movable when reopened in PDFree.

### Additional features recommended for the complete first release

- Undo/redo across field edits, object edits, and page operations; copy/paste,
  duplicate, keyboard nudging, alignment guides, and multi-selection.
- Reorder, delete, duplicate, and extract pages; merge PDFs; insert PDF pages,
  local images, and blank pages. Preview batch operations before applying them.
- Images and stamps; freehand ink, lines/arrows, rectangles, and highlights.
  Use PDF text selection for text highlights where available; offer area
  highlights for scans. A visual cover rectangle is never labeled redaction.
- Create genuine fillable fields on static forms: text fields, checkboxes,
  radio groups, and dropdowns, with names, options, tab order, and required flags.
- Zoom, fit width/page, text search, page jump, thumbnails, and existing outline
  navigation. Search on image-only pages requires the later OCR extension.
- Local draft recovery, an explicit clear-local-data action, unsaved-change
  indicators, and portable project download/import. Browser storage alone is
  insufficient as the durable save format.
- Print, page-image export, and basic document properties. Bundle fonts with
  verified character coverage so supported text exports correctly.
- An offline-capable application with bundled workers, fonts, and dependencies.
  Document processing must work with networking disabled after installation.

Research basis: SimplePDF documents browser-local text, checkboxes, signatures,
images, merging, deletion, and rotation. PDFgear documents native/static filling
and fillable-field creation. Adobe's web tools establish the wider categories of
annotation, form filling, signing, and page organization. These sources inform
feature selection; their engines and services are not dependencies.

## Architecture and durable data

Recommended starting stack: TypeScript, React, Vite, pnpm, PDF.js for viewing and text/
annotation layers, and pdf-lib as the first export-engine candidate. Confirm the
writer in M0 before building the editor around its capabilities. PDF.js documents
separate parsing, display, and viewer layers; pdf-lib documents browser operation,
form filling/creation, page copying, fonts, and drawing.

Keep original PDF bytes immutable. A versioned editing model owns stable page
identities and their source-document references, page order/rotation/crop geometry,
native field identity and values, added fields, text/ink/image/signature objects,
and reusable assets. Store object geometry in PDF page coordinates rather than
screen pixels, with explicit transforms for zoom, crop offsets, and rotation.
Page identities survive reorder and split; field widgets remain associated with
their owning fields even when a field appears on multiple pages.

Rendering, selection, undo/redo, draft recovery, and export all consume that model.
Use workers for expensive processing and render only visible pages plus a bounded
buffer. Release canvases and temporary buffers as documents change. Browser memory
still limits very large scans; M5 measures supported sizes rather than promising
unbounded files.

Portable projects contain a versioned manifest, source PDFs, placed assets, field
values, and edits. Local drafts use browser storage and expose saving failures or
quota exhaustion. Exported PDFs preserve source text/vectors and images instead
of converting every page to a screenshot. Flattening embeds field appearances;
it does not make a document tamper-proof or provide cryptographic signing.

Browser download is the universal save path. Direct file saving is an enhancement
where available, with the same export result and a download fallback.

## Ahara integration and language guidance

Current source contracts: `../ahara/INTEGRATION.md`, `../ahara/CI-WORKFLOW.md`,
`../ahara-standards/standards/typescript.md`, `project-structure.md`, `scripts.md`,
`terraform.md`, and `testing.md`. The actual hosting implementation is
`../ahara-tf-patterns/modules/website/{main,variables,outputs,terraform}.tf`.
Ahara's index repo owns guidance and shared workflow tooling; platform IAM changes
belong in `ahara-infra`, and PDFree's application/website Terraform belongs here.

### Language and repository conventions

- Put the TypeScript/React application in `frontend/`, with strict TypeScript,
  `.ts`/`.tsx` authored source, Vite, and a committed pnpm lockfile. Pin pnpm
  through `packageManager`; the reviewed standard and shared CI use 10.29.3.
  Pin the local Node version compatibly with shared CI's Node 24 runtime.
- Use the required shared `@ahara/standards` ESLint rules and React/accessibility
  plugins, Prettier, and Vitest with co-located `.test.ts`/`.test.tsx` files.
  Observe the documented complexity and function/file-size limits. Keep ordinary
  styling in CSS classes and theme custom properties. PDF coordinate transforms
  need computed geometry; apply the documented dynamic-value exception narrowly.
- No Rust/Python backend is needed. Reusing a browser WASM dependency does not
  justify introducing a separate authored service or language stack.
- Include `README.md`, agent instructions, `LICENSE`, `.gitignore`, `Makefile`,
  `platform.yml`, `.github/workflows/ci.yml`, and `scripts/deploy.sh` in the initial
  scaffold. Use MIT per the integration guide unless the selected PDF engine
  requires a different license, which is an explicit decision before adoption.
- Keep secrets broker-backed in this environment. Documentation for other
  installations may describe ordinary environment variables; no application
  secret or AWS credential is embedded in browser assets.

### Platform identity, infrastructure, and CI

- Keep project/repository key and AWS resource prefix `pdfree`; hostname is
  independently `pdf.ahara.io`. Terraform state is `projects/pdfree.tfstate` in
  the existing platform state bucket, with encryption and state locking.
- During authorized implementation, register the deployer in
  `../ahara-infra/infrastructure/terraform/control/project-pdfree.tf`, using the
  managed-project module with `website` bundle and `terraform-state` primitive.
  `project-ahara-portal.tf` is an inspected example of this static-project shape.
  The registration is now prepared locally; remote/deployed state has not been
  checked because the intended credential broker denied access.
- Put PDFree Terraform in `infrastructure/terraform/`; call the shared `website`
  module with `prefix = "pdfree"`, `hostname = "pdf.ahara.io"`, and
  `site_directory = "${path.module}/../../frontend/dist"`. It provisions private
  S3/OAC delivery, CloudFront, ACM, Route 53 A/AAAA records and deploy invalidation.
  Disable the optional new KMS key and explicitly use S3-managed encryption for
  public application assets. Leave `og_config` unset so hosting remains static;
  place ordinary public metadata in the built HTML.
- Declare `project: pdfree`, `prefix: pdfree`, `stack: [typescript, terraform]`
  and `typescript_dir: frontend` in `platform.yml`. Call the shared reusable
  `chris-arsenault/ahara/.github/workflows/ci.yml@main` workflow for lint, typecheck,
  Vitest coverage, governance, Qlty, and engineering reporting. Match its checks
  through `make ci`. Keep deployment disabled until publication is authorized:
  the inspected shared workflow otherwise applies Terraform on pushes to main.
- API/ALB, database/migrations, TrueNAS, and Cognito integration are conditional
  in Ahara's checklist. They do not apply to the recommended public static tool.
  If login becomes a requirement, use the shared Cognito pool and its documented
  MFA behavior; account login still does not move PDF processing off-device.

### Verified source gaps to resolve before deployment

The user confirmed that website WAF provisioning was removed. The guide now
describes that behavior accurately, preserving its still-current permission
bundle information. Do not reintroduce WAF as a release requirement. The user
also directed that MIME handling stay unchanged until an actual failure occurs.

The module supports `response_headers_policy_id` across cache behaviors and
marks `index.html`, `sw.js`, and `manifest.webmanifest` as no-cache. Verify PDF
workers, fonts, any WASM, security headers, service-worker scope/update behavior,
and asset caching together. Use a restrictive same-origin policy compatible with
the chosen engine; only introduce cross-origin isolation when a tested browser
dependency needs it. Do not weaken platform controls to make an asset load.

## Decisions and compatibility boundaries

Settled from the request: browser-only processing, no application backend, visible
filling of scans, persistent page rotation, page-number splitting, PDF export,
Ahara platform integration, and the hostname `pdf.ahara.io`.

Initial assumptions: signatures mean drawn/typed/imported visible marks; React
and TypeScript suit a new browser workspace; PDF.js plus a tested writer can
preserve the supported PDF structures. M0 establishes the writer's compatibility.
Public use without login is recommended because the editor has no remote data
service; the integration guide does not require login for every frontend.

Known limitations in the starting writer candidate:

- pdf-lib explicitly does not support encrypted documents; ignoring encryption
  does not decrypt them. Password opening/editing and password-protected export
  cannot be promised with this writer.
- pdf-lib does not support reading, creating, or modifying XFA fields. Do not
  delete XFA data as an automatic workaround.
- pdf-lib has no specialized digital-signature creation/reading API and no API
  for arbitrary existing page-text editing. Certificate signing and replacing
  original text are distinct capabilities from the proposed filler.

M0 must test form preservation when splitting/merging, duplicate field names,
repeated widgets, Unicode appearances, existing annotations, links/outlines,
rotated/cropped pages, and signed input. Detect unsupported features before
editing and prevent exports that silently discard them. Edits to digitally
signed input can invalidate signatures; the editor must identify that condition
and keep the original available.

If the candidate writer cannot meet the core contract, recommend a different
browser writer before continuing. MuPDF provides a WebAssembly option worth
evaluating, but its license and required APIs need review before selection.
No licensing purchase or change to publication terms is authorized here.

The subsequent request authorized certificate signing, certification and password
export; the security implementation record below covers those additions.
Encrypted-PDF editing and engines requiring different project licensing remain
separate decisions.

## Milestones and acceptance

| Milestone                      | Scope and dependency                                                                                                                | Acceptance and evidence                                                                                                                                                                                                                                                                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| M0: Verify engine              | Compatibility fixtures and writer selection                                                                                         | Round-trip representative native forms and scans with text/signatures, rotation, merge, and split. Reopen exports in independent readers. Record failures, preserved structures, unsupported formats, and license implications before selecting the writer.                                                                                      |
| M1: Workspace                  | Ahara-standard frontend scaffold, local import, viewer, page identities, coordinate transforms, selection, undo/redo; depends on M0 | Required project files, pnpm, shared lint rules, and Vitest are present. Objects keep their position through zoom/rotation/crop changes. Mixed page sizes and page reorder retain stable identities. Browser interaction tests cover these transitions.                                                                                          |
| M2: Fill and sign              | Native fields, ad hoc text/checkmarks, signatures/initials; depends on M1                                                           | Fill interactive and scanned forms, correct an edit with undo, and export the same visible result. Reopened native fields retain values and supported properties.                                                                                                                                                                                |
| M3: Page operations            | Rotation, reorder, deletion/duplication, merge/insert/extract, split preview and ZIP; depends on M2                                 | Output page membership, order, rotation, field values, and added objects match previews. Tests cover boundary ranges, duplicate field names, and mixed-source documents.                                                                                                                                                                         |
| M4: Complete editor and save   | Markup, images, field authoring, drafts, portable projects, export modes, print/image export; depends on M3                         | Reopening a project restores editable objects and values. Flattened and retained-field PDFs match the editor. Storage failures are visible; download works without enhanced file APIs.                                                                                                                                                           |
| M5: Release quality            | Offline packaging, accessibility, browser fidelity, performance, privacy; depends on M4                                             | Check Chromium, Firefox, and Safari, including touch layouts. Verify no document-data requests, offline processing, keyboard operation, representative large scans, and independent-reader exports. Record measured limits.                                                                                                                      |
| M6: Ahara deployment readiness | Deployer registration, website Terraform for pdf.ahara.io, shared CI, built-asset/header review; depends on M5 for final acceptance | Prepare and validate the actual cross-repo registration and project infrastructure. Inspect the Terraform plan, asset MIME coverage, caching, and static-hosting baseline. Keep publication gated on explicit authorization; after authorized deployment, verify HTTPS, workers, reload/offline behavior, and local export on the real hostname. |

Release-quality checks include source fonts, page boxes, pre-existing rotation,
form field appearances, print output, and reload/project round trips. Fixtures
must establish user-observable preservation, not merely that a save API returns
bytes. Public deployment is not part of M5's authorization.
M6 records integration as required work; it does not grant deployment authority.
Its independent scaffold and registration preparation can begin before M5,
while final deployment readiness depends on the verified production bundle.

## Advanced features to consider after the complete filler

Recommended next extension: local OCR for selecting/searching scan text and
searchable-PDF export. Tesseract.js runs in the browser but does not accept PDF
input directly, so render selected pages locally before OCR, then write a verified
text layer. Ship language assets locally, provide progress/cancel, and measure
accuracy and memory. OCR is unnecessary for manually filling scans.

Further separate work: scan deskew/crop/contrast, image-downsampling compression
with quality preview, encrypted-PDF editing, and true content-removing redaction
plus sanitization. Certificate signing and password export were subsequently
authorized and implemented in the security extension below.
Compression must not silently rasterize searchable pages. Redaction requires
content-removal verification rather than covering text with shapes. Cloud
collaboration, signature collection/tracking, and office-format conversion are
outside the current browser filler proposal.

## Sources inspected

- [SimplePDF feature and local-processing description](https://simplepdf.com/help/faq/how-to-edit-pdf)
- [PDFgear form-filling and creation features](https://www.pdfgear.com/pdf-form/)
- [Adobe Acrobat web overview](https://helpx.adobe.com/sg/acrobat/web/get-set-up/learn-the-basics/overview.html)
- [PDF.js layers and distribution](https://mozilla.github.io/pdf.js/getting_started/)
- [pdf-lib features and limitations](https://github.com/Hopding/pdf-lib)
- [pdf-lib form API and XFA limitation](https://pdf-lib.js.org/docs/api/classes/pdfform)
- [pdf-lib signature API limitation](https://pdf-lib.js.org/docs/api/classes/pdfsignature)
- [MuPDF JavaScript/WebAssembly introduction](https://mupdf.readthedocs.io/en/latest/guide/using-with-javascript.html)
- [Tesseract.js scope and browser operation](https://github.com/naptha/tesseract.js)
- [Browser file-system APIs](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API)
- [Ahara integration guide](../ahara/INTEGRATION.md)
- [Ahara CI workflow guide](../ahara/CI-WORKFLOW.md)
- [Actual shared workflow](../ahara/.github/workflows/ci.yml)
- [TypeScript/React standards](../ahara-standards/standards/typescript.md)
- [Project layout](../ahara-standards/standards/project-structure.md)
- [Terraform conventions](../ahara-standards/standards/terraform.md)
- [Script conventions](../ahara-standards/standards/scripts.md)
- [Testing conventions](../ahara-standards/standards/testing.md)
- [CSS conventions and computed geometry](../ahara-standards/patterns/css-architecture.md)
- [Actual shared website module](../ahara-tf-patterns/modules/website/main.tf)
- [Website module inputs](../ahara-tf-patterns/modules/website/variables.tf)
- [Static-project deployer example](../ahara-infra/infrastructure/terraform/control/project-ahara-portal.tf)

## Initial implementation state (2026-10-07)

Root plan: `7a8900cc-b3b7-479e-b4a3-3469cfd33780`.

| Milestone | Phase ID                               | Status    |
| --------- | -------------------------------------- | --------- |
| M0        | `a7e2d51a-8d62-4763-9dc6-31f42f1cc76e` | completed |
| M1        | `8fecf9e0-c7bb-4229-a129-fd974f141f9c` | completed |
| M2        | `0ddf7ca5-ec1b-4dad-a804-95833292a02f` | completed |
| M3        | `4abf28eb-03ac-450c-910f-c6967cf60dd2` | completed |
| M4        | `b4447c6f-8333-4fad-ad59-163acc9e0fa6` | completed |
| M5        | `693428a7-9f4f-4eb8-aa44-fb8c038af5f8` | completed |
| M6        | `75b37709-1a25-4e3f-ab7f-4f47bf512b6f` | blocked   |

The editor and local release checks are implemented through M5. Execution records
below hold verification, limitations and deployment readiness work.

## Execution record

### M0 — PDF compatibility

Expansion: `3c68a557-7695-4e9c-9567-8b97a5b5daf5`.
Scope: prove actual writer/viewer round trips before selecting the engine.
Files: frontend package/toolchain, PDF engine, and co-located compatibility tests.
Steps: establish an executable fixture suite; verify native fields, repeated
widgets, page copy/split/merge, rotation, and visible additions; render saved
bytes through PDF.js independently; record supported and rejected structures.
No application backend or shared MIME-module edits are authorized by this step.
State: completed. Four writer round trips and one independent Chromium PDF.js
render pass. The writer grafts native fields when copying pages, namespaces
identical field names between sources, preserves original catalog structures
for complete-document edits, and rejects unsupported/lossy exports explicitly.

### M1 — Browser workspace

Expansion: `b365468a-35d4-4358-b394-df8f6ba6f00d`.
Scope: Ahara-standard scaffold, immutable document/history model, local import,
page navigation, rendered canvas, object selection and coordinate transforms.
Files: frontend toolchain, core model/operations, editor hooks and workspace UI.
Verify: unit tests for cropped/rotated coordinate round trips and undo/redo;
browser checks for file import, rendering, navigation and stable overlay geometry.
State: completed. Strict typecheck, shared ESLint, production build, and 15 tests
pass, including browser file import/navigation and coordinate/history contracts.

### M2 — Fill and sign

Expansion: `2e0f7d3c-488d-42b3-b0bd-1aff2592b93d`.
Scope: native fields, text/marks, draggable/resizable objects, typed/drawn/imported
signatures and initials, reusable local signature assets, and visible PDF export.
Files: overlay components, field controls, signature dialog, object inspector,
worker writer, bundled fonts and browser integration tests.
Verify: fill shared widgets, place a text object, undo/redo and rotate it; export
real saved bytes with bundled fonts and signatures; inspect through PDF.js.
State: completed. Sixteen tests pass; browser interactions fill repeated widgets,
place/edit/delete/undo text, and navigate mixed pages. Independent PDF.js reads
worker exports with accented/Greek values and a bundled typed signature. Native
controls and object keyboard focus were checked through actual browser events.

### M3 — Organize and split

Expansion: `4b04c204-55ed-4e82-a820-c876e3c754f8`.
Scope: selected/all-page rotation, duplication/deletion, merge/insert/extract,
physical page-range selection, split preview and downloadable ZIP.
Files: page action toolbar, split dialog, range/worker export services and tests.
Steps: expose existing page operations coherently; generate previews and ZIPs
from the same page identities and current edit state; verify saved memberships,
order, rotation, native values and placed objects.
State: completed. Seventeen tests, strict typecheck and shared lint pass.
Browser worker ZIP export is independently read for output filenames, page
membership, rotation, original content, filled values and placed text.

### M4 — Complete editor and durable save

Expansion: `406b24bb-122d-435b-9102-357559b1c456`.
Scope: annotation tools and genuine field authoring; editable portable projects,
local draft recovery/clear, save/download/print/images, search and navigation.
Files: versioned project schema/archive, worker operations, storage hooks,
field writer/inspector, search/text layer, document/export dialogs and tests.
Steps: durable project and draft path; finish document editing and export modes.
Verify: project round trips restore geometry/assets/native values; malformed
archives fail visibly; new fields remain interactive; worker exports retain
annotations; local recovery and storage failures remain visible.
State: completed. Twenty-four tests, typecheck, shared lint and production build
pass. New native fields survive PDF reopening; project archives restore editable
objects, assets, values and stable identities. Chromium restores a filled form
and typed signature from IndexedDB. A trimmed image signature survives a worker
project round trip, renders to page PNG, and imports again as a PDF page.
Archive/reference failures and text clipping/missing glyphs fail visibly.

### M5 — Release quality

Scope: production offline assets and update handling, bounded rendering, browser
engines/touch, keyboard/accessibility, privacy and measured document limits.
Files: PWA registration, lazy thumbnails/viewer cleanup, production browser tests,
compatibility fixtures, release report and user documentation.
Steps: harden packaging/rendering; exercise actual production bundle with local
temporary test hosting and inspect network requests, downloads, recovery, layout
and representative scans; record engine/host limitations without claiming Safari
or cloud deployment from Linux tests.
Expansion: `132e8584-12cc-4119-9b29-ccb03f6551e2`.
State: completed. Zero-warning shared lint, strict typecheck and build pass;
23 unit tests and six browser tests pass. Production offline/CSP/download/quota
checks pass in Chromium, Firefox and WebKit. The scan measurement mounted six
canvases for a 92 MB, 64-page PDF. XFA dictionary detection was moved before
pdf-lib's destructive getForm accessor. Explicit export-range order is preserved;
individual split downloads and omitted-page notices complete the split preview.
See RELEASE-REPORT.md for measurements and the WebKit emulator workaround.
Final touch checks also exercise page reordering; mobile thumbnail controls fit
inside the fixed virtual rows and retain page identity after moving a page.
Linux WebKit substitutes for unavailable Apple hardware; actual Safari, Acrobat,
physical printing and two-version update testing remain disclosed manual checks.

### M6 — Ahara deployment readiness (2026-10-07 snapshot)

Scope: prepare static hosting, project deployer registration, deployment entry
point, platform manifest/CI and an inspected Terraform plan without publishing.
Files: infrastructure/terraform, scripts/deploy.sh, platform.yml, Makefile,
README.md; ../ahara-infra/infrastructure/terraform/control/project-pdfree.tf.
Steps: write and validate hosting/registration; inspect a credential-free mocked
provider plan against the real build assets, then attempt the authorized read-only
live plan through the credential broker. Record any missing access/publication.
Use the existing state bucket and DNS zone. Disable the module's optional new
KMS key and explicitly use S3-managed encryption; no fixed-cost service is needed.
The shared module and MIME handling stay unchanged until a real failure proves
a required repair. A module publication, infrastructure apply or site publication
remains separately authorized.
Expansion: `a06a08a5-d030-43f1-8060-ab0ea66e5757`.
State: blocked after local implementation and validation. Both PDFree and
ahara-infra configurations validate. The repaired module's regression test and
the actual-build mocked plan pass: 231 adds, zero changes/destroys and one
invalidation action, including 216 asset uploads. This is not a live AWS plan.
Local output: frontend/test-results/website-plan-with-local-mime-repair.txt.

The intended live credential command was
`with-cred -- terraform -chdir=infrastructure/terraform init -backend=false -input=false`
in ../ahara-infra. It failed with exit 66:
`credential-helper: broker denied access (403 Forbidden): {"error":"no secret is unlocked for this terminal"}`.
No substitute credentials were sought. Unlock that path before retrying it.
The repaired module must also be published with authorization and the PDFree pin
updated; a fresh initialization against the old published revision still fails.
No commit, push, registration apply, site publication or CI deployment occurred.

Prerequisite: `2527339f-5d13-4d7d-a6e3-fd75a32b902a`. The actual built-asset
mocked plan fails with Invalid index at shared website main.tf:220 for `.mjs`,
`.bcmap`, `.pfb` and `.icc`. This satisfies the user's condition for a MIME repair.
Add only those MIME entries and verify the shared module's metadata consumer.
PDFree remains pinned to published revision `7891b157`; local repair verification
does not claim that the remote module has changed. Publish the repair and update
the pin only after authorization. No IAM changes or alternate credentials are
part of this prerequisite.

Prerequisite state: local repair completed and tested. Only four MIME entries
were added, with a co-located Terraform regression. The cached dependency was
temporarily given the whole repaired source file for the actual-build test;
that generated cache was restored afterward to match its published pin. Source
repair publication is an external write requiring the user's authorization.

Cost review (2026-10-07): no new fixed monthly charge is proposed. Public,
non-exportable [ACM certificates have no charge](https://aws.amazon.com/certificate-manager/pricing/).
[S3-managed encryption is automatic at no additional cost](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingEncryption.html).
Reuse the existing DNS zone; [CloudFront alias queries have no charge](https://aws.amazon.com/route53/pricing/).
[CloudFront pay-as-you-go pricing](https://aws.amazon.com/cloudfront/pricing/pay-as-you-go/)
provides account-shared monthly allowances of 1 TB transfer and 10 million
requests. Beyond them, US HTTPS costs $0.01 per 10,000 requests and transfer
starts at $0.085/GB. The first 1,000 invalidation paths/month are free; a wildcard
counts as one path. [S3 storage and requests remain usage-based](https://aws.amazon.com/s3/pricing/).
No traffic estimate was supplied, so no capped monthly bill is promised.

## Architectural review repairs

The user authorized fixing every review finding and expanding meaningful unit
coverage to 5–10 times the 23-test baseline. Offline support stays in place.
Tracking plan: `b7820de7-c520-4cde-b412-350736b6c697`. Publication and the existing
M6 credential/module-publication gates remain unchanged.

1. Repair PDF and project boundaries: radio option/widget identity, blank-page
   crop and rotation, referenced-source catalog preservation, canonical imported
   rotations, symmetric project size/reference validation, and readable errors.
2. Repair editor and resource coordination: document replacement and clipboard
   assets, choice clearing, selected-page order, native text copy, draft ownership,
   overlay-independent rendering, rotated native controls, bounded image export,
   and worker-batched splitting with reusable parsed sources.
3. Expand coverage and verify: regressions for every finding, broader contracts
   for coordinates, history, ranges, objects, projects and native fields, real
   PDF bytes and independent readers, shared lint/type/build checks, cross-engine
   browser interactions and production release tests.

Acceptance: at least 115 meaningful unit tests. The finished expansion has 264
unit tests and 22 browser checks covering distinct export, geometry, validation,
state, archive and worker contracts. The larger count follows field/page
composition permutations and input boundaries rather than duplicate assertions.
No backend or remote document-processing path is introduced.

State: completed. All review findings have
repairs and regressions, including symmetric archive/reference validation,
per-tab drafts with transactional clear fencing, write identities for conditional
recovery cleanup, bounded PNG allocation, and one worker split batch with parsed
source reuse. Independent PDF.js tests cover native radio appearance states,
blank-page geometry, rotated fields, choice clearing and extraction order.

Browser verification initially exposed test mounting/locator errors and a canvas
instrumentation assertion that included PDF.js temporary font canvases. Repair
branch: `106ddc33-bca6-4afc-a7a7-949333f1878b`. Tests now wait for mounted inputs,
target the named PDF page region, match complete accessible labels, and watch
actual page/thumbnail canvases. The two-tab production test and all WebKit
checks pass after those repairs. Final `make ci` passes 286 tests: 264 unit and
22 Chromium browser tests, plus lint, strict typing, formatting and Terraform
formatting. Firefox and Linux WebKit each pass 22 browser and four production
checks; the additional large-scan production case runs only in Chromium.
Production build and Chromium release checks pass. Core coverage and the scan
measurement below are recorded separately from browser behavior. Test servers
and test containers are stopped. No commit, push or publication occurred.

Recorded Chromium workload: a 92,210,791-byte PDF with 64 scans imported in
1,219 ms and split into 64 outputs in 2,568 ms, producing a 92,506,829-byte ZIP.
A 50 ms browser timer advanced 47 times in the original probe. The adversarial
review below found that its interval included download/inspection time; this
observation is withdrawn as responsiveness evidence. Core unit coverage at that
point reported 87.81%
statements, 89.92% lines and 81.53% branches. Browser behavior is verified
separately. Hosting publication and the earlier M6 gates remain pending.

## Adversarial review repairs

Tracking plan: `55496b03-011b-40a4-8c4d-8a2de36edfbc`.
Outcome: repair all six reproduced categories and strengthen tests that could
pass despite missing output content. Original bytes, browser-only processing,
editable fields and existing offline support remain requirements.

1. PDF values and geometry: separate choice export values and labels, preserve
   flags and value/index ordering, regenerate correct appearances, intersect page
   boxes, and refresh source descriptors in old projects and drafts.
2. Editor and persistence: constrain authored field rotation in UI/projects/writer,
   make signature changes atomic, share the 255-character name boundary and apply
   opacity to borders and arrowheads. Keep accessible input names stable when
   validation messages appear.
3. Independent verification: regress every defect, inspect actual PDF.js values,
   text and raster regions, check transparent signature assets and omitted-object
   negative controls, measure only worker split execution, prove stall detection,
   exercise concurrent two-tab storage and rerun quality/browser gates.

State: completed locally. Reproductions failed before the corresponding repairs.
The suite now has 291 unit tests and 31 browser checks in Chromium, Firefox and
Linux WebKit. Seven production checks pass in Chromium; six pass in Firefox and
WebKit with the 64-page workload skipped. Signature asset, ink and typed-signature
assertions now inspect their own output regions and deliberately omitted objects.
Legacy recovery keeps values, original bytes, edit coordinates and stable IDs.

The corrected split probe measured a 1,946 ms worker request/response interval,
37 timer ticks and a 97 ms maximum timer gap. The end-to-end ZIP operation took
2,843 ms. A synthetic 700 ms main-thread stall is detected in all three engines.
An independent reader checks added text in extraction and the first split output,
and its absence from the last split output. These are local observations.

Strict typing, zero-warning shared lint, formatting, Terraform formatting, build
and `make ci` pass. Core unit coverage is 88.74% statements, 90.81% lines and
83.09% branches; browser behavior is verified separately. Temporary servers and
containers are stopped. Actual Apple Safari and the manual checks in
RELEASE-REPORT.md remain unverified. No commit, push, publication or credential
retry occurred; the original M6 gates remain in place.

## Digital signing and protection extension

Tracking plan: `4560dc27-8654-441d-b43e-3beff29eadf8`.
The user authorized implementing certificate signing, sign-and-lock/certification,
password encryption and reader permissions. Browser-only processing, immutable
source bytes, the existing editing model and publication boundaries remain.

1. Prove the engine: pin browser-compatible LibPDF 0.5.2, PKIjs 3.4.1 and ASN1js
   3.0.10; validate local PKCS#12 identities; create standard detached CMS and
   DocMDP metadata; encrypt before signing final bytes. Verify with independent
   OpenSSL, qpdf, Poppler, Node crypto and PDF.js readers.
2. Integrate Export: approval signing, three certification policies, AES-256
   opening/owner passwords and seven reader permission controls. Keep credentials
   transient; create and terminate a security worker for each operation. Reuse
   an existing empty signature field unless its seed/lock requirements cannot
   safely be honored. Cancel when the export dialog closes.
3. Regress and document: validation, certificate dates/key usage/key matching,
   tampering, wrong passwords, owner-only viewing, Unicode passwords, flattened
   values, scans/rotation, dialog retries/cancellation, persistence exclusion,
   CSP, network requests, accessibility and three browser engines.

The suite contains 345 unit tests, 40 browser checks and 11 native security
verifier tests. Production checks include two certificate exports per engine;
the total is nine for Chromium and eight for Firefox/WebKit, with only the large
scan workload skipped outside Chromium. Core unit coverage measures 90.15%
statements, 91.97% lines and 85.02% branches. See RELEASE-REPORT.md for final gates,
test setup repairs and manual verification limits.

State: completed locally. `make ci`, production build, core unit coverage and
the native verifier suite pass. Chromium passes 40 browser and nine production
checks; Firefox and Linux WebKit each pass 40 browser and eight production
checks. Tests reject changed signed bytes, incorrect credentials and unsupported
signature-field requirements, while preserving filled values and original scans.
Temporary test servers and containers are stopped. No publication occurred.

The cryptographic signature is invisible unless a separate visible mark is added.
DocMDP records allowed subsequent changes; validating readers enforce the policy.
Reader permissions are advisory. Opening-password encryption provides the
confidentiality boundary; the owner password bypasses permission restrictions.
Certificates and passwords are absent from drafts/projects, and keys never leave
the browser. Certificate-chain retrieval, revocation checks and online timestamps
are disabled. Certificate trust and real Acrobat policy behavior remain reader/
manual checks; no advanced PAdES or long-term-validation claim is made.

Security applies to this dialog's PDF downloads and direct saves. Editing
projects, drafts, images, printing and Split outputs are unprotected. Preserve
the original project for further edits: encrypted or already-signed inputs still
fail before editing. Existing M6 deployment/module-publication gates remain; no
commit, push, site publication or credential retry is authorized by this work.

## Authorized deployment (2026-10-08)

Tracking plan: `f8124602-1b9a-40cc-b6a8-f3d4e71c1810`.
The user authorized committing, pushing and deploying ahara-infra registration
first, then publishing PDFree and watching its deployment. Use only established
Ahara managed-project, reusable CI and website-module patterns. This authorization
supersedes the earlier publication gates; historical records above retain their
original context.

The four-entry website MIME repair and synthetic regression fixtures are
published as `6804de4fa112375eaa1c459cb7347871ce168c71` in ahara-tf-patterns.
PDFree pins that revision; fresh initialization, validation and its actual-build
mocked website plan pass. The standard workflow now deploys on `main`.

Registration commit `69584cdba8307659ff9a38aa4235d19412c159c9` is pushed to
ahara-infra. Its first CI run (`37719962680`) failed before Terraform on six
Clippy `double_must_use` diagnostics generated by async-trait 0.1.89 under Rust
1.99. The prerequisite plan `f3756622-eebf-4a82-9163-d4415e77ff7d` updates only
that dependency to the upstream 0.1.92 fix and validates the existing checks.
The dependency repair is published as
`377f2510ce883a6f02f36dc3d3ff289010e87510`. Both `make ci` and the workflow's
exact Rust 1.99 release Clippy command pass locally. Standard infrastructure
run [37720545759](https://github.com/chris-arsenault/ahara-infra/actions/runs/37720545759)
completed successfully, including Terraform and engineering reporting. Terraform
confirmed creation of `deployer-pdfree` and all three repository secrets; the
apply completed with 14 additions, 10 changes and two replacements/removals.
The optional GitHub secret-metadata API check returned HTTP 403 through the
credential broker; no alternate credentials or retry were used. The successful
Terraform resource-creation log supplies the registration evidence.

PDFree's local `make ci` and production build pass. The standard CI coverage
command passes 345 unit tests with 90.15% statement and 91.97% line coverage.
Its first publication follows the successful infrastructure deployment above.

First PDFree commit `d62fe07b7728e8b37b1fd1b3a063caf6772ec4c0` deployed through
[run 37721396791](https://github.com/chris-arsenault/pdfree/actions/runs/37721396791).
All five jobs passed. Terraform added 245 resources, changed/destroyed none and
invoked one invalidation. Distribution: `E15CRNNV76L7FQ`; bucket:
`pdfree-frontend-559098897826`. Public DNS resolves the hostname and HTTPS serves
the app, CSP, security headers and correct worker/cache metadata. The workspace
resolver at `192.168.66.1` still returned ENOTFOUND, so the temporary live browser
test used the public DNS answer without changing machine or network settings.
The three-page filled export and signed/encrypted export completed with zero
page errors and no nonlocal/write requests.

Live Poppler validation exposed missing invisible-signature widgets. Tightening
the native tests to reject reader syntax diagnostics also exposed dangling
annotation references after pdf-lib flattened fields. Tracking repairs:
`92a390b8-0602-4f11-8409-ce1eaecbd5a3` and
`7ceac250-3aa5-4cfb-913f-d4a458a330b3`. Generated and widgetless existing signature
fields now receive zero-size widgets linked to their page. Existing merged and
separate widgets keep their geometry. Flattening removes only captured widget
references and preserves ordinary comments. The new regressions failed before
the repairs; all eleven native security checks now reject parser errors and pass.
Local `make ci` passes 350 unit and 40 browser tests, and the rebuilt production
bundle passes nine Chromium release checks. The repaired release is published
through the same standard workflow and requires another live export check.
Its unit coverage is 90.38% statements, 92.15% lines and 85.25% branches.
