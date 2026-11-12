#!/bin/bash
# Reproduce sidebar bug on local standalone build with visible server logs
cd /home/z/my-project

# kill leftovers
pkill -f "standalone/server.js" 2>/dev/null; sleep 1

# start server with env
set -a; . ./.env.local; set +a
PORT=3100 HOSTNAME=127.0.0.1 node .next/standalone/server.js > /tmp/standalone.log 2>&1 &
SRV=$!
for i in $(seq 1 20); do
  sleep 1
  code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3100/login 2>/dev/null)
  [ "$code" = "200" ] && break
done
echo "server up: $code (pid $SRV)"

# browser: login and land on dashboard
agent-browser --session repro open "http://127.0.0.1:3100/login" 2>&1 | tail -1
sleep 2
agent-browser --session repro snapshot -i 2>&1 | grep -E "textbox|Đăng nhập" | head -5
agent-browser --session repro find label "Email" fill "tmp-admin-test@tmp.local" 2>&1 | tail -1
agent-browser --session repro find label "Mật khẩu" fill "TmpAdmin123!" 2>&1 | tail -1
agent-browser --session repro find text "Đăng nhập ngay" click 2>&1 | tail -1
agent-browser --session repro wait --url "/dashboard" --timeout 20000 2>&1 | tail -1
sleep 5
echo "=== URL: $(agent-browser --session repro get url) ==="
echo "=== SIDEBAR ==="
agent-browser --session repro snapshot 2>&1 | sed -n '1,25p'
echo "=== BROWSER CONSOLE ==="
agent-browser --session repro console 2>&1 | tail -10
echo "=== SERVER LOG (full) ==="
cat /tmp/standalone.log
