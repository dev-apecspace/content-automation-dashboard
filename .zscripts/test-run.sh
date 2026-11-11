#!/bin/bash
# Batch test: start dev server + full route test in ONE session
# (sandbox kills background processes between tool calls, so everything must run here)
cd /home/z/my-project

echo "########## 1. START DEV SERVER via dev.sh ##########"
setsid nohup bash .zscripts/dev.sh > .zscripts/dev.log 2>&1 < /dev/null &
echo "dev.sh launched"

# wait for port 3000
for i in $(seq 1 45); do
  if curl -s -o /dev/null --max-time 2 http://localhost:3000/login; then
    echo "PORT 3000 UP after ${i}s"
    break
  fi
  sleep 1
done

echo ""
echo "########## 2. DEV LOG (boot) ##########"
tail -20 .zscripts/dev.log

echo ""
echo "########## 3. CURL TEST SUITE ##########"
echo "--- 3.1 GET / (no auth) ---"
curl -s -o /dev/null -w "HTTP %{http_code} -> %{redirect_url}\n" --max-time 60 http://localhost:3000/

echo "--- 3.2 GET /login (first compile) ---"
curl -s -o /tmp/login.html -w "HTTP %{http_code}, %{size_download} bytes, %{time_total}s\n" --max-time 120 http://localhost:3000/login
grep -oE "<title>[^<]*</title>" /tmp/login.html | head -1

echo "--- 3.3 POST /api/auth/login (fake creds -> Supabase check) ---"
curl -s -w "\nHTTP %{http_code}\n" --max-time 60 -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"test@fake.com","password":"wrongpass"}'

echo "--- 3.4 POST /api/auth/login (missing fields) ---"
curl -s -w "\nHTTP %{http_code}\n" --max-time 60 -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":""}'

echo "--- 3.5 GET /dashboard (protected) ---"
curl -s -o /dev/null -w "HTTP %{http_code} -> %{redirect_url}\n" --max-time 60 http://localhost:3000/dashboard

echo "--- 3.6 GET /api/activity/log (protected API) ---"
curl -s -o /dev/null -w "HTTP %{http_code} -> %{redirect_url}\n" --max-time 60 http://localhost:3000/api/activity/log

echo "--- 3.7 GET /api/webhook/schedule-post (webhook route) ---"
curl -s -w "\nHTTP %{http_code}\n" --max-time 60 http://localhost:3000/api/webhook/schedule-post | head -3

echo ""
echo "########## 4. BROWSER TEST (agent-browser) ##########"
mkdir -p /home/z/my-project/download/test-screenshots
agent-browser set viewport 1440 900
agent-browser open http://localhost:3000/ && agent-browser wait --load networkidle --timeout 30000
echo "--- URL after opening / ---"
agent-browser get url
agent-browser screenshot /home/z/my-project/download/test-screenshots/01-root-redirect.png
agent-browser open http://localhost:3000/login && agent-browser wait --load networkidle --timeout 30000
sleep 2
echo "--- login page title ---"
agent-browser get title
agent-browser screenshot /home/z/my-project/download/test-screenshots/02-login-page.png
echo "--- login page interactive elements ---"
agent-browser snapshot -i -c | head -30
echo "--- console errors ---"
agent-browser errors | head -20
echo "--- page errors/console ---"
agent-browser console | head -20

echo ""
echo "########## 5. DEV LOG AFTER TESTS ##########"
tail -40 .zscripts/dev.log
