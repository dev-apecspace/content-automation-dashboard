#!/bin/bash
# Batch test 5: loop-theory confirmation (log to /tmp) + authed browser via document.cookie
cd /home/z/my-project

echo "########## 1. CLEAN RESTART, log -> /tmp/next-dev.log ##########"
pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null; pkill -f "zscripts/dev.sh" 2>/dev/null; sleep 2
setsid nohup bash .zscripts/dev.sh > /tmp/dev-boot.log 2>&1 < /dev/null &
for i in $(seq 1 60); do
  curl -s -o /dev/null --max-time 2 http://localhost:3000/login && { echo "  PORT 3000 UP after ${i}s"; break; }
  sleep 1
done
echo "  (server runtime log goes to /tmp/dev-boot.log because dev.sh inherits stdout)"
: > /tmp/loop-count.txt

set -a
source .env.local
set +a
JWT=$(node -e "
const jwt=require('/home/z/my-project/node_modules/jsonwebtoken');
const fs=require('fs');
const secret=fs.readFileSync('/home/z/my-project/.env.local','utf8').match(/JWT_SECRET=(.+)/)[1].trim();
process.stdout.write(jwt.sign({userId:'user_1',email:'admin@example.com',role:'admin',name:'Admin User'},secret,{expiresIn:'7d'}));
")
echo "$JWT" > /tmp/test.jwt

echo ""
echo "########## 2. BROWSER: SET COOKIE VIA JS + DASHBOARD ##########"
mkdir -p /home/z/my-project/download/test-screenshots
agent-browser set viewport 1440 900
agent-browser open http://localhost:3000/login
sleep 2
agent-browser eval "document.cookie='auth_token=$JWT; path=/'; document.cookie"
echo "  cookie set, navigating..."
agent-browser open http://localhost:3000/dashboard
agent-browser wait --load networkidle --timeout 60000 || echo "  (networkidle timeout)"
sleep 5
echo "  URL: $(agent-browser get url)"
echo "  TITLE: $(agent-browser get title)"
agent-browser screenshot /home/z/my-project/download/test-screenshots/05-dashboard.png
echo "  --- snapshot ---"
agent-browser snapshot -c 2>/dev/null | head -50
echo "  --- page errors ---"
agent-browser errors 2>/dev/null | head -8

echo ""
echo "########## 3. BROWSER: /content ##########"
agent-browser open http://localhost:3000/content
agent-browser wait --load networkidle --timeout 60000 || echo "  (networkidle timeout)"
sleep 4
echo "  TITLE: $(agent-browser get title)"
agent-browser screenshot /home/z/my-project/download/test-screenshots/06-content.png
agent-browser snapshot -c 2>/dev/null | head -30

echo ""
echo "########## 4. BROWSER: /projects ##########"
agent-browser open http://localhost:3000/projects
agent-browser wait --load networkidle --timeout 60000 || echo "  (networkidle timeout)"
sleep 4
echo "  TITLE: $(agent-browser get title)"
agent-browser screenshot /home/z/my-project/download/test-screenshots/07-projects.png
agent-browser snapshot -c 2>/dev/null | head -20

echo ""
echo "########## 5. LOGIN PAGE: wrong-creds error toast ##########"
agent-browser open http://localhost:3000/login
agent-browser wait --load networkidle --timeout 30000 || true
sleep 2
agent-browser eval "document.cookie='auth_token=; path=/; max-age=0'; 'cleared'"
agent-browser open http://localhost:3000/login
sleep 2
agent-browser snapshot -i -c | head -10
agent-browser find label "EMAIL" fill "wrong@test.com"
agent-browser find label "MẬT KHẨU" fill "wrongpass123"
agent-browser find text "Đăng nhập ngay" click
sleep 4
agent-browser screenshot /home/z/my-project/download/test-screenshots/04-login-error.png
echo "  --- toast/alert text present? ---"
agent-browser snapshot -c 2>/dev/null | grep -i -E "invalid|không|sai|toast|alert" | head -8

echo ""
echo "########## 6. RELOAD-LOOP TEST: idle 15s on /login (log in /tmp) ##########"
B=$(grep -c "GET /login" /tmp/dev-boot.log)
sleep 15
A=$(grep -c "GET /login" /tmp/dev-boot.log)
echo "  GET /login before: $B, after 15s idle (browser open): $A  -> loop: $([ $A -gt $((B+3)) ] && echo YES || echo NO)"
agent-browser close

echo ""
echo "########## 7. FINAL MEMORY + LOG ##########"
ps -eo rss,args --sort=-rss 2>/dev/null | grep -E "next-server|next dev" | grep -v grep | awk '{s+=$1} END {printf "  next total RSS: %.0f MB\n", s/1024}'
free -m | awk 'NR==2 {printf "  system used: %d MB, avail: %d MB\n", $3, $7}'
echo "  --- error scan in runtime log ---"
grep -n -E "⨯|Failed to|Error:" /tmp/dev-boot.log | head -15 || echo "  (no error lines)"
echo "  --- last 10 lines ---"
tail -10 /tmp/dev-boot.log
ss -tlnp 2>/dev/null | grep ":3000" && echo "  SERVER STILL RUNNING on 3000"
