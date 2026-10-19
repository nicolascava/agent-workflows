# SOC 2 repository evidence

This is a technical readiness aid for the trust services criteria. It is not an
attestation, certification, auditor opinion, or claim of operating effectiveness.
Use the applicable criteria and scope supplied for the review. The table is a
starting map, not a complete control catalogue. Do not infer organizational
controls from repository code alone.

| Area | Criteria family | Possible repository evidence |
| --- | --- | --- |
| Governance and risk | CC1 to CC5 | Ownership, policies, risk records, control descriptions, monitoring responsibilities. |
| Logical and physical access | CC6 | Authentication, authorization, least privilege, access lifecycle, secret handling. Physical access usually needs outside evidence. |
| System operations | CC7 | Audit events, detection, alert rules, incident procedures, vulnerability handling. |
| Change management | CC8 | Authorized review, tests, approvals, branch rules, release identity, deployment restrictions, rollback. |
| Risk mitigation | CC9 | Dependency and supplier risk, continuity plans, risk treatment. |
| Availability | A1 | Capacity controls, recovery configuration, backups, restore procedures, recovery tests. |
| Processing integrity | PI1 | Input validation, completeness, accuracy, authorization, error handling, reconciliation. |
| Confidentiality | C1 | Classification, access restrictions, encryption, retention, disposal. |
| Privacy | P1 to P8 | Notices, consent where applicable, collection limits, use, retention, disclosure, access and correction, monitoring. |

Security uses the common criteria. Availability, processing integrity,
confidentiality, and privacy depend on the stated system and assessment scope.
Mark a category outside that scope as not assessed. Do not silently treat it as
passing. If scope is unknown, report that uncertainty.

For each applicable control, record evidence, implementation status, gaps,
confidence, and evidence still needed. Use `supported`, `gap`, `unknown`, or
`not-applicable`. A configuration supports control design; it does not prove
the control operated over a review period. Missing evidence means `unknown`
unless repository evidence demonstrates a gap.

For changes, assess the repository's own authorized review and delivery policy.
Check that approval and tests apply to the delivered revision. Do not mandate a
particular merge actor, tracker link, hosting feature, or delivery model. Missing
issue links are gaps only if the repository's policy requires them. A documented
policy without implementation evidence is not proof of enforcement.

Keep organizational evidence requests separate: access review records, incident
history, restore results, training, supplier reviews, and retention practice.
Do not fetch personnel records or credential stores. Review only evidence the
user supplied or repository records within the requested scope.
