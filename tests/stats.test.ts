import { describe, it, expect } from 'vitest';
import { computeAuthorStats, computeHeatmap, computeTimeline, getTopChurnFiles, computeStreaks, computeRepoSummary } from '../src/core/stats.js';
import type { CommitRecord } from '../src/types.js';

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

const makeCommit = (overrides: Partial<CommitRecord> = {}): CommitRecord => ({
  hash: 'abc123',
  author: 'Alice',
  email: 'alice@example.com',
  date: new Date('2024-01-15T10:30:00Z'),
  subject: 'feat: add feature',
  filesChanged: 2,
  insertions: 10,
  deletions: 3,
  files: [],
  ...overrides,
});

const COMMITS: CommitRecord[] = [
  makeCommit({
    hash: '1',
    author: 'Alice',
    email: 'alice@example.com',
    insertions: 100,
    deletions: 20,
    date: new Date('2024-01-15T10:00:00Z'),
    files: [
      { path: 'src/index.ts', insertions: 60, deletions: 15 },
      { path: 'src/utils.ts', insertions: 40, deletions: 5 },
    ],
  }),
  makeCommit({
    hash: '2',
    author: 'Alice',
    email: 'alice@example.com',
    insertions: 50,
    deletions: 5,
    date: new Date('2024-02-10T14:00:00Z'),
    files: [{ path: 'src/index.ts', insertions: 50, deletions: 5 }],
  }),
  makeCommit({
    hash: '3',
    author: 'Bob',
    email: 'bob@example.com',
    insertions: 200,
    deletions: 80,
    date: new Date('2024-01-20T09:00:00Z'),
    files: [
      { path: 'src/index.ts', insertions: 120, deletions: 50 },
      { path: 'README.md', insertions: 50, deletions: 20 },
      { path: 'docs/api.md', insertions: 30, deletions: 10 },
    ],
  }),
];

// ---------------------------------------------------------------------------
// computeAuthorStats
// ---------------------------------------------------------------------------

