export function buildPreShapedIssueBody(input: { problem: string; context?: string; sources?: string[]; stepsToReproduce?: string; suggestedSolution?: string }) {
  if (!input.problem?.trim()) throw new Error("Problem is required");
  const prose = (value: string) => value.trim().replace(/^\s*(#{1,6})\s+/gm, "### ").replace(/^(.+)\n[=-]{3,}\s*$/gm, "### $1");
  const sections = [["Problem", input.problem], ...(input.stepsToReproduce ? [["Steps to reproduce", input.stepsToReproduce]] : []), ["Context", input.context || "Unknown."], ...(input.suggestedSolution ? [["Suggested solution", input.suggestedSolution]] : []), ["Sources", input.sources?.length ? input.sources.map(source => `- ${source}`).join("\n") : "Unknown."]];
  return sections.map(([title, body]) => `## ${title}\n\n${prose(body)}`).join("\n\n") + "\n";
}
