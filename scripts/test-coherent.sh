#!/bin/bash
# Test fresh build WITH static assets copied (coherent bundle)
cd /home/z/pubbuild
PID=$(ss -tlnp 2>/dev/null | grep ':3400' | grep -oP 'pid=\K[0-9]+' | head -1)
[ -n "$PID" ] && kill -9 "$PID" 2>/dev/null && sleep 1

# the missing standard standalone step!
rm -rf .next/standalone/.next/static
cp -r .next/static .next/standalone/.next/static
echo "static copied: $(ls .next/standalone/.next/static | head -2 | tr '\n' ' ')"

: > /tmp/sb.log
set -a; . ./.env.local; set +a
PORT=3400 HOSTNAME=127.0.0.1 node .next/standalone/server.js > /tmp/sb.log 2>&1 &
for i in $(seq 1 25); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3400/login); [ "$code" = "200" ] && break; done
echo "server: $code"

export $(grep -E '^JWT_SECRET=' .env.local | xargs)
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({userId:'tmp_1794455717867',email:'tmp-admin-test@tmp.local',role:'admin',name:'Tmp Admin'},process.env.JWT_SECRET,{expiresIn:'1d'}))")

agent-browser --session sb2 close 2>/dev/null
agent-browser --session sb2 open "http://127.0.0.1:3400/login" 2>&1 | tail -1
agent-browser --session sb2 cookies clear 2>&1 | tail -1
agent-browser --session sb2 cookies set auth_token "$TOKEN" 2>&1 | tail -1
agent-browser --session sb2 open "http://127.0.0.1:3400/dashboard" 2>&1 | tail -1
agent-browser --session sb2 wait --load networkidle --timeout 25000 2>&1 | tail -1
sleep 8
echo "=== SIDEBAR (coherent prod bundle) ==="
agent-browser --session sb2 snapshot 2>&1 | sed -n '1,30p'
echo "=== CONSOLE ==="
agent-browser --session sb2 console 2>&1 | tail -6
echo "=== SERVER LOG ==="
tail -10 /tmp/sb.log
