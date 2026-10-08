# PDFree

Keep all PDF processing, document bytes, signatures, and editing state local to
the browser. No upload endpoints, analytics containing document data, or app
backend. Use native editing tools. Follow the user's current authorization for
publication. Use Ahara's standard reusable CI and main-branch deployment.

Application source lives in `frontend/`; infrastructure is in
`infrastructure/terraform/`. Follow `../ahara/INTEGRATION.md` and the matching
TypeScript/testing standards in `../ahara-standards/standards/`.

Use pnpm, strict TypeScript, the shared ESLint rules, Prettier, and Vitest.
Run `make ci` before a commit. PDF compatibility tests must exercise real saved
bytes and independent PDF.js rendering, not a substitute implementation.

Keep source PDF bytes immutable. All UI and writer operations consume the same
versioned editing model. Preserve field-widget relationships across page copies.
Do not silently flatten or rasterize documents to avoid compatibility issues.

Use `sulion plan current` and [PDFREE-PLAN.md](PDFREE-PLAN.md) before resuming a
phase. Shared website MIME handling stays unchanged unless an actual failure
requires a fix. The website module does not provision WAF.
