# Context surfaces

The useful distinction is when a surface loads. Measure the selected repository files, then confirm loading behavior in the installed host. Character counts do not prove token usage.

## Loaded before invocation

**Repository instructions:** `AGENTS.md`, `CLAUDE.md`, and scoped rule files may load automatically when present. They are optional inputs. The host determines scope and loading. Watch for duplicated rules, but preserve safety, verification, and provenance requirements where every relevant session sees them.

**Skill and agent descriptions:** visible descriptions can help the model select a capability before its body loads. Measure descriptions separately from bodies. A file's existence does not prove it is visible or enabled. Check installed settings documentation and observed discovery.

**Global instructions and tool-server instructions:** these may add context outside the repository. Do not walk home directories or server stores to estimate them. Use supplied configuration or telemetry only when authorized. Record what the audit cannot measure.

## Loaded on invocation

**Skill bodies:** the full workflow loads when invoked. Body length is usually a weaker target than a description paid across sessions. Split a large body into references only with explicit reads before each rule is needed.

**Agent bodies:** load when the host starts that agent. Confirm the host's behavior rather than assuming every body is always present.

**Reference files:** load only when read. A pointer alone does not guarantee access or execution of the required read. Keep protected gates in the always-available layer.

## Measurement ledger

Inventory the entire selected scope with bounded `rg --files --hidden` queries. Use `wc -m` on quoted file paths for characters, not `wc -c`, which counts bytes. Record description and body counts separately, visibility evidence, and any existing enforced limit. Missing files, visibility, telemetry, or limits remain unknown.

A repository character total excludes built-in instructions, served tool schemas, images, tool output, and other session content. Do not present it as the whole session. Use actual host telemetry for tokens, compactions, or percentiles.

Usage evidence needs an explicit repository and observation window. Partial records, retention, and missing delegated calls limit conclusions. Zero observed calls supports investigation, not deletion. Do not read local transcripts or cross-repository records without explicit scope and authority.
