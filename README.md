# git-chronicle

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/shivansh-mishra/git-chronicle/actions/workflows/ci.yml/badge.svg)](https://github.com/shivansh-mishra/git-chronicle/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/git-chronicle?color=cb3837&logo=npm)](https://www.npmjs.com/package/git-chronicle)

> Rich git repository analytics in your terminal — commit heatmaps, author breakdowns, language stats, file churn

---

## Install

```bash
npx git-chronicle         # run instantly without installing
npm install -g git-chronicle  # or install globally
```

---

## Usage

Run from the root of any git repository:

```bash
git-chronicle                            # full analysis (default)
git-chronicle analyze -n 15              # show top 15 items per section
git-chronicle authors --sort insertions
git-chronicle heatmap
git-chronicle --since 2024-01-01         # recent history only
git-chronicle --since 2023-01-01 --until 2024-01-01  # date range
git-chronicle --json > stats.json        # export full analysis as JSON
git-chronicle files                      # top churned files
git-chronicle files -n 20               # show top 20 churned files
git-chronicle report                     # export Markdown report to git-chronicle-report.md
git-chronicle report -o REPORT.md -n 25  # custom output path and top-N depth
git-chronicle report --since 2024-01-01  # report for a date range
git-chronicle compare main feature/x        # what's new in feature/x since main
git-chronicle compare v1.0.0 v1.1.0         # changes between two tags
git-chronicle compare                       # default: main..HEAD
```

### Options

| Flag | Description |
|------|-------------|
| `--since <date>` | Limit analysis to commits after this ISO date |
| `--until <date>` | Limit analysis to commits before this ISO date |
| `-n, --top <number>` | Number of items to display in ranked lists (default: 10) |
| `--sort <field>` | Sort authors by `commits`, `insertions`, or `deletions` |
| `--json` | Output full analysis as JSON to stdout (pipe-friendly) |
| `-o, --output <path>` | Output file path for the `report` command (default: `git-chronicle-report.md`) |

---

## Demo

```
┌────────────────────────────────────────────────────┐
│  git-chronicle · react                             │
│  16,380 commits · 5 authors · 48 months            │
│  Apr 2019 → Mar 2023                               │
│  Most active: Wednesdays at 14:00                  │
└────────────────────────────────────────────────────┘

Commit Timeline
  2019-04  ████████████████████ 42
  2019-05  ████████████ 28
  2019-06  ██████████████████████████ 61
  2019-07  ████████████████ 37
  2019-08  ██████████████████████ 52
  2019-09  ██████████ 24
  2019-10  ███████████████████████████████ 71
  2019-11  ████████████████████ 44
  ...

Top Authors
┌─────┬───────────────────┬─────────┬────────────┬───────────┬──────────┬──────────────┐
│  #  │ Author            │ Commits │ Insertions │ Deletions │ Net      │ Active Days  │
├─────┼───────────────────┼─────────┼────────────┼───────────┼──────────┼──────────────┤
│  1  │ gaearon           │ 4,812   │ +312,401   │ -89,204   │ +223,197 │ 891          │
│  2  │ sebmarkbage       │ 3,201   │ +198,230   │ -71,003   │ +127,227 │ 712          │
│  3  │ acdlite           │ 1,890   │ +87,441    │ -34,120   │ +53,321  │ 430          │
│  4  │ trueadm           │ 1,204   │ +63,002    │ -28,441   │ +34,561  │ 298          │
│  5  │ josephsavona      │ 876     │ +41,230    │ -18,002   │ +23,228  │ 201          │
└─────┴───────────────────┴─────────┴────────────┴───────────┴──────────┴──────────────┘

Language Breakdown
  TypeScript   ████████████████████████████████ 62.4%   (28,431 lines)
  JavaScript   ████████ 15.1%                           ( 6,872 lines)
  CSS          █████ 9.8%                               ( 4,461 lines)
  Python       ███ 6.3%                                 ( 2,870 lines)
  Markdown     ██ 4.0%                                  ( 1,823 lines)
  Other        █ 2.4%                                   ( 1,091 lines)

Activity Heatmap  (day × hour, UTC)
       0  3  6  9  12 15 18 21
  Mon  ░░░░░▒▒▒▓▓▓▓▓▒▒▒░░░░░░░
  Tue  ░░░░░▒▓▓███▓▓▒▒░░░░░░░░
  Wed  ░░░░░░▒▒▓▓▓▒▒░░░░░░░░░░
  Thu  ░░░░░▒▒▓▓▓▓▒▒░░░░░░░░░░
  Fri  ░░░░░▒▒▒▓▓▒▒▒░░░░░░░░░░
  Sat  ░░░░░░░░▒▒░░░░░░░░░░░░░
  Sun  ░░░░░░░░░░░░░░░░░░░░░░░

Top Churned Files
┌────┬──────────────────────────────────────┬─────────┬────────────┬───────────┐
│  # │ File                                 │ Changes │ Insertions │ Deletions │
├────┼──────────────────────────────────────┼─────────┼────────────┼───────────┤
│  1 │ src/core/stats.ts                    │ 94      │ +3,201     │ -2,874    │
│  2 │ src/display/chart.ts                 │ 71      │ +2,540     │ -2,103    │
│  3 │ src/index.ts                         │ 58      │ +1,830     │ -1,421    │
│  4 │ tests/stats.test.ts                  │ 47      │ +1,204     │ -988      │
│  5 │ package.json                         │ 34      │ +210       │ -198      │
└────┴──────────────────────────────────────┴─────────┴────────────┴───────────┘
```

---

## How It Works

1. **Log parsing** — `simple-git` runs `git log --format=... --numstat` and the output is parsed entirely in memory. No temp files, no shell piping gymnastics.
2. **Stats engine** — `src/core/stats.ts` aggregates commit records into author stats, a 7×24 activity heatmap, monthly timelines, and file churn rankings.
3. **Language detection** — `src/core/languages.ts` maps file extensions to language names and GitHub-style brand colours.
4. **Rendering** — `chalk` drives all terminal colour, `cli-table3` handles the tabular author and churn views, and custom bar/sparkline helpers produce inline ASCII charts.

---

## Development

```bash
git clone https://github.com/shivansh-mishra/git-chronicle.git
cd git-chronicle
npm install
npm run dev          # run from source with tsx
npm test             # run Vitest suite
npm run build        # compile to dist/
```

---

## License

MIT — Copyright (c) 2025 Shivansh Mishra. See [LICENSE](./LICENSE) for details.
