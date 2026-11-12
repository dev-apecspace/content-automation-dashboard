#!/bin/bash
# Test same .next build under `next start` (pnpm start) vs standalone
cd /home/z/my-project

PID=$(ss -tlnp 2>/dev/null | grep ':3200' | grep -oP 'pid=\K[0-9]+' | head -1)
[ -n "$PID" ] && kill -9 "$PID" && sleep 1

: > /tmp/ns.log
set -a; . ./.env.local; set +a
PORT=3200 HOSTNAME=127.0.0.1 node node_modules/next/dist/bin/next start > /tmp/ns.log 2>&1 &
for i in $(seq 1 30); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3200/login); [ "$code" = "200" ] && break; done
echo "next start: $code"

export $(grep -E '^JWT_SECRET=' .env.local | xargs)
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({userId:'tmp_1794455717867',email:'tmp-admin-test@tmp.local',role:'admin',name:'Tmp Admin'},process.env.JWT_SECRET,{expiresIn:'1d'}))")

agent-browser --session repro4 close 2>/dev/null
agent-browser --session repro4 open "http://127.0.0.1:3200/login" 2>&1 | tail -1
agent-browser --session repro4 cookies clear 2>&1 | tail -1
agent-browser --session repro4 cookies set auth_token "$TOKEN" 2>&1 | tail -1
agent-browser --session repro4 open "http://127.0.0.1:3200/dashboard" 2>&1 | tail -1
agent-browser --session repro4 wait --load networkidle --timeout 20000 2>&1 | tail -1
sleep 6
echo "=== SIDEBAR under next start ==="
agent-browser --session repro4 snapshot 2>&1 | sed -n '1,20p'
echo "=== NETWORK (non-static) ==="
agent-browser --session repro4 network requests 2>&1 | grep -vE "static|chunks|svg|woff|image|fonts|\.js|\.css|\.png|\.ico" | tail -10
echo "=== next start log ==="
cat /tmp/ns.log
