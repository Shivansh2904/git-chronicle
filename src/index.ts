#!/usr/bin/env node
import { program } from 'commander';
import { runAnalyze } from './commands/analyze.js';
import { runAuthors } from './commands/authors.js';
import { runHeatmap } from './commands/heatmap.js';

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

program.parseAsync(process.argv);
