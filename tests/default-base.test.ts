import { describe, it, expect, afterEach } from 'vitest';
import { getDefaultBase } from '../src/core/git.js';
import { FixtureRepo } from './fixture-repo.js';

// A repo whose only branch is `branch`, with one commit on it.
function repoOn(branch: string): FixtureRepo {
  const repo = new FixtureRepo();
  repo.git('symbolic-ref', 'HEAD', `refs/heads/${branch}`);
  repo.write('a.txt', 'a\n');
  repo.commit('first');
  return repo;
}

describe('getDefaultBase', () => {
  const repos: FixtureRepo[] = [];
  const make = (branch: string) => { const r = repoOn(branch); repos.push(r); return r; };
  afterEach(() => { while (repos.length) repos.pop()!.remove(); });

  it('uses main when it exists', async () => {
    expect(await getDefaultBase(make('main').dir)).toBe('main');
  });

  it('uses master when there is no main', async () => {
    expect(await getDefaultBase(make('master').dir)).toBe('master');
  });

  it("falls back to the remote's default branch", async () => {
    const upstream = make('trunk');
    const clone = new FixtureRepo();
    repos.push(clone);
    clone.git('fetch', '-q', upstream.dir, 'trunk:refs/remotes/origin/trunk');
    clone.git('symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/trunk');
    expect(await getDefaultBase(clone.dir)).toBe('origin/trunk');
  });

  it('asks for a base ref when there is no obvious default', async () => {
    await expect(getDefaultBase(make('trunk').dir)).rejects.toThrow(/compare <base>/);
  });
});
