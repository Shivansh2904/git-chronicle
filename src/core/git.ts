import { simpleGit, SimpleGit } from 'simple-git';
import { CommitRecord, FileChange } from '../types.js';

export async function getRepoRoot(cwd: string = process.cwd()): Promise<string> {
  const git: SimpleGit = simpleGit(cwd);
  const root = await git.revparse(['--show-toplevel']);
  return root.trim();
}

// Hash, author name and email (after .mailmap), author date, subject. With
// -z, git ends every field and every numstat entry with NUL and writes paths
// verbatim (no quoting). None of these can contain NUL, so no name, subject or
// path can break the parse.
const LOG_FIELDS = ['%H', '%aN', '%aE', '%aI', '%s'];

export async function getLog(
  repoPath: string,
  since?: string,
  until?: string
): Promise<CommitRecord[]> {
  const git: SimpleGit = simpleGit(repoPath);

  const args = ['log', '-z', `--format=${LOG_FIELDS.join('%x00')}`, '--numstat'];

  if (since) {
    args.push(`--since=${since}`);
  }

  if (until) {
    args.push(`--before=${until}`);
  }

  const raw = await git.raw(args);
  return parseLog(raw);
}

// "<insertions>\t<deletions>\t<path>"; binary files show "-" for both counts.
// The first entry after a commit's header starts with a newline.
const NUMSTAT_ENTRY = /^\n?(\d+|-)\t(\d+|-)\t(.*)$/s;
const HASH = /^[0-9a-f]{40}([0-9a-f]{24})?$/;

/**
 * Parse `git log -z --numstat` output written with LOG_FIELDS. Each commit is
 * its header fields followed by zero or more numstat entries. A rename or copy
 * is an entry with an empty path followed by the old and the new path as two
 * more fields; it is counted under the new path.
 */
export function parseLog(raw: string): CommitRecord[] {
  // The output ends with a NUL; drop the empty field that leaves behind.
  const fields = raw.split('\0');
  if (fields[fields.length - 1] === '') fields.pop();

  const commits: CommitRecord[] = [];
  let i = 0;

  while (i < fields.length) {
    const header = fields.slice(i, i + LOG_FIELDS.length);
    const [hash, author, email, dateStr, subject] = header;
    const date = new Date(dateStr);
    if (header.length < LOG_FIELDS.length || !HASH.test(hash) || Number.isNaN(date.getTime())) {
      throw new Error(`Unexpected git log output at field ${i}: ${JSON.stringify(header)}`);
    }
    i += LOG_FIELDS.length;

    const files: FileChange[] = [];
    let m: RegExpExecArray | null;
    while (i < fields.length && (m = NUMSTAT_ENTRY.exec(fields[i]))) {
      let path = m[3];
      i++;
      if (path === '') {
        path = fields[i + 1];
        i += 2;
      }
      files.push({
        path,
        insertions: m[1] === '-' ? 0 : parseInt(m[1], 10),
        deletions: m[2] === '-' ? 0 : parseInt(m[2], 10),
      });
    }

    commits.push({
      hash,
      author,
      email,
      date,
      subject,
      filesChanged: files.length,
      insertions: files.reduce((sum, f) => sum + f.insertions, 0),
      deletions: files.reduce((sum, f) => sum + f.deletions, 0),
      files,
    });
  }

  return commits;
}

/**
 * The ref `compare` measures against when none is given: a local main or
 * master branch, else the remote's default branch (origin/HEAD).
 */
export async function getDefaultBase(repoPath: string): Promise<string> {
  const git: SimpleGit = simpleGit(repoPath);
  for (const branch of ['main', 'master']) {
    const found = await git.raw(['for-each-ref', '--format=%(refname:short)', `refs/heads/${branch}`]);
    if (found.trim()) return branch;
  }
  try {
    const remoteHead = await git.raw(['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD']);
    if (remoteHead.trim()) return remoteHead.trim();
  } catch {
    // No origin/HEAD: fall through to the error below.
  }
  throw new Error('No main or master branch found; name the base ref: git-chronicle compare <base> [head]');
}
