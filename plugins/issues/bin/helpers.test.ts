import { expect, test } from "bun:test";
import { chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const bins = ["create-issue-project-resolver", "print-pre-shaped-issue-body.ts", "issue-structure-gate.ts", "upsert-issue-rationale.ts", "shaped-issue-gate.ts", "acceptance-review-gate.ts", "github-waiting-replies.ts", "parent-project.ts"];
test("every entry point refuses malformed flags before a GitHub call", () => {
  for (const bin of bins) {
    const result = Bun.spawnSync([process.execPath, join(import.meta.dir, bin), "--unknown", "value"], { env: { ...process.env, PATH: "" } });
    expect(result.exitCode).toBe(1); expect(result.stderr.toString()).toContain("Issue helper refused");
  }
});
test("resolver and waiting listing use a fake gh on PATH and degrade without a board", () => {
  const root = join(import.meta.dir, `.test-cli-${crypto.randomUUID()}`); mkdirSync(root);
  try {
    const fake = join(root, "gh");
    writeFileSync(fake, `#!${process.execPath}\nconst a=process.argv.slice(2); if(a[0]==="repo") console.log('{"nameWithOwner":"sample/widgets"}'); else if(a[0]==="api" && a[1].includes("/issues?")) console.log('[]'); else process.exit(90);\n`); chmodSync(fake, 0o755);
    const env = { ...process.env, PATH: root };
    const result = Bun.spawnSync([process.execPath, join(import.meta.dir, "create-issue-project-resolver")], { cwd: root, env });
    expect(result.exitCode).toBe(0); const config = JSON.parse(result.stdout.toString()); expect(config.project).toBeNull(); expect(config.message).toContain("plain issues");
    const listing = Bun.spawnSync([process.execPath, join(import.meta.dir, "github-waiting-replies.ts"), "--repo", "sample/widgets", "--user", "reviewer"], { cwd: root, env });
    expect(listing.exitCode).toBe(0); expect(JSON.parse(listing.stdout.toString()).complete).toBe(true);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
