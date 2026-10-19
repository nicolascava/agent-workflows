export function validateGitHubEpicBoardContext(context: any, expected: { parentIssueId: string; projectId: string }) {
  if (context?.schema !== 1 || context.parentIssueId !== expected.parentIssueId || context.projectId !== expected.projectId || context.fields?.project?.id !== expected.projectId || context.snapshot?.projectId !== expected.projectId || context.fields?.cached || context.snapshot?.cached || !Array.isArray(context.children) || !Array.isArray(context.fields?.fields) || !Array.isArray(context.snapshot?.items)) throw new Error("Invalid or stale board context");
  return context;
}
export async function captureGitHubEpicBoardContext(identity: { parentIssueId: string; projectId: string }, readers: { children: () => Promise<any>; fields: () => Promise<any>; snapshot: () => Promise<any> }, now = Date.now) {
  const children = await readers.children(), fields = await readers.fields(), snapshot = await readers.snapshot();
  return validateGitHubEpicBoardContext({ schema: 1, ...identity, capturedAt: new Date(now()).toISOString(), children, fields, snapshot }, identity);
}
