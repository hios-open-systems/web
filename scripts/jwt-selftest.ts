/**
 * Crypto matrix self-test for the JWT Playground lib. Exercises the real
 * module (same Web Crypto path as the browser) and round-trips every
 * supported algorithm: sign -> verify (expect valid) and tamper -> verify
 * (expect invalid).
 *
 * Run: node --experimental-strip-types scripts/jwt-selftest.ts
 */
import {
    JWT_ALGORITHMS,
    algorithmFamily,
    decodeJwtToken,
    generateKeyPair,
    signJwt,
    verifyJwt,
} from '../lib/workbench/jwt.ts';

const HS_SECRET = 'hios-workbench-demo-secret';
const header = { typ: 'JWT' };
const payload = { sub: 'maintainer-42', role: 'developer', iat: 1715683200 };

let failures = 0;

for (const alg of JWT_ALGORITHMS) {
    const family = algorithmFamily(alg);
    let signKey = HS_SECRET;
    let verifyKey = HS_SECRET;

    if (family !== 'HMAC') {
        const pair = await generateKeyPair(alg);
        if (!pair) throw new Error(`no key pair for ${alg}`);
        signKey = pair.privatePem;
        verifyKey = pair.publicPem;
    }

    const token = await signJwt({ header, payload, algorithm: alg, keyMaterial: signKey });
    const decoded = decodeJwtToken(token, 'err');
    const okValid = await verifyJwt({ token, algorithm: alg, keyMaterial: verifyKey });

    // Tamper the payload segment: this always changes the signing input, so
    // a correct verifier must reject it for every algorithm.
    const parts = token.split('.');
    parts[1] = parts[1].replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
    const okTampered = await verifyJwt({ token: parts.join('.'), algorithm: alg, keyMaterial: verifyKey });

    const pass =
        decoded.status === 'valid' &&
        decoded.algorithm === alg &&
        okValid.status === 'valid' &&
        okTampered.status !== 'valid';

    if (!pass) failures += 1;
    console.log(
        `${pass ? '✓' : '✗'} ${alg.padEnd(6)} ${family.padEnd(4)} ` +
        `decode=${decoded.status} verify=${okValid.status} tampered=${okTampered.status}`,
    );
}

console.log(failures === 0 ? '\nALL ALGORITHMS OK' : `\n${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
