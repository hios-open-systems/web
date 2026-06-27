// Copia los estaticos del espejo/admin (src/web/public) a dist/web/public, para
// que el server los sirva tambien cuando se corre solo desde dist/ (install nativo).
import { cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src', 'web', 'public');
const dst = join(root, 'dist', 'web', 'public');

if (existsSync(src)) {
  cpSync(src, dst, { recursive: true });
  console.log('[build] estaticos copiados ->', dst);
} else {
  console.warn('[build] no existe', src);
}
