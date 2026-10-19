#!/usr/bin/env bash

# Block for about nine minutes at most while a background Codex run is alive.
if [ "$#" -ne 1 ]; then
  printf '%s\n' 'CODEX_WAIT unknown: usage: codex-wait.sh <pid-file>'
  exit 0
fi
# A pid counts only once its whole line, newline included, is written.
pid=''
for ((attempt=0;attempt<5;attempt++)); do
  if { IFS= read -r pid < "$1"; } 2>/dev/null &&
    [[ "$pid" =~ ^[0-9]{1,10}$ ]] && [ "$((10#$pid))" -gt 1 ]; then
    break
  fi
  pid=''
  sleep 2
done
if [ -z "$pid" ]; then
  printf '%s\n' "CODEX_WAIT unknown: no pid in $1"
  exit 0
fi
pid=$((10#$pid))
for ((attempt=0;attempt<54;attempt++)); do
  kill -0 "$pid" 2>/dev/null || { printf '%s\n' 'CODEX_WAIT done'; exit 0; }
  sleep 10
done
printf '%s\n' 'CODEX_WAIT running'
