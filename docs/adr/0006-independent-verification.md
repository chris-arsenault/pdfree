# 0006 — Saved-byte and independent-reader verification

- Status: Accepted
- Date: 2026-10-08

## Context

The user challenged tests that might encode incorrect behavior and requested
architecture/adversarial reviews and substantially expanded unit coverage.
Writer-library round trips can agree with the writer's own defects. Live reader
diagnostics exposed widget issues despite cryptographically valid signatures.

## Decision

Test saved PDF bytes, editor/persistence contracts and worker lifecycle failures.
Use independent PDF.js text/annotation/rendering checks, with omitted-object
negative controls where needed. Verify signatures/encryption with OpenSSL, qpdf,
Poppler and Node crypto, including parser stderr and older CI reader behavior.
Require bug regressions to reproduce failures before repair.

Exercise actual built assets/headers in browser release tests. Separate unit
coverage, browser behavior, native reader checks, measured performance and manual
device/reader verification. Use synthetic documents and public test identities.

## Alternatives considered

- **Only reopen with the writer:** risks encoding the same incorrect field/widget
  assumptions on both sides of an assertion.
- **Screenshots or API success alone:** cannot prove field values, PDF membership,
  signature coverage, permission bits or preserved content.
- **Crypto validity without parser diagnostics:** misses malformed widget graphs
  and unsigned-reader results despite valid CMS bytes.
- **Treat Linux WebKit as Safari or CI as live proof:** conflates environments
  and leaves device/deployment behavior unmeasured.

## Consequences

Release checks need browser engines and native verifiers. Test startup/builds
run sequentially because they share generated assets. Counts and coverage are
dated evidence rather than correctness targets. Manual checks stay explicit.
See [development](../development.md) for executable checks.
