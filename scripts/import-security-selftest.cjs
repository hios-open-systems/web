const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const loader = require('./local-excalidraw-fonts.cjs');
for (const mode of ['dev', 'prod']) {
  const directory = `node_modules/@excalidraw/excalidraw/dist/${mode}`;
  let guards = 0;
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith('.js'))) {
    const source = fs.readFileSync(path.join(directory, name), 'utf8');
    const output = loader(source);
    const match = output.match(/\(\(url\) => \{[\s\S]*?return url; \}\)/);
    if (!match) continue;
    guards++;
    const validate = vm.runInNewContext(match[0], { window: { location: { origin: 'https://openhios.dev' } } });
    for (const url of ['data:image/png;base64,AAAA', 'data:image/svg+xml,<svg/>', 'blob:https://openhios.dev/local']) assert.equal(validate(url), url);
    for (const url of ['/api/auth/github/start', 'https://outside.invalid/a.png', '//outside.invalid/a', 'javascript:alert(1)', 'data:text/html,test', 'blob:https://outside.invalid/a', null]) assert.throws(() => validate(url));
  }
  assert.equal(guards, 1, `${mode}: image loader must be guarded exactly once`);
}
assert.throws(() => loader('const changed = new Image(); changed.setAttribute("src", input);'), /image loading changed/);
console.log('Development/production drawing loaders reject linked images; adapter fails closed on upstream changes.');
