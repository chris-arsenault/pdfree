# Ahara deployment

## Ownership and delivery

| Owner               | Contract                                                                       |
| ------------------- | ------------------------------------------------------------------------------ |
| PDFree              | Application build, website Terraform, headers, platform manifest and CI caller |
| `ahara-infra`       | Managed-project deployer registration and repository secrets                   |
| `ahara-tf-patterns` | Shared website module and asset MIME handling                                  |
| `ahara`             | Reusable CI, governance/reporting and integration guidance                     |

[`platform.yml`](../platform.yml) declares project/prefix `pdfree`, TypeScript
and Terraform, with `frontend/` as the TypeScript directory. The hostname is
`pdf.ahara.io`. The website uses private S3 with CloudFront OAC, ACM, Route 53
A/AAAA records and deployment invalidation. Only public application assets go to
S3. Runtime PDFs, drafts and signing credentials remain on the device.

The shared module is pinned in
[`website.tf`](../infrastructure/terraform/website.tf) to published revision
`fff59f90fcf84b58d9328fa58b87e51414bec008`. That revision includes `.mjs`
JavaScript workers, `.bcmap` character maps, `.pfb` binary fonts, `.icc`
profiles and `.gz` OCR language data in the MIME map. Gzip files use
`application/gzip` without HTTP content encoding; the OCR worker decompresses
the language data. Static sites skip the dynamic OpenGraph renderer's
single-entry discovery, so application and worker dependency chunks can retain
Vite's normal filenames. [ADR 0001](adr/0001-browser-only-static-delivery.md)
records the hosting choice and the demonstrated MIME failure that required repair.

`encrypt = false` disables the module's optional new KMS key; a separate bucket
configuration explicitly uses S3-managed AES256 encryption for assets. This
website provisions no WAF, application service or database. Deployment IAM
bundles remain the platform's existing controls.

OpenGraph and Twitter card metadata live in `frontend/index.html`. The static
HTML identifies `https://pdf.ahara.io/` and references the public 1200×630 PNG
at `/og-image.png`; crawlers can read it without running JavaScript. PDFree does
not enable the shared module's dynamic OpenGraph Lambda because its public
metadata describes the application, with no server-side document routes.
The image source is `frontend/tooling/og-image.svg`. Render it locally after
changing the artwork:

```bash
cd frontend
pnpm exec playwright screenshot --browser chromium --viewport-size="1200,630" \
  "file://$(pwd)/tooling/og-image.svg" public/og-image.png
```

## Registration and workflow

Registration lives in
[`project-pdfree.tf`](../../ahara-infra/infrastructure/terraform/control/project-pdfree.tf).
It uses the managed-project module with `website` and `terraform-state`
permissions for this repository/ref. Deploy registration before a project's
first application deployment. It creates the deploy role and repository secrets
`STATE_BUCKET`, `OIDC_ROLE` and `PREFIX`.

The [CI caller](../.github/workflows/ci.yml) invokes
`chris-arsenault/ahara/.github/workflows/ci.yml@main` with inherited secrets and
deployment enabled. The standard workflow assumes the registered role through
GitHub OIDC and applies Terraform on `main`; pull requests run validation. Its
unit coverage/report jobs coexist with the supplemental Chromium/Firefox/WebKit
matrix. The browser matrix validates the release; it is not an additional deploy
implementation. A green deployment job alone does not establish all browser
jobs succeeded: inspect the complete run.

## State and hosting contracts

Terraform requires version 1.14 or later and AWS provider `~> 6.0`.
State uses the existing S3 bucket (default `tfstate-559098897826`), region
`us-east-1`, key `projects/pdfree.tfstate`, encryption and lockfiles.

[`security-headers.json`](../frontend/security-headers.json) is the header source
for both CloudFront and the production test host. Its CSP allows local module
workers, blob/data rendering and required WASM while limiting connections to the
same origin. It also supplies anti-framing, nosniff, referrer, HSTS and device
permission restrictions. HTML, service worker and manifest use no-cache delivery;
ordinary assets have immutable one-year cache metadata. Update asset/header
handling only after verifying its consumer and production tests.

After a build and dependency initialization, validate actual assets without a
live AWS plan:

```bash
terraform -chdir=infrastructure/terraform test
```

The mocked test covers MIME metadata and S3-managed encryption. It does not
prove deployed state. [`website.tftest.hcl`](../infrastructure/terraform/tests/website.tftest.hcl)
is the executable contract.

## Authorized manual deployment

[`scripts/deploy.sh`](../scripts/deploy.sh) is the parameterless entry point.
It installs locked dependencies, builds, initializes shared state, saves a plan
and applies that plan. It applies changes without an additional interactive
approval, so invoke it only with deployment authorization. `make deploy` calls it.

In this environment:

```bash
with-cred -- ./scripts/deploy.sh
```

Other installations use ordinary AWS environment/profile credentials.
`STATE_BUCKET` and `STATE_REGION` override backend defaults. Application assets
must never contain credentials. If broker/authentication fails, report the exact
error and stop that action; do not seek alternative credentials or roles.

## Deployment verification

Watch standard CI through Terraform, invalidation, engineering reporting and
all browser jobs. Inspect actual logs for any failure before changing workflows
or IAM. Then verify normal DNS/HTTPS, response headers, worker MIME/caching and a
synthetic PDF round trip on the real hostname. Independently inspect a combined
signed/encrypted download for encryption, signature coverage, parser diagnostics
and retained content. Record observed results separately from mock plans.

Summarize observed checks and failures in chat or existing CI output.
