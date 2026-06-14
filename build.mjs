// Build script: bundles src/main.ts -> main.js with esbuild.
// Usage:
//   node build.mjs            one-shot production build
//   node build.mjs --watch    rebuild on change
//   node build.mjs --serve    also start a static dev server (implies --watch)
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname, join, normalize} from 'node:path';
import * as esbuild from 'esbuild';
import {commonHosts, getFreePort} from './scripts/get-free-port.mjs';

const args = new Set(process.argv.slice(2));
const serve = args.has('--serve');
const watch = args.has('--watch') || serve;
const root = process.cwd();
const preferredPort = Number(process.env.PORT) || 8080;

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: [join(root, 'src/main.ts')],
  outfile: join(root, 'main.js'),
  bundle: true,
  format: 'iife',
  target: 'es2020',
  sourcemap: true,
  logLevel: 'info',
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

async function startServer() {
  const port = await getFreePort(preferredPort, commonHosts);
  createServer(async (req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('Forbidden');
      return;
    }
    try {
      const body = await readFile(filePath);
      res.writeHead(200, {'Content-Type': MIME[extname(filePath)] || 'application/octet-stream'});
      res.end(body);
    } catch {
      res.writeHead(404).end('Not found');
    }
  }).listen(port, () => console.log(`dev server: http://localhost:${port}`));
}

if (watch) {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  if (serve) await startServer();
} else {
  await esbuild.build(buildOptions);
}
