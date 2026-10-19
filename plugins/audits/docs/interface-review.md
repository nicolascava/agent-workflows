# Interface review criteria

This is the audit rubric. Read the project's intended-design contract when one
exists and evaluate the implementation against it. Without one, use repository
conventions and the evidence below; record missing design intent as a limit.
The review never requires the web-qa plugin or its files.

Discover application entry points, routes, UI packages, local component wrappers,
tokens, themes, style rules, and existing examples from repository guidance,
workspace manifests, and source imports. Read the local component contract before
judging a call site. Prefer repository conventions over an assumed library API.

Review the requested flow across its relevant states: loading, empty, success,
error, disabled, and validation. Consider narrow and wide viewports, long text,
zoom, keyboard use, and each supported theme. Record which states were observed
and which were inferred from source. Do not claim viewport or theme coverage from
one screenshot. Mark an unavailable running page as a limit on rendered findings.

| Area | Review questions |
| --- | --- |
| Hierarchy | Does the primary task stand out? Are headings, grouping, density, and spacing consistent? |
| Components | Do controls use the local wrappers, tokens, variants, and documented interaction contract? |
| Content | Are labels, instructions, errors, and empty states clear and actionable? |
| Accessibility | Are semantics, accessible names, labels, alt text, keyboard behavior, focus, and reduced motion supported? |
| Layout | Does content remain usable at the supported sizes without clipping, overflow, or unstable shifts? |
| Overlays | Are focus entry, containment, escape, return, scroll behavior, and background interaction appropriate? |
| Performance | Are loading, image sizing, imports, rendering, and animation costs justified by evidence? |

Before an accessibility compliance claim, read the applicable primary criterion
at `https://www.w3.org/WAI/` or `https://www.w3.org/TR/` using available web tools.
Cite the exact criterion and the observed behavior or source evidence. Without
that evidence, describe an accessibility concern and its verification steps.
Source alone does not prove computed contrast, accessible tree output, focus
behavior, or screen-reader behavior. Do not call an automated scan a compliance
certificate.

Use existing screenshots, browser sessions, measurements, or Figma design context
when available and relevant. Identify their URL or node, revision, viewport,
theme, state, and retrieval time where available. Tool absence does not block a
source review. Do not install tools, start a server, capture durable artifacts,
update visual baselines, or run browser tests during the default read-only review.

Prefer specific, bounded recommendations over a redesign. Explain user impact
and effort only to the precision the evidence supports. Keep visual preference
separate from a broken behavior or documented contract violation.
