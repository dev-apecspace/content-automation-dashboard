#!/bin/bash
# Clean restart + cookie flow + capture REAL server-side error
cd /home/z/my-project
pkill -f "standalone/server.js" 2>/dev/null
sleep 2
: > /tmp/standalone.log
set -a; . ./.env.local; set +a
PORT=3100 HOSTNAME=127.0.0.1 node .next/standalone/server.js > /tmp/standalone.log 2>&1 &
for i in $(seq 1 25); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3100/login); [ "$code" = "200" ] && break; done
echo "server: $code"

export $(grep -E '^JWT_SECRET=' .env.local | xargs)
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({userId:'tmp_1794455717867',email:'tmp-admin-test@tmp.local',role:'admin',name:'Tmp Admin'},process.env.JWT_SECRET,{expiresIn:'1d'}))")

agent-browser --session repro2 close 2>/dev/null | tail -1
agent-browser --session repro2 open "http://127.0.0.1:3100/login" 2>&1 | tail -1
agent-browser --session repro2 cookies clear 2>&1 | tail -1
agent-browser --session repro2 cookies set auth_token "$TOKEN" 2>&1 | tail -1
agent-browser --session repro2 open "http://127.0.0.1:3100/dashboard" 2>&1 | tail -1
agent-browser --session repro2 wait --load networkidle --timeout 20000 2>&1 | tail -1
sleep 6
echo "=== BROWSER CONSOLE ==="
agent-browser --session repro2 console 2>&1 | tail -12
echo "=== BROWSER ERRORS ==="
agent-browser --session repro2 errors 2>&1 | tail -12
echo "=== SERVER LOG ==="
cat /tmp/standalone.log
