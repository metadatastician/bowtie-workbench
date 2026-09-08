// SPDX-License-Identifier: MPL-2.0
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve(import.meta.dir, '..');
export const buildDir = process.env.BOWTIE_BUILD_DIR || resolve(root, '../../llm-coding-configs/codex/bowtie-workbench-build');
export const wasmPath = resolve(buildDir, 'policy.wasm');
if (import.meta.main) {
  const compiler = process.env.AFFINESCRIPT_BIN || resolve(root, '../affinescript/_build/default/bin/main.exe');
  await mkdir(buildDir, { recursive: true });
  const source = resolve(root, 'src/core/policy.affine');
  for (const args of [['check', source], ['compile', source, '-o', wasmPath]]) {
    const child = Bun.spawn([compiler, ...args], { cwd: root, stdout: 'inherit', stderr: 'inherit' });
    const code = await child.exited;
    if (code !== 0) throw new Error(`AffineScript ${args[0]} failed (${code})`);
  }
  const sha = async path => createHash('sha256').update(await readFile(path)).digest('hex');
  await writeFile(resolve(buildDir, 'build-evidence.json'), JSON.stringify({ compiler, compilerSha256: await sha(compiler), sourceSha256: await sha(source), wasmSha256: await sha(wasmPath) }, null, 2) + '\n');
  console.log(`Built and recorded compiler/source/output hashes in ${buildDir}`);
}
