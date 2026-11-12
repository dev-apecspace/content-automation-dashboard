#!/bin/bash
# Test server actions on local standalone build by setting auth cookie directly
cd /home/z/my-project

# ensure server alive
code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3100/login 2>/dev/null)
if [ "$code" != "200" ]; then
  pkill -f "standalone/server.js" 2>/dev/null; sleep 1
  set -a; . ./.env.local; set +a
  PORT=3100 HOSTNAME=127.0.0.1 node .next/standalone/server.js > /tmp/standalone.log 2>&1 &
  for i in $(seq 1 20); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3100/login); [ "$code" = "200" ] && break; done
fi
echo "server: $code"

# mint JWT with real secret
export $(grep -E '^JWT_SECRET=' .env.local | xargs)
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({userId:'tmp_1794455717867',email:'tmp-admin-test@tmp.local',role:'admin',name:'Tmp Admin'},process.env.JWT_SECRET,{expiresIn:'1d'}))")
echo "token minted: ${TOKEN:0:30}..."

agent-browser --session repro open "http://127.0.0.1:3100/login" 2>&1 | tail -1
agent-browser --session repro cookies clear 2>&1 | tail -1
agent-browser --session repro cookies set auth_token "$TOKEN" 2>&1 | tail -1
agent-browser --session repro open "http://127.0.0.1:3100/dashboard" 2>&1 | tail -1
agent-browser --session repro wait --load networkidle --timeout 20000 2>&1 | tail -1
sleep 4
echo "=== URL: $(agent-browser --session repro get url) ==="
echo "=== SIDEBAR AREA ==="
agent-browser --session repro snapshot 2>&1 | sed -n '1,30p'
echo "=== BROWSER CONSOLE ==="
agent-browser --session repro console 2>&1 | tail -8
echo "=== SERVER LOG ==="
tail -40 /tmp/standalone.log
