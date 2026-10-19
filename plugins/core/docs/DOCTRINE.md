# Agent-first engineering doctrine

This doctrine sets binding defaults for how we build and operate. It applies to agents and people unless a higher-priority rule, explicit approval boundary, or real constraint requires otherwise.

## Authority and durability

Within an authorized role and explicit delegated mandate, agents decide routine product and technical direction by default. Human-set constraints, explicit approval boundaries, governance, safety requirements, and real-world constraints remain binding. Autonomy means owning decisions within those boundaries, never bypassing them.

### Doctrine compliance

Architectural and engineering decisions must comply with this doctrine. Any deviation must be explicitly documented and justified.

Intent, data, and verification are durable only where classification, privacy, security, retention, and deletion requirements permit; code is disposable. Preserve the minimum permitted and redacted goals, constraints, source data, decisions, invariants, and evidence that let implementation be understood, checked, replaced, or rebuilt. Treat code as a replaceable expression of that durable record, not as the record itself.

## Operating principles

### Simplicity with rigor

Follow KISS and DRY. Choose the smallest solution that meets the need and preserves the required safety, validation, and evidence. State each rule, fact, and behavior once and have every other place point at it, because a second copy drifts. Remove accidental complexity, but do not simplify by weakening an invariant, test, approval gate, or recovery path.

### Locality

Keep related behavior, data, decisions, and verification close together. Prefer changes whose consequences can be understood from their immediate context, and make dependencies explicit when they must cross a boundary.

### Convention over choice

Use established conventions and defaults unless the problem demonstrates a need to depart from them. Every unnecessary option creates more decisions, more paths to verify, and more ways for work to drift.

### Explicit invariants

Name the conditions that must remain true, including ownership, authorization, data integrity, failure behavior, and recovery expectations. Design, review, and verification should make those conditions observable rather than relying on intent or convention alone.

### Mechanical verification and evidence

Prefer repeatable checks that can establish behavior over inspection, memory, or assertion. Make claims proportionate to evidence, retain the evidence with the work, and state uncertainty when verification is unavailable or incomplete.

### Resumable work

Favor clear handoffs, manageable changes, and work that can be resumed by another capable operator.

### Resilience

Expect partial failure, interruption, and replacement. Keep operations recoverable, make failure states visible, and favor designs that degrade safely and can be repaired without reconstructing hidden context.

### Verification sources

Use the intended current worktree and a freshly fetched immutable comparison OID. Keep the source identity with the evidence. Do not claim clean remote evidence from local edits. Follow the [verification-source contract](verification-source.md).

### Clear responsibilities

Use automation for repeatable work. Keep responsibility and decision boundaries clear. Preserve human judgment where the task requires it.

### Replaceable implementation

Make implementation easy to exchange when intent, data, invariants, and verification remain valid. Avoid coupling the durable record to a particular implementation shape, tool, or operator.

## Practice

Start from the durable intent and constraints, choose the local conventional solution, state the invariants, and create mechanical evidence that it works. When a tradeoff is necessary, preserve the durable record and the ability for another agent or person to verify, operate, and replace the implementation.
