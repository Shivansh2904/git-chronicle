import { simpleGit } from 'simple-git';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { getRepoRoot } from '../core/git.js';

interface CompareOptions {
  // any flags later
}

interface CompareCommit {
  hash: string;
  author: string;
  files: { path: string; ins: number; del: number }[];
}

export async function runCompare(
  baseRef: string | undefined,
  headRef: string | undefined,
  _opts: CompareOptions,
): Promise<void> {
  const base = baseRef ?? 'main';
  const head = headRef ?? 'HEAD';

  const spinner = ora(`Comparing ${chalk.cyan(base)}..${chalk.cyan(head)}`).start();

  try {
    const repoPath = await getRepoRoot();
    const git = simpleGit(repoPath);

    // Get commits in head that are not in base, with per-commit numstat.
    // simple-git's typed log result doesn't expose numstat, so parse from raw output.
    const raw = await git.raw([
      'log',
      `${base}..${head}`,
      '--pretty=format:__COMMIT__%H%n%an',
      '--numstat',
    ]);

    spinner.stop();

    const commits: CompareCommit[] = [];
    let current: CompareCommit | null = null;
    let expectAuthor = false;

    for (const rawLine of raw.split('\n')) {
      const line = rawLine.trimEnd();
      if (line.startsWith('__COMMIT__')) {
        if (current) commits.push(current);
        current = { hash: line.replace('__COMMIT__', '').trim(), author: '', files: [] };
        expectAuthor = true;
        continue;
      }
      if (!current) continue;

      if (expectAuthor) {
        current.author = line.trim();
        expectAuthor = false;
        continue;
      }

      const trimmed = line.trim();
      if (!trimmed) continue;

      const m = trimmed.match(/^(\d+|-)\s+(\d+|-)\s+(.+)$/);
      if (m) {
        const ins = m[1] === '-' ? 0 : parseInt(m[1], 10);
        const del = m[2] === '-' ? 0 : parseInt(m[2], 10);
        // Clean rename notation like "{old => new}/file" or "old => new"
        const cleanPath = m[3]
          .replace(/\{.*? => (.*?)\}/, '$1')
          .replace(/ => .*$/, '');
        current.files.push({ path: cleanPath, ins, del });
      }
    }
    if (current) commits.push(current);

    if (commits.length === 0) {
      console.log(chalk.yellow(`No commits between ${base} and ${head}.`));
      return;
    }

    // Aggregate
    const totalCommits = commits.length;
    const authors = new Map<string, number>();
    const fileMap = new Map<string, { ins: number; del: number; changes: number }>();
    let totalIns = 0;
    let totalDel = 0;

    for (const c of commits) {
      authors.set(c.author, (authors.get(c.author) ?? 0) + 1);
      for (const f of c.files) {
        const cur = fileMap.get(f.path) ?? { ins: 0, del: 0, changes: 0 };
        cur.ins += f.ins;
        cur.del += f.del;
        cur.changes += 1;
        fileMap.set(f.path, cur);
        totalIns += f.ins;
        totalDel += f.del;
      }
    }

    // Render summary
    console.log('');
    console.log(chalk.bold(`Comparing ${chalk.cyan(base)} → ${chalk.cyan(head)}`));
    console.log(
      `  ${chalk.green(totalCommits)} commits · ${chalk.green(authors.size)} authors · ${chalk.green(fileMap.size)} files`,
    );
    console.log(
      `  ${chalk.green('+' + totalIns.toLocaleString())} insertions · ${chalk.red('-' + totalDel.toLocaleString())} deletions`,
    );
    console.log('');

    // Top authors
    const sortedAuthors = [...authors.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const authorTable = new Table({
      head: ['Author', 'Commits'].map(h => chalk.cyan(h)),
      style: { border: ['dim'] },
    });
    for (const [name, count] of sortedAuthors) {
      authorTable.push([chalk.bold(name), chalk.yellow(count.toString())]);
    }
    console.log(chalk.bold.underline('Top Authors'));
    console.log(authorTable.toString());

    // Top files (by churn count, top 10)
    const sortedFiles = [...fileMap.entries()]
      .sort((a, b) => b[1].changes - a[1].changes)
      .slice(0, 10);
    const fileTable = new Table({
      head: ['File', 'Changes', '+Lines', '-Lines'].map(h => chalk.cyan(h)),
      style: { border: ['dim'] },
      colWidths: [48, 10, 12, 12],
    });
    for (const [path, stats] of sortedFiles) {
      const short = path.length > 45 ? '…' + path.slice(-44) : path;
      fileTable.push([
        chalk.dim(short),
        chalk.yellow(stats.changes.toString()),
        chalk.green(`+${stats.ins.toLocaleString()}`),
        chalk.red(`-${stats.del.toLocaleString()}`),
      ]);
    }
    console.log('');
    console.log(chalk.bold.underline('Top Files'));
    console.log(fileTable.toString());
  } catch (err) {
    spinner.fail((err as Error).message);
    process.exitCode = 1;
  }
}
