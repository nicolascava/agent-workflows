# Portable issue instructions

Use the checked-out repository's committed guidance for engineering conventions and authorization boundaries. This plugin carries no repository-specific operating context. Never infer a repository, identity, project, or credentials from another checkout.

Use `/issues:create-issue` for intake, `/issues:triage` for classification and refinement, `/issues:review-issue` for readiness review, and `/issues:project` for coordination parents. Use `/issues:check-issue-status` for a delivery evidence report and `/issues:acceptance-review` for acceptance. `/issues:github-waiting-replies` lists pending replies without writing.

Write short, plain sentences. Lead with the problem and observable outcome. Preserve facts, constraints, decisions, and source links. State uncertainty directly. Use straight quotes. Avoid slogans and decorative punctuation. For a requested copy pass use `/core:condense`; do not read another plugin's documentation by filesystem path.
