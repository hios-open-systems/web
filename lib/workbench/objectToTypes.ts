type JsonObject = Record<string, unknown>;

interface PropertyDefinition {
  key: string;
  type: string;
  optional: boolean;
}

export interface GeneratedTypesResult {
  code: string;
  interfaceCount: number;
  lineCount: number;
  rootTypeName: string;
}

function isPlainObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toPascalCase(input: string) {
  const cleaned = input
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();

  const normalized = cleaned.length > 0 ? cleaned : 'GeneratedType';
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function formatPropertyKey(key: string) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

function mergeUnion(types: string[]) {
  const uniqueTypes = Array.from(new Set(types));
  if (uniqueTypes.length === 0) {
    return 'unknown';
  }

  if (uniqueTypes.length === 1) {
    return uniqueTypes[0];
  }

  return uniqueTypes.sort().join(' | ');
}

function wrapArrayType(type: string) {
  return type.includes(' | ') ? `(${type})[]` : `${type}[]`;
}

export function generateTypesFromObject(input: unknown, rootTypeName = 'RootPayload'): GeneratedTypesResult {
  const declarationOrder: string[] = [];
  const declarations = new Map<string, PropertyDefinition[]>();
  const nameCounts = new Map<string, number>();

  const reserveName = (suggestedName: string) => {
    const baseName = toPascalCase(suggestedName);
    const seen = nameCounts.get(baseName) ?? 0;
    nameCounts.set(baseName, seen + 1);
    return seen === 0 ? baseName : `${baseName}${seen + 1}`;
  };

  const inferObjectArray = (items: JsonObject[], suggestedName: string) => {
    const interfaceName = reserveName(suggestedName);
    const keys = new Set<string>();

    for (const item of items) {
      Object.keys(item).forEach((key) => keys.add(key));
    }

    const properties = Array.from(keys)
      .sort((left, right) => left.localeCompare(right))
      .map((key) => {
        const presentValues = items.filter((item) => key in item).map((item) => item[key]);
        const optional = presentValues.length < items.length;
        const propertyType = mergeUnion(
          presentValues.map((value) => inferType(value, `${interfaceName}${toPascalCase(key)}`))
        );

        return {
          key,
          type: propertyType,
          optional,
        } satisfies PropertyDefinition;
      });

    declarationOrder.push(interfaceName);
    declarations.set(interfaceName, properties);
    return interfaceName;
  };

  const inferArray = (items: unknown[], suggestedName: string) => {
    if (items.length === 0) {
      return 'unknown[]';
    }

    if (items.every((item) => isPlainObject(item))) {
      return `${inferObjectArray(items as JsonObject[], `${suggestedName}Item`)}[]`;
    }

    return wrapArrayType(
      mergeUnion(items.map((item) => inferType(item, `${suggestedName}Item`)))
    );
  };

  const inferObject = (value: JsonObject, suggestedName: string) => {
    if (Object.keys(value).length === 0) {
      return 'Record<string, unknown>';
    }

    const interfaceName = reserveName(suggestedName);
    const properties = Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, propertyValue]) => ({
        key,
        type: inferType(propertyValue, `${interfaceName}${toPascalCase(key)}`),
        optional: false,
      } satisfies PropertyDefinition));

    declarationOrder.push(interfaceName);
    declarations.set(interfaceName, properties);
    return interfaceName;
  };

  const inferType = (value: unknown, suggestedName: string): string => {
    if (value === null) {
      return 'null';
    }

    if (Array.isArray(value)) {
      return inferArray(value, suggestedName);
    }

    if (isPlainObject(value)) {
      return inferObject(value, suggestedName);
    }

    switch (typeof value) {
      case 'string':
        return 'string';
      case 'number':
        return Number.isFinite(value) ? 'number' : 'unknown';
      case 'boolean':
        return 'boolean';
      default:
        return 'unknown';
    }
  };

  const rootType = inferType(input, rootTypeName);
  const declarationsText = declarationOrder
    .map((name) => {
      const properties = declarations.get(name) ?? [];
      const lines = properties.map((property) => `  ${formatPropertyKey(property.key)}${property.optional ? '?' : ''}: ${property.type};`);
      return `export interface ${name} {\n${lines.join('\n')}\n}`;
    })
    .join('\n\n');

  const rootDeclaration = rootType === toPascalCase(rootTypeName)
    ? ''
    : `\n\nexport type ${toPascalCase(rootTypeName)} = ${rootType};`;
  const code = `${declarationsText}${rootDeclaration}`.trim();

  return {
    code,
    interfaceCount: declarations.size,
    lineCount: code.split('\n').length,
    rootTypeName: toPascalCase(rootTypeName),
  };
}