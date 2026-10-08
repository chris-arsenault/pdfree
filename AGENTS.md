# PDFree agent guide

Browser PDF editor delivered by Ahara at `pdf.ahara.io`.

## Critical rules

- Keep PDF processing, document bytes, signatures and editing state in the
  browser. Maintain the boundary against upload endpoints, document analytics
  and an application backend.
- Use native editing tools. Follow the user's current publication authorization.
  Use Ahara's standard reusable CI and the current branch for deployment.
- Keep private local inputs in the ignored `.sulion-paste/` directory.
- Summarize tests and failures in chat or existing CI output. Create verification,
  audit, completion or release report files only when explicitly requested.
- Keep source PDF bytes immutable and use the versioned editing model for UI,
  history, page operations, drafts, projects and export.
- Preserve field/widget relationships and source content. Reject unsupported
  composition explicitly rather than silently flattening or rasterizing it.
- Keep opening/signing credentials outside persisted state; retain original
  ciphertext separately from decrypted working bytes and require consent for
  plaintext drafts. Terminate each security
  worker after completion, failure or cancellation.
- Use pnpm, strict TypeScript, shared Ahara ESLint, Prettier and Vitest.
  Run `make ci` before a commit. Verify actual saved bytes with independent
  readers, including parser diagnostics.
- Run `sulion plan current` when resuming work. Archived plans describe history,
  not current requirements. Change shared MIME handling only for a demonstrated
  compatibility failure. The website module provisions no WAF.

## Read first

| Topic                             | Link                                                      |
| --------------------------------- | --------------------------------------------------------- |
| Product and quickstart            | [README.md](README.md)                                    |
| Documentation index               | [docs/README.md](docs/README.md)                          |
| Runtime and persistence contracts | [Architecture](docs/architecture.md)                      |
| Decisions                         | [ADRs](docs/adr/README.md)                                |
| Compatibility and limits          | [Compatibility](docs/compatibility.md)                    |
| Future work                       | [Backlog](docs/backlog.md)                                |
| Shipped behavior                  | [CHANGELOG.md](CHANGELOG.md)                              |
| Platform integration              | [Ahara integration](../ahara/INTEGRATION.md)              |
| Language/testing conventions      | [Ahara standards](../ahara-standards/standards/README.md) |

## Code map

| Path                                                            | Purpose                                                     |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| `frontend/src/core/`                                            | Model, operations, import/export, projects and PDF security |
| `frontend/src/services/`                                        | Workers, rendering, files and local persistence             |
| `frontend/src/hooks/`, `frontend/src/components/`               | Editor state and React UI                                   |
| `frontend/tooling/`                                             | Asset generation, production test hosting and fixtures      |
| `frontend/security-headers.json`                                | Shared production/test header configuration                 |
| `infrastructure/terraform/`                                     | Static website and actual-build hosting tests               |
| `scripts/deploy.sh`, `platform.yml`, `.github/workflows/ci.yml` | Standard Ahara delivery                                     |

## Commands

Run root targets from the repository root. Prerequisites and environment
switches are in [development](docs/development.md).

| Command                    | Purpose                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| `make ci`                  | Lint, types, tests and frontend/Terraform formatting                         |
| `make build`               | Production bundle                                                            |
| `make release-check`       | Build, native security verifiers and production tests                        |
| `make security-check`      | Docker-hosted independent PDF encryption/signature checks                    |
| `make test-unit`           | Unit contracts; use `TEST_ARGS` to select files/tests                        |
| `make test-browser`        | Browser interaction checks; select `BROWSER=chromium`, `firefox` or `webkit` |
| `make test-browser-docker` | Browser interaction checks in the preserved Playwright image                 |
| `make test-release-docker` | Existing production bundle checks in the Playwright image                    |
| `make test-sample`         | Private sample regression from `.sulion-paste/s.pdf`                         |
| `make dev`                 | Interactive server, when requested                                           |
| `make deploy`              | Authorized manual build/plan/apply; see [deployment](docs/deployment.md)     |
