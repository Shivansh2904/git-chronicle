import chalk from 'chalk';

const SPARK = '▁▂▃▄▅▆▇█';
const BLOCKS = ['░', '▒', '▓', '█'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function renderBarChart(
  data: { label: string; value: number }[],
  title: string,
  width = 40
): string {
  if (data.length === 0) return title ? chalk.bold(title) + '\n  (no data)' : '(no data)';
  const max = Math.max(...data.map(d => d.value), 1);
  const maxLabelLen = Math.max(...data.map(d => d.label.length), 0);
  const lines: string[] = [];
  if (title) lines.push(chalk.bold(title), '');
  for (const { label, value } of data) {
    const barLen = Math.round((value / max) * width);
    const bar = chalk.cyan('█'.repeat(Math.max(barLen, value > 0 ? 1 : 0)));
    const pad = ' '.repeat(maxLabelLen - label.length);
    lines.push(`  ${chalk.dim(label)}${pad}  ${bar} ${chalk.yellow(String(value))}`);
  }
  return lines.join('\n');
}

export function renderHeatmap(grid: number[][], max: number): string {
  if (max === 0) return chalk.dim('  No commit data to display.');
  const lines: string[] = [];
  const header = '      ' + Array.from({ length: 24 }, (_, h) =>
    h % 3 === 0 ? String(h).padStart(2, ' ') : '  '
  ).join('');
  lines.push(chalk.dim(header));
  for (let d = 0; d < 7; d++) {
    const cells = Array.from({ length: 24 }, (_, h) => {
      const val = grid[d]?.[h] ?? 0;
      if (val === 0) return chalk.dim('░');
      const level = Math.min(3, Math.ceil((val / max) * 4) - 1);
      return level < 2 ? chalk.green(BLOCKS[level]) : chalk.red(BLOCKS[level]);
    }).join('');
    lines.push(`  ${chalk.bold(DAYS[d])}  ${cells}`);
  }
  return lines.join('\n');
}

export function renderSparkline(values: number[]): string {
  const max = Math.max(...values, 1);
  return values.map(v => SPARK[Math.min(7, Math.round((v / max) * 7))]).join('');
}
