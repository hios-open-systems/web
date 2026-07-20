#!/usr/bin/env node
// Corre toda la red de self-tests de una. Descubre los scripts `test:*` de
// package.json en vez de listarlos, así un self-test nuevo queda protegido
// por CI sin que nadie se acuerde de agregarlo acá.
//
// Excluye los e2e (levantan servidor y red; van aparte).

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const EXCLUDED = /^test:e2e/;

// Los self-tests corren con --experimental-strip-types, que necesita Node
// >=22.6. Sin este chequeo, un runner en Node 20 falla los 27 con errores de
// sintaxis y parece una regresión masiva cuando es la versión de Node.
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 22 || (major === 22 && minor < 6)) {
    console.error(
        `\n  Node ${process.versions.node} es muy viejo para los self-tests.\n` +
        `  --experimental-strip-types necesita Node >=22.6.\n`,
    );
    process.exit(1);
}

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const names = Object.keys(pkg.scripts).filter((n) => n.startsWith('test:') && !EXCLUDED.test(n));

if (names.length === 0) {
    console.error('No se encontró ningún script test:* en package.json');
    process.exit(1);
}

console.log(`\nCorriendo ${names.length} self-tests\n`);

const failed = [];
for (const name of names) {
    process.stdout.write(`  ${name.padEnd(18)}`);
    try {
        execSync(pkg.scripts[name], { stdio: 'pipe', encoding: 'utf8' });
        console.log('ok');
    } catch (error) {
        console.log('FALLÓ');
        failed.push({ name, output: `${error.stdout ?? ''}${error.stderr ?? ''}`.trim() });
    }
}

if (failed.length > 0) {
    for (const { name, output } of failed) {
        console.error(`\n${'─'.repeat(60)}\n${name}\n${'─'.repeat(60)}\n${output}`);
    }
    console.error(`\n${failed.length}/${names.length} fallaron: ${failed.map((f) => f.name).join(', ')}\n`);
    process.exit(1);
}

console.log(`\n${names.length}/${names.length} en verde\n`);
