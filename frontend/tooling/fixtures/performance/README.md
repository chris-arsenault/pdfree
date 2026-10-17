# Large-document fixture

`r-4.6.1-reference.pdf` is the R Core Team's complete reference manual,
version 4.6.1 (2026-06-24), downloaded on 2026-10-17 from
<https://cran.r-project.org/doc/manuals/r-release/fullrefman.pdf>.
It contains 3,993 real text/vector pages, no form fields, and 10,402,568 bytes.
SHA-256: `f29391a9c09580d870caaaf4251a5a0a299e00f422e329dfeef28e51d07e907d`.

Copyright © 1999–2026 R Foundation for Statistical Computing. The permission
notice on the first page allows verbatim redistribution when the copyright and
permission notices remain intact. It also allows modified copies when the
entire derived work carries the same permission notice. This fixture preserves
the original file, including that notice. Generated 100-, 500- and 2,000-page
excerpts retain page one and its notice; those derivatives carry the same
permission terms. The upstream release URL changes, so the checked-in bytes,
not the latest download, define the benchmark.

Generated excerpts remove internal link annotations because their named
destinations and some target pages lie outside the excerpt. Page text, vector
content, fonts and the permission notice remain intact. The original fixture
retains its navigation. This is test-input preparation, not an application
export shortcut; unsupported composition must still be rejected by PDFree.

The performance suite generates excerpts and synthetic forms/annotations and
bounded scan profiles in ignored `test-results/performance/`. Generation happens
before measured browser intervals. None of these PDFs enters the application
bundle or offline cache. Private PDFs belong in the repository's ignored
`.sulion-paste/` directory instead.
