import { describe, it, expect } from 'vitest';
import { buildReport, type ReportInput } from '../src/commands/report.js';
import type { RepoSummary } from '../src/types.js';

const summaryAt = (path: string): RepoSummary => ({
  path,
  totalCommits: 3,
  authors: 1,
  dateRange: { from: new Date('2024-01-15T10:00:00Z'), to: new Date('2024-02-10T14:00:00Z') },
  mostActiveHour: 14,
  mostActiveDayOfWeek: 0,
  topLanguages: [],
});

const input = (path: string): ReportInput => ({
  summary: summaryAt(path),
  authors: [],
  timeline: [],
  churn: [],
  generatedAt: new Date('2024-03-01T00:00:00Z'),
});

describe('buildReport', () => {
  it('links to the project repository', () => {
    const md = buildReport(input('/tmp/myrepo'));
    expect(md).toContain('[git-chronicle](https://github.com/Shivansh2904/git-chronicle)');
  });

  it('names the repository without its local path (POSIX)', () => {
    const md = buildReport(input('/home/alice/clients/acme/myrepo'));
    expect(md).toContain('# myrepo — Repository Report');
    expect(md).toContain('- **Repository:** myrepo');
    expect(md).not.toContain('/home/alice');
    expect(md).not.toContain('acme');
  });

  it('names the repository without its local path (Windows)', () => {
    const md = buildReport(input('C:\\Users\\alice\\code\\myrepo'));
    expect(md).toContain('- **Repository:** myrepo');
    expect(md).not.toContain('Users');
    expect(md).not.toContain('alice');
  });

  it('stamps the generation date that was passed in', () => {
    const md = buildReport(input('/tmp/myrepo'));
    expect(md).toContain('on 2024-03-01.');
  });
});
