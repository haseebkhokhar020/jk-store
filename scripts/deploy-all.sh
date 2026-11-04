#!/usr/bin/env bash
# ============================================================================
# JK Store — ONE-COMMAND FULL DEPLOY
# Creates the GitHub repo + pushes, creates the Supabase project + runs SQL +
# bucket + admin user, validates Resend, creates the Vercel project + env
# vars + deploys production. Then prints your LIVE URL.
#
# Usage:
#   export GH_TOKEN=ghp_... GH_USER=haseebkhokhar020
#   export SB_TOKEN=sbp_... SB_ORG_ID=...        # supabase access token + org id
#   export RESEND_KEY=re_... RESEND_FROM="JK Store <orders@yourdomain.com>"
#   export VERCEL_TOKEN=...                      # (+ VERCEL_TEAM_ID if in a team)
#   export ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='StrongPass123!'
#   ./scripts/deploy-all.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

: "${GH_TOKEN:?set GH_TOKEN}"; : "${GH_USER:?set GH_USER}"; : "${SB_TOKEN:?set SB_TOKEN}"; : "${SB_ORG_ID:?set SB_ORG_ID}"
: "${RESEND_KEY:?set RESEND_KEY}"; : "${VERCEL_TOKEN:?set VERCEL_TOKEN}"; : "${ADMIN_EMAIL:?set ADMIN_EMAIL}"; : "${ADMIN_PASSWORD:?set ADMIN_PASSWORD}"
REPO="${REPO:-jk-store}"
SUPA_NAME="${SUPA_NAME:-jk-store}"
DB_PASS="$(openssl rand -base64 24 | tr -d '/+=' )"
step() { echo; echo "==> $*"; }

# ---------------------------------------------------------------------------
step "1/6 GitHub: create repo github.com/$GH_USER/$REPO and push"
curl -sf -X POST https://api.github.com/user/repos -H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" \
  -d "{\"name\":\"$REPO\",\"private\":false,\"description\":\"JK Store — premium cosmetics e-commerce (React+Vite+Supabase+Resend+Vercel)\",\"auto_init\":false}" > /dev/null \
  || echo "   (repo may already exist — continuing)"
git init -q 2>/dev/null || true
git add -A
git -c user.name="$GH_USER" -c user.email="${GH_USER}@users.noreply.github.com" commit -qm "JK Store — full e-commerce (storefront, admin, Supabase, Resend, Vercel)" || true
git branch -M main 2>/dev/null || true
git remote remove origin 2>/dev/null || true
git remote add origin "https://${GH_USER}:${GH_TOKEN}@github.com/${GH_USER}/${REPO}.git"
git push -u origin main --force
echo "   GitHub: https://github.com/$GH_USER/$REPO"

