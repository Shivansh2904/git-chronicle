# Examples

## sample-report.md

Example output from `git-chronicle report` run against [facebook/react](https://github.com/facebook/react).

To generate a similar report for your own repo:

```bash
cd /path/to/your/repo
git-chronicle report                            # writes git-chronicle-report.md
git-chronicle report -o REPORT.md -n 25         # custom name, top-25 entries
git-chronicle report --since 2024-01-01         # date range
git-chronicle report --since 2024-01-01 --until 2024-06-30 -n 50
```

The report is plain Markdown — paste it into GitHub Issues, Notion, or anywhere else that renders MD.
