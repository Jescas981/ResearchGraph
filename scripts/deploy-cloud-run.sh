#!/usr/bin/env bash
# Despliega el backend (Dockerfile en backend/) a Google Cloud Run.
# Requisitos: gcloud instalado y autenticado (`gcloud auth login`),
# APIs Cloud Run + Cloud Build habilitadas en el proyecto.
#
# Todas las variables se leen de backend/.env (mismos nombres que backend/.env.example):
#   GCP_PROJECT_ID, GCP_REGION, CLOUD_RUN_SERVICE
#   DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PDF_BUCKET
#   PG_POOL_MAX (opcional)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
ENV_FILE="$BACKEND_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No existe $ENV_FILE — créalo a partir de backend/.env.example" >&2
  exit 1
fi

set -a
# shellcheck source=/dev/null
source "$ENV_FILE"
set +a

GCP_REGION="${GCP_REGION:-us-west1}"
CLOUD_RUN_SERVICE="${CLOUD_RUN_SERVICE:-researchgraph-api}"

if [[ -z "${GCP_PROJECT_ID:-}" ]]; then
  echo "Define GCP_PROJECT_ID en $ENV_FILE" >&2
  exit 1
fi

ENV_KEYS=(
  DATABASE_URL
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_PDF_BUCKET
  PG_POOL_MAX
)

ENV_YAML="$(mktemp)"
cleanup() { rm -f "$ENV_YAML"; }
trap cleanup EXIT

python3 - "$ENV_YAML" "${ENV_KEYS[@]}" <<'PY'
import os, sys

path = sys.argv[1]
keys = sys.argv[2:]

def yaml_double(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'

lines = []
for k in keys:
    v = os.environ.get(k)
    if v is None or str(v).strip() == "":
        continue
    lines.append(f"{k}: {yaml_double(str(v))}")

with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
PY

echo "Proyecto: $GCP_PROJECT_ID | región: $GCP_REGION | servicio: $CLOUD_RUN_SERVICE"
echo "Origen: $BACKEND_DIR"

gcloud config set project "$GCP_PROJECT_ID" >/dev/null

gcloud run deploy "$CLOUD_RUN_SERVICE" \
  --source="$BACKEND_DIR" \
  --region="$GCP_REGION" \
  --allow-unauthenticated \
  --env-vars-file="$ENV_YAML"

echo
echo "Listo. Usa esta base + /api en VITE_API_URL del frontend:"
gcloud run services describe "$CLOUD_RUN_SERVICE" --region="$GCP_REGION" --format='value(status.url)'
