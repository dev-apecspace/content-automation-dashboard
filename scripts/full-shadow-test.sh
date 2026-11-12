#!/bin/bash
# Full pipeline: rebuild shadow + copy static + start + browser test
cd /home/z/pubbuild
set -a; . ./.env.local; set +a
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=2048"

echo "[1/4] building..."
rm -rf .next
node node_modules/next/dist/bin/next build > /tmp/pb2.log 2>&1
BUILD_EXIT=$?
echo "build exit: $BUILD_EXIT"
[ $BUILD_EXIT -ne 0 ] && tail -30 /tmp/pb2.log && exit 1

echo "[2/4] copying static into standalone..."
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/ 2>/dev/null
echo "static files: $(find .next/standalone/.next/static -name '*.js' | wc -l) js chunks"

echo "[3/4] starting server on 3400..."
OLDPID=$(ss -tlnp 2>/dev/null | grep ':3400' | grep -oP 'pid=\K[0-9]+' | head -1)
[ -n "$OLDPID" ] && kill -9 "$OLDPID" && sleep 1
: > /tmp/sb.log
PORT=3400 HOSTNAME=127.0.0.1 node .next/standalone/server.js > /tmp/sb.log 2>&1 &
for i in $(seq 1 25); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3400/login); [ "$code" = "200" ] && break; done
echo "server: $code"

echo "[4/4] browser test..."
export $(grep -E '^JWT_SECRET=' .env.local | xargs)
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({userId:'tmp_1794455717867',email:'tmp-admin-test@tmp.local',role:'admin',name:'Tmp Admin'},process.env.JWT_SECRET,{expiresIn:'1d'}))")
agent-browser --session sb3 close 2>/dev/null
agent-browser --session sb3 open "http://127.0.0.1:3400/login" 2>&1 | tail -1
agent-browser --session sb3 cookies clear 2>&1 | tail -1
agent-browser --session sb3 cookies set auth_token "$TOKEN" 2>&1 | tail -1
agent-browser --session sb3 open "http://127.0.0.1:3400/dashboard" 2>&1 | tail -1
agent-browser --session sb3 wait --load networkidle --timeout 25000 2>&1 | tail -1
sleep 8
echo "=== SIDEBAR ==="
agent-browser --session sb3 snapshot 2>&1 | sed -n '1,32p'
echo "=== CONSOLE ==="
agent-browser --session sb3 console 2>&1 | tail -5
echo "=== SERVER LOG ==="
tail -8 /tmp/sb.log
