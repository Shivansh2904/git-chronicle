import { describe, it, expect } from 'vitest';
import { computeAuthorStats, computeHeatmap, computeTimeline, getTopChurnFiles } from '../src/core/stats.js';
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
  filenames: [],
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
    filenames: ['src/index.ts', 'src/utils.ts'],
  }),
  makeCommit({
    hash: '2',
    author: 'Alice',
    email: 'alice@example.com',
    insertions: 50,
    deletions: 5,
    date: new Date('2024-02-10T14:00:00Z'),
    filenames: ['src/index.ts'],
  }),
  makeCommit({
    hash: '3',
    author: 'Bob',
    email: 'bob@example.com',
    insertions: 200,
    deletions: 80,
    date: new Date('2024-01-20T09:00:00Z'),
    filenames: ['src/index.ts', 'README.md', 'docs/api.md'],
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

  it('handles n larger than available files gracefully', () => {
    const result = getTopChurnFiles(COMMITS, 1000);
    // Just checks it doesn't throw and returns an array
    expect(Array.isArray(result)).toBe(true);
  });
});