describe('computeAuthorStats', () => {
  it('returns one entry per unique email', () => {
    const stats = computeAuthorStats(COMMITS);
    expect(stats).toHaveLength(2);
  });

  it('sums insertions and deletions correctly', () => {
    const stats = computeAuthorStats(COMMITS);
    const alice = stats.find(a => a.email === 'alice@example.com')!;
    expect(alice.insertions).toBe(150);
    expect(alice.deletions).toBe(25);
    expect(alice.commits).toBe(2);
  });

  it('sums Bob insertions and deletions correctly', () => {
    const stats = computeAuthorStats(COMMITS);
    const bob = stats.find(a => a.email === 'bob@example.com')!;
    expect(bob.insertions).toBe(200);
    expect(bob.deletions).toBe(80);
    expect(bob.commits).toBe(1);
  });

  it('returns empty array for empty input', () => {
    expect(computeAuthorStats([])).toEqual([]);
  });

  it('sorts by commits descending', () => {
    const stats = computeAuthorStats(COMMITS);
    expect(stats[0].commits).toBeGreaterThanOrEqual(stats[1].commits);
  });

  it('records firstCommit and lastCommit per author', () => {
    const stats = computeAuthorStats(COMMITS);
    const alice = stats.find(a => a.email === 'alice@example.com')!;
    expect(alice.firstCommit.toISOString()).toBe(new Date('2024-01-15T10:00:00Z').toISOString());
    expect(alice.lastCommit.toISOString()).toBe(new Date('2024-02-10T14:00:00Z').toISOString());
  });

  it('counts activeDays as unique calendar days', () => {
    const stats = computeAuthorStats(COMMITS);
    const alice = stats.find(a => a.email === 'alice@example.com')!;
    // Alice committed on 2024-01-15 and 2024-02-10 — 2 unique days
    expect(alice.activeDays).toBe(2);
  });

  it('handles a single commit', () => {
    const stats = computeAuthorStats([makeCommit()]);
    expect(stats).toHaveLength(1);
    expect(stats[0].commits).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// computeHeatmap
// ---------------------------------------------------------------------------

describe('computeHeatmap', () => {
  it('returns a 7x24 grid', () => {
    const { grid } = computeHeatmap(COMMITS);
    expect(grid).toHaveLength(7);
    grid.forEach(row => expect(row).toHaveLength(24));
  });

  it('max >= all grid values', () => {
    const { grid, max } = computeHeatmap(COMMITS);
    for (const row of grid) {
      for (const val of row) {
        expect(val).toBeLessThanOrEqual(max);
      }
    }
  });

  it('returns max=0 for empty commits', () => {
    expect(computeHeatmap([]).max).toBe(0);
  });

  it('returns an all-zero grid for empty commits', () => {
    const { grid } = computeHeatmap([]);
    for (const row of grid) {
      for (const val of row) {
        expect(val).toBe(0);
      }
    }
  });

  it('total count in grid equals number of commits', () => {
    const { grid } = computeHeatmap(COMMITS);
    const total = grid.flat().reduce((s, v) => s + v, 0);
    expect(total).toBe(COMMITS.length);
  });

  it('max is a positive integer for non-empty commits', () => {
    const { max } = computeHeatmap(COMMITS);
    expect(max).toBeGreaterThan(0);
    expect(Number.isInteger(max)).toBe(true);
  });

  it('handles a single commit correctly', () => {
    const single = [makeCommit({ date: new Date('2024-01-15T10:00:00Z') })];
    const { max } = computeHeatmap(single);
    expect(max).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// computeTimeline
// ---------------------------------------------------------------------------

describe('computeTimeline', () => {
  it('groups commits by month', () => {
    const timeline = computeTimeline(COMMITS);
    const months = timeline.map(t => t.month);
    expect(months).toContain('2024-01');
    expect(months).toContain('2024-02');
  });

  it('counts correctly for January', () => {
    const timeline = computeTimeline(COMMITS);
    const jan = timeline.find(t => t.month === '2024-01')!;
    expect(jan.count).toBe(2);
  });

  it('counts correctly for February', () => {
    const timeline = computeTimeline(COMMITS);
    const feb = timeline.find(t => t.month === '2024-02')!;
    expect(feb.count).toBe(1);
  });

  it('returns empty for no commits', () => {
    expect(computeTimeline([])).toEqual([]);
  });

  it('returns entries in chronological order', () => {
    const timeline = computeTimeline(COMMITS);
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].month >= timeline[i - 1].month).toBe(true);
    }
  });

  it('produces exactly as many entries as distinct months', () => {
    const timeline = computeTimeline(COMMITS);
    const uniqueMonths = new Set(COMMITS.map(c => c.date.toISOString().slice(0, 7)));
    expect(timeline).toHaveLength(uniqueMonths.size);
  });
});

// ---------------------------------------------------------------------------
// getTopChurnFiles
// ---------------------------------------------------------------------------

describe('getTopChurnFiles', () => {
  it('returns at most N files', () => {
    const result = getTopChurnFiles(COMMITS, 1);
    expect(result.length).toBeLessThanOrEqual(1);
  });

  it('ranks src/index.ts first (appears in all commits)', () => {
    const result = getTopChurnFiles(COMMITS, 5);
    expect(result[0].path).toBe('src/index.ts');
  });

  it('returns empty array for empty commits', () => {
    expect(getTopChurnFiles([], 10)).toEqual([]);
  });

  it('returns correct change count for top file', () => {
    const result = getTopChurnFiles(COMMITS, 5);
    // src/index.ts appears in hashes 1, 2, 3 → 3 changes
    expect(result[0].changes).toBe(3);
  });

  it('sums the insertions and deletions of each file', () => {
    const result = getTopChurnFiles(COMMITS, 5);
    expect(result.find(f => f.path === 'src/index.ts')).toEqual({ path: 'src/index.ts', changes: 3, insertions: 230, deletions: 70 });
    expect(result.find(f => f.path === 'src/utils.ts')).toEqual({ path: 'src/utils.ts', changes: 1, insertions: 40, deletions: 5 });
  });

  it('handles n larger than available files gracefully', () => {
    const result = getTopChurnFiles(COMMITS, 1000);
    // Just checks it doesn't throw and returns an array
    expect(Array.isArray(result)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// computeStreaks
// ---------------------------------------------------------------------------

describe('computeStreaks', () => {
  const onDay = (day: string) =>
    makeCommit({ date: new Date(`${day}T12:00:00Z`) });

  it('returns zeros for an empty repo', () => {
    const s = computeStreaks([]);
    expect(s.longest.length).toBe(0);
    expect(s.current.length).toBe(0);
    expect(s.totalActiveDays).toBe(0);
    expect(s.longest.from).toBeNull();
  });

  it('counts a single commit day as a streak of 1', () => {
    const s = computeStreaks([onDay('2024-03-01')]);
    expect(s.longest.length).toBe(1);
    expect(s.current.length).toBe(1);
    expect(s.totalActiveDays).toBe(1);
    expect(s.longest.from).toBe('2024-03-01');
    expect(s.longest.to).toBe('2024-03-01');
  });

  it('finds the longest run of consecutive days', () => {
    // 3-day run, gap, 2-day run
    const s = computeStreaks([
      onDay('2024-03-01'),
      onDay('2024-03-02'),
      onDay('2024-03-03'),
      onDay('2024-03-10'),
      onDay('2024-03-11'),
    ]);
    expect(s.longest.length).toBe(3);
    expect(s.longest.from).toBe('2024-03-01');
    expect(s.longest.to).toBe('2024-03-03');
    expect(s.totalActiveDays).toBe(5);
  });

  it('collapses multiple commits on the same day', () => {
    const s = computeStreaks([
      onDay('2024-03-01'),
      onDay('2024-03-01'),
      onDay('2024-03-02'),
    ]);
    expect(s.longest.length).toBe(2);
    expect(s.totalActiveDays).toBe(2);
  });

  it('computes the current (trailing) streak independent of the longest', () => {
    const s = computeStreaks([
      onDay('2024-03-01'),
      onDay('2024-03-02'),
      onDay('2024-03-03'), // longest = 3
      onDay('2024-03-20'),
      onDay('2024-03-21'), // current = 2
    ]);
    expect(s.longest.length).toBe(3);
    expect(s.current.length).toBe(2);
    expect(s.current.from).toBe('2024-03-20');
    expect(s.current.to).toBe('2024-03-21');
  });

  it('is order-independent (unsorted input still works)', () => {
    const s = computeStreaks([
      onDay('2024-03-03'),
      onDay('2024-03-01'),
      onDay('2024-03-02'),
    ]);
    expect(s.longest.length).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// computeRepoSummary
// ---------------------------------------------------------------------------

describe('computeRepoSummary', () => {
  it('finds the first and last commit dates in unsorted input', () => {
    const s = computeRepoSummary(COMMITS, '/tmp/repo');
    expect(s.dateRange.from.toISOString()).toBe('2024-01-15T10:00:00.000Z');
    expect(s.dateRange.to.toISOString()).toBe('2024-02-10T14:00:00.000Z');
  });

  it('gives each language one row, whichever extensions it uses', () => {
    const file = (path: string) => ({ path, insertions: 1, deletions: 0 });
    const s = computeRepoSummary([
      makeCommit({ files: [file('ci.yml'), file('compose.yaml'), file('a.js'), file('b.mjs')] }),
      makeCommit({ files: [file('deploy.yml'), file('c.ts')] }),
    ], '/tmp/repo');
    expect(s.topLanguages.map(l => [l.language, l.fileChanges])).toEqual([
      ['YAML', 3],
      ['JavaScript', 2],
      ['TypeScript', 1],
    ]);
  });

  it('handles histories too long to spread into Math.min', () => {
    // A million arguments overflows the stack whether the suite runs on the
    // main thread or in a worker, which has a larger stack. One shared commit
    // object keeps the array light.
    const first = makeCommit({ hash: 'first', date: new Date('2020-01-01T00:00:00Z') });
    const middle = makeCommit({ hash: 'middle', date: new Date('2022-03-15T12:00:00Z') });
    const last = makeCommit({ hash: 'last', date: new Date('2024-06-30T00:00:00Z') });
    const many = [middle, last].concat(new Array(999_997).fill(middle), [first]);
    const s = computeRepoSummary(many, '/tmp/repo');
    expect(s.totalCommits).toBe(1_000_000);
    expect(s.dateRange.from.toISOString()).toBe('2020-01-01T00:00:00.000Z');
    expect(s.dateRange.to.toISOString()).toBe('2024-06-30T00:00:00.000Z');
  });
});
