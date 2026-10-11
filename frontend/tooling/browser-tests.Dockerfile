ARG PLAYWRIGHT_VERSION=1.63.0
FROM mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble

# Containers run as the caller's uid, whose HOME would be the unwritable `/`;
# Firefox exits with "Could not find profile folder" without a writable home.
ENV CI=1 PDFREE_BROWSER=chromium HOME=/tmp
WORKDIR /workspace
CMD ["node", "node_modules/vitest/vitest.mjs", "run", "--project", "browser"]
