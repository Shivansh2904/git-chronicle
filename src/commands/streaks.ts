import ora from 'ora';
import chalk from 'chalk';
import { getLog, getRepoRoot } from '../core/git.js';
import { computeStreaks } from '../core/stats.js';

export async function runStreaks(opts: { since?: string; until?: string }) {
  const spinner = ora('Reading git history…').start();
  try {
    const root = await getRepoRoot();
    const commits = await getLog(root, opts.since, opts.until);
    spinner.succeed(`Loaded ${commits.length.toLocaleString()} commits`);

    const streaks = computeStreaks(commits);

    if (streaks.totalActiveDays === 0) {
      console.log(chalk.yellow('No commits found.'));
      return;
    }

    const fmt = (s: { length: number; from: string | null; to: string | null }) =>
      s.length === 0
        ? chalk.dim('none')
        : `${chalk.green(s.length)} day${s.length === 1 ? '' : 's'} ` +
          chalk.dim(`(${s.from} → ${s.to})`);

    console.log('\n' + chalk.bold.underline('Commit Streaks'));
    console.log(`  Longest streak:  ${fmt(streaks.longest)}`);
    console.log(`  Current streak:  ${fmt(streaks.current)}`);
    console.log(`  Active days:     ${chalk.green(streaks.totalActiveDays.toLocaleString())}`);
  } catch (err) {
    spinner.fail('Failed to compute streaks');
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}
