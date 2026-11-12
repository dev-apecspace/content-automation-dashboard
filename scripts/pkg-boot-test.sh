#!/bin/bash
# Boot the extracted package via start.sh (mimics FC) and verify
cd /tmp/pkgtest
PID=$(ss -tlnp 2>/dev/null | grep ':3700' | grep -oP 'pid=\K[0-9]+' | head -1)
[ -n "$PID" ] && kill -9 "$PID" 2>/dev/null && sleep 1
PORT=3700 HOSTNAME=127.0.0.1 bash start.sh > /tmp/pkgboot.log 2>&1 &
for i in $(seq 1 30); do sleep 1; code=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3700/login 2>/dev/null); [ "$code" = "200" ] && break; done
echo "login: $code"
curl -s -o /dev/null -w "font: %{http_code}\n" http://127.0.0.1:3700/fonts/be-vietnam-pro-400-latin.woff2
curl -s -o /dev/null -w "root redirect: %{http_code}\n" http://127.0.0.1:3700/

export $(grep -E '^JWT_SECRET=' next-service-dist/.env.local | xargs)
TOKEN=$(node -e "const jwt=require('jsonwebtoken');console.log(jwt.sign({userId:'tmp_1794455717867',email:'tmp-admin-test@tmp.local',role:'admin',name:'Tmp Admin'},process.env.JWT_SECRET,{expiresIn:'1d'}))")

ab() { timeout 40 agent-browser "$@" 2>&1; }
ab --session pkg open "http://127.0.0.1:3700/login" | tail -1
ab --session pkg cookies clear | tail -1
ab --session pkg cookies set auth_token "$TOKEN" | tail -1
ab --session pkg open "http://127.0.0.1:3700/dashboard" | tail -1
ab --session pkg wait --load networkidle --timeout 20000 | tail -1
sleep 6
echo "=== SIDEBAR from packaged boot ==="
ab --session pkg snapshot | grep -E "link \"|StaticText \"(User|Admin|Tmp)" | head -14
