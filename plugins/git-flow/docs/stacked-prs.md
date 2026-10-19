# Dependent PRs

Use this only in `pr` mode. Propose a stack when a change has dependent layers that each pass checks and can be reviewed alone. Independent changes belong on separate branches from the base. Keep inseparable layers together.

Get the user's approval for the proposed branches and base relationships before creating a stack. Use `<prefix>/<short-description>` for every branch. Do not install an extension automatically. Use ordinary Git branches and explicit `gh pr create --base <lower-branch>` if the repository has no documented stack tool.

Each PR needs its own visible description, issue references when applicable, verification and review. Fetch and pin that PR's actual base, which may differ from the workflow's delivery base. Rebase and merge bottom-up using the repository's supported stack procedure. Do not assume GitHub preview features, automatic retargeting, merge queues or multi-PR submission exist. An operation that rewrites or merges additional layers needs explicit scope authorization for those layers. A lower layer's merge does not prove a later layer passed review.
