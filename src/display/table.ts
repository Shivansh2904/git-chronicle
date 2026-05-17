import Table from 'cli-table3';
import chalk from 'chalk';
import type { AuthorStats, FileChurn } from '../types.js';

export function renderAuthorsTable(authors: AuthorStats[]): string {
  const t = new Table({
    head: ['#', 'Author', 'Commits', '+Lines', '-Lines', 'Net', 'Days'].map(h => chalk.cyan(h)),
    style: { border: ['dim'] },
  });
  authors.forEach((a, i) => {
    const net = a.insertions - a.deletions;
    t.push([
      chalk.dim(String(i + 1)),
      chalk.bold(a.name),
      chalk.yellow(a.commits.toLocaleString()),
      chalk.green(`+${a.insertions.toLocaleString()}`),
      chalk.red(`-${a.deletions.toLocaleString()}`),
      net >= 0 ? chalk.green(`+${net.toLocaleString()}`) : chalk.red(net.toLocaleString()),
      String(a.activeDays),
    ]);
  });
  return t.toString();
}

export function renderChurnTable(files: FileChurn[]): string {
  const t = new Table({
    head: ['File', 'Times Changed', '+Lines', '-Lines'].map(h => chalk.cyan(h)),
    style: { border: ['dim'] },
    colWidths: [48, 15, 10, 10],
  });
  for (const f of files) {
    const short = f.path.length > 45 ? '…' + f.path.slice(-44) : f.path;
    t.push([chalk.dim(short), chalk.yellow(f.changes.toLocaleString()), chalk.green(`+${f.insertions}`), chalk.red(`-${f.deletions}`)]);
  }
  return t.toString();
}
