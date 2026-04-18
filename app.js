/**
 * Point d'entrée Phusion Passenger (cPanel Setup Node.js App)
 *
 * Passenger lance ce fichier et injecte :
 *   - process.env.PORT        (port / socket d'écoute imposé)
 *   - process.env.NODE_ENV    ('production')
 * Les autres variables (DATABASE_URL) sont définies côté cPanel
 * (interface Setup Node.js App → Environment variables)
 * OU dans un fichier .env à la racine de l'app.
 *
 * Pour redéployer sans downtime : `touch tmp/restart.txt`
 */

const path = require('path');
const fs = require('fs');

const rootDir = __dirname;

// Charger .env si présent (Passenger ne le fait pas automatiquement)
const envFile = path.join(rootDir, '.env');
if (fs.existsSync(envFile)) {
  try {
    require('dotenv').config({ path: envFile });
  } catch (_) {
    const raw = fs.readFileSync(envFile, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
      if (m && !process.env[m[1]]) {
        let v = m[2];
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
          v = v.slice(1, -1);
        }
        process.env[m[1]] = v;
      }
    }
  }
}

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const port = process.env.PORT || 3000;
const hostname = '127.0.0.1';
const dev = false;

const nextApp = next({ dev, hostname, port, dir: rootDir });
const handle = nextApp.getRequestHandler();

nextApp
  .prepare()
  .then(() => {
    createServer((req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        handle(req, res, parsedUrl);
      } catch (err) {
        console.error('[app.js] Request error:', err);
        res.statusCode = 500;
        res.end('internal error');
      }
    }).listen(port, () => {
      console.log(`[app.js] Next.js prêt — port/socket=${port}`);
    });
  })
  .catch((err) => {
    console.error('[app.js] Échec préparation Next.js :', err);
    process.exit(1);
  });
