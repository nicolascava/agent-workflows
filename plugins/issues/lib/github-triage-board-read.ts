import { connection, type Runner } from "./gh.ts";
import { selectFieldName } from "./github-project-field-value.ts";
const fieldValues = `fieldValues(first:100){nodes{... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2FieldCommon{name}}} ... on ProjectV2ItemFieldTextValue{text field{... on ProjectV2FieldCommon{name}}}} pageInfo{hasNextPage endCursor}}`;
function values(item: any) {
  if (!Array.isArray(item.fieldValues?.nodes) || item.fieldValues.pageInfo?.hasNextPage !== false) throw new Error("Incomplete item field values");
  const result: Record<string, string | null> = {};
  for (const field of item.fieldValues.nodes) {
    if (!field?.field?.name || Object.hasOwn(result, field.field.name)) throw new Error("Ambiguous item field value");
    result[field.field.name] = selectFieldName(field);
  }
  return { ...item, values: result };
}
export async function readProjectFields(gh: Runner, id: string) {
  let project: any;
  const fields = await connection(gh, `query($id:ID!,$after:String){node(id:$id){... on ProjectV2{id number title fields(first:100,after:$after){nodes{... on ProjectV2Field{id name dataType} ... on ProjectV2SingleSelectField{id name dataType options{id name}}} pageInfo{hasNextPage endCursor}}}}}`, { id }, data => { project = data.node; if (project?.id !== id) throw new Error("Project mismatch"); return project.fields; });
  return { project: { id: project.id, number: project.number, title: project.title }, fields };
}
export async function readBoardSnapshot(gh: Runner, projectId: string) {
  const items = await connection(gh, `query($id:ID!,$after:String){node(id:$id){... on ProjectV2{id items(first:100,after:$after){nodes{id content{__typename ... on Issue{id number title url state}} ${fieldValues}} pageInfo{hasNextPage endCursor}}}}}`, { id: projectId }, data => { if (data.node?.id !== projectId) throw new Error("Project mismatch"); return data.node.items; });
  return { projectId, items: items.map(values) };
}
export async function readItemState(gh: Runner, issueId: string, projectId: string) {
  const items = await connection(gh, `query($id:ID!,$after:String){node(id:$id){... on Issue{projectItems(first:100,after:$after){nodes{id project{id} ${fieldValues}} pageInfo{hasNextPage endCursor}}}}}`, { id: issueId }, data => data.node?.projectItems);
  const matches = items.filter(item => item.project?.id === projectId);
  if (matches.length > 1) throw new Error("Duplicate project membership");
  return matches.length ? values(matches[0]) : null;
}
