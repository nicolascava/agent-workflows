#!/usr/bin/env bun
import { cli, input, options } from "../lib/cli.ts";
import { runGh } from "../lib/gh.ts";
import { listGitHubParentProjectChildren, readHierarchy, buildHierarchyMutation } from "../lib/github-parent-project.ts";
import { planHierarchy } from "../lib/parent-project.ts";
// This helper only reads and prints a plan. Applying it needs user authority.
await cli(async () => {
  const args = options(process.argv.slice(2), ["input"]), request = input(args.input);
  if (!["show", "attach", "detach", "reorder"].includes(request.operation) || typeof request.parentId !== "string" || !request.parentId || request.operation !== "show" && (!Array.isArray(request.childIds) || request.childIds.some((id: unknown) => typeof id !== "string" || !id))) throw new Error("Invalid hierarchy request");
  const hierarchy = await readHierarchy(runGh, request.parentId), members = await listGitHubParentProjectChildren(runGh, request.parentId);
  if (request.operation === "show") return { parentId: request.parentId, ...hierarchy, children: members };
  const children = [];
  for (const id of request.childIds) children.push({ id, ...await readHierarchy(runGh, id) });
  const plan = planHierarchy(request.operation, { id: request.parentId, parentId: hierarchy.parentId, children: members.map(member => member.id) }, children);
  return { plan, payloads: plan.map(buildHierarchyMutation), applied: false };
});
