#!/usr/bin/env bash
set -euo pipefail

PDFREE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PDFREE_TF_DIR="${PDFREE_ROOT}/infrastructure/terraform"
STATE_BUCKET="${STATE_BUCKET:-tfstate-559098897826}"
STATE_REGION="${STATE_REGION:-us-east-1}"

cd "${PDFREE_ROOT}/frontend"
pnpm install --frozen-lockfile
pnpm build
terraform -chdir="${PDFREE_TF_DIR}" init -reconfigure \
  -backend-config="bucket=${STATE_BUCKET}" \
  -backend-config="region=${STATE_REGION}" \
  -backend-config="use_lockfile=true"
terraform -chdir="${PDFREE_TF_DIR}" plan -out=deployment.tfplan
terraform -chdir="${PDFREE_TF_DIR}" apply deployment.tfplan
