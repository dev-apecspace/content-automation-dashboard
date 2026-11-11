#!/bin/bash
# Batch 8: iframe cross-site login - corrected refs
cd /home/z/my-project
set -a
source .env.local
set +a

echo "########## 0. SERVER + WRAPPER CHECK ##########"
curl -s -o /dev/null --max-time 3 http://localhost:3000/login || { setsid nohup bash .zscripts/dev.sh > /tmp/dev-boot.log 2>&1 < /dev/null & for i in $(seq 1 60); do curl -s -o /dev/null --max-time 2 http://localhost:3000/login && break; sleep 1; done; }
curl -s -o /dev/null -w "  wrapper 3005: HTTP %{http_code}\n" --max-time 3 http://127.0.0.1:3005/ || {
  (setsid nohup python3 -m http.server 3005 --bind 127.0.0.1 -d /tmp/iframe-test > /tmp/http3005.log 2>&1 < /dev/null &); sleep 2; }

echo "########## 1. RECREATE TEMP USER ##########"
HASH=$(node -e "const b=require('/home/z/my-project/node_modules/bcryptjs');process.stdout.write(b.hashSync('E2eTest#2026!',10))")
E2E_ID="e2e_$(date +%s)"
echo "$E2E_ID" > /tmp/e2e-user-id
curl -s --max-time 15 -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"id\":\"$E2E_ID\",\"email\":\"e2e-test@apecspace.local\",\"name\":\"E2E Test\",\"role\":\"admin\",\"is_active\":true,\"password\":\"$HASH\"}" | head -c 120
echo ""

echo "########## 2. LOGIN INSIDE CROSS-SITE IFRAME (correct refs) ##########"
agent-browser close 2>/dev/null
agent-browser set viewport 1500 900
agent-browser open http://127.0.0.1:3005/
sleep 4
SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
echo "$SNAP" | head -10
EMAIL_REF=$(echo "$SNAP" | sed -n 's/.*textbox "EMAIL".*ref=\(e[0-9]*\).*/\1/p' | tail -1)
PASS_REF=$(echo "$SNAP" | sed -n 's/.*textbox "MẶT KHẨU".*ref=\(e[0-9]*\).*/\1/p' | tail -1)
PASS_REF=$(echo "$SNAP" | sed -n 's/.*M.*T KH.*U.*ref=\(e[0-9]*\).*/\1/p' | tail -1)
BTN_REF=$(echo "$SNAP" | sed -n 's/.*button "Đăng nhập ngay".*ref=\(e[0-9]*\).*/\1/p' | tail -1)
echo "  refs: email=$EMAIL_REF pass=$PASS_REF btn=$BTN_REF"
agent-browser fill @$EMAIL_REF "e2e-test@apecspace.local"
agent-browser fill @$PASS_REF "E2eTest#2026!"
echo "  values filled: email=$(agent-browser get value @$EMAIL_REF), pass-len=$(agent-browser get value @$PASS_REF | wc -c)"
agent-browser click @$BTN_REF
echo "  ... clicked, waiting 8s ..."
sleep 8
echo ""
echo "  --- IFRAME CONTENT AFTER LOGIN ---"
agent-browser snapshot -c 2>/dev/null | head -25
echo ""
echo "  --- COOKIES ---"
agent-browser cookies
agent-browser screenshot /home/z/my-project/download/test-screenshots/09-iframe-login-result.png
echo ""
echo "  --- NETWORK (dashboard/auth) ---"
agent-browser network requests --filter dashboard 2>/dev/null | head -6
agent-browser network requests --filter "auth" 2>/dev/null | head -4
agent-browser close

echo ""
echo "########## 3. SERVER LOG ##########"
tail -12 /tmp/dev-boot.log

echo ""
echo "########## 4. CLEANUP TEMP USER ##########"
E2E_ID=$(cat /tmp/e2e-user-id)
curl -s -o /dev/null -w "  del logs: HTTP %{http_code} " -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/activity_logs?user_id=eq.$E2E_ID" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
curl -s -o /dev/null -w "| del user: HTTP %{http_code}\n" -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?id=eq.$E2E_ID" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
