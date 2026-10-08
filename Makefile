.PHONY: ci lint typecheck test build format format-check terraform-check dev deploy release-check
ci: lint typecheck test format-check terraform-check
lint:
	cd frontend && pnpm lint
typecheck:
	cd frontend && pnpm typecheck
test:
	cd frontend && pnpm test
build:
	cd frontend && pnpm build
format:
	cd frontend && pnpm format
	terraform fmt -recursive infrastructure/terraform/
format-check:
	cd frontend && pnpm format:check
terraform-check:
	terraform fmt -check -recursive infrastructure/terraform/
release-check: build
	cd frontend && pnpm test:security
	cd frontend && pnpm test:release
dev:
	cd frontend && pnpm dev
deploy:
	./scripts/deploy.sh
