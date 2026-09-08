// SPDX-License-Identifier: MPL-2.0
import { test, expect } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { wasmPath } from '../scripts/build.mjs';
const { instance } = await WebAssembly.instantiate(await readFile(wasmPath), {
  wasi_snapshot_preview1: {
    fd_write() { throw new Error('Pure policy unexpectedly attempted I/O'); },
    proc_exit() { throw new Error('Pure policy unexpectedly attempted process exit'); }
  }
});
const { appetite_gate: gate, learning_closure_ready: close } = instance.exports;

test('unknown and invalid bands remain review; breach takes precedence', () => {
  for (const value of [-10, -1, 0, 6, 100]) {
    expect(gate(value, 3, 3, 0, 1, 1)).toBe(0);
    expect(gate(2, value, 3, 0, 1, 1)).toBe(0);
  }
  expect(gate(2, 3, -1, 0, 1, 1)).toBe(0);
  expect(gate(2, 3, 6, 0, 1, 1)).toBe(0);
  expect(gate(-1, -1, -1, 1, 0, 0)).toBe(2);
});
test('all valid ordinal combinations compare likelihood to the declared ceiling', () => {
  for (let l = 1; l <= 5; l++) for (let s = 1; s <= 5; s++) for (let ceiling = 0; ceiling <= 5; ceiling++) {
    expect(gate(l, s, ceiling, 0, 1, 1)).toBe(l > ceiling ? 2 : 1);
  }
});
test('weaker evidence cannot produce within-appetite assurance', () => {
  expect(gate(2, 5, 2, 0, 1, 1)).toBe(1);
  expect(gate(2, 5, 2, 0, 0, 1)).toBe(0);
  expect(gate(2, 5, 2, 0, 1, 0)).toBe(0);
  expect(gate(3, 5, 2, 0, 0, 0)).toBe(2);
});
test('learning closure requires every prerequisite, with individual negative controls', () => {
  expect(close(1, 1, 1, 1, 1, 1)).toBe(1);
  for (let missing = 0; missing < 6; missing++) {
    const values = Array(6).fill(1); values[missing] = 0;
    expect(close(...values)).toBe(0);
  }
});
