ARG PLAYWRIGHT_VERSION=1.63.0
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

ENV CI=1 PDFREE_BROWSER=chromium
WORKDIR /workspace
CMD ["node", "node_modules/vitest/vitest.mjs", "run", "--project", "browser"]
