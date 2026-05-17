import ora from 'ora';
import chalk from 'chalk';
import { getLog, getRepoRoot } from '../core/git.js';
import { getTopChurnFiles } from '../core/stats.js';
import { renderChurnTable } from '../display/table.js';

export async function runFiles(opts: { top: string }) {
  const n = parseInt(opts.top, 10) || 10;
  const spinner = ora('Reading git history…').start();
  try {
    const root = await getRepoRoot();
    const commits = await getLog(root);
    spinner.succeed(`Loaded ${commits.length.toLocaleString()} commits`);

    const churn = getTopChurnFiles(commits, n);

    if (churn.length === 0) {
      console.log(chalk.yellow('No file churn data found.'));
      return;
    }

    console.log('\n' + chalk.bold.underline(`Top ${n} Churned Files`));
    console.log(renderChurnTable(churn));
  } catch (err) {
    spinner.fail('Failed to load file churn');
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}
