import simpleGit, { SimpleGit } from 'simple-git';
import { CommitRecord, FileChurn } from '../types.js';

export async function getRepoRoot(cwd: string = process.cwd()): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);
  const root = await git.revparse(['--show-toplevel']);
  return root.trim();
}

export async function getLog(
  repoPath: string,
  since?: string
): Promise<CommitRecord[]> {
  const git: SimpleGit = simpleGit(repoPath);

  const args = [
    'log',
    '--format=COMMIT_DELIMITER%H|%an|%ae|%aI|%s',
    '--numstat',
  ];

  if (since) {
    args.push(`--since=${since}`);
  }

  const raw = await git.raw(args);
  return parseLog(raw);
}

function parseLog(raw: string): CommitRecord[] {
  const commits: CommitRecord[] = [];
  if (!raw.trim()) return commits;

  // Split on our delimiter
  const blocks = raw.split('COMMIT_DELIMITER').filter(b => b.trim());

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length === 0) continue;

    const headerLine = lines[0].trim();
    if (!headerLine) continue;

    const parts = headerLine.split('|');
    if (parts.length < 5) continue;

    const [hash, author, email, dateStr, ...subjectParts] = parts;
    const subject = subjectParts.join('|');

    let insertions = 0;
    let deletions = 0;
    let filesChanged = 0;

    // Parse numstat lines (format: insertions\tdeletions\tfilename)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const numstatMatch = line.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
      if (numstatMatch) {
        filesChanged++;
        const ins = numstatMatch[1] === '-' ? 0 : parseInt(numstatMatch[1], 10);
        const del = numstatMatch[2] === '-' ? 0 : parseInt(numstatMatch[2], 10);
        insertions += ins;
        deletions += del;
      }
    }

    commits.push({
      hash: hash.trim(),
      author: author.trim(),
      email: email.trim(),
      date: new Date(dateStr.trim()),
      subject: subject.trim(),
      filesChanged,
      insertions,
      deletions,
    });
  }

  return commits;
}

export async function getFileChurn(
  repoPath: string,
  since?: string
): Promise<FileChurn[]> {
  const git: SimpleGit = simpleGit(repoPath);

  const args = ['log', '--numstat', '--format='];
  if (since) {
    args.push(`--since=${since}`);
  }

  const raw = await git.raw(args);
  const fileMap = new Map<string, FileChurn>();

  const lines = raw.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(\d+|-)\t(\d+|-)\t(.+)$/);
    if (match) {
      const ins = match[1] === '-' ? 0 : parseInt(match[1], 10);
      const del = match[2] === '-' ? 0 : parseInt(match[2], 10);
      const filePath = match[3];

      // Handle renames like "old => new" or "{old => new}/file"
      const cleanPath = filePath.replace(/\{.*? => (.*?)\}/, '$1').replace(/ => .*$/, '');

      if (!fileMap.has(cleanPath)) {
        fileMap.set(cleanPath, { path: cleanPath, changes: 0, insertions: 0, deletions: 0 });
      }
      const entry = fileMap.get(cleanPath)!;
      entry.changes++;
      entry.insertions += ins;
      entry.deletions += del;
    }
  }

  return Array.from(fileMap.values()).sort((a, b) => b.changes - a.changes);
}

export async function getFilesInRepo(repoPath: string): Promise<string[]> {
  const git: SimpleGit = simpleGit(repoPath);
  try {
    const raw = await git.raw(['ls-files']);
    return raw.split('\n').filter(f => f.trim());
  } catch {
    return [];
  }
}
