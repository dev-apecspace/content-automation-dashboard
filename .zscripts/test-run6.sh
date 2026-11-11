#!/bin/bash
# Batch 6: login flow E2E - cookie check + redirect check
cd /home/z/my-project
set -a
source .env.local
set +a

echo "########## 0. SERVER CHECK ##########"
if ! curl -s -o /dev/null --max-time 3 http://localhost:3000/login; then
  echo "  server down -> restarting (log -> /tmp/dev-boot.log)"
  pkill -f "next dev" 2>/dev/null; pkill -f "next-server" 2>/dev/null; sleep 2
  setsid nohup bash .zscripts/dev.sh > /tmp/dev-boot.log 2>&1 < /dev/null &
  for i in $(seq 1 60); do
    curl -s -o /dev/null --max-time 2 http://localhost:3000/login && { echo "  UP after ${i}s"; break; }
    sleep 1
  done
else
  echo "  server alive on 3000"
fi

echo ""
echo "########## 1. USERS TABLE SCHEMA (required cols) ##########"
curl -s --max-time 15 -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" > /tmp/openapi.json 2>/dev/null
node -e "
try{
  const spec=JSON.parse(require('fs').readFileSync('/tmp/openapi.json','utf8'));
  const u=spec.definitions&&spec.definitions.users;
  if(u){console.log('  required:',JSON.stringify(u.required||[]));console.log('  columns:',Object.keys(u.properties||{}).join(', '));}
  else console.log('  (no openapi users def)');
}catch(e){console.log('  openapi parse fail');}"

echo ""
echo "########## 2. RLS CHECK: anon key SELECT users ##########"
curl -s -w "\n  HTTP %{http_code}\n" --max-time 15 \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users?select=id,email,role&limit=3" | head -c 400

echo ""
echo "########## 3. CREATE TEMP E2E USER ##########"
HASH=$(node -e "const b=require('/home/z/my-project/node_modules/bcryptjs');process.stdout.write(b.hashSync('E2eTest#2026!',10))")
E2E_ID="e2e_$(date +%s)"
echo "$E2E_ID" > /tmp/e2e-user-id
INS=$(curl -s --max-time 15 -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/users" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"id\":\"$E2E_ID\",\"email\":\"e2e-test@apecspace.local\",\"name\":\"E2E Test\",\"role\":\"admin\",\"is_active\":true,\"password\":\"$HASH\"}")
echo "  insert result: $(echo "$INS" | head -c 250)"

echo ""
echo "########## 4. API LOGIN: Set-Cookie headers (curl) ##########"
curl -s -i --max-time 30 -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"e2e-test@apecspace.local","password":"E2eTest#2026!"}' | grep -i -E "^HTTP|^set-cookie|^content-type" 
echo "  ^ cookie attributes: HttpOnly? SameSite? Secure?"

echo ""
echo "########## 5. BROWSER E2E: login -> redirect? ##########"
mkdir -p /home/z/my-project/download/test-screenshots
agent-browser close 2>/dev/null
agent-browser set viewport 1440 900
agent-browser open http://localhost:3000/login
agent-browser wait --load networkidle --timeout 30000 || true
sleep 2
echo "  --- cookies BEFORE login ---"
agent-browser cookies | head -5
REFS=$(agent-browser snapshot -i --json 2>/dev/null)
EMAIL_REF=$(echo "$REFS" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{const j=JSON.parse(d);const t=JSON.stringify(j);const m=t.match(/\"ref\":\"(@e\d+)\"[^}]*EMAIL|EMAIL[^}]*\"ref\":\"(@e\d+)\"/);console.log(m?(m[1]||m[2]):'')}catch(e){console.log('')}})")
echo "  email ref: $EMAIL_REF"
# fallback: dùng refs cố định theo snapshot đã biết (e4=email, e5=password, e3=button)
agent-browser fill @e4 "e2e-test@apecspace.local" 2>/dev/null || agent-browser find role textbox fill "e2e-test@apecspace.local" --name "EMAIL"
agent-browser fill @e5 "E2eTest#2026!" 2>/dev/null || agent-browser find role textbox fill "E2eTest#2026!" --name "MẬT KHẨU"
echo "  --- form filled ---"
agent-browser find text "Đăng nhập ngay" click
echo "  ... waiting for navigation ..."
sleep 6
echo "  URL after login: $(agent-browser get url)"
echo "  TITLE after login: $(agent-browser get title)"
echo "  --- cookies AFTER login ---"
agent-browser cookies
echo "  --- network: /dashboard + login requests ---"
agent-browser network requests --filter dashboard 2>/dev/null | head -8
agent-browser network requests --filter "api/auth" 2>/dev/null | head -6
agent-browser screenshot /home/z/my-project/download/test-screenshots/08-after-login-click.png
echo "  --- snapshot top 15 ---"
agent-browser snapshot -c 2>/dev/null | head -15
echo "  --- server log tail ---"
grep -E "POST /api/auth/login|GET /dashboard" /tmp/dev-boot.log | tail -6
