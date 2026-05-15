export interface ValidJwtState {
    status: 'valid';
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    headerFormatted: string;
    payloadFormatted: string;
    algorithm: string;
    tokenType: string;
    expiresAt: string | null;
    isExpired: boolean;
    signatureLength: number;
    headerKeys: number;
    payloadKeys: number;
}

export interface InvalidJwtState {
    status: 'invalid';
    error: string;
}

export type JwtState = ValidJwtState | InvalidJwtState;

function decodeBase64UrlSegment(segment: string) {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));

    return new TextDecoder().decode(bytes);
}

function parseJsonSegment(segment: string) {
    const decoded = decodeBase64UrlSegment(segment);
    const parsed = JSON.parse(decoded);

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Decoded segment is not a JSON object');
    }

    return parsed as Record<string, unknown>;
}

function toBase64Url(value: Record<string, unknown>) {
    const json = JSON.stringify(value);
    const base64 = btoa(json);

    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function buildExampleJwt() {
    const header = {
        alg: 'HS256',
        typ: 'JWT',
    };

    const payload = {
        sub: 'maintainer-42',
        role: 'developer',
        scope: ['workbench', 'payloads', 'tools'],
        iat: 1715683200,
        exp: 1893456000,
    };

    return `${toBase64Url(header)}.${toBase64Url(payload)}.demo_signature`;
}

export function decodeJwtToken(input: string, unknownError: string): JwtState {
    const token = input.trim();
    if (token.length === 0) {
        return { status: 'invalid', error: unknownError };
    }

    const segments = token.split('.');
    if (segments.length < 2) {
        return { status: 'invalid', error: 'JWT must contain at least header and payload segments' };
    }

    try {
        const [headerSegment, payloadSegment, signatureSegment = ''] = segments;
        const header = parseJsonSegment(headerSegment);
        const payload = parseJsonSegment(payloadSegment);
        const expValue = typeof payload.exp === 'number' ? payload.exp : null;
        // ISO en vez de toLocaleString() para evitar mismatches de hidratación
        // (locale del servidor vs del browser difieren).
        const expiresAt = expValue
            ? new Date(expValue * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
            : null;
        const isExpired = expValue ? expValue * 1000 < Date.now() : false;

        return {
            status: 'valid',
            header,
            payload,
            headerFormatted: JSON.stringify(header, null, 2),
            payloadFormatted: JSON.stringify(payload, null, 2),
            algorithm: typeof header.alg === 'string' ? header.alg : '-',
            tokenType: typeof header.typ === 'string' ? header.typ : 'JWT',
            expiresAt,
            isExpired,
            signatureLength: signatureSegment.length,
            headerKeys: Object.keys(header).length,
            payloadKeys: Object.keys(payload).length,
        };
    } catch (error) {
        return {
            status: 'invalid',
            error: error instanceof Error ? error.message : unknownError,
        };
    }
}