type Schema = Record<string, unknown>;
export function inferSchema(value: unknown, depth = 0, budget = { remaining: 20_000 }): Schema {
  if (depth > 64 || --budget.remaining < 0) throw new Error('Analysis limit: 20,000 nodes / 64 levels');
  if (value === null) return { type: 'null' };
  if (typeof value === 'number') return { type: Number.isInteger(value) ? 'integer' : 'number' };
  if (typeof value === 'string' || typeof value === 'boolean') return { type: typeof value };
  if (Array.isArray(value)) {
    const schemas = value.map(item => inferSchema(item, depth + 1, budget));
    const unique = [...new Map(schemas.map(schema => [JSON.stringify(schema), schema])).values()];
    // anyOf permits overlapping shapes. oneOf would reject an object matching
    // two observations, and taking only the first silently loses information.
    return { type: 'array', items: unique.length === 0 ? {} : unique.length === 1 ? unique[0] : { anyOf: unique } };
  }
  if (typeof value !== 'object') return {};
  const properties: Record<string, Schema> = Object.create(null);
  for (const [key, item] of Object.entries(value)) properties[key] = inferSchema(item, depth + 1, budget);
  return { type: 'object', properties, required: Object.keys(value) };
}
export function generateSchema(json: string, rootName: string): { ok: true; schema: string } | { ok: false; error: string } {
  try {
    if (json.length > 1_000_000) throw new Error('Input limit: 1 MB');
    const schema = { $schema: 'http://json-schema.org/draft-07/schema#', title: rootName || 'Root', ...inferSchema(JSON.parse(json)) };
    return { ok: true, schema: JSON.stringify(schema, null, 2) };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : 'Invalid JSON' }; }
}
