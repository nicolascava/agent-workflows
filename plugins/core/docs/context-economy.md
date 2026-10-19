# Context economy

Keep context small by bounding what each decision loads and carries forward.

- Bound command output to the next decision with `gh ... --json <fields> --jq`, `head`, `rg -n`, `rg -l`, and targeted `sed -n` ranges. Read only the needed part of files and comment threads.
- Reuse information already in context unless it may have changed.
- Read pages and threads as text. Take screenshots to check visual state when detail matters.
- When delegation is authorized and useful, ask for a bounded read-only summary. Keep the evidence and decision with the coordinator.
- Keep unrelated work in a separate session when it needs different context.
- Follow the [simplicity doctrine](simplicity-doctrine.md) when reducing context. Preserve safety, tests, review, required context, and evidence.
