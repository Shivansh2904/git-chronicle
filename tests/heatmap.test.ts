import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import chalk from 'chalk';
import { renderHeatmap } from '../src/display/chart.js';

// One commit at the given day (Mon = 0) and hour, nothing else.
function gridWith(day: number, hour: number): number[][] {
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0));
  grid[day][hour] = 1;
  return grid;
}

describe('renderHeatmap', () => {
  let level: typeof chalk.level;
  beforeEach(() => { level = chalk.level; chalk.level = 0; });
  afterEach(() => { chalk.level = level; });

  it.each([0, 6, 12, 18])('puts the %i:00 label over its column', (hour) => {
    const [header, monday] = renderHeatmap(gridWith(0, hour), 1).split('\n');
    const cellColumn = monday.indexOf('█');
    expect(cellColumn).toBeGreaterThan(0);
    expect(header.indexOf(` ${hour}`) + 1).toBe(cellColumn);
  });

  it('draws one character per hour on every row', () => {
    const lines = renderHeatmap(gridWith(3, 23), 1).split('\n');
    const rows = lines.slice(1);
    expect(rows).toHaveLength(7);
    for (const row of rows) expect(row.length).toBe(rows[0].length);
    expect(lines[0].length).toBeLessThanOrEqual(rows[0].length);
  });
});
