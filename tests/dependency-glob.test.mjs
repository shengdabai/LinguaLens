import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { glob, globSync, hasMagic, escape } from 'glob';
import { rimraf } from 'rimraf';

// Capacitor's rimraf -> glob dependency must retain its matching and deletion
// behavior when glob is upgraded to use the patched minimatch dependency.
test('glob and rimraf preserve matching boundaries with the patched matcher', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'lingualens-glob-'));
  try {
    await mkdir(join(cwd, 'nested'));
    for (const file of ['keep.txt', 'remove.log', 'nested/keep.md', 'nested/remove.log', '.hidden.txt', '[literal].txt']) {
      await writeFile(join(cwd, file), 'fixture');
    }
    const pattern = '**/*.{txt,md}';
    const options = { cwd, nodir: true, ignore: ['nested/**'] };
    const expected = ['[literal].txt', 'keep.txt'];
    assert.deepEqual((await glob(pattern, options)).sort(), expected);
    assert.deepEqual(globSync(pattern, options).sort(), expected);
    assert.equal(hasMagic('**/*.log'), true);
    assert.deepEqual(await glob(escape('[literal].txt'), { cwd }), ['[literal].txt']);
    assert.equal(await rimraf(join(cwd, '**/*.log'), { glob: true }), true);
    assert.deepEqual(await glob('**/*.log', { cwd }), []);
    await access(join(cwd, 'keep.txt'));
    await access(join(cwd, 'nested/keep.md'));
    await access(join(cwd, '.hidden.txt'));
  } finally {
    await rm(cwd, { recursive: true, force: true });
  }
});
