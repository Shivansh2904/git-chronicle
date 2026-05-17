import type { CommitRecord, AuthorStats, HeatmapData, FileChurn, RepoSummary } from '../types.js';
import { getLanguageName } from './languages.js';
import path from 'node:path';

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

export function computeRepoSummary(commits: CommitRecord[], repoPath: string): RepoSummary {
  if (commits.length === 0) {
    return { path: repoPath, totalCommits: 0, authors: 0, dateRange: { from: new Date(), to: new Date() }, mostActiveHour: 0, mostActiveDayOfWeek: 0, topLanguages: [] };
  }
  const dates = commits.map(c => c.date);
  const hourCounts = new Array(24).fill(0);
  const dayCounts = new Array(7).fill(0);
  const extCounts = new Map<string, number>();
  const emailSet = new Set<string>();

  for (const c of commits) {
    hourCounts[c.date.getHours()]++;
    dayCounts[(c.date.getDay() + 6) % 7]++;
    emailSet.add(c.email);
    // count file extensions from filenames if present
    for (const f of (c as any).filenames ?? []) {
      const ext = path.extname(f).toLowerCase();
      if (ext) extCounts.set(ext, (extCounts.get(ext) ?? 0) + 1);
    }
  }

  const totalFiles = [...extCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const topLanguages = [...extCounts.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([ext, lines]) => ({ ext: getLanguageName(ext), lines, pct: Math.round((lines / totalFiles) * 100) }));

  return {
    path: repoPath,
    totalCommits: commits.length,
    authors: emailSet.size,
    dateRange: { from: new Date(Math.min(...dates.map(d => d.getTime()))), to: new Date(Math.max(...dates.map(d => d.getTime()))) },
    mostActiveHour: hourCounts.indexOf(Math.max(...hourCounts)),
    mostActiveDayOfWeek: dayCounts.indexOf(Math.max(...dayCounts)),
    topLanguages,
  };
}

export function getTopChurnFiles(commits: CommitRecord[], n: number): FileChurn[] {
  const map = new Map<string, FileChurn>();
  for (const c of commits) {
    for (const f of (c as any).filenames ?? []) {
      if (!map.has(f)) map.set(f, { path: f, changes: 0, insertions: 0, deletions: 0 });
      const s = map.get(f)!;
      s.changes++;
      s.insertions += Math.floor(c.insertions / Math.max((c as any).filenames?.length ?? 1, 1));
      s.deletions += Math.floor(c.deletions / Math.max((c as any).filenames?.length ?? 1, 1));
    }
  }
  return [...map.values()].sort((a, b) => b.changes - a.changes).slice(0, n);
}
