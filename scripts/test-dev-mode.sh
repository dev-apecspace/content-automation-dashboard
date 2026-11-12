#!/bin/bash
# Dev mode to surface real server action error
cd /home/z/pubbuild
PID=$(ss -tlnp 2>/dev/null | grep ':3500' | grep -oP 'pid=\K[0-9]+' | head -1)
[ -n "$PID" ] && kill -9 "$PID" 2>/dev/null && sleep 1

: > /tmp/dev.log
set -a; . ./.env.local; set +a
export NEXT_TELEMETRY_DISABLED=1
PORT=3500 HOSTNAME=127.0.0.1 setsid nohup node node_modules/next/dist/bin/next dev > /tmp/dev.log 2>&1 < /dev/null &
echo "dev pid $!"
for i in $(seq 1 60); do sleep 2; code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3500/login 2>/dev/null); [ "$code" = "200" ] && break; done
echo "dev server: $code"

export $(grep -E '^JWT_SECRET=' .env.local | xargs)
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({userId:'tmp_1794455717867',email:'tmp-admin-test@tmp.local',role:'admin',name:'Tmp Admin'},process.env.JWT_SECRET,{expiresIn:'1d'}))")

agent-browser --session dev close 2>/dev/null
agent-browser --session dev open "http://127.0.0.1:3500/login" 2>&1 | tail -1
agent-browser --session dev cookies clear 2>&1 | tail -1
agent-browser --session dev cookies set auth_token "$TOKEN" 2>&1 | tail -1
agent-browser --session dev open "http://127.0.0.1:3500/dashboard" 2>&1 | tail -1
agent-browser --session dev wait --load networkidle --timeout 40000 2>&1 | tail -1
sleep 8
echo "=== SIDEBAR (dev mode) ==="
agent-browser --session dev snapshot 2>&1 | sed -n '1,24p'
echo "=== DEV CONSOLE ==="
agent-browser --session dev console 2>&1 | tail -15
echo "=== DEV SERVER LOG ==="
tail -50 /tmp/dev.log
