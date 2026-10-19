# Specialists

Use a specialist for a focused task with a clear question, target repository, relevant files or revisions, and expected output. Installed agents have scoped names such as `specialists:code-reviewer`. Ask for the role by that name when delegating.

| Agent | Use it for | Access |
| --- | --- | --- |
| [api-engineer](../agents/api-engineer.md) | API contracts, compatibility, pagination, errors, and idempotency. | Task-scoped edits |
| [backend-engineer](../agents/backend-engineer.md) | Server behavior, data access, integration code, and performance. | Task-scoped edits |
| [code-reviewer](../agents/code-reviewer.md) | Concrete defects and regression risks in a focused diff. | Read-only |
| [context-engineer](../agents/context-engineer.md) | Instruction ownership, context boundaries, and generated configuration. | Approved plan |
| [copy-editor](../agents/copy-editor.md) | Pull request copy proposals that preserve facts and evidence. | Read-only |
| [dba](../agents/dba.md) | Schema design, constraints, indexes, and migration safety. | Task-scoped edits |
| [economy-researcher](../agents/economy-researcher.md) | Small local searches and evidence inventories with explicit limits. | Read-only, no shell or web |
| [frontend-engineer](../agents/frontend-engineer.md) | Accessible, responsive interface implementation. | Task-scoped edits |
| [infrastructure-engineer](../agents/infrastructure-engineer.md) | Infrastructure configuration, pipelines, reliability, and recovery. | Task-scoped edits |
| [integration-and-rollout-reviewer](../agents/integration-and-rollout-reviewer.md) | Integration failure modes and rollout readiness. | Read-only |
| [model-policy-reviewer](../agents/model-policy-reviewer.md) | Model-selection configuration and documented provider constraints. | Read-only, no shell |
| [product-prioritization-assistant](../agents/product-prioritization-assistant.md) | Evidence-based comparison of candidate work and dependencies. | Read-only |
| [repository-librarian](../agents/repository-librarian.md) | File placement, moves, and reference repair. | Approved manifest, no deletion |
| [technical-writer](../agents/technical-writer.md) | Documentation structure, accuracy, examples, and freshness. | Task-scoped edits |
| [test-designer](../agents/test-designer.md) | Behavior matrices and focused failing tests. | Read-only unless assigned test edits |
| [triager](../agents/triager.md) | Current-repository GitHub issue assessment and readiness gaps. | Read-only |
| [ui-designer](../agents/ui-designer.md) | Visual hierarchy, layout, tokens, states, and visual acceptance. | Read-only |
| [ux-designer](../agents/ux-designer.md) | Task flows, navigation, recovery, and usability acceptance. | Read-only |

Agents read relevant `AGENTS.md` and `CLAUDE.md` files if present. They discover commands, stack choices, and source locations from the target repository. Editing agents write only within the caller's assigned task. Configuration changes and file moves need the exact plan or manifest approved before mutation. Existing approval of that plan is sufficient.

Read-only agents return evidence and recommendations. They do not publish, mutate tracker state, or apply configuration. Bash availability does not grant mutation authority. Tool lists limit available tools; the role instructions also constrain their use.

This plugin has no hard plugin dependencies and ships no executable helpers. Copy rules live in the copy-editor definition. That agent returns JSON proposals; the caller applies them and owns validation and publication.

If the core plugin is installed, `/core:tdd` can guide behavior changes and `/core:review` can support code review.
If the git-flow plugin is installed, `/git-flow:pr` and `/git-flow:update-pr` own their mechanical copy checks and publication gates.
If the issues plugin is installed, `/issues:triage` can guide a separate caller-owned triage workflow.
If the audits plugin is installed, `/audits:documentation-review` can support a documentation assessment.
