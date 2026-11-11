#!/bin/bash
# Batch test 4: memory profiling + OOM detection + browser auth test
cd /home/z/my-project

echo "########## 0. CGROUP MEMORY BASELINE ##########"
CG=/sys/fs/cgroup
cat $CG/memory.max 2>/dev/null && echo "  ^ memory.max"
grep -E "oom_kill" $CG/memory.events 2>/dev/null && echo "  ^ oom_kill count BEFORE" || echo "  cgroup stats not readable"

echo ""
echo "########## 1. START CLEAN SERVER ##########"
pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null; sleep 2
setsid nohup bash .zscripts/dev.sh > .zscripts/dev.log 2>&1 < /dev/null &
for i in $(seq 1 60); do
  curl -s -o /dev/null --max-time 2 http://localhost:3000/login && { echo "  PORT 3000 UP after ${i}s"; break; }
  sleep 1
done
mem() {
  ps -eo rss,comm,args --sort=-rss 2>/dev/null | grep -E "next-server|next dev" | grep -v grep | awk '{s+=$1} END {printf "  [next total RSS: %.0f MB]", s/1024}'
  free -m | awk 'NR==2 {printf " | system used: %d MB, avail: %d MB]\n", $3, $7}'
}
mem

set -a
source .env.local
set +a
JWT=$(node -e "
const jwt=require('/home/z/my-project/node_modules/jsonwebtoken');
const fs=require('fs');
const secret=fs.readFileSync('/home/z/my-project/.env.local','utf8').match(/JWT_SECRET=(.+)/)[1].trim();
process.stdout.write(jwt.sign({userId:'user_1',email:'admin@example.com',role:'admin',name:'Admin User'},secret,{expiresIn:'7d'}));
")

echo ""
echo "########## 2. PAGES SLOWLY (5s gap), memory after each ##########"
for p in /dashboard /content /projects /accounts /schedules /prompts /users /roles /activity-logs /settings /guide /video; do
  R=$(curl -s -o /dev/null -w "%{http_code}" --max-time 240 -b "auth_token=$JWT" "http://localhost:3000$p")
  echo "  $p -> HTTP $R  $(mem)"
  sleep 4
done

echo ""
echo "########## 3. OOM CHECK AFTER PAGE LOADS ##########"
grep -E "oom_kill" $CG/memory.events 2>/dev/null && echo "  ^ oom_kill count AFTER" || true
echo "  server alive? $(curl -s -o /dev/null -w 'HTTP %{http_code}' --max-time 5 http://localhost:3000/login)"
echo "  dev.log tail:"; tail -4 .zscripts/dev.log

echo ""
echo "########## 4. BROWSER: AUTHED DASHBOARD ##########"
mkdir -p /home/z/my-project/download/test-screenshots
agent-browser set viewport 1440 900
agent-browser cookies set auth_token "$JWT"
agent-browser open http://localhost:3000/dashboard
agent-browser wait --load networkidle --timeout 60000 || echo "  (networkidle timeout)"
sleep 5
echo "  URL: $(agent-browser get url)"
echo "  TITLE: $(agent-browser get title)"
agent-browser screenshot /home/z/my-project/download/test-screenshots/05-dashboard.png
echo "  --- snapshot (first 40 lines) ---"
agent-browser snapshot -c 2>/dev/null | head -40
echo "  --- errors ---"
agent-browser errors 2>/dev/null | head -8
mem

echo ""
echo "########## 5. BROWSER: /content ##########"
agent-browser open http://localhost:3000/content
agent-browser wait --load networkidle --timeout 60000 || echo "  (networkidle timeout)"
sleep 4
echo "  TITLE: $(agent-browser get title)"
agent-browser screenshot /home/z/my-project/download/test-screenshots/06-content.png
agent-browser snapshot -c 2>/dev/null | head -25
mem

echo ""
echo "########## 6. FINAL STATE ##########"
agent-browser close
grep -E "oom_kill" $CG/memory.events 2>/dev/null && echo "  ^ oom_kill count FINAL"
ss -tlnp 2>/dev/null | grep ":3000" || echo "  PORT 3000: no listener (server died)"
echo "  dev.log last lines:"; tail -6 .zscripts/dev.log
grep -n -E "⨯|Failed to|Error:" .zscripts/dev.log | head -15 || echo "  (no error lines in dev.log)"
