#!/usr/bin/env bash
# EMBER Coffee — one command to run everything, forever.
# Ctrl+C stops all services.
#
#   bash /home/ariyan/Downloads/Claude/Coffee/deploy.sh
#
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PIDS=()

STOPPED=0
cleanup() {
  [[ $STOPPED -eq 1 ]] && return
  STOPPED=1
  echo ""
  echo "==> Stopping..."
  for pid in "${PIDS[@]}"; do kill "$pid" 2>/dev/null; wait "$pid" 2>/dev/null; done
  echo "==> Done."
  exit 0
}
trap cleanup EXIT INT TERM

# Kill anything stale on our ports
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 8000/tcp 2>/dev/null || true
sleep 1

# --- Env ---
ENV_FILE="$PROJECT_DIR/.env.host"
if [[ ! -f "$ENV_FILE" ]]; then
  SECRET="$(head -c 48 /dev/urandom | base64 | tr -dc 'A-Za-z0-9' | head -c 48)"
  cat > "$ENV_FILE" <<EOF
ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://coffee:coffee@127.0.0.1:55432/coffee_db
REDIS_URL=redis://127.0.0.1:56379/0
CELERY_BROKER_URL=redis://127.0.0.1:56379/0
CELERY_RESULT_BACKEND=redis://127.0.0.1:56379/0
JWT_SECRET=$SECRET
EOF
  chmod 600 "$ENV_FILE"
fi
set -a; source "$ENV_FILE"; set +a

VENV="$PROJECT_DIR/.venv/bin"

# --- 1. Docker ---
echo "==> [1/5] Postgres + Redis"
docker start ember-pg >/dev/null 2>&1 || \
  docker run -d --name ember-pg --restart unless-stopped \
    -p 127.0.0.1:55432:5432 \
    -e POSTGRES_DB=coffee_db -e POSTGRES_USER=coffee -e POSTGRES_PASSWORD=coffee \
    -v ember-pg-data:/var/lib/postgresql/data postgres:15-alpine

docker start ember-redis >/dev/null 2>&1 || \
  docker run -d --name ember-redis --restart unless-stopped \
    -p 127.0.0.1:56379:6379 \
    -v ember-redis-data:/data redis:7-alpine redis-server --appendonly yes

echo -n "   Waiting for postgres"
until docker exec ember-pg pg_isready -U coffee -d coffee_db >/dev/null 2>&1; do echo -n .; sleep 1; done
echo " ready"

# --- 2. Migrations ---
echo "==> [2/5] Migrations"
"$VENV/alembic" upgrade head

# --- 3. Backend ---
echo "==> [3/5] Backend API (http://127.0.0.1:8000)"
(cd backend && exec "$VENV/uvicorn" app.main:app --host 127.0.0.1 --port 8000) &
PIDS+=($!)

# --- 4. Celery ---
echo "==> [4/5] Celery worker+beat"
(cd backend && exec "$VENV/celery" -A app.tasks.celery_app.celery_app worker --loglevel=warning -B) &
PIDS+=($!)

# --- 5. Frontend ---
echo "==> [5/5] Frontend (http://localhost:3000)"
(cd frontend && exec ./node_modules/.bin/next start -p 3000) &
PIDS+=($!)

# --- Banner ---
echo ""
echo "============================================="
echo "  EMBER Coffee is live"
echo "============================================="
echo "  Frontend   http://localhost:3000"
echo "  Backend    http://127.0.0.1:8000/api/v1"
echo "  Postgres   127.0.0.1:55432"
echo "  Redis      127.0.0.1:56379"
echo "============================================="
echo "  Seeds: admin@ember.test / staff@ember.test"
echo "         alice@ember.test / bob@ember.test"
echo "         password: EmberTest123!"
echo "============================================="
echo ""
echo "  Ctrl+C to stop everything"
echo ""

wait
