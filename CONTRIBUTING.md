# Contributing to git-chronicle

Thanks for considering a contribution! Issues and PRs welcome.

## Getting set up

```bash
git clone https://github.com/Shivansh2904/git-chronicle.git
cd git-chronicle
npm install
```

## Running locally

```bash
npm run dev      # run from TypeScript source via tsx
npm test         # run Vitest suite
npm run build    # compile to dist/
```

Try it against this very repo:

```bash
node dist/index.js              # default analyze
node dist/index.js authors      # author breakdown
node dist/index.js report -o ./REPORT.md
```

## Adding a new command

Commands live in `src/commands/`. The pattern:

1. Create `src/commands/your-command.ts` exporting an async `runYourCommand(opts)` function
2. Register it in `src/index.ts` with Commander.js
3. Reuse helpers from `src/core/git.ts` (log loading) and `src/core/stats.ts` (aggregations)
4. Use `ora` for spinners, `chalk` for color, `cli-table3` for tables — match existing style

## Style

- TypeScript strict mode is on; fix any new type errors
- Vitest for tests — keep them in `tests/<module>.test.ts`
- Pure functions in `src/core/` (no side effects); side effects belong in `src/commands/`

## Submitting a PR

1. Fork, branch, commit
2. `npm test` must pass
3. `npm run build` must produce no TypeScript errors
4. Update README if you add a flag or command

## License

By contributing, you agree your contributions are licensed under MIT.
