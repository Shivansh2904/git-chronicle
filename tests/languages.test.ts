import { describe, it, expect } from 'vitest';
import { LANGUAGE_MAP, getLanguageName } from '../src/core/languages.js';

// ---------------------------------------------------------------------------
// LANGUAGE_MAP
// ---------------------------------------------------------------------------

describe('LANGUAGE_MAP', () => {
  it('has TypeScript entry', () => {
    expect(LANGUAGE_MAP['.ts']).toBeDefined();
    expect(LANGUAGE_MAP['.ts'].name).toBe('TypeScript');
  });

  it('has Python entry', () => {
    expect(LANGUAGE_MAP['.py']).toBeDefined();
  });

  it('all entries have name and color', () => {
    for (const [, val] of Object.entries(LANGUAGE_MAP)) {
      expect(val.name).toBeTruthy();
      expect(val.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('has JavaScript entry', () => {
    expect(LANGUAGE_MAP['.js']).toBeDefined();
    expect(LANGUAGE_MAP['.js'].name).toBe('JavaScript');
  });

  it('has at least 5 distinct language entries', () => {
    expect(Object.keys(LANGUAGE_MAP).length).toBeGreaterThanOrEqual(5);
  });

  it('color values are exactly 7 characters including the hash', () => {
    for (const [, val] of Object.entries(LANGUAGE_MAP)) {
      expect(val.color).toHaveLength(7);
    }
  });

  it('all keys start with a dot', () => {
    for (const key of Object.keys(LANGUAGE_MAP)) {
      expect(key.startsWith('.')).toBe(true);
    }
  });

  it('has no duplicate names apart from the intended extension aliases', () => {
    // Every language name used by more than one extension, with its extensions.
    const extsByName = new Map<string, string[]>();
    for (const [ext, { name }] of Object.entries(LANGUAGE_MAP)) {
      extsByName.set(name, [...(extsByName.get(name) ?? []), ext]);
    }
    const shared = Object.fromEntries(
      [...extsByName].filter(([, exts]) => exts.length > 1).map(([name, exts]) => [name, exts.sort()])
    );
    expect(shared).toEqual({
      JavaScript: ['.cjs', '.js', '.mjs'],
      'C++': ['.cc', '.cpp'],
      YAML: ['.yaml', '.yml'],
      Shell: ['.bash', '.sh'],
    });
  });

  it('TypeScript color is a valid hex string', () => {
    expect(LANGUAGE_MAP['.ts'].color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('has a CSS/SCSS or styling entry', () => {
    const hasStyling = ['.css', '.scss', '.sass', '.less'].some(
      ext => LANGUAGE_MAP[ext] !== undefined
    );
    expect(hasStyling).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getLanguageName
// ---------------------------------------------------------------------------

describe('getLanguageName', () => {
  it('returns mapped name for known extension .ts', () => {
    expect(getLanguageName('.ts')).toBe('TypeScript');
  });

  it('returns mapped name for known extension .py', () => {
    expect(getLanguageName('.py')).toBe('Python');
  });

  it('returns mapped name for known extension .js', () => {
    expect(getLanguageName('.js')).toBe('JavaScript');
  });

  it('returns uppercased extension for unknown extension', () => {
    expect(getLanguageName('.xyz')).toBe('XYZ');
  });

  it('returns uppercased for another unknown extension', () => {
    expect(getLanguageName('.abc')).toBe('ABC');
  });

  it('strips the dot when uppercasing unknown extensions', () => {
    const result = getLanguageName('.unknown');
    expect(result).not.toContain('.');
  });

  it('returns a non-empty string for any input', () => {
    expect(getLanguageName('.ts').length).toBeGreaterThan(0);
    expect(getLanguageName('.xyz').length).toBeGreaterThan(0);
  });
});
