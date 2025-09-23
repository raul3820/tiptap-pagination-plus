// Fail the build if explicit `any` or `unknown` are used, and print a custom message.
// Output format: file:line:col: message
// This complements oxlint by providing the required custom message.

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'public',
  '.git',
  '.husky',
  '.vscode'
]);

/** @typedef {{ file: string; line: number; col: number; token: 'any' | 'unknown'; }} Match */

function isTsFile(file) {
  return file.endsWith('.ts') || file.endsWith('.tsx');
}

function walk(dir) {
  /** @type {string[]} */
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
    } else if (entry.isFile() && isTsFile(full) && !full.endsWith('.d.ts')) {
      files.push(full);
    }
  }
  return files;
}

function* findMatchesInLine(line, lineIdx, file, token) {
  // We purposely target the token positions to report a useful column.
  const patterns = token === 'any'
    ? [
        /\bas\s+any\b/g,     // `as any`
        /:\s*any\b/g,        // `: any`
        /<\s*any\s*>/g       // `<any>`
      ]
    : [
        /\bas\s+unknown\b/g, // `as unknown`
        /:\s*unknown\b/g,    // `: unknown`
        /<\s*unknown\s*>/g   // `<unknown>`
      ];

  for (const re of patterns) {
    let m;
    while ((m = re.exec(line)) !== null) {
      const matched = m[0];
      const inner = token; // "any" or "unknown"
      const innerIdx = matched.lastIndexOf(inner);
      const col = (m.index + (innerIdx >= 0 ? innerIdx : 0)) + 1; // 1-based
      /** @type {Match} */
      const result = { file, line: lineIdx + 1, col, token };
      yield result;
    }
  }
}

function scanFile(file) {
  /** @type {Match[]} */
  const result = [];
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const match of findMatchesInLine(line, i, file, 'any')) {
      result.push(match);
    }
    for (const match of findMatchesInLine(line, i, file, 'unknown')) {
      result.push(match);
    }
  }
  return result;
}

function main() {
  const tsFiles = walk(ROOT);
  /** @type {Match[]} */
  let all = [];
  for (const f of tsFiles) {
    all = all.concat(scanFile(f));
  }

  if (all.length > 0) {
    for (const m of all) {
      // Use one unified custom message, as requested.
      // Keep unix-like formatting so editors/CI parse it.
      console.log(`${path.relative(ROOT, m.file)}:${m.line}:${m.col}: any or unknown are not allowed. Find the correct types.`);
    }
    process.exit(1);
  }
}

main();