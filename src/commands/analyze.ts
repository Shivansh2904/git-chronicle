import ora from 'ora';
import chalk from 'chalk';
import { getLog, getRepoRoot } from '../core/git.js';
import { computeAuthorStats, computeHeatmap, computeTimeline, computeRepoSummary, getTopChurnFiles } from '../core/stats.js';
import { renderSummaryCard } from '../display/summary.js';
import { renderBarChart, renderHeatmap } from '../display/chart.js';
import { renderAuthorsTable, renderChurnTable } from '../display/table.js';

export async function runAnalyze(opts: { top: string; since?: string }) {
  const n = parseInt(opts.top, 10) || 10;
  const spinner = ora('Reading git history…').start();
  try {
    const root = await getRepoRoot();
    const commits = await getLog(root, opts.since);
    spinner.succeed(`Loaded ${commits.length.toLocaleString()} commits`);

    const summary = computeRepoSummary(commits, root);
    const authors = computeAuthorStats(commits);
    const timeline = computeTimeline(commits);
    const heatmap = computeHeatmap(commits);
    const churn = getTopChurnFiles(commits, n);

    console.log('\n' + renderSummaryCard(summary));

    if (timeline.length > 0) {
      console.log('\n' + renderBarChart(timeline.map(t => ({ label: t.month, value: t.count })), chalk.bold.underline('Commit Timeline')));
    }

    console.log('\n' + chalk.bold.underline('Top Authors'));
    console.log(renderAuthorsTable(authors.slice(0, n)));

    if (churn.length > 0) {
      console.log('\n' + chalk.bold.underline(`File Churn (top ${n})`));
      console.log(renderChurnTable(churn));
    }

    console.log('\n' + chalk.bold.underline('Activity Heatmap'));
    console.log(chalk.dim('  Legend: ░ low  ▒▓ medium  █ high\n'));
    console.log(renderHeatmap(heatmap.grid, heatmap.max));

    if (summary.topLanguages.length > 0) {
      console.log('\n' + renderBarChart(
        summary.topLanguages.map(l => ({ label: l.ext, value: l.lines })),
        chalk.bold.underline('Languages (by file changes)')
      ));
    }
  } catch (err) {
    spinner.fail('Analysis failed');
    console.error(chalk.red((err as Error).message));
    process.exit(1);
  }
}
