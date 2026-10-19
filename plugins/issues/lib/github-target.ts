import { json, type Runner } from "./gh.ts";
const segment = /^[A-Za-z0-9][A-Za-z0-9_.-]*$/;
export function normalizeRepository(value: string): string {
  const parts = value.split("/");
  if (parts.length !== 2 || parts.some(p => !segment.test(p) || p === "." || p === "..")) throw new Error("Repository must be owner/name");
  return parts.join("/");
}
export function positive(value: string | number): number {
  if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) throw new Error("Expected a positive safe integer");
  return Number(value);
}
export function parseProject(value: string) {
  const [owner, number, extra] = value.split("/");
  if (!owner || !segment.test(owner) || extra !== undefined) throw new Error("Project must be owner/number");
  return { owner, number: positive(number) };
}
export async function resolveGitHubTarget(args: { repository?: string; issue?: string; project?: string }, gh: Runner) {
  let repository = args.repository ? normalizeRepository(args.repository) : undefined;
  let project = args.project ? parseProject(args.project) : undefined;
  let number: number | undefined;
  if (args.issue) {
    if (/^[1-9]\d*$/.test(args.issue)) number = positive(args.issue);
    else {
      let url: URL; try { url = new URL(args.issue); } catch { throw new Error("Issue must be a number or GitHub URL"); }
      if (url.protocol !== "https:" || url.host !== "github.com" || url.username || url.password || url.hash) throw new Error("Invalid Issue URL");
      const issuePath = url.pathname.match(/^\/([^/]+)\/([^/]+)\/issues\/([1-9]\d*)\/?$/);
      const boardPath = url.pathname.match(/^\/(?:orgs|users)\/([^/]+)\/projects\/([1-9]\d*)(?:\/views\/[1-9]\d*)?\/?$/);
      let parsedRepo: string;
      if (issuePath) { parsedRepo = normalizeRepository(`${issuePath[1]}/${issuePath[2]}`); number = positive(issuePath[3]); }
      else if (boardPath && url.searchParams.get("pane") === "issue") {
        const parts = url.searchParams.get("issue")?.split("|");
        if (!parts || parts.length !== 3) throw new Error("Issue pane requires an explicit issue reference");
        parsedRepo = normalizeRepository(`${parts[0]}/${parts[1]}`); number = positive(parts[2]);
        const paneProject = parseProject(`${boardPath[1]}/${boardPath[2]}`);
        if (project && JSON.stringify(project) !== JSON.stringify(paneProject)) throw new Error("Project mismatch");
        project = paneProject;
      } else throw new Error("Unsupported Issue URL");
      if (repository && repository.toLowerCase() !== parsedRepo.toLowerCase()) throw new Error("Repository mismatch");
      repository = parsedRepo;
    }
  }
  repository ??= normalizeRepository(json(await gh(["repo", "view", "--json", "nameWithOwner"])).nameWithOwner);
  return { repository, ...(number ? { issue: `https://github.com/${repository}/issues/${number}` } : {}), ...(project ? { project } : {}) };
}
