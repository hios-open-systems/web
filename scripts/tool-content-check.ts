import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { workbenchGuideIds } from '../config/workbench-guides.ts';
import { workbenchTools } from '../config/workbench.ts';

interface Guide { intro: string; steps: string[]; tip?: string }
interface Messages {
  Workbench: { packs: Record<string, { title: string; description: string }>; guides: Record<string, Guide> };
}

function encode(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

/** The initial body must remain useful without executing the client tool. */
export function verifyToolContent(html: string, route: string) {
  const [, locale, section, toolId] = route.split('/');
  if (section !== 'workbench' || ['payload', 'snippets', 'serial-monitor', 'settings', 'feedback'].includes(toolId)) return;
  const tool = workbenchTools.find((entry) => entry.id === toolId && !entry.external);
  if (!tool) return;
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) as Messages;
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/)?.[1] ?? '')
    .replace(/<script\b[\s\S]*?<\/script>/g, '');
  const headings = [...body.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/g)];
  assert.equal(headings.length, 1, `${route}: one prerendered h1`);
  assert.equal(headings[0][1], encode(messages.Workbench.packs[toolId].title), route);
  assert.ok(body.includes(encode(messages.Workbench.packs[toolId].description)), `${route}: prerendered description`);
  const guideId = workbenchGuideIds[tool.id];
  if (!guideId) return;
  const guide = messages.Workbench.guides[guideId];
  assert.ok(guide && guide.steps.length, `${route}: translated guide`);
  for (const text of [guide.intro, ...guide.steps, ...(guide.tip ? [guide.tip] : [])]) {
    assert.ok(body.includes(encode(text)), `${route}: guide content exists before JavaScript loads`);
  }
}
