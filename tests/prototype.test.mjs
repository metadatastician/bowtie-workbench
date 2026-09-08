// SPDX-License-Identifier: MPL-2.0
import { test, expect } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
const html = await readFile(new URL('../src/prototype/index.html', import.meta.url), 'utf8');
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
const style = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const digest = (value, encoding = 'base64') => createHash('sha256').update(value).digest(encoding);
test('prototype script parses and CSP hashes match actual inline content', () => {
  expect(new Bun.Transpiler({ loader: 'js' }).transformSync(script)).toBeString();
  expect(html).toContain(`script-src 'sha256-${digest(script)}'`);
  expect(html).toContain(`style-src 'sha256-${digest(style)}'`);
  expect(html).toContain("connect-src 'none'");
});
test('source import remains byte-identical to the recorded input', async () => {
  const provenance = JSON.parse(await readFile(new URL('../.machine_readable/prototype-source.json', import.meta.url)));
  expect(digest(html, 'hex')).toBe(provenance.sha256);
});
test('workspace validator accepts an empty workspace and rejects malformed input', () => {
  // Exercise the supplied domain functions before storage/UI boot, with no browser mocks.
  const domain = script.split('// SPDX-License-Identifier: MPL-2.0\n\nclass ConflictError')[0];
  const context = vm.createContext({ crypto: globalThis.crypto, structuredClone });
  vm.runInContext(domain + '\nglobalThis.api = {validateWorkspace, SCHEMA};', context);
  const { validateWorkspace, SCHEMA } = context.api;
  expect(() => validateWorkspace({ schemaVersion: SCHEMA, revision: 0, assessments: [] })).not.toThrow();
  for (const bad of [null, {}, { schemaVersion: SCHEMA, revision: -1, assessments: [] }, { schemaVersion: SCHEMA, revision: 0, assessments: Array(201).fill({}) }]) {
    expect(() => validateWorkspace(bad)).toThrow();
  }
});
