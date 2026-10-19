# Scanner licenses and provenance

The scanner images are external tools. This plugin vendors no scanner binaries or
upstream rule bundles. Their upstream licenses and dependency notices still
apply when the images are used. The repository license does not replace them.

| Tool | Version | Upstream license | Provenance |
| --- | --- | --- | --- |
| Gitleaks | v8.30.1 | [MIT](https://github.com/gitleaks/gitleaks/blob/v8.30.1/LICENSE) | [Image provenance](https://github.com/gitleaks/gitleaks/issues/2176) |
| OSV-Scanner | v2.5.1 | [Apache-2.0](https://github.com/google/osv-scanner/blob/v2.5.1/LICENSE) | [Release](https://github.com/google/osv-scanner/releases/tag/v2.5.1) |
| Semgrep Community Edition | v1.175.0 | [LGPL-2.1](https://github.com/semgrep/semgrep/blob/v1.175.0/LICENSE) | [Image](https://hub.docker.com/r/semgrep/semgrep) |

Image tags and immutable digests are recorded in
`${CLAUDE_PLUGIN_ROOT}/templates/security-scanners.json`. The workflow uses those
same pins. Treat image contents and any optional commercial features according
to their upstream terms. These license links identify the open-source projects;
they do not describe every dependency inside an image.

The shipped local JavaScript and TypeScript rules flag dynamic execution and
shell execution for review. They are a small authored ruleset, not an upstream
Semgrep registry ruleset. No remote rules are fetched by the template. Gitleaks
uses the rules in its pinned image. OSV-Scanner uses its upstream advisory data,
which can change independently of its image. Scanner findings are automated
signals with coverage limits. Review them before changing policy.
