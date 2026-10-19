import { readFileSync } from "node:fs";
import { json, type Runner } from "./gh.ts";
import { normalizeRepository, parseProject, positive } from "./github-target.ts";
type Settings = { project?: { owner: string; number: number }; fields?: Record<string, string>; statuses?: Record<string, string>; issueTypes?: Record<string, string>; ranks?: Record<string, string[]> };
const keys = { fields: ["status", "priority", "impact", "effort", "severity"], statuses: ["triage", "ready", "building", "review", "acceptance", "shipped"], issueTypes: ["bug", "feature", "task", "project"], ranks: ["priority", "impact", "effort", "severity"] };
export function parseConfiguration(raw: any): Settings {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || Object.keys(raw).some(k => k !== "issues")) throw new Error("Expected only an issues section");
  const settings = raw.issues ?? {};
  if (!settings || typeof settings !== "object" || Array.isArray(settings) || Object.keys(settings).some(k => !["project", ...Object.keys(keys)].includes(k))) throw new Error("Unknown issue setting");
  if (settings.project) {
    if (Object.keys(settings.project).some(k => !["owner", "number"].includes(k))) throw new Error("Unknown project setting");
    parseProject(`${settings.project.owner}/${positive(settings.project.number)}`);
  }
  for (const [group, allowed] of Object.entries(keys)) {
    const values = settings[group]; if (values === undefined) continue;
    if (!values || typeof values !== "object" || Array.isArray(values)) throw new Error(`Invalid ${group}`);
    for (const [key, value] of Object.entries(values)) {
      if (!allowed.includes(key) || (group === "ranks" ? !Array.isArray(value) || !value.length || new Set(value).size !== value.length || value.some(v => typeof v !== "string" || !v.trim()) : typeof value !== "string" || !value.trim())) throw new Error(`Invalid ${group}.${key}`);
    }
  }
  return settings;
}
export function readConfiguration(path = "issue-workflow.json"): unknown {
  try { return json(readFileSync(path, "utf8")); } catch (error: any) { if (error.code === "ENOENT") return {}; throw error; }
}
export async function resolveConfiguration(raw: unknown, gh: Runner, overrides: { repository?: string; project?: string } = {}) {
  const settings = parseConfiguration(raw);
  const repository = normalizeRepository(overrides.repository ?? json(await gh(["repo", "view", "--json", "nameWithOwner"])).nameWithOwner);
  const requested = overrides.project ? parseProject(overrides.project) : settings.project;
  const result = { repository, fields: settings.fields ?? {}, statuses: settings.statuses ?? {}, issueTypes: settings.issueTypes ?? {}, ranks: settings.ranks ?? {}, project: null as any, message: "Using plain issues; no project board is configured." };
  if (!requested) return result;
  try {
    const board = json(await gh(["project", "view", String(requested.number), "--owner", requested.owner, "--format", "json"]));
    if (!board.id || board.number !== requested.number || board.closed) throw new Error("Project unavailable or closed");
    result.project = { ...board, owner: requested.owner }; result.message = "Using the configured project board.";
  } catch { result.message = "Using plain issues; the requested project board is unavailable."; }
  return result;
}
