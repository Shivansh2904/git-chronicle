import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execFileSync } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FixtureRepo } from './fixture-repo.js';

// Runs the real CLI from source, in a throwaway repository, and reads stdout.
const PROJECT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TSX_CLI = join(PROJECT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
const ENTRY = join(PROJECT, 'src', 'index.ts');

/** Every string anywhere inside a parsed JSON value. */
function stringsIn(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === 'object') return Object.values(value).flatMap(stringsIn);
  return [];
}

describe('analyze --json', () => {
  let repo: FixtureRepo;
  let output: unknown;

  beforeAll(() => {
    repo = new FixtureRepo();
    repo.write('src/app.ts', 'export const x = 1;\n');
    repo.commit('first');
    const stdout = execFileSync(process.execPath, [TSX_CLI, ENTRY, 'analyze', '--json'], {
      cwd: repo.dir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NO_COLOR: '1' },
    });
    output = JSON.parse(stdout);
  }, 60_000);

  afterAll(() => repo.remove());

  it("names the repository by its directory name", () => {
    expect((output as { summary: { name: string } }).summary.name).toBe(basename(repo.dir));
  });

  it('contains no local path', () => {
    const toplevel = repo.git('rev-parse', '--show-toplevel').trim();
    const localPaths = [toplevel, repo.dir, tmpdir(), homedir()].flatMap(p => [p, p.replace(/\\/g, '/')]);
    const values = stringsIn(output);
    expect(values.length).toBeGreaterThan(0);
    for (const local of localPaths) {
      expect(values.filter(v => v.includes(local))).toEqual([]);
    }
  });
});
