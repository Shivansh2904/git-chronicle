import { describe, it, expect } from 'vitest';
import { renderBarChart, renderSparkline } from '../src/display/chart.js';

// ---------------------------------------------------------------------------
// renderBarChart
// ---------------------------------------------------------------------------

describe('renderBarChart', () => {
  it('contains the title', () => {
    const output = renderBarChart([{ label: 'Jan', value: 10 }], 'Monthly');
    expect(output).toContain('Monthly');
  });

  it('renders one bar per data item', () => {
    const data = [{ label: 'a', value: 5 }, { label: 'b', value: 10 }];
    const output = renderBarChart(data, '');
    expect(output).toContain('a');
    expect(output).toContain('b');
  });

  it('handles empty data without throwing', () => {
    expect(() => renderBarChart([], 'Empty')).not.toThrow();
  });

  it('returns a non-empty string for valid data', () => {
    const output = renderBarChart([{ label: 'Jan', value: 42 }], 'Test');
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });

  it('includes the numeric value somewhere in the output', () => {
    const output = renderBarChart([{ label: 'Jan', value: 99 }], 'Title');
    expect(output).toContain('99');
  });

  it('renders multiple labels without throwing', () => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      label: `Month-${i + 1}`,
      value: (i + 1) * 10,
    }));
    expect(() => renderBarChart(data, 'Year Overview')).not.toThrow();
  });

  it('renders correctly when all values are zero', () => {
    const data = [{ label: 'A', value: 0 }, { label: 'B', value: 0 }];
    expect(() => renderBarChart(data, 'Zeroes')).not.toThrow();
  });

  it('handles a single item with a large value', () => {
    const output = renderBarChart([{ label: 'Dec', value: 100_000 }], 'Big');
    expect(output).toContain('Dec');
  });
});

// ---------------------------------------------------------------------------
// renderSparkline
// ---------------------------------------------------------------------------

describe('renderSparkline', () => {
  it('returns correct length', () => {
    const result = renderSparkline([1, 2, 3, 4, 5]);
    // Strip ANSI escape codes before measuring length
    const clean = result.replace(/\x1b\[[0-9;]*m/g, '');
    expect(clean).toHaveLength(5);
  });

  it('handles single value', () => {
    expect(() => renderSparkline([42])).not.toThrow();
  });

  it('handles all-zero values', () => {
    expect(() => renderSparkline([0, 0, 0])).not.toThrow();
  });

  it('returns a string', () => {
    const result = renderSparkline([10, 20, 30]);
    expect(typeof result).toBe('string');
  });

  it('length matches input length after stripping ANSI', () => {
    const values = [3, 1, 4, 1, 5, 9, 2, 6];
    const result = renderSparkline(values);
    const clean = result.replace(/\x1b\[[0-9;]*m/g, '');
    expect(clean).toHaveLength(values.length);
  });

  it('handles descending values without throwing', () => {
    expect(() => renderSparkline([100, 80, 60, 40, 20])).not.toThrow();
  });

  it('handles a two-element array', () => {
    const result = renderSparkline([1, 2]);
    const clean = result.replace(/\x1b\[[0-9;]*m/g, '');
    expect(clean).toHaveLength(2);
  });

  it('handles identical non-zero values', () => {
    expect(() => renderSparkline([5, 5, 5, 5])).not.toThrow();
  });
});
