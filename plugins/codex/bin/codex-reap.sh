#!/usr/bin/env bash

# Reap recent orphan candidates associated with a worktree.
export LC_ALL=C
if [ "$(uname -s)" != Darwin ]; then
  printf '%s\n' 'CODEX_REAP unknown: macOS only'
  exit 0
fi
if [ "$#" -ne 2 ] || [ ! -d "$1" ] || [[ ! "$2" =~ ^[0-9]{1,10}$ ]]; then
  printf '%s\n' 'CODEX_REAP unknown: usage: codex-reap.sh <worktree-root> <start-epoch>'
  exit 0
fi
passed_worktree=$(cd -- "$1" 2>/dev/null && pwd)
worktree=$(cd -- "$1" 2>/dev/null && pwd -P)
if [ -z "$worktree" ]; then
  printf '%s\n' 'CODEX_REAP unknown: usage: codex-reap.sh <worktree-root> <start-epoch>'
  exit 0
fi
start=$((10#$2))
user_uid=$(id -u)
date_format='%a %b %e %T %Y'
started_since_run() {
  local epoch
  epoch=$(date -j -f "$date_format" "$1" +%s 2>/dev/null)
  [[ "$epoch" =~ ^[0-9]+$ ]] && [ "$epoch" -ge "$start" ]
}

# Numeric PID keys work with macOS's bundled Bash 3.2.
worktree_cache=()
# Failed cwd lookups (exited or inaccessible top ancestors) count as outside: keep them.
in_worktree() {
  [ "${worktree_cache[$1]+set}" ] && return "${worktree_cache[$1]}"
  worktree_cache[$1]=0
  case "$2 " in
    *"$worktree"[/\ ]*|*"$passed_worktree"[/\ ]*) ;;
    *)
      case "$(lsof -a -p "$1" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')" in
        "$worktree"|"$worktree"/*) ;;
        *) worktree_cache[$1]=1 ;;
      esac ;;
  esac
  return "${worktree_cache[$1]}"
}

# Use one snapshot to find the calling session's top ancestor below PID 1.
# Protect its entire process tree and retain each candidate's top ancestor age.
snapshot=$(ps -axww -o pid=,ppid=,uid=,lstart=,command= 2>/dev/null)
candidates=$(printf '%s\n' "$snapshot" | awk -v self="$$" -v uid="$user_uid" '
  { parent[$1] = $2; owner[$1] = $3; line[$1] = $0 }
  END {
    root = pid = self
    while (pid > 1 && !protected[pid]) {
      protected[pid] = 1
      root = pid
      pid = parent[pid]
    }
    protected[1] = 1
    for (pid in line) {
      top = ancestor = pid
      delete seen
      while (ancestor > 1 && ancestor != root && !seen[ancestor]) {
        top = ancestor
        seen[ancestor] = 1
        ancestor = parent[ancestor]
      }
      if (owner[pid] == uid && !protected[pid] && ancestor == 1 && ancestor != root) {
        print line[top]
        print line[pid]
      }
    }
  }')

pids=()
details=()
starts=()
while read -r top_pid _top_ppid _top_uid top_weekday top_month top_day top_time top_year top_command &&
      read -r pid _ppid _uid weekday month day time year command; do
  lstart="$weekday $month $day $time $year"
  top_start="$top_weekday $top_month $top_day $top_time $top_year"
  # An older live top ancestor belongs to a session that predates this run.
  started_since_run "$lstart" && started_since_run "$top_start" || continue
  in_worktree "$top_pid" "$top_command" && in_worktree "$pid" "$command" || continue
  pids+=("$pid")
  details+=("$pid ${command:0:80}")
  starts+=("$lstart")
done <<< "$candidates"

# Recheck identity before each signal so an exited PID reused during scanning
# or the grace period is not mistaken for the original process.
same_process() {
  local identity
  identity=$(ps -p "${pids[$1]}" -o uid=,lstart= 2>/dev/null)
  read -r _uid weekday month day time year <<< "$identity"
  [ "$_uid" = "$user_uid" ] && [ "$weekday $month $day $time $year" = "${starts[$1]}" ]
}

summary=''
count=0
for ((i = 0; i < ${#pids[@]}; i++)); do
  if [ "${CODEX_REAP_DRY_RUN:-0}" != 1 ]; then
    same_process "$i" || continue
    kill -TERM "${pids[$i]}" 2>/dev/null || continue
  fi
  count=$((count + 1))
  summary+="${summary:+; }${details[$i]}"
done

if [ "${CODEX_REAP_DRY_RUN:-0}" = 1 ]; then
  label=dry-run
else
  label=killed
  if [ "$count" -gt 0 ]; then
    for ((attempt = 0; attempt < 30; attempt++)); do
      alive=0
      for ((i = 0; i < ${#pids[@]}; i++)); do
        if same_process "$i"; then alive=1; break; fi
      done
      [ "$alive" -eq 1 ] || break
      sleep 0.1
    done
    for ((i = 0; i < ${#pids[@]}; i++)); do
      same_process "$i" && kill -KILL "${pids[$i]}" 2>/dev/null
    done
  fi
fi
printf 'CODEX_REAP %s=%s%s\n' "$label" "$count" "${summary:+: $summary}"
exit 0
