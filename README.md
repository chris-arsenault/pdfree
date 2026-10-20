# PDFree

An open-source PDF editor for filling forms, signing documents, annotating and
organizing pages in your browser. Your documents, edits and signing credentials
stay on your device. No account required.

**[Open PDFree](https://pdf.ahara.io)** · [User guide](docs/user-guide.md) ·
[Changelog](CHANGELOG.md)

## Features

- **Fill and sign:** complete interactive forms, add text to scans, and place
  drawn, typed or image signatures. Create fillable fields on existing pages.
- **Annotate and review:** add highlights, shapes, ink, stamps, comments and
  replies. Keep a page pinned beside your work with independent zoom and scrolling.
- **Organize pages:** rotate, reorder, merge, extract and split PDFs. Edit
  bookmarks and work across separate document tabs.
- **Work with scans:** recognize English text, clean up supported scans and
  compress images with a size preview.
- **Prepare and protect:** add numbering or watermarks, process multiple files,
  arrange pages on printable sheets, and export certificate-signed or encrypted PDFs.
- **Keep editing:** undo changes, recover local drafts and save portable
  `.pdfree` projects that retain editable objects and original sources.

PDFree supports 17 interface languages and an optional offline copy, including
text recognition. See [compatibility](docs/compatibility.md) for supported PDF
formats, fonts and browser coverage, and [signing and protection](docs/security.md)
for certificate and encryption details.

## Run locally

Use Node.js 24 and pnpm 10.29.3. From a checkout of this repository:

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

Open the local URL printed by Vite. To build the static application, run
`make build` from the repository root; the output is in `frontend/dist/`.

See [development and testing](docs/development.md) for test prerequisites,
`make ci`, browser tests and independent PDF checks.

## Documentation

| Topic                              | Guide                                  |
| ---------------------------------- | -------------------------------------- |
| Editing, pages and saving          | [User guide](docs/user-guide.md)       |
| Signing, encryption and local data | [Security](docs/security.md)           |
| Supported documents and browsers   | [Compatibility](docs/compatibility.md) |
| Building and testing               | [Development](docs/development.md)     |
| How PDFree works                   | [Architecture](docs/architecture.md)   |
| Hosting the application            | [Deployment](docs/deployment.md)       |
| Complete documentation index       | [Documentation](docs/README.md)        |

## Contributing

Bug reports and pull requests are welcome. Include your browser and version,
steps to reproduce, and the expected result when reporting a problem. Use a
synthetic sample PDF for document-specific issues.

Start with the [development guide](docs/development.md),
[project conventions](AGENTS.md) and [feature backlog](docs/backlog.md).
Architectural decisions are recorded in [ADRs](docs/adr/README.md).

## License

[MIT](LICENSE). Bundled dependencies and fonts retain their own licenses;
their notices are included in the application assets.

Built by [Ahara](https://ahara.io).
