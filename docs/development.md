# Development and verification

## Setup

Use Node 24 from `.node-version` and pnpm 10.29.3 from `packageManager`.
From `frontend/` install dependencies and the default test browser:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

From the repository root, `make dev` starts Vite for interactive development.
`make build` produces `frontend/dist`. Workers, fonts, PDF.js character maps,
image codecs and upstream licenses are bundled locally by
`frontend/tooling/pdfAssets.ts`. Public signing fixtures are test imports and
are excluded from application assets.

## Commands

| Location               | Command                                   | Purpose                                                                     |
| ---------------------- | ----------------------------------------- | --------------------------------------------------------------------------- |
| Root                   | `make ci`                                 | Shared ESLint, strict TypeScript, tests, Prettier and Terraform formatting  |
| Root                   | `make build`                              | Type check and production build                                             |
| Root                   | `make release-check`                      | Build, native security verification and production tests                    |
| Root                   | `make test-unit`                          | Unit contracts without browser interaction                                  |
| Root                   | `make test-coverage`                      | Core coverage, separate from browser behavior                               |
| Root                   | `make test-browser BROWSER=firefox`       | Real browser interactions and independent PDF.js reading/rendering          |
| Root                   | `make test-browser-docker BROWSER=webkit` | Browser interactions using the preserved Playwright image                   |
| Root                   | `make security-check`                     | Docker-hosted OpenSSL, qpdf, Poppler and PDFBox encryption/signature checks |
| Root                   | `make test-release`                       | Existing production bundle, headers, downloads and lifecycle checks         |
| Root                   | `make test-release-docker BROWSER=webkit` | Existing production bundle checks using the Playwright image                |
| Root                   | `make test-sample`                        | Local private sample regression; defaults to `.sulion-paste/s.pdf`          |
| Root, after build/init | `make terraform-test`                     | Mock-provider hosting checks using actual assets                            |

`make ci` runs unit and Chromium browser tests locally. With `CI` set and no
`PDFREE_BROWSER`, Vitest config selects unit tests only, matching Ahara's shared
coverage job. The supplemental GitHub matrix sets `PDFREE_BROWSER` and runs
Chromium, Firefox and WebKit checks. Firefox and WebKit run browser test files
one at a time: parallel test frames share one page's focus, which makes Firefox
drop keyboard button activation and pushes WebKit tests past their timeouts.
Set `PDFREE_BROWSER=firefox` or `webkit`
locally after installing the corresponding Playwright engine. Linux engines
may require OS packages (`playwright install --with-deps` on supported hosts).

Run build/test commands sequentially: Vite and Vitest configuration startup
both generate shared assets. Production tests need an existing build; their
temporary servers are test fixtures, not a development deployment.

`BROWSER` defaults to Chromium. `TEST_ARGS` forwards Vitest file filters/options
for unit, browser, native-security and production targets. For example, after
`make build`:

```bash
make test-release-docker BROWSER=webkit TEST_ARGS=src/security.release.test.ts
```

`frontend/tooling/browser-tests.Dockerfile` preserves the official Playwright
environment used for WebKit. `make browser-test-image` selects its image version
from the installed, locked Playwright package. `make security-test-image` builds
the separate native-verifier image. Both test images mount `frontend/`, run as
the current user and remove their temporary containers afterward.

## Independent PDF verification

The native suite uses the test-only image in
`frontend/tooling/security-tests.Dockerfile`: Node 24, OpenSSL, qpdf, Poppler,
a Java runtime and checksum-pinned PDFBox 3.0.6. CI runs it in the Chromium job.
From the root, with Docker available and frontend dependencies installed:

```bash
make security-check
```

Saved-byte tests assert page membership, field/widget relationships, choice
values/labels, geometry, catalog retention and project references. Independent
PDF.js tests inspect text, annotations and rendered regions. Signature and
encryption checks use OpenSSL, qpdf, Poppler, PDFBox and Node crypto, and reject changed
bytes, wrong passwords, unsigned-reader results and parser diagnostics.

Every bug regression should reproduce the defect before its fix. Rendering tests
use omitted-object negative controls where appropriate so unrelated content
cannot satisfy the assertion. Passing writer-library calls alone are insufficient
evidence. See [ADR 0006](adr/0006-independent-verification.md).

Public qpdf/PDFBox inputs and recipient identities live in
`tooling/fixtures/encryption/`; their passwords are documented test values.
Native suites regenerate equivalent inputs in ignored `test-results/`. Docker
provides verification tools only; none ship in the app or run as a backend.
Private inputs belong in the Git-ignored `.sulion-paste/` directory. The optional
local regression reads the sample without copying it into fixtures or test output:

```bash
make test-sample
make test-sample SAMPLE=/absolute/path/to/another-sample.pdf
```

Run from the root. The Make target supplies `PDFREE_SAMPLE_PATH`; public CI
leaves this optional private regression disabled.

## Maintained dependency patches

`pnpm-workspace.yaml` and the frozen lockfile apply the LibPDF 0.5.2 and PKIjs
3.4.1 patches in `patches/`. To update one, use `pnpm patch <package>@<version>`,
edit the returned directory, then `pnpm patch-commit <directory>`. Re-run type
checks, browser encrypted-input tests and `make security-check`. Do not remove
a patch until an upstream replacement passes the independent fixtures.

## Production and manual checks

Production tests use `frontend/security-headers.json` and the actual worker and
asset URLs. They cover security exports, local request boundaries, desktop/touch
layout, accessibility probes, projects/drafts, clear fencing across two tabs,
downloads, and the opt-in offline copy: no service worker before opting in,
offline editing and OCR after it, and removal. Offline tests opt in through the
footer first. Chromium additionally runs a 64-page scan
workload. The split responsiveness probe measures the worker request/response
interval and has a deliberate main-thread-stall negative control.

Linux WebKit testing may use the official Playwright container matching the
installed version. Its origin-disconnect workaround exists for offline-copy
tests because Playwright WebKit's offline switch blocks service-worker replies.
Offline use is an opt-in feature, not a consequence of the no-backend
requirement. Temporary test servers and containers must be stopped afterward.

Generated screenshots, accessibility output and scan measurements live in ignored
`frontend/test-results/`; coverage output is also generated. Synthetic fixtures
contain no user documents. See [fixture provenance](../frontend/tooling/fixtures/README.md).

Summarize checks and material failures in chat or existing CI output. Create
verification or release report files only when explicitly requested.
Automated accessibility checks and Linux WebKit do not establish full document
accessibility or real Apple Safari behavior. Manual checks are listed in
[backlog](backlog.md#manual-verification).

## Documentation maintenance

Follow [Ahara's repository documentation conventions](../../ahara/skills/repo-docs/SKILL.md).
Keep root files navigational, current contracts in topic docs, rationale in
numbered ADRs, shipped behavior in `CHANGELOG.md` and future work in `backlog.md`.
Accepted decisions are superseded by a new ADR when the architecture changes.
Archived execution records retain their date and scope; they do not override
current contracts. Documentation passes do not create separate verification reports.
