import { lstatSync, readFileSync } from "node:fs";

type Rule = { name: string; matches: (line: string) => boolean };

const allowedEmailDomains = new Set(["example.com", "example.org", "example.net"]);

function hasDisallowedEmail(line: string): boolean {
  const emails = line.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@(?:[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?\.)+[A-Z]{2,}/gi) ?? [];
  return emails.some((email) => {
    const [local, domain] = email.toLowerCase().split("@");
    return local !== "noreply" && !allowedEmailDomains.has(domain!);
  });
}

const rules: Rule[] = [
  {
    name: "absolute-home-path",
    matches: (line) => /\/(?:Users|home)\/[^/\r\n]+\/|[a-z]:\\Users\\/i.test(line),
  },
  { name: "email-address", matches: hasDisallowedEmail },
  { name: "private-launcher", matches: (line) => /nca[-]run/.test(line) },
  { name: "private-docs-path", matches: (line) => /docs\/os\//.test(line) },
  { name: "private-scripts-path", matches: (line) => /packages\/scripts\//.test(line) },
  { name: "private-project-packages", matches: (line) => /CLAUDE_PROJECT_DIR\}\/packages/.test(line) },
];

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function addDenylist(path: string) {
  let content: string;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    fail("leak-scan: cannot read denylist");
  }
  let index = 0;
  for (const line of content.split(/\r?\n/)) {
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    index++;
    let pattern: RegExp;
    try {
      pattern = new RegExp(line);
    } catch {
      fail(`leak-scan: invalid denylist rule ${index}`);
    }
    rules.push({ name: `denylist-rule-${index}`, matches: (text) => pattern.test(text) });
  }
}

const args = process.argv.slice(2);
if (args.length !== 0) {
  if (args.length !== 2 || args[0] !== "--denylist" || !args[1] || args[1].startsWith("--")) {
    fail("Usage: bun scripts/leak-scan.ts [--denylist <path>]");
  }
  addDenylist(args[1]);
}

const tracked = Bun.spawnSync(["git", "ls-files", "-z"]);
if (tracked.exitCode !== 0) fail("leak-scan: cannot list tracked files");

const decoder = new TextDecoder("utf-8", { fatal: true });
const ignoreMarker = ["leak-scan", "ignore-file"].join("-");
let hits = false;

for (const path of tracked.stdout.toString().split("\0").filter(Boolean)) {
  let bytes: Buffer;
  try {
    // Do not follow tracked symlinks or read submodule directories.
    if (!lstatSync(path).isFile()) continue;
    bytes = readFileSync(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
    fail(`leak-scan: cannot read tracked file ${path}`);
  }
  if (bytes.includes(0)) continue;
  let content: string;
  try {
    content = decoder.decode(bytes);
  } catch {
    continue;
  }
  if (content.includes(ignoreMarker)) continue;
  for (const [index, line] of content.split(/\r?\n/).entries()) {
    for (const rule of rules) {
      if (rule.matches(line)) {
        console.log(`${path}:${index + 1}: ${rule.name}`);
        hits = true;
      }
    }
  }
}

process.exitCode = hits ? 1 : 0;
