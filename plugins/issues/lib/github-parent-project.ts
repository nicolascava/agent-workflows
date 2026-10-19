import { connection, graphql, type Runner } from "./gh.ts";
import type { Operation } from "./parent-project.ts";
export async function listGitHubParentProjectChildren(gh: Runner, id: string) {
  return connection(gh, `query($id:ID!,$after:String){node(id:$id){... on Issue{subIssues(first:100,after:$after){nodes{id number title url} pageInfo{hasNextPage endCursor}}}}}`, { id }, data => data.node?.subIssues);
}
export async function readHierarchy(gh: Runner, id: string) {
  const { node } = await graphql(gh, `query($id:ID!){node(id:$id){... on Issue{parent{id} subIssues(first:1){totalCount}}}}`, { id });
  if (!node || !(node.parent === null || typeof node.parent?.id === "string") || !Number.isInteger(node.subIssues?.totalCount) || node.subIssues.totalCount < 0) throw new Error("Incomplete hierarchy");
  return { parentId: node.parent?.id ?? null, childCount: node.subIssues.totalCount };
}
export function buildHierarchyMutation(operation: Operation) {
  if (!operation.parentId || !operation.childId || operation.parentId === operation.childId) throw new Error("Invalid hierarchy IDs");
  const input: Record<string, string | boolean> = { issueId: operation.parentId, subIssueId: operation.childId };
  if (operation.operation === "attach") input.replaceParent = false;
  if (operation.operation === "reorder") {
    if (Boolean(operation.beforeId) === Boolean(operation.afterId) || [operation.beforeId, operation.afterId].includes(operation.childId)) throw new Error("Exactly one distinct anchor is required");
    if (operation.beforeId) input.beforeId = operation.beforeId;
    if (operation.afterId) input.afterId = operation.afterId;
  }
  const mutation = operation.operation === "attach" ? "addSubIssue" : operation.operation === "detach" ? "removeSubIssue" : "reprioritizeSubIssue";
  const type = mutation[0].toUpperCase() + mutation.slice(1) + "Input!";
  return { query: `mutation($input:${type}){${mutation}(input:$input){clientMutationId}}`, variables: { input } };
}
