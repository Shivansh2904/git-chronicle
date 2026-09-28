# git-chronicle

[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![CI](https://github.com/Shivansh2904/git-chronicle/actions/workflows/ci.yml/badge.svg)](https://github.com/Shivansh2904/git-chronicle/actions/workflows/ci.yml)

> Rich git repository analytics in your terminal — commit heatmaps, author breakdowns, language stats, file churn

---

## Install

git-chronicle is not published to npm. The `git-chronicle` package on the npm
registry is an unrelated project, so `npx git-chronicle` will not run this tool.

Install from a clone:

```bash
git clone https://github.com/Shivansh2904/git-chronicle.git
cd git-chronicle
npm install    # the prepare script compiles dist/
npm link       # puts git-chronicle on your PATH
```

Or run it once without installing:

```bash
npx github:Shivansh2904/git-chronicle
```

A global install straight from GitHub (`npm install -g github:...`) failed
when tried with npm 10.9.3 on Windows: the package's `prepare` step stopped
with `'tsc' is not recognized`. Use the clone and `npm link` instead.

Requires Node.js 18 or newer and `git` on your PATH.

---

## Usage

Run inside any git repository:

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
git-chronicle compare                       # default: main (or master)..HEAD
git-chronicle streaks                       # longest & current consecutive-day commit streaks
git-chronicle streaks --since 2024-01-01    # streaks within a date range
```

### Options

Options belong to specific commands; `git-chronicle --since ...` works because
`analyze` is the default command.

| Option | Commands | Description |
|--------|----------|-------------|
| `--since <date>` | `analyze`, `report`, `streaks` | Only commits after this date (passed to `git log --since`) |
| `--until <date>` | `analyze`, `report`, `streaks` | Only commits before this date (passed to `git log --before`) |
| `-n, --top <n>` | `analyze`, `files`, `report` | Rows in each ranked list (default 10, or 15 for `report`) |
| `--sort <field>` | `authors` | Sort by `commits`, `insertions` or `deletions` |
| `--json` | `analyze` | Print the full analysis as JSON on stdout |
| `-o, --output <path>` | `report` | Output file (default `git-chronicle-report.md`) |

Time zones: the heatmap and the "most active" day and hour use the local time
zone of the machine running the tool (set `TZ` to change it). The timeline,
active days and streaks group commits by UTC date.

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

1. **Log parsing** — `src/core/git.ts` runs `git log -z --numstat` through `simple-git` and parses the NUL-separated output in memory, keeping each file's insertions and deletions per commit. Renamed files are counted under their new path.
2. **Stats** — `src/core/stats.ts` turns the commits into author totals (one row per email address, after `.mailmap`), a monthly timeline, a day-by-hour heatmap, per-file churn and streaks.
3. **Languages** — `src/core/languages.ts` maps file extensions to language names. The language breakdown counts file changes, not lines.
4. **Rendering** — `chalk` for colour, `cli-table3` for tables, and a small bar chart and heatmap renderer in `src/display/chart.ts`.

---

## Development

```bash
git clone https://github.com/Shivansh2904/git-chronicle.git
cd git-chronicle
npm install
npm run dev          # run from source with tsx
npm test             # run Vitest suite
npm run lint         # ESLint
npm run build        # compile to dist/
```

---

## License

MIT — Copyright (c) 2026 Shivansh Mishra. See [LICENSE](./LICENSE) for details.
