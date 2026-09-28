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

A global `npm install -g` from a git URL of this repo stopped at the
package's `prepare` step with `'tsc' is not recognized` (tried with npm 10.9.3
on Windows, installing from a local clone). Use the clone and `npm link` instead.

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

Unedited output of `scripts/readme-demo.sh`, which runs git-chronicle against
[expressjs/express](https://github.com/expressjs/express) at commit
`98bd4cd96b250d25e1672c36f49cfc743bc801e7` with `TZ=UTC` and `NO_COLOR=1`.
Generated on 2026-09-28 on Windows 11 with Node.js 22.19.0 and git 2.49.0.

```text
$ git-chronicle heatmap

┌──────────────────────────────────────────────────────┐
│  git-chronicle · express                             │
│  6,171 commits · 396 authors · 210 months            │
│  26 Jun 2009 → 28 Sept 2026                          │
│  Most active: Thursdays at 16:00                     │
└──────────────────────────────────────────────────────┘

Commit Activity Heatmap (day × hour)
  Legend: ░ low  ▒▓ medium  █ high

       0     6     12    18    
  Mon  ░░░░▒░░░░░░░░░░▓▓▓▓▒▒▓▓▓
  Tue  ▓▓▓▒▒░░░░░░░░░▒▒▓▓▓▓▓▒▓▓
  Wed  ▒▓▒▓▒▒░░░░░░░░░▒█▓▓▓▓▓██
  Thu  ▓▒▒▒▒░░░░░░▒░░░▓██▓▓██▓▓
  Fri  ▓▒▒▒▒░░░░░░░░░▒▓█▓▒▒▓▓▒▓
  Sat  ▒░▒░░░░░░░░░░░░░░░░░▒▒░░
  Sun  ░░░░░░░░░░░░░░░░░▒▒▒▒░░▒

$ git-chronicle files -n 5

Top 5 Churned Files
┌────────────────────────────────────────────────┬───────────────┬──────────┬──────────┐
│ File                                           │ Times Changed │ +Lines   │ -Lines   │
├────────────────────────────────────────────────┼───────────────┼──────────┼──────────┤
│ package.json                                   │ 1,214         │ +1586    │ -1477    │
├────────────────────────────────────────────────┼───────────────┼──────────┼──────────┤
│ History.md                                     │ 986           │ +4261    │ -682     │
├────────────────────────────────────────────────┼───────────────┼──────────┼──────────┤
│ lib/response.js                                │ 394           │ +3173    │ -2147    │
├────────────────────────────────────────────────┼───────────────┼──────────┼──────────┤
│ Readme.md                                      │ 283           │ +1259    │ -1073    │
├────────────────────────────────────────────────┼───────────────┼──────────┼──────────┤
│ lib/express/core.js                            │ 223           │ +1423    │ -2108    │
└────────────────────────────────────────────────┴───────────────┴──────────┴──────────┘

$ git-chronicle streaks

Commit Streaks
  Longest streak:  12 days (2012-04-24 → 2012-05-05)
  Current streak:  1 day (2026-09-28 → 2026-09-28)
  Active days:     1,356
```

`+Lines` and `-Lines` are each file's own `git log --numstat` counts summed
over its history, with a renamed file counted under its new name.
`tests/churn.test.ts` checks them against `git log --numstat` on a small
repository built by the test.

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
