import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

// Pin the settings that would otherwise come from the machine's git config.
const GIT_FLAGS = [
  '-c', 'core.autocrlf=false',
  '-c', 'commit.gpgsign=false',
  '-c', 'user.name=Fixture',
  '-c', 'user.email=fixture@example.com',
];

/** A throwaway git repository in the OS temp directory. */
export class FixtureRepo {
  readonly dir: string;

  constructor() {
    this.dir = mkdtempSync(join(tmpdir(), 'git-chronicle-'));
    this.git('init', '-q');
  }

  git(...args: string[]): string {
    return execFileSync('git', [...GIT_FLAGS, ...args], { cwd: this.dir, encoding: 'utf8' });
  }

  write(path: string, content: string | Buffer): void {
    const full = join(this.dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }

  commit(message: string, author?: { name: string; email: string }): void {
    this.git('add', '-A');
    const authorArgs = author ? ['--author', `${author.name} <${author.email}>`] : [];
    this.git('commit', '-q', '--allow-empty', '-m', message, ...authorArgs);
  }

  remove(): void {
    rmSync(this.dir, { recursive: true, force: true });
  }
}

export const lines = (n: number, prefix = 'line'): string =>
  Array.from({ length: n }, (_, i) => `${prefix} ${i}\n`).join('');
