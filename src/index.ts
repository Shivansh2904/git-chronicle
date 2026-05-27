#!/usr/bin/env node
import { program } from 'commander';
import { runAnalyze } from './commands/analyze.js';
import { runAuthors } from './commands/authors.js';
import { runHeatmap } from './commands/heatmap.js';
import { runFiles } from './commands/files.js';
import { runReport } from './commands/report.js';
import { runCompare } from './commands/compare.js';

program
  .name('git-chronicle')
  .description('Rich git repository analytics in your terminal')
  .version('1.0.0');

program
  .command('analyze', { isDefault: true })
  .alias('a')
  .description('Full repository analysis (default)')
  .option('-n, --top <n>', 'number of top items to show', '10')
  .option('--since <date>', 'only commits since date (YYYY-MM-DD)')
  .option('--until <date>', 'only commits until date (YYYY-MM-DD)')
  .option('--json', 'output full analysis as JSON to stdout')
  .action(runAnalyze);

program
  .command('authors')
  .alias('au')
  .description('Author contribution breakdown')
  .option('--sort <field>', 'sort by: commits | insertions | deletions', 'commits')
  .action(runAuthors);

program
  .command('heatmap')
  .alias('h')
  .description('Commit activity heatmap by day and hour')
  .action(runHeatmap);

program
  .command('files')
  .alias('f')
  .description('Show top churned files')
  .option('-n, --top <n>', 'number of files to show', '10')
  .action(runFiles);

program
  .command('report')
  .alias('r')
  .description('Export a comprehensive Markdown report')
  .option('--since <date>', 'only commits since date (YYYY-MM-DD)')
  .option('--until <date>', 'only commits until date (YYYY-MM-DD)')
  .option('-n, --top <n>', 'top N items in ranked sections', '15')
  .option('-o, --output <path>', 'output file path', 'git-chronicle-report.md')
  .action(runReport);

program
  .command('compare [base] [head]')
  .alias('cmp')
  .description('Compare two git refs (default: main..HEAD)')
  .action((base, head) => runCompare(base, head, {}));

program.parseAsync(process.argv);
