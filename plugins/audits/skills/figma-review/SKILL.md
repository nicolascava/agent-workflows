---
name: figma-review
description: Review a user-supplied Figma file or node through an installed Figma MCP server. Use to assess design consistency and compare available repository implementation evidence.
argument-hint: <figma-url>
---

# Figma review

Read `${CLAUDE_PLUGIN_ROOT}/docs/assessment-contract.md` first. Follow its source,
read-only, finding, verification, and reporting rules. Report in the conversation.
Any requested write needs its target and exact payload shown first.

Read `${CLAUDE_PLUGIN_ROOT}/docs/interface-review.md` for shared criteria and
accessibility evidence requirements.

## Require a supplied file

Take the Figma file or node URL from the user's argument or message. If missing,
ask for it. Never infer a file from a registry, unrelated repository, or account
search. Require an installed Figma MCP server with access to that file. If none
is available or access fails, report blocked and identify the missing input.
Do not read tokens, use credential stores, install tools, or call a REST fallback.

Inspect the server's advertised read tools. Retrieve design context, metadata,
screenshots, variables, or component mappings only when supported and needed.
Keep the request bounded to the supplied file and nodes. Record file and node
identifiers, exposed revision or version, retrieval time, and any missing context.
If no immutable revision is exposed, state that limitation. A node label alone
does not prove the visual design or current implementation.

## Review the evidence

Use screenshots and structure together. Review hierarchy, spacing, typography,
colors, component and variable reuse, responsive intent, interaction states,
and missing or ambiguous specifications. Apply the shared interface criteria.
Separate visual preference, design inconsistency, and verified behavior defects.
A static design cannot prove runtime keyboard or screen-reader behavior.

When the user requests an implementation comparison, establish repository source
identity with `${CLAUDE_PLUGIN_ROOT}/docs/verification-source.md`. Discover its
actual application and UI source locations, wrappers, tokens, and theme rules.
Compare mapped components and states against that evidence. Do not assume a
style framework or infer implementation parity from a screenshot alone.
If source is unavailable, limit the result to the supplied design.

Comments are optional evidence only if a read tool exposes them within scope.
Distinguish an old discussion from a current design requirement. Do not post,
resolve, or reply to comments during the review. A requested comment needs its
exact file or node target and payload shown first, and an available write tool.

## Report

Use the contract's report shape. Include reviewed nodes, design and optional code
revisions, coverage limits, findings tied to node identifiers, and verification
steps. Suggest `/audits:frontend-review` for deeper code review when useful.
Do not create a report file, edit designs, or publish comments by default.
