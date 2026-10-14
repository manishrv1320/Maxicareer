const path = require('node:path');
const fs = require('node:fs');

// Determine port:
// In AI Studio / Cloud Run containers, Nginx reverse-proxies port 8080 -> port 3000.
// If Nginx is present or process.env.PORT is 8080, Node must listen on 3000 to prevent EADDRINUSE.
const isNginxProxy = fs.existsSync('/etc/nginx/nginx.conf') || process.env.PORT === '8080';
const targetPort = isNginxProxy ? '3000' : (process.env.PORT || '3000');

process.env.PORT = targetPort;
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';
process.env.NODE_ENV = 'production';

console.log(`[production-server] Starting server on port ${targetPort} (${process.env.HOSTNAME})...`);

const standaloneServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(standaloneServer)) {
  console.log(`[production-server] Loading standalone Next.js server from ${standaloneServer}`);
  require(standaloneServer);
} else {
  console.log(`[production-server] Standalone build not found at ${standaloneServer}, using next start fallback`);
  const { spawn } = require('node:child_process');
  const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
  const bin = fs.existsSync(nextBin) ? nextBin : 'next';
  const child = spawn(bin, ['start', '-p', targetPort, '-H', process.env.HOSTNAME], {
    stdio: 'inherit',
    env: process.env,
  });
  child.on('exit', (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0));
  });
}
