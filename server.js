import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const CONFIG_PATH = path.join(DATA_DIR, 'rack.json');
const PORT = Number(process.env.PORT) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 5_000_000) req.destroy();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function handleApi(req, res) {
  if (req.url === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return true;
  }

  if (req.url === '/api/config' && req.method === 'GET') {
    try {
      const text = await readFile(CONFIG_PATH, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(text);
    } catch {
      res.writeHead(204);
      res.end();
    }
    return true;
  }

  if (req.url === '/api/config' && req.method === 'PUT') {
    try {
      const body = await readBody(req);
      JSON.parse(body);
      await ensureDataDir();
      await writeFile(CONFIG_PATH, body, 'utf8');
      res.writeHead(204);
      res.end();
    } catch {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Invalid JSON body');
    }
    return true;
  }

  return false;
}

async function serveStatic(req, res) {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  let filePath = path.join(DIST_DIR, urlPath);

  if (!filePath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  if (urlPath === '/' || !path.extname(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  try {
    const data = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    try {
      const fallback = await readFile(path.join(DIST_DIR, 'index.html'));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fallback);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
}

const server = http.createServer(async (req, res) => {
  const handled = await handleApi(req, res);
  if (!handled) await serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Rack Builder listening on port ${PORT} (data dir: ${DATA_DIR})`);
});
