#!/usr/bin/env node
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const localNextBin = path.join(projectRoot, 'node_modules', '.bin', 'next');
const nextJsScript = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

process.on('unhandledRejection', (reason) => {
  console.warn('[dev-supervisor] Intercepted unhandled rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[dev-supervisor] Uncaught exception:', err);
});

// Set separate dev distDir so dev server never collides with production build (.next)
const devDistDir = '.next_dev';

// Next.js dev accepts -p/--port and -H/--hostname, but rejects --host.
// The AI Studio dev server supervisor passes '--host 0.0.0.0 --port 3000'.
const rawArgs = process.argv.slice(2);
const nextArgs = ['dev'];

let port = '3000';
let hostname = '0.0.0.0';

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--host' || arg === '-H' || arg === '--hostname') {
    if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
      hostname = rawArgs[++i];
    }
  } else if (arg.startsWith('--host=')) {
    hostname = arg.split('=')[1];
  } else if (arg.startsWith('--hostname=')) {
    hostname = arg.split('=')[1];
  } else if (arg === '-p' || arg === '--port') {
    if (i + 1 < rawArgs.length && !rawArgs[i + 1].startsWith('-')) {
      port = rawArgs[++i];
    }
  } else if (arg.startsWith('--port=')) {
    port = arg.split('=')[1];
  } else if (arg.startsWith('-p=')) {
    port = arg.split('=')[1];
  } else if (arg !== '--') {
    nextArgs.push(arg);
  }
}

nextArgs.push('-p', port, '-H', hostname);

// Determine execution target
const binToRun = fs.existsSync(nextJsScript) ? nextJsScript : localNextBin;

// Helper to keep layout.css in sync with compiled Tailwind CSS
function syncLayoutCss() {
  const cssDir = path.join(projectRoot, devDistDir, 'static', 'css');
  const appDir = path.join(cssDir, 'app');
  const targetFile = path.join(appDir, 'layout.css');
  const cacheFile = path.join(projectRoot, '.next-css-cache.css');

  try {
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    let sourceCssFile = null;
    if (fs.existsSync(cssDir)) {
      const entries = fs.readdirSync(cssDir, { withFileTypes: true });
      const cssFiles = entries
        .filter((f) => f.isFile() && f.name.endsWith('.css') && f.name !== 'layout.css')
        .map((f) => path.join(cssDir, f.name));

      if (cssFiles.length > 0) {
        cssFiles.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
        sourceCssFile = cssFiles[0];
      }
    }

    if (!sourceCssFile && fs.existsSync(cacheFile)) {
      sourceCssFile = cacheFile;
    }

    if (sourceCssFile) {
      const sourceContent = fs.readFileSync(sourceCssFile);
      if (!fs.existsSync(targetFile) || fs.statSync(targetFile).size !== sourceContent.length) {
        fs.writeFileSync(targetFile, sourceContent);
      }
    }
  } catch {
    // safe fallback
  }
}

// Initial sync once at startup if needed
syncLayoutCss();

const child = spawn(process.execPath, [binToRun, ...nextArgs], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_DIST_DIR: devDistDir,
    PATH: `${path.join(projectRoot, 'node_modules', '.bin')}:${process.env.PATH || ''}`,
  },
});

child.on('exit', (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
