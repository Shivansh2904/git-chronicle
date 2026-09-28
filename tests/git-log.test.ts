import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getLog } from '../src/core/git.js';
import { computeAuthorStats } from '../src/core/stats.js';
import type { CommitRecord } from '../src/types.js';
import { FixtureRepo, lines } from './fixture-repo.js';

// getLog against real git output, for the inputs that broke the old
// pipe-delimited, line-based parser.
describe('getLog on awkward histories', () => {
  let repo: FixtureRepo;
  let log: CommitRecord[];
  const bySubject = (s: string) => log.find(c => c.subject === s)!;

  beforeAll(async () => {
    repo = new FixtureRepo();
    repo.write('old.ts', lines(10));
    repo.write('café.ts', 'x\n');
    repo.commit('first | with pipe', { name: 'Ana|B', email: 'ana@example.com' });

    repo.write('a.md', 'a\n');
    repo.write('b.md', 'b\n');
    repo.commit('mention COMMIT_DELIMITER here');

    repo.git('mv', 'old.ts', 'new.ts');
    repo.write('new.ts', lines(11));
    repo.commit('rename old.ts');

    repo.commit('nothing changed');

    log = await getLog(repo.dir);
  });

  afterAll(() => repo.remove());

  it('reads every commit', () => {
    expect(log.map(c => c.subject)).toEqual([
      'nothing changed',
      'rename old.ts',
      'mention COMMIT_DELIMITER here',
      'first | with pipe',
    ]);
  });

  it('keeps a | in the author name and subject', () => {
    const c = bySubject('first | with pipe');
    expect(c.author).toBe('Ana|B');
    expect(c.email).toBe('ana@example.com');
    expect(Number.isNaN(c.date.getTime())).toBe(false);
  });

  it('keeps the files of a commit whose subject contains the old delimiter', () => {
    expect(bySubject('mention COMMIT_DELIMITER here').files.map(f => f.path).sort()).toEqual(['a.md', 'b.md']);
  });

  it('counts a rename under the new path', () => {
    expect(bySubject('rename old.ts').files).toEqual([{ path: 'new.ts', insertions: 1, deletions: 0 }]);
  });

  it('reads non-ASCII paths verbatim', () => {
    expect(bySubject('first | with pipe').files.map(f => f.path).sort()).toEqual(['café.ts', 'old.ts']);
  });

  it('gives a commit with no changes an empty file list', () => {
    expect(bySubject('nothing changed').files).toEqual([]);
  });
});

describe('getLog and .mailmap', () => {
  let repo: FixtureRepo;

  beforeAll(() => {
    repo = new FixtureRepo();
    repo.write('.mailmap', 'Ana Lima <ana@new.example> <ana@old.example>\n');
    repo.write('a.txt', 'a\n');
    repo.commit('from the old address', { name: 'ana', email: 'ana@old.example' });
    repo.write('b.txt', 'b\n');
    repo.commit('from the new address', { name: 'Ana Lima', email: 'ana@new.example' });
  });

  afterAll(() => repo.remove());

  it('reports authors by their canonical .mailmap identity', async () => {
    const authors = computeAuthorStats(await getLog(repo.dir));
    expect(authors.map(a => [a.name, a.email, a.commits])).toEqual([['Ana Lima', 'ana@new.example', 2]]);
  });
});
