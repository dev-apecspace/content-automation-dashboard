#!/bin/bash
# Batch 7: iframe cross-origin simulation (preview panel scenario) + cleanup
cd /home/z/my-project
set -a
source .env.local
set +a

if ! curl -s -o /dev/null --max-time 3 http://localhost:3000/login; then
  setsid nohup bash .zscripts/dev.sh > /tmp/dev-boot.log 2>&1 < /dev/null &
  for i in $(seq 1 60); do curl -s -o /dev/null --max-time 2 http://localhost:3000/login && break; sleep 1; done
fi

echo "########## 1. SETUP IFRAME WRAPPER (127.0.0.1:3005 -> localhost:3000 = CROSS-SITE) ##########"
mkdir -p /tmp/iframe-test
cat > /tmp/iframe-test/index.html <<'EOF'
<!DOCTYPE html>
<html><head><title>Preview Simulator</title></head>
<body style="margin:0">
<h3 style="font-family:sans-serif">Simulating preview panel iframe (cross-origin wrapper)</h3>
<iframe id="f" src="http://localhost:3000/login" style="width:1400px;height:760px;border:2px solid red"></iframe>
</body></html>
EOF
pkill -f "http.server 3005" 2>/dev/null
(setsid nohup python3 -m http.server 3005 --bind 127.0.0.1 -d /tmp/iframe-test > /tmp/http3005.log 2>&1 < /dev/null &) 
sleep 2
curl -s -o /dev/null -w "  wrapper server: HTTP %{http_code}\n" http://127.0.0.1:3005/

echo ""
echo "########## 2. BROWSER: LOGIN INSIDE CROSS-SITE IFRAME ##########"
agent-browser close 2>/dev/null
agent-browser set viewport 1500 900
agent-browser open http://127.0.0.1:3005/
sleep 3
agent-browser frame "#f"
sleep 2
echo "  --- iframe snapshot (top 10) ---"
agent-browser snapshot -i -c 2>/dev/null | head -10
agent-browser fill @e4 "e2e-test@apecspace.local" 2>/dev/null || echo "  (fill email by ref failed, trying role)"
agent-browser fill @e5 "E2eTest#2026!" 2>/dev/null || true
agent-browser find text "Đăng nhập ngay" click 2>/dev/null || agent-browser find role button click --name "Đăng nhập ngay"
echo "  ... waiting ..."
sleep 7
echo "  --- iframe content AFTER login (login form again? or dashboard?) ---"
agent-browser snapshot -c 2>/dev/null | head -20
echo ""
echo "  --- ALL COOKIES after iframe login ---"
agent-browser cookies
agent-browser screenshot /home/z/my-project/download/test-screenshots/09-iframe-login-result.png
agent-browser frame main 2>/dev/null
agent-browser close

echo ""
echo "########## 3. SERVER LOG: what happened ##########"
grep -E "POST /api/auth/login|GET /dashboard|GET /login" /tmp/dev-boot.log | tail -8

echo ""
echo "########## 4. CLEANUP: delete temp user + its logs ##########"
E2E_ID=$(cat /tmp/e2e-user-id)
D1=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/activity_logs?user_id=eq.$E2E_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
D2=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?id=eq.$E2E_ID" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY")
echo "  deleted activity_logs: HTTP $D1, deleted user: HTTP $D2 (id: $E2E_ID)"
curl -s --max-time 15 -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?select=email&id=eq.$E2E_ID" | head -c 100
echo " <- should be []"
