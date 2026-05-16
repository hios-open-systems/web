/**
 * JWT playground primitives — encode, decode and verify, fully in-browser via
 * the Web Crypto API. Nothing here touches the network: HS uses an HMAC
 * secret, RS and ES use PEM key material the operator pastes locally.
 */

export type JwtAlgorithm =
    | 'HS256' | 'HS384' | 'HS512'
    | 'RS256' | 'RS384' | 'RS512'
    | 'ES256' | 'ES384';

export const JWT_ALGORITHMS: JwtAlgorithm[] = [
    'HS256', 'HS384', 'HS512',
    'RS256', 'RS384', 'RS512',
    'ES256', 'ES384',
];

export type AlgorithmFamily = 'HMAC' | 'RSA' | 'EC';

export function algorithmFamily(alg: JwtAlgorithm): AlgorithmFamily {
    if (alg.startsWith('HS')) return 'HMAC';
    if (alg.startsWith('RS')) return 'RSA';
    return 'EC';
}

function hashName(alg: JwtAlgorithm): 'SHA-256' | 'SHA-384' | 'SHA-512' {
    if (alg.endsWith('256')) return 'SHA-256';
    if (alg.endsWith('384')) return 'SHA-384';
    return 'SHA-512';
}

/* ------------------------------------------------------------------ *
 * base64url helpers
 * ------------------------------------------------------------------ */

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64Url(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach((b) => {
        binary += String.fromCharCode(b);
    });
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBytes(segment: string): Uint8Array<ArrayBuffer> {
    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        out[i] = binary.charCodeAt(i);
    }
    return out;
}

function encodeJsonSegment(value: Record<string, unknown>): string {
    return bytesToBase64Url(textEncoder.encode(JSON.stringify(value)));
}

function decodeJsonSegment(segment: string): Record<string, unknown> {
    const parsed = JSON.parse(textDecoder.decode(base64UrlToBytes(segment)));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Segment is not a JSON object');
    }
    return parsed as Record<string, unknown>;
}

function pemToDer(pem: string): ArrayBuffer {
    const body = pem
        .replace(/-----BEGIN [^-]+-----/g, '')
        .replace(/-----END [^-]+-----/g, '')
        .replace(/\s+/g, '');
    if (!body) throw new Error('Empty PEM key');
    // PEM bodies are standard base64; base64UrlToBytes tolerates both and
    // returns a fresh, zero-offset ArrayBuffer-backed view.
    return base64UrlToBytes(body).buffer;
}

/* ------------------------------------------------------------------ *
 * Key import
 * ------------------------------------------------------------------ */

async function importSignKey(alg: JwtAlgorithm, secretOrPem: string): Promise<CryptoKey> {
    const family = algorithmFamily(alg);
    if (family === 'HMAC') {
        return crypto.subtle.importKey(
            'raw',
            textEncoder.encode(secretOrPem),
            { name: 'HMAC', hash: hashName(alg) },
            false,
            ['sign'],
        );
    }
    if (family === 'RSA') {
        return crypto.subtle.importKey(
            'pkcs8',
            pemToDer(secretOrPem),
            { name: 'RSASSA-PKCS1-v1_5', hash: hashName(alg) },
            false,
            ['sign'],
        );
    }
    return crypto.subtle.importKey(
        'pkcs8',
        pemToDer(secretOrPem),
        { name: 'ECDSA', namedCurve: alg === 'ES256' ? 'P-256' : 'P-384' },
        false,
        ['sign'],
    );
}

async function importVerifyKey(alg: JwtAlgorithm, secretOrPem: string): Promise<CryptoKey> {
    const family = algorithmFamily(alg);
    if (family === 'HMAC') {
        return crypto.subtle.importKey(
            'raw',
            textEncoder.encode(secretOrPem),
            { name: 'HMAC', hash: hashName(alg) },
            false,
            ['verify'],
        );
    }
    if (family === 'RSA') {
        return crypto.subtle.importKey(
            'spki',
            pemToDer(secretOrPem),
            { name: 'RSASSA-PKCS1-v1_5', hash: hashName(alg) },
            false,
            ['verify'],
        );
    }
    return crypto.subtle.importKey(
        'spki',
        pemToDer(secretOrPem),
        { name: 'ECDSA', namedCurve: alg === 'ES256' ? 'P-256' : 'P-384' },
        false,
        ['verify'],
    );
}

