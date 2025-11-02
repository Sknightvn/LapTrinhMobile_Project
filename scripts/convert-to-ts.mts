#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';

const root = path.resolve(new URL(import.meta.url).pathname, '..');
const repoRoot = process.cwd();
const exts = { '.js': '.ts', '.jsx': '.tsx', '.mjs': '.mts' };
const ignoreDirs = new Set(['node_modules', '.git', 'android', 'ios', 'dist', 'build', '.expo', 'coverage']);
const apply = process.argv.includes('--apply');

function shouldIgnore(name) {
  return ignoreDirs.has(name);
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (shouldIgnore(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...await walk(full));
    } else if (e.isFile()) {
      const ext = path.extname(e.name).toLowerCase();
      if (Object.keys(exts).includes(ext)) files.push(full);
    }
  }
  return files;
}

function toTarget(file) {
  const ext = path.extname(file);
  const targetExt = exts[ext.toLowerCase()];
  if (!targetExt) return null;
  return file.slice(0, -ext.length) + targetExt;
}

async function replaceImportExts(fileMap) {
  // replace import/require specifiers that end with .js/.jsx/.mjs
  const importRegex = /(import\s+[\s\S]*?from\s+['"])([^'"\)]+)(['"])/g;
  const requireRegex = /(require\(\s*['"])([^'"\)]+)(['"]\s*\))/g;

  const allFiles = await walk(repoRoot);
  for (const f of allFiles) {
    let content = await fs.readFile(f, 'utf8');
    let changed = false;
    content = content.replace(importRegex, (m, p1, p2, p3) => {
      const ext = path.extname(p2).toLowerCase();
      if (ext && exts[ext]) {
        const newp = p2.slice(0, -ext.length) + exts[ext];
        changed = true;
        return p1 + newp + p3;
      }
      return m;
    });
    content = content.replace(requireRegex, (m, p1, p2, p3) => {
      const ext = path.extname(p2).toLowerCase();
      if (ext && exts[ext]) {
        const newp = p2.slice(0, -ext.length) + exts[ext];
        changed = true;
        return p1 + newp + p3;
      }
      return m;
    });

    if (changed) {
      if (apply) {
        await fs.writeFile(f, content, 'utf8');
        console.log('Updated imports in', f);
      } else {
        console.log('[dry-run] would update imports in', f);
      }
    }
  }
}

async function main() {
  console.log('Scanning for .js/.jsx/.mjs files...');
  const files = await walk(repoRoot);
  console.log('Found', files.length, 'candidates.');
  for (const f of files) {
    const t = toTarget(f);
    if (!t) continue;
    if (apply) {
      await fs.rename(f, t);
      console.log('Renamed', f, '->', t);
    } else {
      console.log('[dry-run] rename', f, '->', t);
    }
  }

  console.log('Updating import specifiers that include extensions...');
  await replaceImportExts();

  console.log('Done.');
  if (!apply) console.log('Re-run with --apply to actually rename files.');
}

main().catch((e) => {
  console.error('Error during conversion script:', e);
  process.exit(1);
});
