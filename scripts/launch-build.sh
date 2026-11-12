#!/bin/bash
# Launch next build detached; verify it survives shell exit
cd /home/z/my-project
set -a; . ./.env.local; set +a
export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="--max-old-space-size=2048"
setsid nohup node /home/z/my-project/node_modules/next/dist/bin/next build > /tmp/build3.log 2>&1 < /dev/null &
BPID=$!
setsid bash -c "echo $BPID > /tmp/build.pid"
sleep 8
if kill -0 "$BPID" 2>/dev/null; then
  echo "BUILD ALIVE pid=$BPID cpu=$(ps -p $BPID -o pcpu= | tr -d ' ')"
else
  echo "BUILD DEAD — log:"
  cat /tmp/build3.log
fi
head -5 /tmp/build3.log
