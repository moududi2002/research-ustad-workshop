#!/usr/bin/env bash
# Usage: bash /path/to/RU_Certificate_System_Patch/scripts/install-into-repo.sh /path/to/research-ustad-workshop
set -euo pipefail
PATCH_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="${1:-$(pwd)}"
REPO_ROOT="$(cd "$REPO_ROOT" && pwd)"
if [[ ! -f "$REPO_ROOT/backend/src/app.module.ts" || ! -f "$REPO_ROOT/frontend/package.json" ]]; then
  echo 'ERROR: Pass the original research-ustad-workshop repo root.' >&2
  exit 1
fi
cp -R "$PATCH_ROOT/backend/src/certificates" "$REPO_ROOT/backend/src/"
mkdir -p "$REPO_ROOT/backend/sql" "$REPO_ROOT/frontend/src/app/admin/certificates" \
  "$REPO_ROOT/frontend/src/app/certificate/verify/[id]" "$REPO_ROOT/frontend/src/lib" "$REPO_ROOT/scripts"
cp "$PATCH_ROOT/backend/sql/20261018_certificate_tables.sql" "$REPO_ROOT/backend/sql/"
cp "$PATCH_ROOT/backend/.env.certificate.example" "$REPO_ROOT/backend/.env.certificate.example"
cp "$PATCH_ROOT/frontend/src/app/admin/certificates/page.tsx" "$REPO_ROOT/frontend/src/app/admin/certificates/"
cp "$PATCH_ROOT/frontend/src/app/certificate/verify/page.tsx" "$REPO_ROOT/frontend/src/app/certificate/verify/"
cp "$PATCH_ROOT/frontend/src/app/certificate/verify/[id]/page.tsx" "$REPO_ROOT/frontend/src/app/certificate/verify/[id]/"
cp "$PATCH_ROOT/frontend/src/lib/certificateApi.ts" "$REPO_ROOT/frontend/src/lib/"
cp "$PATCH_ROOT/scripts/apply-repo-patch.py" "$REPO_ROOT/scripts/"
cp "$PATCH_ROOT/scripts/copy-certificate-assets.sh" "$REPO_ROOT/scripts/"
chmod +x "$REPO_ROOT/scripts/copy-certificate-assets.sh"
(cd "$REPO_ROOT" && python3 scripts/apply-repo-patch.py && bash scripts/copy-certificate-assets.sh)
echo 'DONE: Overlay copied. Next: npm install, SQL table creation, backend/.env, build and testing.'
