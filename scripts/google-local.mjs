import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = 'config/google-login/wrangler.jsonc';
const persist = '.wrangler/google-login';
const origin = 'http://localhost:3300';
const callback = origin + '/api/auth/google/callback';
const wrangler = resolve(root, 'node_modules/wrangler/bin/wrangler.js');
const env = { ...process.env, CI: '1', WRANGLER_SEND_METRICS: 'false',
  CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false', CLOUDFLARE_INCLUDE_PROCESS_ENV: 'false' };
const args = process.argv.slice(2);

function importCredentials(path) {
  let data;
  try { data = JSON.parse(readFileSync(resolve(path), 'utf8')).web; }
  catch { throw new Error('No se pudo leer el JSON del cliente web de Google.'); }
  if (!data || typeof data.client_id !== 'string' || !/^[a-zA-Z0-9_-]+\.apps\.googleusercontent\.com$/.test(data.client_id)
    || typeof data.client_secret !== 'string' || !/^[a-zA-Z0-9_-]{10,256}$/.test(data.client_secret)) {
    throw new Error('El archivo debe ser un cliente OAuth de tipo Aplicación web con ID y secreto válidos.');
  }
  if (!Array.isArray(data.redirect_uris) || !data.redirect_uris.includes(callback)) {
    throw new Error('Agregá esta URI al cliente y descargá de nuevo el JSON: ' + callback);
  }
  // Only these two values are imported. Never print credentials or pass them in argv.
  const destination = resolve(root, 'config/google-login/.dev.vars');
  writeFileSync(destination, 'GOOGLE_CLIENT_ID=' + data.client_id + '\nGOOGLE_CLIENT_SECRET=' + data.client_secret + '\n', { mode: 0o600 });
  console.log('Credenciales importadas en .dev.vars local, excluido de Git.');
}

function migrate() {
  execFileSync(process.execPath, [wrangler, 'd1', 'migrations', 'apply', 'DB', '--local',
    '--config', config, '--persist-to', persist], { cwd: root, env, stdio: 'inherit' });
}

try {
  if (args.length > 1 || (args[0]?.startsWith('--') && args[0] !== '--prepare')) {
    throw new Error('Uso: npm run google:local -- "ruta-al-cliente.json" (o npm run google:prepare).');
  }
  if (args[0] === '--prepare') {
    migrate();
    console.log('D1 local preparado. Callback: ' + callback);
  } else {
    if (args[0]) importCredentials(args[0]);
    if (!existsSync(resolve(root, '.open-next/worker.js'))) {
      throw new Error('Primero ejecutá npx opennextjs-cloudflare build (sólo build, sin deploy).');
    }
    migrate();
    console.log('Prueba local: ' + origin + '/es');
    console.log('D1 aislado. Sin deploy ni conexiones a la base de producción. Ctrl+C para detener.');
    console.log('Google aparecerá al cargar credenciales reales. Los logs omiten URLs de callback.');
    const child = spawn(process.execPath, [wrangler, 'dev', '--local', '--config', config, '--persist-to', persist,
      '--ip', '127.0.0.1', '--port', '3300', '--inspector-ip', '127.0.0.1', '--inspector-port', '9330',
      '--log-level', 'error', '--show-interactive-dev-session=false'], { cwd: root, env, stdio: 'inherit', windowsHide: true });
    child.on('error', () => { console.error('No se pudo iniciar Wrangler local.'); process.exitCode = 1; });
    child.on('exit', code => { process.exitCode = code ?? 0; });
    process.on('SIGINT', () => child.kill('SIGINT'));
    process.on('SIGTERM', () => child.kill('SIGTERM'));
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'No se pudo preparar la prueba local.');
  process.exitCode = 1;
}
