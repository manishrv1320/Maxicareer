import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('[build] Starting unified production build...');

// Clean production .next before running build
const nextDir = path.join(projectRoot, '.next');
try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
  }
} catch (cleanErr) {
  console.warn('[build] Note on pre-clean:', cleanErr.message);
}

// 1. Build Next.js standalone production build
console.log('[build] Building Next.js application (standalone)...');
// Run the CLI's JavaScript entry with Node itself: the extensionless .bin shims can't be
// spawned directly on Windows (ENOENT), while this works on every OS.
const nodeCli = (pkgPath, name) => {
  const entry = path.join(projectRoot, 'node_modules', ...pkgPath);
  return fs.existsSync(entry) ? [process.execPath, [entry]] : [name, []];
};

const [nextCmd, nextPre] = nodeCli(['next', 'dist', 'bin', 'next'], 'next');

const nextBuild = spawnSync(nextCmd, [...nextPre, 'build'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_DIST_DIR: '.next',
    NODE_ENV: 'production',
  },
});

if (nextBuild.status !== 0) {
  console.error('[build] Next.js build failed with exit code:', nextBuild.status);
  process.exit(nextBuild.status || 1);
}

const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const staticDir = path.join(projectRoot, '.next', 'static');
const publicDir = path.join(projectRoot, 'public');

if (!fs.existsSync(standaloneDir)) {
  console.error('[build] Error: .next/standalone directory was not generated!');
  process.exit(1);
}

if (!fs.existsSync(staticDir)) {
  console.error('[build] Error: .next/static directory was not generated!');
  process.exit(1);
}

// Copy static assets and public into standalone directory for self-contained runtime
try {
  const targetStaticDir = path.join(standaloneDir, '.next', 'static');
  fs.cpSync(staticDir, targetStaticDir, { recursive: true, force: true });

  const targetPublicDir = path.join(standaloneDir, 'public');
  if (fs.existsSync(publicDir)) {
    fs.cpSync(publicDir, targetPublicDir, { recursive: true, force: true });
  }
} catch (copyErr) {
  console.warn('[build] Warning during copying standalone assets:', copyErr.message);
}

// 2. Build Vite static bundle into dist/
console.log('[build] Building Vite static client bundle into dist/...');
const [viteCmd, vitePre] = nodeCli(['vite', 'bin', 'vite.js'], 'vite');

const viteBuild = spawnSync(viteCmd, [...vitePre, 'build'], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
  },
});

if (viteBuild.status !== 0) {
  console.warn('[build] Vite build non-zero exit code:', viteBuild.status);
}

const distDir = path.join(projectRoot, 'dist');
if (fs.existsSync(distDir)) {
  console.log('[build] dist/ directory populated:');
  const entries = fs.readdirSync(distDir);
  console.log(' - ' + entries.join('\n - '));
}

console.log('[build] .next/standalone directory populated:');
const standaloneEntries = fs.readdirSync(standaloneDir);
console.log(' - ' + standaloneEntries.join('\n - '));

console.log('[build] Production build completed successfully!');
