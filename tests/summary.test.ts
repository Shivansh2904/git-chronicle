import { describe, it, expect, afterEach } from 'vitest';
import chalk from 'chalk';
import { computeRepoSummary } from '../src/core/stats.js';
import { renderSummaryCard } from '../src/display/summary.js';
import { buildReport } from '../src/commands/report.js';
import type { CommitRecord } from '../src/types.js';

// Noon in the local time zone, because the busiest weekday is computed in local
// time. A fixed UTC time would land on the next day in UTC+12 and beyond.
const localNoon = (isoDay: string) => {
  const [year, month, day] = isoDay.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
};

const commitOn = (isoDay: string): CommitRecord => ({
  hash: isoDay,
  author: 'Alice',
  email: 'alice@example.com',
  date: localNoon(isoDay),
  subject: 'change',
  filesChanged: 0,
  insertions: 0,
  deletions: 0,
  files: [],
});

// 2024-01-18, 2024-01-25 and 2024-02-01 are Thursdays; 2024-01-15 is a Monday.
const THURSDAY_HEAVY = ['2024-01-15', '2024-01-18', '2024-01-25', '2024-02-01'].map(commitOn);

describe('most active weekday', () => {
  it('computeRepoSummary indexes weekdays from Monday = 0', () => {
    expect(computeRepoSummary(THURSDAY_HEAVY, '/tmp/repo').mostActiveDayOfWeek).toBe(3);
  });

  it('the summary card names the busiest weekday', () => {
    const card = renderSummaryCard(computeRepoSummary(THURSDAY_HEAVY, '/tmp/repo'));
    expect(card).toContain('Most active: Thursdays at');
  });

  it('the summary card and the report agree on the weekday', () => {
    const summary = computeRepoSummary(THURSDAY_HEAVY, '/tmp/repo');
    const card = renderSummaryCard(summary);
    const report = buildReport({ summary, authors: [], timeline: [], churn: [], generatedAt: new Date() });
    const cardDay = card.match(/Most active: (\w+)s at/)?.[1];
    const reportDay = report.match(/Most active day\/hour:\*\* (\w+) at/)?.[1];
    expect(cardDay).toBeDefined();
    expect(cardDay).toBe(reportDay);
  });

  it('a Sunday-only history is reported as Sunday', () => {
    const card = renderSummaryCard(computeRepoSummary([commitOn('2024-01-21')], '/tmp/repo'));
    expect(card).toContain('Most active: Sundays at');
  });
});

describe('summary card box', () => {
  const level = chalk.level;
  afterEach(() => { chalk.level = level; });
  const visible = (line: string) => line.replace(/\x1b\[[0-9;]*m/g, '');

  it.each([0, 1, 3])('keeps every line the same width at colour level %i', (colourLevel) => {
    chalk.level = colourLevel as typeof chalk.level;
    const card = renderSummaryCard(computeRepoSummary(THURSDAY_HEAVY, '/tmp/repo'));
    const widths = card.split('\n').map(l => [...visible(l)].length);
    expect(new Set(widths).size).toBe(1);
  });
});
