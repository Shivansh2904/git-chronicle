import ora from 'ora';
import chalk from 'chalk';
import { getLog, getRepoRoot } from '../core/git.js';
import { computeAuthorStats, computeRepoSummary } from '../core/stats.js';
import { renderSummaryCard } from '../display/summary.js';
import { renderAuthorsTable } from '../display/table.js';

export async function runAuthors(opts: { sort: string }) {
  const spinner = ora('Loading author data…').start();
  try {
    const root = await getRepoRoot();
    const commits = await getLog(root);
    spinner.succeed(`Analysed ${commits.length.toLocaleString()} commits`);
    const summary = computeRepoSummary(commits, root);
    let authors = computeAuthorStats(commits);
    const field = ['commits', 'insertions', 'deletions'].includes(opts.sort)
      ? opts.sort as 'commits' | 'insertions' | 'deletions' : 'commits';
    authors = [...authors].sort((a, b) => b[field] - a[field]);
    console.log('\n' + renderSummaryCard(summary));
    console.log('\n' + chalk.bold.underline('Author Contributions'));
    console.log(renderAuthorsTable(authors));
  } catch (err) {
    spinner.fail('Failed');
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}