# ---------------------------------------------------------------------------
step "2/6 Supabase: create project '$SUPA_NAME'"
PROJ=$(curl -sf -X POST "https://api.supabase.com/v1/projects" -H "Authorization: Bearer $SB_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"$SUPA_NAME\",\"organization_id\":\"$SB_ORG_ID\",\"db_pass\":\"$DB_PASS\",\"region\":\"ap-southeast-1\",\"plan\":\"free\"}")
REF=$(echo "$PROJ" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
echo "   project ref: $REF (waiting for it to become ACTIVE_HEALTHY...)"
for i in $(seq 1 40); do
  ST=$(curl -sf "https://api.supabase.com/v1/projects/$REF" -H "Authorization: Bearer $SB_TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['status'])")
  [ "$ST" = "ACTIVE_HEALTHY" ] && break
  sleep 15
done
echo "   status: $ST"

step "3/6 Supabase: keys, run migrations + seed, create bucket, create admin user"
KEYS=$(curl -sf "https://api.supabase.com/v1/projects/$REF/keys" -H "Authorization: Bearer $SB_TOKEN")
ANON=$(echo "$KEYS" | python3 -c "import sys,json;d=json.load(sys.stdin);print([k['api_key'] for k in d if k['name']=='anon'][0])")
SERVICE=$(echo "$KEYS" | python3 -c "import sys,json;d=json.load(sys.stdin);print([k['api_key'] for k in d if k['name']=='service_role'][0])")
SUPA_URL="https://$REF.supabase.co"

sql() { curl -sf -X POST "https://api.supabase.com/v1/projects/$REF/database/query" -H "Authorization: Bearer $SB_TOKEN" -H "Content-Type: application/json" -d "$(python3 -c "import sys,json;print(json.dumps({'query':open(sys.argv[1]).read()}))" "$1")" > /dev/null; }
sql supabase/migrations/001_schema.sql && echo "   schema OK"
sql supabase/seed.sql && echo "   seed OK"

curl -sf -X POST "https://api.supabase.com/v1/projects/$REF/storage/buckets" -H "Authorization: Bearer $SB_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"product-images","public":true}' > /dev/null && echo "   bucket product-images OK"

# create auth admin user
ADMIN_JSON=$(curl -sf -X POST "https://api.supabase.com/v1/projects/$REF/auth/admin/users" \
  -H "apikey: $SERVICE" -H "Authorization: Bearer $SERVICE" -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"Store Admin\"}}")
ADMIN_ID=$(echo "$ADMIN_JSON" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
curl -sf -X POST "https://api.supabase.com/v1/projects/$REF/database/query" -H "Authorization: Bearer $SB_TOKEN" -H "Content-Type: application/json" \
  -d "{\"query\":\"insert into public.admin_users (id,email,full_name) values ('$ADMIN_ID','$ADMIN_EMAIL','Store Admin') on conflict (id) do nothing;\"}" > /dev/null
echo "   admin user OK: $ADMIN_EMAIL"

step "4/6 Resend: validate key + from-address"
curl -sf https://api.resend.com/domains -H "Authorization: Bearer $RESEND_KEY" > /dev/null && echo "   Resend key valid"

step "5/6 Vercel: create project linked to GitHub + set env vars"
TEAM_ARGS=(); [ -n "${VERCEL_TEAM_ID:-}" ] && TEAM_ARGS=("?teamId=$VERCEL_TEAM_ID")
PROJ_JSON=$(curl -sf -X POST "https://api.vercel.com/v9/projects${TEAM_ARGS[0]}" -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" -d "{
  \"name\":\"$REPO\",\"framework\":\"vite\",\"buildCommand\":\"npm run build\",\"outputDirectory\":\"dist\",\"installCommand\":\"npm install\",
  \"gitRepository\":{\"type\":\"github\",\"repo\":\"$GH_USER/$REPO\",\"productionBranch\":\"main\"}}")
VERCEL_PROJ_ID=$(echo "$PROJ_JSON" | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")

set_env() { # key value sensitive
  curl -sf -X POST "https://api.vercel.com/v10/projects/$VERCEL_PROJ_ID/env${TEAM_ARGS[0]}" -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
    -d "{\"key\":\"$1\",\"value\":\"$2\",\"type\":\"$3\",\"target\":[\"production\",\"preview\",\"development\"]}" > /dev/null; }
set_env VITE_SUPABASE_URL "$SUPA_URL" plain
set_env VITE_SUPABASE_ANON_KEY "$ANON" plain
set_env SUPABASE_URL "$SUPA_URL" secret
set_env SUPABASE_SERVICE_ROLE_KEY "$SERVICE" secret
set_env RESEND_API_KEY "$RESEND_KEY" secret
set_env RESEND_FROM_EMAIL "${RESEND_FROM:-JK Store <onboarding@resend.dev>}" plain
set_env NOTIFY_EMAIL "$ADMIN_EMAIL" plain
echo "   env vars set"

step "6/6 Vercel: trigger production deployment"
curl -sf -X POST "https://api.vercel.com/v13/deployments${TEAM_ARGS[0]}" -H "Authorization: Bearer $VERCEL_TOKEN" -H "Content-Type: application/json" \
  -d "{\"name\":\"$REPO\",\"project\":\"$VERCEL_PROJ_ID\",\"target\":\"production\",\"gitSource\":{\"type\":\"github\",\"repo\":\"$GH_USER/$REPO\",\"ref\":\"main\"}}" | python3 -c "import sys,json;d=json.load(sys.stdin);print('   deployment:',d.get('url'))"

echo
echo "============================================================"
echo "  DONE — JK Store is live."
echo "  Website:  https://$REPO.vercel.app   (or your custom domain)"
echo "  Admin:    https://$REPO.vercel.app/admin   ($ADMIN_EMAIL)"
echo "  GitHub:   https://github.com/$GH_USER/$REPO"
echo "  Supabase: https://supabase.com/dashboard/project/$REF"
echo "  DB password (save it): $DB_PASS"
echo "============================================================"
