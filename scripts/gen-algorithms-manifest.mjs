// Genera lib/algorithmsManifest.json desde lib/algorithms/*.ts.
// Corre en `prebuild`/`predev` (después de gen-blog-manifest) para que el
// componente <HowItWorks/> muestre EL MISMO código que ejecutan las tools:
// una sola fuente, sin copias que puedan driftear.
// Shape: { [id]: { file: ruta repo-relativa (deep-link a GitHub), source: contenido } }
import fs from 'fs';
import path from 'path';

const DIR = path.join(process.cwd(), 'lib', 'algorithms');
const OUT = path.join(process.cwd(), 'lib', 'algorithmsManifest.json');

const files = (fs.existsSync(DIR) ? fs.readdirSync(DIR) : [])
    .filter((f) => f.endsWith('.ts'))
    .sort(); // orden determinístico -> diffs estables en el JSON commiteado

const manifest = {};
for (const f of files) {
    const id = f.replace(/\.ts$/, '');
    manifest[id] = {
        file: `lib/algorithms/${f}`,
        // Normalizamos CRLF -> LF para que el output no dependa del checkout.
        source: fs.readFileSync(path.join(DIR, f), 'utf8').replace(/\r\n/g, '\n'),
    };
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2) + '\n');
console.log(`[algorithms] manifest: ${files.length} modules -> lib/algorithmsManifest.json`);
