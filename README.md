# PDFree

Fill, sign, annotate and organize PDFs entirely in your browser at
**https://pdf.ahara.io**. Documents, entered values, signature assets and drafts
stay on your device. Ahara serves application assets; browser workers process
PDFs without an application backend or account requirement.

## Use PDFree

Open a PDF, fill its form fields or place text on a scanned form. Add drawn,
typed or image signatures, annotate, create fillable fields, rotate/reorder
pages, add comments and replies, merge documents, and split by physical page numbers. Download a PDF or
save an editable `.pdfree` project. Export supports certificate signing,
certification and AES-256 password or recipient-certificate protection. Encrypted
inputs open with an opening/owner password or a local recipient `.p12`/`.pfx`
identity. Permission-only PDFs with an empty opening password open automatically.

See the [user guide](docs/user-guide.md) and
[signing and protection guide](docs/security.md) for workflows and boundaries.

## Local development

Use Node 24 and pnpm 10.29.3. Install dependencies from `frontend/`:

```bash
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
```

From the repository root:

```bash
make ci
make build
make dev
```

`make dev` starts the interactive Vite server. See
[development and testing](docs/development.md) for individual checks, independent
PDF verifiers, other engines and production-bundle tests.

## Architecture and deployment

React/TypeScript uses one versioned editing model with immutable source PDFs.
PDF.js renders pages; a pdf-lib worker writes PDFs and portable projects.
A separate worker handles each credential-bearing import or signing/encryption
operation. Drafts use IndexedDB; decrypted drafts require explicit consent.
See [architecture](docs/architecture.md).

Ahara's standard reusable CI deploys `main` through the registered PDFree OIDC
role. The shared website module delivers private S3 assets through CloudFront,
ACM and Route 53 at `pdf.ahara.io`. See [deployment](docs/deployment.md) for
registration, state, headers and the authorized manual deployment path.

## Documentation

| Topic                               | Link                                   |
| ----------------------------------- | -------------------------------------- |
| All documentation                   | [docs/README.md](docs/README.md)       |
| Editing, pages and saving           | [User guide](docs/user-guide.md)       |
| Certificate signing and encryption  | [Security](docs/security.md)           |
| Supported PDFs and resource limits  | [Compatibility](docs/compatibility.md) |
| Runtime and data contracts          | [Architecture](docs/architecture.md)   |
| Build and test commands             | [Development](docs/development.md)     |
| Ahara delivery and operations       | [Deployment](docs/deployment.md)       |
| Design rationale                    | [ADRs](docs/adr/README.md)             |
| Future work and manual verification | [Backlog](docs/backlog.md)             |
| Shipped behavior                    | [Changelog](CHANGELOG.md)              |
| Coding agent rules                  | [AGENTS.md](AGENTS.md)                 |

## License

[MIT](LICENSE). Bundled font, PDF.js and cryptographic dependency licenses are
included in the application assets.
