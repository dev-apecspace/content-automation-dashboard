#!/bin/bash
# Kill by port, fresh log, cookie flow, capture server error
cd /home/z/my-project

PID=$(ss -tlnp 2>/dev/null | grep ':3100' | grep -oP 'pid=\K[0-9]+' | head -1)
if [ -n "$PID" ]; then echo "killing old pid $PID"; kill -9 "$PID" 2>/dev/null; sleep 2; fi
ss -tlnp 2>/dev/null | grep ':3100' || echo "port 3100 free"

: > /tmp/sa.log
set -a; . ./.env.local; set +a
PORT=3100 HOSTNAME=127.0.0.1 node .next/standalone/server.js > /tmp/sa.log 2>&1 &
SRV=$!
for i in $(seq 1 25); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3100/login); [ "$code" = "200" ] && break; done
echo "server: $code (pid $SRV)"

export $(grep -E '^JWT_SECRET=' .env.local | xargs)
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({userId:'tmp_1794455717867',email:'tmp-admin-test@tmp.local',role:'admin',name:'Tmp Admin'},process.env.JWT_SECRET,{expiresIn:'1d'}))")

agent-browser --session repro3 close 2>/dev/null
agent-browser --session repro3 open "http://127.0.0.1:3100/login" 2>&1 | tail -1
agent-browser --session repro3 cookies clear 2>&1 | tail -1
agent-browser --session repro3 cookies set auth_token "$TOKEN" 2>&1 | tail -1
agent-browser --session repro3 open "http://127.0.0.1:3100/dashboard" 2>&1 | tail -1
agent-browser --session repro3 wait --load networkidle --timeout 20000 2>&1 | tail -1
sleep 6
echo "=== URL ==="
agent-browser --session repro3 get url
echo "=== BROWSER CONSOLE ==="
agent-browser --session repro3 console 2>&1 | tail -12
echo "=== SERVER LOG (/tmp/sa.log) ==="
cat /tmp/sa.log
