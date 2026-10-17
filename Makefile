.PHONY: ci lint typecheck test test-unit test-coverage test-browser test-release test-sample test-browser-docker test-release-docker test-performance test-performance-docker font-ui build format format-check terraform-check terraform-test dev deploy release-check security-check security-test-image browser-test-image

BROWSER ?= chromium
TEST_ARGS ?=
PERF_BUILD ?= dist
SAMPLE ?= $(CURDIR)/.sulion-paste/s.pdf

ci: lint typecheck test format-check terraform-check
lint:
	cd frontend && pnpm lint
typecheck:
	cd frontend && pnpm typecheck
test:
	cd frontend && pnpm test
test-unit:
	cd frontend && pnpm exec vitest run --project unit $(TEST_ARGS)
test-coverage:
	cd frontend && pnpm exec vitest run --project unit --coverage $(TEST_ARGS)
test-browser:
	cd frontend && PDFREE_BROWSER="$(BROWSER)" pnpm exec vitest run --project browser $(TEST_ARGS)
test-release:
	cd frontend && PDFREE_BROWSER="$(BROWSER)" PDFREE_RELEASE_TESTS=1 pnpm exec vitest run --project release $(TEST_ARGS)
test-performance:
	cd frontend && PDFREE_BROWSER="$(BROWSER)" PDFREE_PERFORMANCE_TESTS=1 PDFREE_PERF_BUILD="$(PERF_BUILD)" pnpm exec vitest run --project performance $(TEST_ARGS)
test-performance-docker: browser-test-image
	docker run --rm --init --ipc=host --user "$$(id -u):$$(id -g)" --mount type=bind,src="$(CURDIR)/frontend",dst=/workspace -e PDFREE_BROWSER="$(BROWSER)" -e PDFREE_PERFORMANCE_TESTS=1 -e PDFREE_PERF_BUILD="$(PERF_BUILD)" pdfree-browser-tests node node_modules/vitest/vitest.mjs run --project performance $(TEST_ARGS)
test-sample:
	test -f "$(SAMPLE)"
	cd frontend && PDFREE_SAMPLE_PATH="$(SAMPLE)" pnpm exec vitest run --project unit src/core/encryptedImport.test.ts
build:
	cd frontend && pnpm build
font-ui:
	python frontend/tooling/uiFont.py
format:
	cd frontend && pnpm format
	terraform fmt -recursive infrastructure/terraform/
format-check:
	cd frontend && pnpm format:check
terraform-check:
	terraform fmt -check -recursive infrastructure/terraform/
terraform-test:
	terraform -chdir=infrastructure/terraform test
security-test-image:
	docker build -t pdfree-security-tests -f frontend/tooling/security-tests.Dockerfile frontend/tooling
security-check: security-test-image
	docker run --rm --init --user "$$(id -u):$$(id -g)" --mount type=bind,src="$(CURDIR)/frontend",dst=/workspace pdfree-security-tests node node_modules/vitest/vitest.mjs run --project security $(TEST_ARGS)
browser-test-image:
	docker build --build-arg PLAYWRIGHT_VERSION="$$(cd frontend && node -p "require('playwright/package.json').version")" -t pdfree-browser-tests -f frontend/tooling/browser-tests.Dockerfile frontend/tooling
test-browser-docker: browser-test-image
	docker run --rm --init --ipc=host --user "$$(id -u):$$(id -g)" --mount type=bind,src="$(CURDIR)/frontend",dst=/workspace -e PDFREE_BROWSER="$(BROWSER)" pdfree-browser-tests node node_modules/vitest/vitest.mjs run --project browser $(TEST_ARGS)
test-release-docker: browser-test-image
	docker run --rm --init --ipc=host --user "$$(id -u):$$(id -g)" --mount type=bind,src="$(CURDIR)/frontend",dst=/workspace -e PDFREE_BROWSER="$(BROWSER)" -e PDFREE_RELEASE_TESTS=1 pdfree-browser-tests node node_modules/vitest/vitest.mjs run --project release $(TEST_ARGS)
release-check: build security-check
	$(MAKE) test-release
dev:
	cd frontend && pnpm dev
deploy:
	./scripts/deploy.sh
