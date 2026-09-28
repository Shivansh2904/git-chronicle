import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import chalk from 'chalk';
import { renderAuthorsTable, renderChurnTable } from '../src/display/table.js';

const ESC = '\x1b';

const authors = [{
  name: 'Alice', email: 'a@example.com', commits: 3, insertions: 10, deletions: 4,
  firstCommit: new Date('2024-01-01T00:00:00Z'), lastCommit: new Date('2024-01-02T00:00:00Z'), activeDays: 2,
}];
const churn = [{ path: 'src/a.ts', changes: 2, insertions: 5, deletions: 1 }];

// Tables must follow chalk's colour decision (NO_COLOR, piping, FORCE_COLOR)
// instead of cli-table3's own colouring, which ignores all of those.
describe('table colour', () => {
  let level: typeof chalk.level;
  beforeEach(() => { level = chalk.level; });
  afterEach(() => { chalk.level = level; });

  it('authors table has no escape codes when colour is off', () => {
    chalk.level = 0;
    expect(renderAuthorsTable(authors)).not.toContain(ESC);
  });

  it('churn table has no escape codes when colour is off', () => {
    chalk.level = 0;
    expect(renderChurnTable(churn)).not.toContain(ESC);
  });

  it('keeps chalk colours when colour is on', () => {
    chalk.level = 1;
    expect(renderChurnTable(churn)).toContain(`${ESC}[36mFile`);
  });
});
