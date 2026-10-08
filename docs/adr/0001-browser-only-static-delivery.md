# 0001 — Browser-only processing and Ahara static delivery

- Status: Accepted
- Date: 2026-10-08

## Context

The user requires a complete browser PDF filler without a server-side component,
integrated with Ahara at `pdf.ahara.io`. Ahara already has managed-project OIDC
registration, standard reusable CI and a private-S3/CloudFront website module.
PDF processing does not need platform API, database or identity services.

## Decision

Keep documents and processing in the browser. Deliver public application assets
through the existing website module, without account gating. Register PDFree in
`ahara-infra` and deploy through Ahara's standard workflow on `main`, with the
supplemental browser matrix providing release verification.

Use the existing state bucket, DNS zone and module IAM patterns. Disable the
optional new KMS key and explicitly apply S3-managed asset encryption. The website
module provisions no WAF. Use one shared security-header configuration for hosting
and production tests.

Keep the shared website module pinned. The user instructed that MIME handling
remain unchanged until an actual failure. The built-asset mocked plan failed for
`.mjs`, `.bcmap`, `.pfb` and `.icc`; only those entries and regressions were added.
The published dependency revision is pinned by PDFree's Terraform.

## Alternatives considered

- **PDF processing service or upload endpoint:** violates the requested runtime
  boundary and adds credential/data retention and service ownership requirements.
- **Custom hosting/deploy workflow:** duplicates Ahara's established controls and
  conflicts with the user's instruction to use platform patterns.
- **Cognito gating:** adds login without a remote user-data service or account
  requirement; reconsider only if product requirements change.
- **A new KMS key:** adds a separate fixed-cost asset encryption resource where
  S3-managed encryption serves public application assets.

## Consequences

Browser workers and memory own document processing. Cloud deployment credentials
remain in OIDC/broker-backed delivery, never browser assets. Static delivery still
has cloud infrastructure and usage charges, but no PDF application backend.
Module changes require demonstrated failures and upstream regression checks.
See [deployment](../deployment.md) and the
[historical implementation record](../archive/implementation-plan.md).
