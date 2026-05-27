# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Weekly Dependabot updates for npm and GitHub Actions
- `CONTRIBUTING.md` with dev setup, command-creation guidelines, and PR checklist

## [1.3.0] — 2026-05-27

### Added
- `compare [base] [head]` command — compare two git refs and show commits, authors, and file churn between them (defaults to `main..HEAD`)

## [1.2.0] — 2026-05-27

### Added
- `report` command exports a comprehensive Markdown report with summary, authors, timeline, languages, and top files
- `-o, --output <path>` flag on `report` to set the output file

## [1.1.0] — 2026-05-27

### Added
- `--until <date>` flag on `analyze` for date-range filtering
- `--json` flag on `analyze` to emit the full analysis as JSON to stdout
- `files` command (alias `f`) shows top churned files with `-n` depth control

### Fixed
- `getLog()` now passes `--before=<date>` to git when `until` is provided
- `parseLog()` now populates `filenames` on commit records (previously empty)
- `simpleGit` import switched to the named-export form
- `LANGUAGE_MAP` test allows shared names (`.ts` and `.tsx` both map to "TypeScript")

### Changed
- Replaced fabricated author names in the README demo with real React core team contributors

## [1.0.0] — 2026-05-17

### Added
- Initial release
- `analyze` (default), `authors`, and `heatmap` commands
- Repository summary, commit timeline, author breakdown, language detection, activity heatmap, file churn
- `--since <date>` and `-n, --top <n>` filters
- ASCII bar charts, sparklines, and box-drawing summary cards
