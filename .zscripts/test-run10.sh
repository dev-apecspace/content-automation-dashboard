#!/bin/bash
# Batch 10: iframe verification with proper wait + session persistence check
cd /home/z/my-project
set -a
source .env.local
set +a

echo "########## 0. SERVER CHECK ##########"
curl -s -o /dev/null --max-time 3 http://localhost:3000/login || { pkill -f "next dev"; pkill -f "next-server"; sleep 2; setsid nohup bash .zscripts/dev.sh > /tmp/dev-boot.log 2>&1 < /dev/null & for i in $(seq 1 60); do curl -s -o /dev/null --max-time 2 http://localhost:3000/login && break; sleep 1; done; }
echo "  ok"

echo "########## 1. RECREATE TEMP USER ##########"
HASH=$(node -e "const b=require('/home/z/my-project/node_modules/bcryptjs');process.stdout.write(b.hashSync('E2eTest#2026!',10))")
E2E_ID="e2e_$(date +%s)"
echo "$E2E_ID" > /tmp/e2e-user-id
curl -s --max-time 15 -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"id\":\"$E2E_ID\",\"email\":\"e2e-test@apecspace.local\",\"name\":\"E2E Test\",\"role\":\"admin\",\"is_active\":true,\"password\":\"$HASH\"}" > /dev/null
echo "  user created: $E2E_ID"

echo ""
echo "########## 2. LOGIN INSIDE IFRAME (wait long enough) ##########"
agent-browser close 2>/dev/null
agent-browser set viewport 1500 900
agent-browser open http://127.0.0.1:3005/
sleep 4
SNAP=$(agent-browser snapshot -i -c 2>/dev/null)
EMAIL_REF=$(echo "$SNAP" | sed -n 's/.*textbox "EMAIL".*ref=\(e[0-9]*\).*/\1/p' | tail -1)
PASS_REF=$(echo "$SNAP" | sed -n 's/.*M.*T KH.*U.*ref=\(e[0-9]*\).*/\1/p' | tail -1)
BTN_REF=$(echo "$SNAP" | sed -n 's/.*button "Đăng nhập ngay".*ref=\(e[0-9]*\).*/\1/p' | tail -1)
agent-browser fill @$EMAIL_REF "e2e-test@apecspace.local"
agent-browser fill @$PASS_REF "E2eTest#2026!"
agent-browser click @$BTN_REF
echo "  clicked. Polling iframe content every 4s (max 40s)..."
for i in $(seq 1 10); do
  sleep 4
  C=$(agent-browser snapshot -c 2>/dev/null)
  if echo "$C" | grep -q "Content Dashboard"; then
    echo "  >>> DASHBOARD RENDERED INSIDE IFRAME after ~$((i*4))s <<<"
    break
  fi
  echo "  poll $i: dashboard chưa hiện (đang compile/render)..."
done
echo ""
echo "  --- IFRAME CONTENT (top 28 lines) ---"
agent-browser snapshot -c 2>/dev/null | head -28
echo ""
echo "  --- COOKIES ---"
agent-browser cookies | head -3
agent-browser screenshot /home/z/my-project/download/test-screenshots/10-iframe-dashboard-fixed.png

echo ""
echo "########## 3. SESSION PERSISTENCE: reload iframe -> /dashboard directly ##########"
cat > /tmp/iframe-test/dash.html <<'EOF'
<!DOCTYPE html>
<html><head><title>Dashboard Iframe</title></head>
<body style="margin:0">
<iframe id="f" src="http://localhost:3000/dashboard" style="width:1400px;height:760px;border:2px solid green"></iframe>
</body></html>
EOF
agent-browser open http://127.0.0.1:3005/dash.html
sleep 6
for i in $(seq 1 6); do
  C=$(agent-browser snapshot -c 2>/dev/null)
  if echo "$C" | grep -q "Content Dashboard"; then echo "  >>> SESSION PERSISTED: dashboard loads WITHOUT re-login <<<"; break; fi
  echo "  poll $i..."
  sleep 4
done
agent-browser snapshot -c 2>/dev/null | head -12
agent-browser screenshot /home/z/my-project/download/test-screenshots/12-iframe-session-persist.png
agent-browser close

echo ""
echo "########## 4. CLEANUP ##########"
E2E_ID=$(cat /tmp/e2e-user-id)
curl -s -o /dev/null -w "  del logs: HTTP %{http_code} " -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/activity_logs?user_id=eq.$E2E_ID" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
curl -s -o /dev/null -w "| del user: HTTP %{http_code}\n" -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?id=eq.$E2E_ID" -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

echo ""
echo "########## 5. GIT DIFF SUMMARY ##########"
git diff --stat
