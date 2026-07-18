// Flat config de ESLint 9. Reemplaza a .eslintrc.json (legacy, dejó de ser el
// default en ESLint 9). Usa FlatCompat para reusar los presets de Next
// (next/core-web-vitals + next/typescript), que todavía se publican en el formato
// viejo. Equivale exactamente al `extends` que había en .eslintrc.json.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  // next lint ya ignora .next y node_modules; sumamos los outputs propios.
  { ignores: ['.next/**', '.open-next/**', '.vercel/**', 'node_modules/**', 'projects/**/.pio/**'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
