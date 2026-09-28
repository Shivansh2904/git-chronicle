import { describe, it, expect } from 'vitest';
import { buildReport, type ReportInput } from '../src/commands/report.js';
import { computeRepoSummary } from '../src/core/stats.js';
import type { CommitRecord } from '../src/types.js';

const COMMITS: CommitRecord[] = [
  {
    hash: 'a1',
    author: 'Alice',
    email: 'alice@example.com',
    date: new Date('2024-01-15T10:00:00Z'),
    subject: 'first',
    filesChanged: 0,
    insertions: 0,
    deletions: 0,
    files: [],
  },
];

// The summary is built the way `report` builds it: from the repository's local path.
const input = (repoPath: string): ReportInput => ({
  summary: computeRepoSummary(COMMITS, repoPath),
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
