/** One file's line counts in one commit, as reported by `git log --numstat`. */
export interface FileChange {
  path: string;
  insertions: number;
  deletions: number;
}

export interface CommitRecord {
  hash: string;
  author: string;
  email: string;
  date: Date;
  subject: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  files: FileChange[];
}

export interface AuthorStats {
  name: string;
  email: string;
  commits: number;
  insertions: number;
  deletions: number;
  firstCommit: Date;
  lastCommit: Date;
  activeDays: number;
}

export interface FileChurn {
  path: string;
  changes: number;
  insertions: number;
  deletions: number;
}

export interface RepoSummary {
  path: string;
  totalCommits: number;
  authors: number;
  dateRange: { from: Date; to: Date };
  mostActiveHour: number;
  mostActiveDayOfWeek: number;
  /** Files changed per language across all commits, largest first. */
  topLanguages: { language: string; fileChanges: number; pct: number }[];
}

export interface HeatmapData {
  // [dayOfWeek 0-6][hour 0-23] = commit count
  grid: number[][];
  max: number;
}

export interface StreakData {
  longest: { length: number; from: string | null; to: string | null };
  current: { length: number; from: string | null; to: string | null };
  totalActiveDays: number;
}
