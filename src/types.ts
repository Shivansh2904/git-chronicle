export interface CommitRecord {
  hash: string;
  author: string;
  email: string;
  date: Date;
  subject: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
  filenames: string[];
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
  topLanguages: { ext: string; lines: number; pct: number }[];
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

export interface AnalyzeOptions {
  top: string;
  since?: string;
}

export interface AuthorsOptions {
  sort: 'commits' | 'insertions' | 'deletions';
}
