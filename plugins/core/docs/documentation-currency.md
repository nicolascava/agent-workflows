# Documentation currency

Check current primary documentation for library, framework, SDK, API, CLI, and service behavior before relying on it. This also applies when reviewing a change that adds or upgrades a dependency.

- Use a configured documentation lookup tool if available. Otherwise use the official documentation directly. A specific external tool is not required.
- Sanitize queries. Include only the public library name, version, API, and technical question. Omit private paths, code, identifiers, and credentials.
- Resolve an ambiguous library name before querying individual concepts. Skip name resolution when the request already gives an exact documentation identifier.
- Choose matches by exact name, version, relevance, source reputation, and useful examples. Retry with a clearer name when results do not match.
- Use version-specific documentation when a version is named. Distinguish current behavior from migration advice and unsupported assumptions.
- Upgrade through `/core:update-deps`, passing a package name or a bounded batch, then verify the repository's required checks.
