import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getLog } from '../src/core/git.js';
import { getTopChurnFiles } from '../src/core/stats.js';
import type { FileChurn } from '../src/types.js';
import { FixtureRepo, lines } from './fixture-repo.js';

// Sum `git log --numstat` per path, independently of the code under test.
function numstatTotals(repo: FixtureRepo): FileChurn[] {
  const totals = new Map<string, FileChurn>();
  for (const line of repo.git('log', '--numstat', '--format=').split('\n')) {
    if (!line.trim()) continue;
    const [ins, del, path] = line.split('\t');
    const entry = totals.get(path) ?? { path, changes: 0, insertions: 0, deletions: 0 };
    entry.changes++;
    entry.insertions += ins === '-' ? 0 : Number(ins);
    entry.deletions += del === '-' ? 0 : Number(del);
    totals.set(path, entry);
  }
  return [...totals.values()];
}

const byPath = (files: FileChurn[]) => [...files].sort((a, b) => a.path.localeCompare(b.path));

describe('per-file churn', () => {
  let repo: FixtureRepo;

  beforeAll(() => {
    repo = new FixtureRepo();
    // One large and one small file in the same commit: an even split of the
    // commit total would give each of them +50.
    repo.write('big.txt', lines(100));
    repo.write('small.txt', 'one\n');
    repo.commit('add files');

    repo.write('big.txt', lines(110));
    repo.write('small.txt', 'uno\n');
    repo.commit('grow big, reword small');

    repo.write('big.txt', lines(80));
    repo.write('bin.dat', Buffer.from([0, 1, 2, 3, 0, 255, 0]));
    repo.commit('shrink big, add a binary');
  });

  afterAll(() => repo.remove());

  it('gives each file its own insertions and deletions', async () => {
    const churn = getTopChurnFiles(await getLog(repo.dir), 10);
    expect(byPath(churn)).toEqual([
      { path: 'big.txt', changes: 3, insertions: 110, deletions: 30 },
      { path: 'bin.dat', changes: 1, insertions: 0, deletions: 0 },
      { path: 'small.txt', changes: 2, insertions: 2, deletions: 1 },
    ]);
  });

  it('matches git log --numstat for every file', async () => {
    const churn = getTopChurnFiles(await getLog(repo.dir), 10);
    expect(byPath(churn)).toEqual(byPath(numstatTotals(repo)));
  });

  it('keeps the per-commit totals equal to the sum over files', async () => {
    for (const c of await getLog(repo.dir)) {
      expect(c.files.reduce((s, f) => s + f.insertions, 0)).toBe(c.insertions);
      expect(c.files.reduce((s, f) => s + f.deletions, 0)).toBe(c.deletions);
    }
  });
});
