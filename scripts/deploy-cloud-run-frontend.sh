#!/usr/bin/env bash
# Despliega el frontend (React/Vite + nginx) a Google Cloud Run.
#
# Variables en frontend/.env:
#   GCP_PROJECT_ID, GCP_REGION, CLOUD_RUN_FRONTEND_SERVICE
#   VITE_API_URL  → URL del backend terminada en /api
#
# Crea frontend/vite.cloudrun.env antes del deploy. Ese nombre NO debe estar en
# .gitignore: gcloud run deploy --source omite archivos ignorados por git.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
ENV_FILE="$FRONTEND_DIR/.env"
CLOUDRUN_ENV_FILE="$FRONTEND_DIR/vite.cloudrun.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No existe $ENV_FILE — créalo a partir de frontend/.env.example" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

GCP_REGION="${GCP_REGION:-us-west1}"
CLOUD_RUN_FRONTEND_SERVICE="${CLOUD_RUN_FRONTEND_SERVICE:-researchgraph-web}"

if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
  echo "Define GCP_PROJECT_ID en $ENV_FILE" >&2
  exit 1
fi

if [[ -z "${VITE_API_URL:-}" ]]; then
  echo "Define VITE_API_URL en $ENV_FILE (ej. https://TU-BACKEND.run.app/api)" >&2
  exit 1
fi

if [[ ! "$VITE_API_URL" =~ /api$ ]]; then
  echo "ERROR: VITE_API_URL debe terminar en /api" >&2
  echo "  Tienes:  $VITE_API_URL" >&2
  exit 1
fi

cleanup_env() { rm -f "$CLOUDRUN_ENV_FILE"; }
trap cleanup_env EXIT

printf 'VITE_API_URL=%s\n' "$VITE_API_URL" >"$CLOUDRUN_ENV_FILE"

echo "Proyecto: $GCP_PROJECT_ID | región: $GCP_REGION | servicio: $CLOUD_RUN_FRONTEND_SERVICE"
echo "VITE_API_URL → vite.cloudrun.env (súbelo gcloud; no lo pongas en .gitignore)"
echo "Origen: $FRONTEND_DIR"

gcloud config set project "$GCP_PROJECT_ID" >/dev/null

gcloud run deploy "$CLOUD_RUN_FRONTEND_SERVICE" \
  --source="$FRONTEND_DIR" \
  --region="$GCP_REGION" \
  --allow-unauthenticated

echo
echo "Frontend desplegado:"
gcloud run services describe "$CLOUD_RUN_FRONTEND_SERVICE" --region="$GCP_REGION" --format='value(status.url)'
