import { describe, it, expect } from 'vitest';
import { parseLog } from '../src/core/git.js';

// Build `git log -z --numstat --format=%H%x00%aN%x00%aE%x00%aI%x00%s` output
// by hand. Every field and numstat entry ends in NUL; the first numstat entry
// after a header starts with a newline.
const H1 = '1'.repeat(40);
const H2 = '2'.repeat(40);
const H3 = '3'.repeat(40);
const DATE = '2024-01-18T12:00:00+00:00';
const header = (hash: string, subject: string, author = 'Alice', email = 'alice@example.com') =>
  [hash, author, email, DATE, subject];
const gitOutput = (...fields: string[]) => fields.map(f => f + '\0').join('');

describe('parseLog', () => {
  it('returns no commits for empty output', () => {
    expect(parseLog('')).toEqual([]);
  });

  it('reads header fields verbatim, including | characters', () => {
    const [c] = parseLog(gitOutput(...header(H1, 'fix: a | b', 'Ana|B', 'ana|b@example.com')));
    expect(c).toMatchObject({ hash: H1, author: 'Ana|B', email: 'ana|b@example.com', subject: 'fix: a | b' });
    expect(c.date.toISOString()).toBe('2024-01-18T12:00:00.000Z');
  });

  it('reads per-file counts and totals', () => {
    const [c] = parseLog(gitOutput(...header(H1, 'two files'), '\n10\t2\tsrc/a.ts', '1\t0\tREADME.md'));
    expect(c.files).toEqual([
      { path: 'src/a.ts', insertions: 10, deletions: 2 },
      { path: 'README.md', insertions: 1, deletions: 0 },
    ]);
    expect(c).toMatchObject({ filesChanged: 2, insertions: 11, deletions: 2 });
  });

  it('counts binary files as changed with no lines', () => {
    const [c] = parseLog(gitOutput(...header(H1, 'binary'), '\n-\t-\timg/logo.png'));
    expect(c.files).toEqual([{ path: 'img/logo.png', insertions: 0, deletions: 0 }]);
  });

  it('counts a rename under its new path, wherever it appears in the list', () => {
    const [c] = parseLog(gitOutput(
      ...header(H1, 'renames'),
      '\n0\t0\t', 'old/a.ts', 'new/a.ts',
      '4\t1\tkeep.ts',
      '2\t3\t', 'b.ts', 'lib/b.ts',
    ));
    expect(c.files).toEqual([
      { path: 'new/a.ts', insertions: 0, deletions: 0 },
      { path: 'keep.ts', insertions: 4, deletions: 1 },
      { path: 'lib/b.ts', insertions: 2, deletions: 3 },
    ]);
  });

  it('keeps tabs, spaces, arrows and non-ASCII characters in paths', () => {
    const [c] = parseLog(gitOutput(...header(H1, 'odd names'), '\n1\t0\ta\tb.txt', '1\t0\tx => y.md', '1\t0\tcafé.ts'));
    expect(c.files.map(f => f.path)).toEqual(['a\tb.txt', 'x => y.md', 'café.ts']);
  });

  it('handles commits with no numstat entries (merges, empty commits) between others', () => {
    const commits = parseLog(gitOutput(
      ...header(H1, 'merge'),
      ...header(H2, 'change'), '\n1\t1\ta.ts',
      ...header(H3, 'empty'),
    ));
    expect(commits.map(c => [c.hash, c.files.length])).toEqual([[H1, 0], [H2, 1], [H3, 0]]);
  });

  it('accepts an empty subject', () => {
    const [c] = parseLog(gitOutput(...header(H1, ''), '\n1\t0\ta.ts'));
    expect(c.subject).toBe('');
    expect(c.files).toHaveLength(1);
  });

  it('accepts SHA-256 object names', () => {
    const [c] = parseLog(gitOutput(...header('a'.repeat(64), 'sha256 repo')));
    expect(c.hash).toHaveLength(64);
  });

  it('fails loudly on output it does not understand', () => {
    expect(() => parseLog('COMMIT_DELIMITERabc|Alice|a@x|2024-01-18|old format\n')).toThrow(/Unexpected git log output/);
    expect(() => parseLog(gitOutput(H1, 'Alice', 'alice@example.com', 'not a date', 'x'))).toThrow(/Unexpected git log output/);
  });
});
