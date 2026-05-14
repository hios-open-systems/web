export type PayloadViewMode = 'pretty' | 'minified';

export interface PayloadPathEntry {
    path: string;
    type: string;
    preview: string;
}

export interface PayloadMetric {
    key: 'chars' | 'lines' | 'nodes' | 'depth';
    value: number;
}

export interface ValidPayloadState {
    status: 'valid';
    parsed: unknown;
    formatted: string;
    paths: PayloadPathEntry[];
    metrics: PayloadMetric[];
}

export interface InvalidPayloadState {
    status: 'invalid';
    parsed: null;
    formatted: '';
    paths: [];
    metrics: PayloadMetric[];
    error: string;
}

export type PayloadState = ValidPayloadState | InvalidPayloadState;

function getValueType(value: unknown): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

function getValuePreview(value: unknown): string {
    if (value === null) return 'null';
    if (typeof value === 'string') {
        return value.length > 42 ? `${value.slice(0, 39)}...` : value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    if (Array.isArray(value)) {
        return `${value.length} items`;
    }
    if (typeof value === 'object') {
        return `${Object.keys(value).length} keys`;
    }
    return String(value);
}

function buildPathEntries(value: unknown, prefix: string = 'root', depth: number = 0): PayloadPathEntry[] {
    if (depth > 5 || value === null || typeof value !== 'object') {
        return [];
    }

    if (Array.isArray(value)) {
        return value.slice(0, 20).flatMap((item, index) => {
            const path = `${prefix}[${index}]`;
            const current: PayloadPathEntry = {
                path,
                type: getValueType(item),
                preview: getValuePreview(item),
            };

            return [current, ...buildPathEntries(item, path, depth + 1)];
        });
    }

    return Object.entries(value).slice(0, 30).flatMap(([key, nestedValue]) => {
        const path = `${prefix}.${key}`;
        const current: PayloadPathEntry = {
            path,
            type: getValueType(nestedValue),
            preview: getValuePreview(nestedValue),
        };

        return [current, ...buildPathEntries(nestedValue, path, depth + 1)];
    });
}

function countNodes(value: unknown): number {
    if (value === null || typeof value !== 'object') return 1;
    if (Array.isArray(value)) {
        return 1 + value.reduce((total, item) => total + countNodes(item), 0);
    }

    return 1 + Object.values(value).reduce((total, nestedValue) => total + countNodes(nestedValue), 0);
}

function getDepth(value: unknown): number {
    if (value === null || typeof value !== 'object') return 0;
    if (Array.isArray(value)) {
        if (value.length === 0) return 1;
        return 1 + Math.max(...value.map(getDepth));
    }

    const values = Object.values(value);
    if (values.length === 0) return 1;
    return 1 + Math.max(...values.map(getDepth));
}

function buildMetrics(input: string, parsed: unknown): PayloadMetric[] {
    const lines = input.length === 0 ? 0 : input.split('\n').length;

    return [
        { key: 'chars', value: input.length },
        { key: 'lines', value: lines },
        { key: 'nodes', value: countNodes(parsed) },
        { key: 'depth', value: getDepth(parsed) },
    ];
}

export function parsePayloadInput(input: string, viewMode: PayloadViewMode, unknownError: string): PayloadState {
    if (input.trim().length === 0) {
        return {
            status: 'invalid',
            parsed: null,
            formatted: '',
            paths: [],
            metrics: [
                { key: 'chars', value: 0 },
                { key: 'lines', value: 0 },
                { key: 'nodes', value: 0 },
                { key: 'depth', value: 0 },
            ],
            error: unknownError,
        };
    }

    try {
        const parsed = JSON.parse(input);

        return {
            status: 'valid',
            parsed,
            formatted: JSON.stringify(parsed, null, viewMode === 'pretty' ? 2 : 0),
            paths: buildPathEntries(parsed),
            metrics: buildMetrics(input, parsed),
        };
    } catch (error) {
        return {
            status: 'invalid',
            parsed: null,
            formatted: '',
            paths: [],
            metrics: [
                { key: 'chars', value: input.length },
                { key: 'lines', value: input.length === 0 ? 0 : input.split('\n').length },
                { key: 'nodes', value: 0 },
                { key: 'depth', value: 0 },
            ],
            error: error instanceof Error ? error.message : unknownError,
        };
    }
}