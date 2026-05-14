export type DifferenceKind = 'added' | 'removed' | 'changed';

export interface CompareDifference {
    path: string;
    kind: DifferenceKind;
    leftPreview: string;
    rightPreview: string;
}

export interface CompareSummary {
    added: number;
    removed: number;
    changed: number;
}

export interface ValidCompareState {
    status: 'valid';
    differences: CompareDifference[];
    summary: CompareSummary;
    equal: boolean;
}

export interface InvalidCompareState {
    status: 'invalid';
    leftError: string | null;
    rightError: string | null;
}

export type CompareState = ValidCompareState | InvalidCompareState;

function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepEqual(left: unknown, right: unknown): boolean {
    if (left === right) return true;
    if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length && left.every((item, index) => deepEqual(item, right[index]));
    }
    if (isObject(left) && isObject(right)) {
        const leftKeys = Object.keys(left);
        const rightKeys = Object.keys(right);
        return leftKeys.length === rightKeys.length && leftKeys.every((key) => deepEqual(left[key], right[key]));
    }
    return false;
}

function previewValue(value: unknown): string {
    if (value === undefined) return 'missing';
    if (value === null) return 'null';
    if (typeof value === 'string') return value.length > 60 ? `${value.slice(0, 57)}...` : value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return `[${value.length} items]`;
    if (isObject(value)) return `{${Object.keys(value).length} keys}`;
    return String(value);
}

function collectDifferences(left: unknown, right: unknown, path: string = 'root'): CompareDifference[] {
    if (deepEqual(left, right)) {
        return [];
    }

    if (Array.isArray(left) && Array.isArray(right)) {
        const maxLength = Math.max(left.length, right.length);
        const differences: CompareDifference[] = [];

        for (let index = 0; index < maxLength; index += 1) {
            const nextPath = `${path}[${index}]`;
            if (index >= left.length) {
                differences.push({
                    path: nextPath,
                    kind: 'added',
                    leftPreview: 'missing',
                    rightPreview: previewValue(right[index]),
                });
                continue;
            }
            if (index >= right.length) {
                differences.push({
                    path: nextPath,
                    kind: 'removed',
                    leftPreview: previewValue(left[index]),
                    rightPreview: 'missing',
                });
                continue;
            }

            differences.push(...collectDifferences(left[index], right[index], nextPath));
        }

        return differences;
    }

    if (isObject(left) && isObject(right)) {
        const keys = Array.from(new Set([...Object.keys(left), ...Object.keys(right)])).sort();
        return keys.flatMap((key) => {
            const nextPath = path === 'root' ? key : `${path}.${key}`;

            if (!(key in left)) {
                return [{
                    path: nextPath,
                    kind: 'added' as const,
                    leftPreview: 'missing',
                    rightPreview: previewValue(right[key]),
                }];
            }

            if (!(key in right)) {
                return [{
                    path: nextPath,
                    kind: 'removed' as const,
                    leftPreview: previewValue(left[key]),
                    rightPreview: 'missing',
                }];
            }

            return collectDifferences(left[key], right[key], nextPath);
        });
    }

    return [{
        path,
        kind: 'changed',
        leftPreview: previewValue(left),
        rightPreview: previewValue(right),
    }];
}

export function compareJsonInputs(leftInput: string, rightInput: string, unknownError: string): CompareState {
    let leftParsed: unknown;
    let rightParsed: unknown;
    let leftError: string | null = null;
    let rightError: string | null = null;

    try {
        leftParsed = JSON.parse(leftInput);
    } catch (error) {
        leftError = error instanceof Error ? error.message : unknownError;
    }

    try {
        rightParsed = JSON.parse(rightInput);
    } catch (error) {
        rightError = error instanceof Error ? error.message : unknownError;
    }

    if (leftError || rightError) {
        return {
            status: 'invalid',
            leftError,
            rightError,
        };
    }

    const differences = collectDifferences(leftParsed, rightParsed).slice(0, 40);
    const summary = differences.reduce<CompareSummary>((accumulator, difference) => {
        accumulator[difference.kind] += 1;
        return accumulator;
    }, { added: 0, removed: 0, changed: 0 });

    return {
        status: 'valid',
        differences,
        summary,
        equal: differences.length === 0,
    };
}