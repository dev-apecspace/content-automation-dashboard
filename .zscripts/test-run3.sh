#!/bin/bash
# Batch test 3: clean single server + full browser verification
cd /home/z/my-project

echo "########## 0. CURRENT STATE ##########"
ss -tlnp 2>/dev/null | grep -E ":300[0-9]" || echo "  (no 300x listeners)"
ps aux | grep -E "next dev|next-server|dev.sh" | grep -v grep | awk '{print "  PID",$2":",substr($0,index($0,$11),80)}' || true

echo ""
echo "########## 1. CLEANUP: kill all next/dev.sh instances ##########"
pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null; pkill -f ".zscripts/dev.sh" 2>/dev/null
sleep 3
ss -tlnp 2>/dev/null | grep -E ":300[0-9]" || echo "  (ports clean)"

echo ""
echo "########## 2. START ONE CLEAN SERVER ##########"
setsid nohup bash .zscripts/dev.sh > .zscripts/dev.log 2>&1 < /dev/null &
for i in $(seq 1 60); do
  curl -s -o /dev/null --max-time 2 http://localhost:3000/login && { echo "  PORT 3000 UP after ${i}s"; break; }
  sleep 1
done
grep -E "Local:|Ready" .zscripts/dev.log | head -3

set -a
source .env.local
set +a
JWT=$(node -e "
const jwt=require('/home/z/my-project/node_modules/jsonwebtoken');
const fs=require('fs');
const secret=fs.readFileSync('/home/z/my-project/.env.local','utf8').match(/JWT_SECRET=(.+)/)[1].trim();
process.stdout.write(jwt.sign({userId:'user_1',email:'admin@example.com',role:'admin',name:'Admin User'},secret,{expiresIn:'7d'}));
")

echo ""
echo "########## 3. RETEST /video + all pages (single warm server) ##########"
for p in /dashboard /content /projects /accounts /schedules /prompts /users /roles /activity-logs /settings /guide /video; do
  R=$(curl -s -o /dev/null -w "%{http_code} in %{time_total}s" --max-time 240 -b "auth_token=$JWT" "http://localhost:3000$p")
  echo "  $p -> HTTP $R"
done

echo ""
echo "########## 4. BROWSER: LOGIN FORM (wrong creds error path) ##########"
mkdir -p /home/z/my-project/download/test-screenshots
agent-browser set viewport 1440 900
agent-browser open http://localhost:3000/login
agent-browser wait --load networkidle --timeout 30000 || true
sleep 2
agent-browser snapshot -i -c | head -12
agent-browser find label "EMAIL" fill "wrong@test.com" 2>/dev/null || agent-browser fill @e4 "wrong@test.com"
agent-browser find label "MẬT KHẨU" fill "wrongpass123" 2>/dev/null || agent-browser fill @e5 "wrongpass123"
agent-browser find text "Đăng nhập ngay" click 2>/dev/null || agent-browser click @e3
sleep 4
agent-browser screenshot /home/z/my-project/download/test-screenshots/04-login-error.png
echo "  (screenshot: 04-login-error.png)"

echo ""
echo "########## 5. BROWSER: DASHBOARD (authed) ##########"
agent-browser cookies set auth_token "$JWT"
agent-browser open http://localhost:3000/dashboard
agent-browser wait --load networkidle --timeout 45000 || echo "  (networkidle timeout)"
sleep 4
echo "  URL: $(agent-browser get url)"
echo "  TITLE: $(agent-browser get title)"
agent-browser screenshot /home/z/my-project/download/test-screenshots/05-dashboard.png
echo "  --- snapshot ---"
agent-browser snapshot -c 2>/dev/null | head -45
echo "  --- console errors ---"
agent-browser errors 2>/dev/null | head -10

echo ""
echo "########## 6. BROWSER: /content PAGE ##########"
agent-browser open http://localhost:3000/content
agent-browser wait --load networkidle --timeout 45000 || echo "  (networkidle timeout)"
sleep 4
echo "  TITLE: $(agent-browser get title)"
agent-browser screenshot /home/z/my-project/download/test-screenshots/06-content.png
agent-browser snapshot -c 2>/dev/null | head -25

echo ""
echo "########## 7. REBUILD LOOP CHECK ##########"
echo "  dev.log size now: $(stat -c%s .zscripts/dev.log)"
sleep 10
echo "  dev.log size after 10s idle (browser open): $(stat -c%s .zscripts/dev.log)"
agent-browser close
sleep 3
echo "  dev.log size after browser close: $(stat -c%s .zscripts/dev.log)"
echo "  --- last log lines ---"
tail -8 .zscripts/dev.log
echo "  --- error scan ---"
grep -n -E "⨯|Failed to|Error:" .zscripts/dev.log | head -20 || echo "  (no server errors)"
