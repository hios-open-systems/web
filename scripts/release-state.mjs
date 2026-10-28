import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export const receiptPath = '.release/verified.json';
export const git = (...args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

export function cleanCommit() {
  if (git('branch', '--show-current') !== 'main') throw new Error('Release requires local main.');
  if (git('status', '--porcelain', '--untracked-files=all')) throw new Error('Commit all changes before verifying or publishing.');
  return git('rev-parse', 'HEAD');
}

export function artifactHash(root = '.open-next') {
  if (!existsSync(join(root, 'worker.js'))) throw new Error('Missing OpenNext artifact. Run npm run release:verify.');
  const hash = createHash('sha256');
  function visit(directory) {
    for (const name of readdirSync(directory).sort()) {
      const file = join(directory, name);
      if (statSync(file).isDirectory()) visit(file);
      else {
        hash.update(relative(root, file).replaceAll('\\', '/') + '\0');
        const data = readFileSync(file);
        hash.update(String(data.length) + '\0');
        hash.update(data);
      }
    }
  }
  visit(root);
  return hash.digest('hex');
}

export function publicKeyHash() {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITEKEY;
  if (!key || !/^[a-zA-Z0-9_-]{10,100}$/.test(key) || /^[123]x0+/.test(key)) {
    throw new Error('Configure a real NEXT_PUBLIC_TURNSTILE_SITEKEY in .env.local before verification.');
  }
  return createHash('sha256').update(key).digest('hex');
}

export function assertReceipt(receipt, current) {
  for (const field of ['sha', 'artifact', 'key', 'node']) {
    if (!receipt || receipt.schema !== 1 || receipt[field] !== current[field]) {
      throw new Error(`Verification missing or stale (${field}). Run npm run release:verify.`);
    }
  }
}

export function verifiedCommit() {
  const current = { sha: cleanCommit(), artifact: artifactHash(), key: publicKeyHash(), node: process.version };
  const receipt = existsSync(receiptPath) ? JSON.parse(readFileSync(receiptPath, 'utf8')) : null;
  assertReceipt(receipt, current);
  return current.sha;
}

export function assertRemote(sha, output) {
  if (output.split(/\s+/)[0] !== sha) throw new Error('origin/main differs from the verified commit. Run release:push first.');
}
