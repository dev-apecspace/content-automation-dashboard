#!/bin/bash
# Launch next build in shadow dir (no wedged upload mount)
cd /home/z/pubbuild
ls .env.local >/dev/null 2>&1 || echo "WARN no .env.local"
set -a; . ./.env.local; set +a
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=2048"
rm -rf .next
setsid nohup node /home/z/pubbuild/node_modules/next/dist/bin/next build > /tmp/pbuild.log 2>&1 < /dev/null &
BPID=$!
echo $BPID > /tmp/pbuild.pid
sleep 8
if kill -0 "$BPID" 2>/dev/null; then
  echo "SHADOW BUILD ALIVE pid=$BPID cpu=$(ps -p $BPID -o pcpu= | tr -d ' ')"
else
  echo "SHADOW BUILD DEAD - log:"
  cat /tmp/pbuild.log
fi
