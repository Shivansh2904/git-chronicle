import chalk from 'chalk';
import type { RepoSummary } from '../types.js';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function fmt(d: Date) {
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function renderSummaryCard(s: RepoSummary): string {
  const name = s.path.split(/[/\\]/).pop() ?? s.path;
  const months = Math.max(1, Math.round((s.dateRange.to.getTime() - s.dateRange.from.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const W = 54;
  const border = chalk.cyan;
  const line = (text: string) => border('│') + text.padEnd(W) + border('│');
  return [
    border('┌' + '─'.repeat(W) + '┐'),
    line(chalk.bold(`  git-chronicle · ${name}`)),
    line(`  ${chalk.yellow(s.totalCommits.toLocaleString())} commits · ${chalk.yellow(String(s.authors))} authors · ${chalk.yellow(String(months))} months`),
    line(chalk.dim(`  ${fmt(s.dateRange.from)} → ${fmt(s.dateRange.to)}`)),
    ...(s.totalCommits > 0 ? [line(chalk.dim(`  Most active: ${DAYS[s.mostActiveDayOfWeek]}s at ${s.mostActiveHour}:00`))] : []),
    border('└' + '─'.repeat(W) + '┘'),
  ].join('\n');
}
