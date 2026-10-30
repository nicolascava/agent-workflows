# Repository configuration

Run skills and helpers from the target repository root. Read its committed `AGENTS.md`, `CLAUDE.md`, and contribution guidance when present. Explicit skill arguments override repository settings. Without an explicit repository, use `gh repo view --json nameWithOwner`. Never select another checkout's repository or credentials.

The optional root file `issue-workflow.json` contains only an `issues` section. All properties below are optional. Names are examples, not defaults. Use exact names from the target board and organization.

```json
{
  "issues": {
    "project": { "owner": "example-owner", "number": 12 },
    "fields": {
      "status": "Stage",
      "priority": "Order",
      "impact": "Reach",
      "effort": "Size",
      "severity": "Incident level"
    },
    "statuses": {
      "triage": "Inbox",
      "ready": "Planned",
      "building": "Active",
      "review": "Reviewing",
      "acceptance": "Checking",
      "shipped": "Released"
    },
    "issueTypes": {
      "bug": "Defect",
      "feature": "Enhancement",
      "task": "Task",
      "project": "Initiative"
    },
    "ranks": {
      "priority": ["First", "Next", "Normal", "Later", "Last"],
      "impact": ["Broad", "Moderate", "Small"],
      "effort": ["Large", "Medium", "Small"],
      "severity": ["Critical", "Major", "Degraded", "Minor"]
    }
  }
}
```

`project.owner` is the board owner, which may differ from the repository owner. `project.number` is a positive integer. Discover candidate boards with `gh project list --owner <confirmed-owner> --format json`. Ask which board to use if ambiguous. Never choose the first board automatically. Confirm it with `gh project view <number> --owner <owner> --format json`. The resolver uses the declared board only. It does not perform broad discovery.

`fields` maps logical roles to exact field names. `statuses` maps lifecycle roles to exact single-select option names. `issueTypes` maps logical classifications to native organization issue type names. These are not labels. Personal repositories or owners without accessible native types retain plain issues. No automatic type or label creation occurs.

`ranks` lists live options from highest to lowest. Priority positions map logical P0 through P4. Impact and effort positions map high, medium, low. Severity positions map SEV1 through SEV4. A skill that writes one of these classifications requires the corresponding three, four, or five ranks and live options. The parser accepts nonempty rank arrays for other read/rollup uses. It does not decide semantic completeness. Never silently substitute a default vocabulary.

Resolve field IDs and option IDs fresh with `gh project field-list <number> --owner <owner> --limit 100 --format json`. Check exact names and refuse duplicate matches. IDs are operation data; do not commit them as configuration. Text and single-select fields are supported. No shipped reader takes a board snapshot, so a procedure that takes one must enforce its limits. When taking a snapshot, stop if nested project item field values report `hasNextPage`, and stop if a configured field holds a value of any other type. Never treat a value hidden by truncation or an unsupported type as blank, and never clear it. Use `clearProjectV2ItemFieldValue` for a previewed clear and `updateProjectV2ItemFieldValue` for a typed value. Resolve the issue's live project item ID before a board write.

The resolver accepts `--repo <owner/repository>`, `--project <owner/number>`, and `--config <path>`. A custom config path is relative to the current directory unless supplied otherwise. The default is `issue-workflow.json` in the current directory. A missing file means `{}`. Malformed files, unknown keys, unsafe references, and invalid value types fail with a message before a write. It does not read arbitrary repository settings files.

Missing or inaccessible board configuration yields `project: null` and a clear plain-issue message. Creation and requested body refinement remain available. Board moves, Ready claims, placement, rollups, and terminal publication remain unavailable. Missing fields or options stop affected field writes; do not change a different board or option. If the board fails after issue creation, retain the issue and report the partial result.

Git delivery mode is separate. See [workflow modes](workflow-modes.md). None of these settings authorizes a mutation.
