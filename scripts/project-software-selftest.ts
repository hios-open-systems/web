import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { softwareProjects } from '../config/project-software.ts';
import { serializeStructuredData, createBreadcrumbData } from '../lib/structured-data.ts';

const unsafe = { text: '</script><script>alert(1)</script>&' };
const serialized = serializeStructuredData(unsafe);
assert(!serialized.includes('<'));
assert.deepEqual(JSON.parse(serialized), unsafe);
assert.throws(() => createBreadcrumbData('xx', [{ name: 'Home', path: '' }]));

for (const locale of ['en', 'es', 'de', 'it']) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'));
  for (const [slug, project] of Object.entries(softwareProjects)) {
    const copy = messages.ProjectSoftware[slug];
    const html = readFileSync(`.next/server/app/${locale}/projects/${slug}/software.html`, 'utf8');
    const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    assert.equal((body.match(/<h1\b/g) ?? []).length, 1);
    assert(body.includes(copy.title), `${locale}/${slug}: missing rendered title`);
    for (const section of project.sections) assert(body.includes(`id="${section}"`));
    assert(body.includes(`/${locale}/projects/${slug}`));
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
      .map((match) => JSON.parse(match[1]));
    const trail = schemas.find((schema) => schema['@type'] === 'BreadcrumbList');
    assert.equal(trail.itemListElement.length, 4);
    const page = schemas.find((schema) => schema['@type'] === 'WebPage');
    assert.equal(page.name, copy.title);
    assert.equal(page.description, copy.description);
    assert.equal(trail.itemListElement[3].item, page.url);
    console.log(`✓ ${locale}/${slug}: rendered features, navigation and JSON-LD`);
  }
}
