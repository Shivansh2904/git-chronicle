import type { CommitRecord, AuthorStats, HeatmapData, FileChurn, RepoSummary, StreakData } from '../types.js';
import { getLanguageName } from './languages.js';
import path from 'node:path';

/** Day names in the order used by every day-of-week index here: Monday = 0. */
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

export function computeAuthorStats(commits: CommitRecord[]): AuthorStats[] {
  const map = new Map<string, AuthorStats>();
  const daysSeen = new Map<string, Set<string>>();

  for (const c of commits) {
    const key = c.email;
    const dayKey = c.date.toISOString().slice(0, 10);
    if (!map.has(key)) {
      map.set(key, { name: c.author, email: c.email, commits: 0, insertions: 0, deletions: 0, firstCommit: c.date, lastCommit: c.date, activeDays: 0 });
      daysSeen.set(key, new Set());
    }
    const s = map.get(key)!;
    s.commits++;
    s.insertions += c.insertions;
    s.deletions += c.deletions;
    if (c.date < s.firstCommit) s.firstCommit = c.date;
    if (c.date > s.lastCommit) s.lastCommit = c.date;
    daysSeen.get(key)!.add(dayKey);
  }

  for (const [key, s] of map) s.activeDays = daysSeen.get(key)!.size;
  return [...map.values()].sort((a, b) => b.commits - a.commits);
}

export function computeHeatmap(commits: CommitRecord[]): HeatmapData {
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const c of commits) {
    const dow = (c.date.getDay() + 6) % 7; // Mon=0 Sun=6
    const hour = c.date.getHours();
    grid[dow][hour]++;
  }
  const max = Math.max(...grid.flat(), 0);
  return { grid, max };
}

export function computeTimeline(commits: CommitRecord[]): { month: string; count: number }[] {
  const map = new Map<string, number>();
  for (const c of commits) {
    const key = c.date.toISOString().slice(0, 7);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));
}

/** The last segment of a local path, split on either separator. */
export function repoName(repoPath: string): string {
  return repoPath.split(/[/\\]/).filter(Boolean).pop() ?? repoPath;
}

export function computeRepoSummary(commits: CommitRecord[], repoPath: string): RepoSummary {
  const name = repoName(repoPath);
  if (commits.length === 0) {
    return { name, totalCommits: 0, authors: 0, dateRange: { from: new Date(), to: new Date() }, mostActiveHour: 0, mostActiveDayOfWeek: 0, topLanguages: [] };
  }
  // A loop rather than Math.min(...times): spreading one argument per commit
  // overflows the call stack on large histories.
  let first = commits[0].date;
  let last = commits[0].date;
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  const languageCounts = new Map<string, number>();
  const emailSet = new Set<string>();

  for (const c of commits) {
    if (c.date < first) first = c.date;
    if (c.date > last) last = c.date;
    hourCounts[c.date.getHours()]++;
    dayCounts[(c.date.getDay() + 6) % 7]++;
    emailSet.add(c.email);
    for (const f of c.files) {
      const ext = path.extname(f.path).toLowerCase();
      if (!ext) continue;
      // Count by language, not extension, so .yml and .yaml share one row.
      const language = getLanguageName(ext);
      languageCounts.set(language, (languageCounts.get(language) ?? 0) + 1);
    }
  }

  const totalFiles = [...languageCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const topLanguages = [...languageCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([language, fileChanges]) => ({ language, fileChanges, pct: Math.round((fileChanges / totalFiles) * 100) }));

  return {
    name,
    totalCommits: commits.length,
    authors: emailSet.size,
    dateRange: { from: first, to: last },
    mostActiveHour: hourCounts.indexOf(Math.max(...hourCounts)),
    mostActiveDayOfWeek: dayCounts.indexOf(Math.max(...dayCounts)),
    topLanguages,
  };
}

export function getTopChurnFiles(commits: CommitRecord[], n: number): FileChurn[] {
  const map = new Map<string, FileChurn>();
  for (const c of commits) {
    for (const f of c.files) {
      if (!map.has(f.path)) map.set(f.path, { path: f.path, changes: 0, insertions: 0, deletions: 0 });
      const s = map.get(f.path)!;
      s.changes++;
      s.insertions += f.insertions;
      s.deletions += f.deletions;
    }
  }
  return [...map.values()].sort((a, b) => b.changes - a.changes).slice(0, n);
}

/**
 * Compute consecutive-calendar-day commit streaks.
 *
 * A "streak" is a run of consecutive UTC calendar days that each have at least
 * one commit. Returns the longest streak ever and the current streak (the run
 * ending on the most recent commit day).
 */
export function computeStreaks(commits: CommitRecord[]): StreakData {
  const empty = { length: 0, from: null, to: null };
  if (commits.length === 0) {
    return { longest: { ...empty }, current: { ...empty }, totalActiveDays: 0 };
  }

  // Unique commit days as YYYY-MM-DD, sorted ascending.
  const days = [...new Set(commits.map(c => c.date.toISOString().slice(0, 10)))].sort();

  const MS_PER_DAY = 86_400_000;
  const toUtc = (s: string) => Date.parse(s + 'T00:00:00Z');

  let longest = { length: 1, from: days[0], to: days[0] };
  let runStart = days[0];
  let runLen = 1;

  for (let i = 1; i < days.length; i++) {
    const gap = (toUtc(days[i]) - toUtc(days[i - 1])) / MS_PER_DAY;
    if (gap === 1) {
      runLen++;
    } else {
      runLen = 1;
      runStart = days[i];
    }
    if (runLen > longest.length) {
      longest = { length: runLen, from: runStart, to: days[i] };
    }
  }

  // Current streak = the trailing run ending on the last commit day.
  const current = { length: 1, from: days[days.length - 1], to: days[days.length - 1] };
  for (let i = days.length - 1; i > 0; i--) {
    const gap = (toUtc(days[i]) - toUtc(days[i - 1])) / MS_PER_DAY;
    if (gap === 1) {
      current.length++;
      current.from = days[i - 1];
    } else {
      break;
    }
  }

  return { longest, current, totalActiveDays: days.length };
}
