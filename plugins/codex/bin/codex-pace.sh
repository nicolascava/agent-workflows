#!/usr/bin/env bash

# Report Codex weekly usage against the share of the week elapsed.
if ! command -v jq >/dev/null 2>&1; then
  printf '%s\n' 'CODEX_PACE unknown: jq is unavailable'
  exit 0
fi

shopt -s nullglob
days=("${CODEX_HOME:-$HOME/.codex}"/sessions/*/*/*)
rl=''
checked=0
if [ "${#days[@]}" -gt 0 ]; then
  while IFS= read -r day; do
    [ -d "$day" ] || continue
    rollouts=("$day"/rollout-*.jsonl)
    [ "${#rollouts[@]}" -gt 0 ] || continue
    while IFS= read -r file; do
      checked=$((checked + 1))
      rl=$(jq -Rc 'fromjson? | (.payload.rate_limits)? | objects' "$file" 2>/dev/null | tail -1)
      if [ -n "$rl" ] || [ "$checked" -ge 20 ]; then
        break 2
      fi
    done < <(ls -t "${rollouts[@]}" 2>/dev/null)
  done < <(printf '%s\n' "${days[@]}" | LC_ALL=C sort -r)
fi

if [ -z "$rl" ]; then
  printf '%s\n' 'CODEX_PACE unknown: no rate-limit data yet'
  exit 0
fi

printf '%s' "$rl" | jq -r --argjson now "$(date +%s)" '
  ([.primary, .secondary] | map(select(type == "object" and .window_minutes == 10080)) | first) as $w
  | if ((.rate_limit_reached_type | type) == "string" and .rate_limit_reached_type != "") or .rate_limit_reached == true then "CODEX_PACE over: limit reached (\(.rate_limit_reached_type // "reported"))"
    elif $w == null then "CODEX_PACE unknown: no weekly window reported"
    elif ($w.used_percent | type) != "number" or ($w.resets_at | type) != "number" then "CODEX_PACE unknown: weekly usage or reset time missing"
    elif $w.resets_at <= $now then "CODEX_PACE ok: weekly window has reset"
    else (100 * (1 - ($w.resets_at - $now) / ($w.window_minutes * 60))) as $elapsed
      | (if $w.used_percent > $elapsed + 10 then "over"
         elif $w.used_percent < $elapsed - 20 then "under"
         else "ok" end) as $status
      | "CODEX_PACE \($status): \($w.used_percent)% used, \($elapsed | floor)% of the week elapsed, resets \($w.resets_at | todate)"
    end'