function signParams(alg: JwtAlgorithm): AlgorithmIdentifier | EcdsaParams {
    const family = algorithmFamily(alg);
    if (family === 'HMAC') return { name: 'HMAC' };
    if (family === 'RSA') return { name: 'RSASSA-PKCS1-v1_5' };
    return { name: 'ECDSA', hash: hashName(alg) };
}

/* ------------------------------------------------------------------ *
 * Encode / sign
 * ------------------------------------------------------------------ */

export async function signJwt(args: {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    algorithm: JwtAlgorithm;
    keyMaterial: string;
}): Promise<string> {
    const header = { ...args.header, alg: args.algorithm, typ: args.header.typ ?? 'JWT' };
    const signingInput = `${encodeJsonSegment(header)}.${encodeJsonSegment(args.payload)}`;
    const key = await importSignKey(args.algorithm, args.keyMaterial);
    const signature = await crypto.subtle.sign(
        signParams(args.algorithm),
        key,
        textEncoder.encode(signingInput),
    );
    return `${signingInput}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

/* ------------------------------------------------------------------ *
 * Decode
 * ------------------------------------------------------------------ */

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
        const header = decodeJsonSegment(headerSegment);
        const payload = decodeJsonSegment(payloadSegment);
        const expValue = typeof payload.exp === 'number' ? payload.exp : null;
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

/* ------------------------------------------------------------------ *
 * Verify
 * ------------------------------------------------------------------ */

export type VerifyResult =
    | { status: 'valid' }
    | { status: 'invalid' }
    | { status: 'error'; error: string };

export async function verifyJwt(args: {
    token: string;
    algorithm: JwtAlgorithm;
    keyMaterial: string;
}): Promise<VerifyResult> {
    const segments = args.token.trim().split('.');
    if (segments.length !== 3 || !segments[2]) {
        return { status: 'error', error: 'Token must have header.payload.signature' };
    }
    try {
        const [headerSegment, payloadSegment, signatureSegment] = segments;
        const key = await importVerifyKey(args.algorithm, args.keyMaterial);
        const ok = await crypto.subtle.verify(
            signParams(args.algorithm),
            key,
            base64UrlToBytes(signatureSegment),
            textEncoder.encode(`${headerSegment}.${payloadSegment}`),
        );
        return { status: ok ? 'valid' : 'invalid' };
    } catch (error) {
        return {
            status: 'error',
            error: error instanceof Error ? error.message : 'Verification failed',
        };
    }
}

/* ------------------------------------------------------------------ *
 * Examples
 * ------------------------------------------------------------------ */

export function buildExampleJwt(): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
        sub: 'maintainer-42',
        role: 'developer',
        scope: ['workbench', 'payloads', 'tools'],
        iat: 1715683200,
        exp: 1893456000,
    };
    return `${encodeJsonSegment(header)}.${encodeJsonSegment(payload)}.demo_signature`;
}

export const EXAMPLE_HS_SECRET = 'hios-workbench-demo-secret';

export function buildExampleHeader(algorithm: JwtAlgorithm): string {
    return JSON.stringify({ alg: algorithm, typ: 'JWT' }, null, 2);
}

export function buildExamplePayload(): string {
    const nowSeconds = 1715683200;
    return JSON.stringify(
        {
            sub: 'maintainer-42',
            role: 'developer',
            scope: ['workbench', 'payloads', 'tools'],
            iat: nowSeconds,
            exp: nowSeconds + 60 * 60 * 24 * 365,
        },
        null,
        2,
    );
}
