export type RepoProvider = 'github' | 'gitlab';
export interface Repository { provider: RepoProvider; project: string; branch: string }
export interface RepoEntry { name: string; path: string; directory: boolean }
const API = { github: 'https://api.github.com', gitlab: 'https://gitlab.com/api/v4' };
const MAX_BYTES = 1_500_000;

export function parseRepository(raw: string, branch: string): Repository {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.search || url.hash) throw new Error('Invalid repository URL');
  const provider = url.hostname === 'github.com' ? 'github' : url.hostname === 'gitlab.com' ? 'gitlab' : null;
  const project = url.pathname.replace(/^\/|\/$/g, '').replace(/\.git$/, '');
  if (!provider || !/^[\w.-]+(?:\/[\w.-]+)+$/.test(project) || project.split('/').some(part => part === '.' || part === '..')
    || (provider === 'github' && project.split('/').length !== 2) || branch.length > 200) throw new Error('Invalid repository');
  return { provider, project, branch: branch.trim() };
}

async function readResponse(response: Response): Promise<string> {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty response');
  let size = 0, text = '';
  const decoder = new TextDecoder('utf-8', { fatal: true });
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error('File too large');
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally { await reader.cancel(); }
}

function repoUrl(repo: Repository, path: string, directory: boolean, page: number): URL {
  if (path.split('/').some(part => part === '..' || part === '.') || path.length > 1500) throw new Error('Invalid path');
  const base = repo.provider === 'github'
    ? `${API.github}/repos/${repo.project}/contents/${path.split('/').map(encodeURIComponent).join('/')}`
    : `${API.gitlab}/projects/${encodeURIComponent(repo.project)}/repository/${directory ? 'tree' : 'files/' + encodeURIComponent(path) + '/raw'}`;
  const url = new URL(base);
  if (repo.branch) url.searchParams.set('ref', repo.branch);
  if (repo.provider === 'gitlab' && directory) {
    url.searchParams.set('path', path); url.searchParams.set('per_page', '100'); url.searchParams.set('page', String(page));
  }
  return url;
}

export async function readRepository(repo: Repository, token: string, path: string, directory: boolean, signal: AbortSignal, page = 1) {
  const response = await fetch(repoUrl(repo, path, directory, page), {
    method: 'GET', credentials: 'omit', cache: 'no-store', redirect: 'error', referrerPolicy: 'no-referrer', signal,
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  });
  const raw = await readResponse(response);
  if (!directory && repo.provider === 'gitlab') {
    if (raw.includes('\0')) throw new Error('Binary file');
    return { text: raw };
  }
  const data: unknown = JSON.parse(raw);
  if (!directory) {
    if (!data || typeof data !== 'object' || !('encoding' in data) || data.encoding !== 'base64'
      || !('content' in data) || typeof data.content !== 'string') throw new Error('Unsupported file');
    const text = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(atob(data.content.replace(/\s/g, '')), c => c.charCodeAt(0)));
    if (text.includes('\0')) throw new Error('Binary file');
    return { text };
  }
  if (!Array.isArray(data)) throw new Error('Invalid tree');
  const entries: RepoEntry[] = data.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== 'object' || !('name' in entry) || typeof entry.name !== 'string'
      || !('path' in entry) || typeof entry.path !== 'string' || !('type' in entry)) return [];
    if (!['file', 'dir', 'blob', 'tree'].includes(String(entry.type))) return [];
    return [{ name: entry.name, path: entry.path, directory: entry.type === 'dir' || entry.type === 'tree' }];
  });
  return { entries, more: repo.provider === 'gitlab' && data.length === 100,
    limited: repo.provider === 'github' && data.length >= 1000 };
}
