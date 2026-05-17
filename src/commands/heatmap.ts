import ora from 'ora';
import chalk from 'chalk';
import { getLog, getRepoRoot } from '../core/git.js';
import { computeHeatmap, computeRepoSummary } from '../core/stats.js';
import { renderSummaryCard } from '../display/summary.js';
import { renderHeatmap } from '../display/chart.js';

export async function runHeatmap() {
  const spinner = ora('Building heatmap…').start();
  try {
    const root = await getRepoRoot();
    const commits = await getLog(root);
    spinner.succeed(`Processed ${commits.length.toLocaleString()} commits`);
    const summary = computeRepoSummary(commits, root);
    const heatmap = computeHeatmap(commits);
    console.log('\n' + renderSummaryCard(summary));
    console.log('\n' + chalk.bold.underline('Commit Activity Heatmap (day × hour)'));
    console.log(chalk.dim('  Legend: ░ low  ▒▓ medium  █ high\n'));
    console.log(renderHeatmap(heatmap.grid, heatmap.max));
  } catch (err) {
    spinner.fail('Failed');
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}
