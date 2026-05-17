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
git-chronicle                       # full analysis (default)
git-chronicle analyze -n 15         # show top 15 items per section
git-chronicle authors --sort insertions
git-chronicle heatmap
git-chronicle --since 2024-01-01    # recent history only
```

### Options

| Flag | Description |
|------|-------------|
| `--since <date>` | Limit analysis to commits after this ISO date |
| `-n, --top <number>` | Number of items to display in ranked lists (default: 10) |
| `--sort <field>` | Sort authors by `commits`, `insertions`, or `deletions` |

---

## Demo

```
┌────────────────────────────────────────────────────┐
│  git-chronicle · my-awesome-project                │
│  1,247 commits · 4 authors · 18 months             │
│  Jan 2023 → Jul 2024                               │
│  Most active: Tuesdays at 11:00                    │
└────────────────────────────────────────────────────┘

Commit Timeline
  2023-01  ████████████████████ 42
  2023-02  ████████████ 28
  2023-03  ██████████████████████████ 61
  2023-04  ████████████████ 37
  2023-05  ██████████████████████ 52
  2023-06  ██████████ 24
  2023-07  ███████████████████████████████ 71
  2023-08  ████████████████████ 44
  2023-09  █████████████ 31
  2023-10  ████████████████████████ 58
  2023-11  ████████████████ 38
  2023-12  ████████ 19
  2024-01  ██████████████████████████████ 68
  2024-02  █████████████████████ 49
  2024-03  ████████████████████████████ 64
  2024-04  ██████████████████ 43
  2024-05  ████████████████████████ 55
  2024-06  █████████████████ 41
  2024-07  ████████████ 28

Top Authors
┌─────┬──────────────────┬─────────┬────────────┬───────────┬──────────┬──────────────┐
│  #  │ Author           │ Commits │ Insertions │ Deletions │ Net      │ Active Days  │
├─────┼──────────────────┼─────────┼────────────┼───────────┼──────────┼──────────────┤
│  1  │ Shivansh Mishra  │ 612     │ +45,231    │ -12,840   │ +32,391  │ 187          │
│  2  │ Alice Wang       │ 401     │ +28,103    │ -9,221    │ +18,882  │ 124          │
│  3  │ Carlos Ruiz      │ 158     │ +9,840     │ -4,312    │ +5,528   │ 73           │
│  4  │ Priya Sharma     │ 76      │ +3,102     │ -1,890    │ +1,212   │ 41           │
└─────┴──────────────────┴─────────┴────────────┴───────────┴──────────┴──────────────┘

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
