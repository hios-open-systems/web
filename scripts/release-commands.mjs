import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const bins = {
  opennext: 'node_modules/@opennextjs/cloudflare/dist/cli/index.js',
  playwright: 'node_modules/@playwright/test/cli.js',
};

export function runStages(stages, run) {
  for (const stage of stages) run(stage);
}

export function command(executable, args, env = {}) {
  const result = spawnSync(executable, args, {
    stdio: 'inherit', env: { ...process.env, ...env }, windowsHide: true,
  });
  if (result.error) throw new Error(result.error.message);
  if (result.status !== 0) throw new Error(`Command failed (${result.status ?? result.signal}): ${executable} ${args.join(' ')}`);
}

export const node = (script, args = [], env = {}) => command(process.execPath, [script, ...args], env);
export function npm(args) {
  if (!process.env.npm_execpath) throw new Error('Use the npm run release:* commands.');
  node(process.env.npm_execpath, args);
}

export function gitleaks() {
  const local = resolve('.release-tools', process.platform === 'win32' ? 'gitleaks.exe' : 'gitleaks');
  return process.env.HIOS_GITLEAKS_PATH || (existsSync(local) ? local : 'gitleaks');
}
