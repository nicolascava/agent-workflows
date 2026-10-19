export function selectFieldName(value: any): string | null {
  return typeof value?.name === "string" && value.name ? value.name : typeof value?.text === "string" && value.text ? value.text : null;
}
export function resolveFieldValue(fields: any[], name: string, value: string | null) {
  const matches = fields.filter(field => field.name === name);
  if (matches.length !== 1 || !matches[0].id) throw new Error(`Missing or ambiguous project field: ${name}`);
  const field = matches[0];
  if (value === null) return { fieldId: field.id, value: null };
  if (field.dataType === "TEXT") return { fieldId: field.id, value: { text: value } };
  if (field.dataType !== "SINGLE_SELECT") throw new Error(`Unsupported project field: ${name}`);
  const options = field.options?.filter((option: any) => option.name === value);
  if (options?.length !== 1 || !options[0].id) throw new Error(`Missing or ambiguous option: ${value}`);
  return { fieldId: field.id, value: { singleSelectOptionId: options[0].id } };
}
