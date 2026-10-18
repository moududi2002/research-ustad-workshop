#!/usr/bin/env bash
set -euo pipefail
mkdir -p backend/assets/certificate
cp 'frontend/public/images/RU_logo.png' 'backend/assets/certificate/logo.png'
cp 'frontend/public/images/sign.png' 'backend/assets/certificate/sign.png'
echo 'Certificate assets copied to backend/assets/certificate/'
