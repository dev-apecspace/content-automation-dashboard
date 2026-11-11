#!/bin/bash
# Batch test 2: DB probe + authenticated page tests with crafted JWT
cd /home/z/my-project
set -a
source .env.local
set +a

echo "########## 1. SUPABASE TABLE PROBE (service role) ##########"
TABLES="users projects content_items video_items schedules posts prompts roles role_permissions permissions accounts settings notification_settings ai_models ai_config activity_logs cost_logs"
for t in $TABLES; do
  CR=$(curl -s -D - -o /dev/null --max-time 15 \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Prefer: count=exact" -H "Range: 0-0" \
    "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/$t?select=*" | grep -i "^content-range:" | tr -d '\r')
  if [ -n "$CR" ]; then
    echo "  $t -> OK ($CR)"
  else
    echo "  $t -> MISSING/ERROR"
  fi
done

echo ""
echo "########## 2. USERS IN DB ##########"
curl -s --max-time 15 -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?select=id,email,name,role,is_active&limit=10" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const u=JSON.parse(d);u.forEach(x=>console.log('  ',x.email,'|',x.role,'| active:',x.is_active,'| id:',x.id))}catch(e){console.log('  parse error:',d.slice(0,200))}})"

echo ""
echo "########## 3. CRAFT JWT (same as app signToken) ##########"
JWT=$(node -e "
const path='/home/z/my-project/node_modules/jsonwebtoken';
const jwt=require(path);
const fs=require('fs');
const env=fs.readFileSync('/home/z/my-project/.env.local','utf8');
const secret=env.match(/JWT_SECRET=(.+)/)[1].trim();
const token=jwt.sign({userId:'user_1',email:'admin@example.com',role:'admin',name:'Admin User'},secret,{expiresIn:'7d'});
process.stdout.write(token);
")
echo "  token created, length: ${#JWT}"

echo ""
echo "########## 4. START SERVER (log to /tmp to test rebuild-loop theory) ##########"
setsid nohup bash .zscripts/dev.sh > /tmp/dev-boot.log 2>&1 < /dev/null &
for i in $(seq 1 45); do
  curl -s -o /dev/null --max-time 2 http://localhost:3000/login && { echo "PORT 3000 UP after ${i}s"; break; }
  sleep 1
done

echo ""
echo "########## 5. AUTHENTICATED PAGES (with JWT cookie) ##########"
for p in /dashboard /content /projects /accounts /schedules /prompts /users /roles /activity-logs /settings /guide /video; do
  R=$(curl -s -o /dev/null -w "%{http_code}" --max-time 180 -b "auth_token=$JWT" "http://localhost:3000$p")
  echo "  $p -> HTTP $R"
done

echo ""
echo "########## 6. BROWSER: DASHBOARD ##########"
mkdir -p /home/z/my-project/download/test-screenshots
agent-browser cookies set auth_token "$JWT" --url http://localhost:3000 >/dev/null 2>&1 || agent-browser cookies set auth_token "$JWT"
agent-browser open http://localhost:3000/dashboard
agent-browser wait --load networkidle --timeout 40000 || echo "(networkidle timeout - page may keep polling)"
sleep 3
agent-browser get url
agent-browser get title
agent-browser screenshot /home/z/my-project/download/test-screenshots/03-dashboard.png || true
echo "--- dashboard snapshot (top) ---"
agent-browser snapshot -i -c 2>/dev/null | head -40
echo "--- browser errors ---"
agent-browser errors 2>/dev/null | head -15

echo ""
echo "########## 7. REBUILD-LOOP CHECK (server log in /tmp) ##########"
echo "  rebuild count while browser open: $(grep -c '✓ Compiled' /tmp/next-dev.log 2>/dev/null || echo 'n/a')"
echo "  GET requests logged: $(grep -c 'GET ' /tmp/next-dev.log 2>/dev/null || echo 'n/a')"

echo ""
echo "########## 8. SERVER LOG ERRORS ##########"
grep -n -E "⨯|Error|error|Failed|failed|500" /tmp/next-dev.log 2>/dev/null | grep -v -E "error.message|console.error" | head -25 || echo "  (no errors found)"
echo "--- boot log ---"
tail -5 /tmp/dev-boot.log
