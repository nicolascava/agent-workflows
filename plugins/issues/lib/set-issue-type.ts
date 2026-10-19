import { connection, graphql, json, type Runner } from "./gh.ts";
import { normalizeRepository } from "./github-target.ts";
export async function setIssueType(options: { repository: string; issue: string; type: string; ifMissing?: boolean; authorized?: boolean }, gh: Runner) {
  const repository = normalizeRepository(options.repository), [owner, name] = repository.split("/");
  const read = async () => json(await gh(["issue", "view", options.issue, "--repo", repository, "--json", "id,number,url,issueType"]));
  const issue = await read(); if (!issue.id) throw new Error("Missing issue ID");
  if (options.ifMissing && issue.issueType?.name) return { action: "preserved", issue };
  let types: any[];
  try { types = await connection(gh, `query($owner:String!,$after:String){organization(login:$owner){issueTypes(first:100,after:$after){nodes{id name} pageInfo{hasNextPage endCursor}}}}`, { owner }, data => data.organization?.issueTypes); }
  catch { return { action: "unavailable", message: "Native issue types are unavailable; keep a plain issue." }; }
  const matches = types.filter(type => type.name === options.type);
  if (!matches.length) return { action: "unavailable", message: "Requested type is unavailable; keep a plain issue." };
  if (matches.length !== 1) throw new Error("Ambiguous issue type");
  const payload = { issueId: issue.id, issueTypeId: matches[0].id };
  if (!options.authorized) return { action: "preview", payload };
  const data = await graphql(gh, `mutation($input:UpdateIssueIssueTypeInput!){updateIssueIssueType(input:$input){issue{id issueType{name}}}}`, { input: payload });
  if (data.updateIssueIssueType?.issue?.id !== issue.id || data.updateIssueIssueType.issue.issueType?.name !== options.type) throw new Error("Issue type mutation was not confirmed");
  const after = await read(); if (after.id !== issue.id || after.issueType?.name !== options.type) throw new Error("Issue type readback failed");
  return { action: "set", issue: after };
}
