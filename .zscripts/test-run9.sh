#!/bin/bash
# Batch 9: verify cookie fix - same-origin + cross-site iframe
cd /home/z/my-project
set -a
source .env.local
set +a

echo "########## 0. RESTART SERVER ##########"
pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null; sleep 3
setsid nohup bash .zscripts/dev.sh > /tmp/dev-boot.log 2>&1 < /dev/null &
for i in $(seq 1 60); do
  curl -s -o /dev/null --max-time 2 http://localhost:3000/login && { echo "  UP after ${i}s"; break; }
  sleep 1
done

echo "########## 1. CREATE TEMP USER ##########"
HASH=$(node -e "const b=require('/home/z/my-project/node_modules/bcryptjs');process.stdout.write(b.hashSync('E2eTest#2026!',10))")
E2E_ID="e2e_$(date +%s)"
echo "$E2E_ID" > /tmp/e2e-user-id
curl -s --max-time 15 -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"id\":\"$E2E_ID\",\"email\":\"e2e-test@apecspace.local\",\"name\":\"E2E Test\",\"role\":\"admin\",\"is_active\":true,\"password\":\"$HASH\"}" | head -c 100
echo ""

echo "########## 2. NEW COOKIE ATTRS (curl -i) ##########"
curl -s -i --max-time 30 -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e-test@apecspace.local","password":"E2eTest#2026!"}' | grep -i -E "^HTTP|^set-cookie" | head -3

echo ""
echo "########## 3. IFRAME CROSS-SITE TEST (after fix) ##########"
agent-browser close 2>/dev/null
agent-browser set viewport 1500 900
agent-browser open http://127.0.0.1:3005/
sleep 4
SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
EMAIL_REF=$(echo "$SNAP" | sed -n 's/.*textbox "EMAIL".*ref=\(e[0-9]*\).*/\1/p' | tail -1)
PASS_REF=$(echo "$SNAP" | sed -n 's/.*M.*T KH.*U.*ref=\(e[0-9]*\).*/\1/p' | tail -1)
BTN_REF=$(echo "$SNAP" | sed -n 's/.*button "Đăng nhập ngay".*ref=\(e[0-9]*\).*/\1/p' | tail -1)
echo "  refs: email=$EMAIL_REF pass=$PASS_REF btn=$BTN_REF"
agent-browser fill @$EMAIL_REF "e2e-test@apecspace.local"
agent-browser fill @$PASS_REF "E2eTest#2026!"
agent-browser click @$BTN_REF
echo "  ... clicked, waiting 9s ..."
sleep 9
echo ""
echo "  --- IFRAME CONTENT AFTER LOGIN (expect Dashboard, not login form) ---"
agent-browser snapshot -c 2>/dev/null | head -30
echo ""
echo "  --- COOKIES (expect auth_token with SameSite=None; Secure) ---"
agent-browser cookies
agent-browser screenshot /home/z/my-project/download/test-screenshots/10-iframe-dashboard-fixed.png
echo ""
echo "  --- NETWORK ---"
agent-browser network requests --filter dashboard 2>/dev/null | head -6
agent-browser network requests --filter "auth" 2>/dev/null | head -4
agent-browser close

echo ""
echo "########## 4. SAME-ORIGIN REGRESSION (direct login) ##########"
agent-browser close 2>/dev/null
agent-browser set viewport 1440 900
agent-browser open http://localhost:3000/login
agent-browser wait --load networkidle --timeout 30000 || true
sleep 2
SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
EMAIL_REF=$(echo "$SNAP" | sed -n 's/.*textbox "EMAIL".*ref=\(e[0-9]*\).*/\1/p' | tail -1)
PASS_REF=$(echo "$SNAP" | sed -n 's/.*M.*T KH.*U.*ref=\(e[0-9]*\).*/\1/p' | tail -1)
BTN_REF=$(echo "$SNAP" | sed -n 's/.*button "Đăng nhập ngay".*ref=\(e[0-9]*\).*/\1/p' | tail -1)
agent-browser fill @$EMAIL_REF "e2e-test@apecspace.local"
agent-browser fill @$PASS_REF "E2eTest#2026!"
agent-browser click @$BTN_REF
sleep 6
echo "  URL: $(agent-browser get url)"
echo "  TITLE: $(agent-browser get title)"
agent-browser screenshot /home/z/my-project/download/test-screenshots/11-same-origin-after-fix.png
agent-browser close

echo ""
echo "########## 5. CLEANUP TEMP USER ##########"
E2E_ID=$(cat /tmp/e2e-user-id)
curl -s -o /dev/null -w "  del logs: HTTP %{http_code} " -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/activity_logs?user_id=eq.$E2E_ID" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
curl -s -o /dev/null -w "| del user: HTTP %{http_code}\n" -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?id=eq.$E2E_ID" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "########## 6. SERVER LOG TAIL ##########"
grep -E "POST /api/auth/login|GET /dashboard" /tmp/dev-boot.log | tail -8
