const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const OUT_DIR = path.resolve(__dirname, '..', 'mujeres desesperadas');

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/save') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const obj = JSON.parse(body);
        const filename = `user_${Date.now()}.json`;
        fs.writeFileSync(path.join(OUT_DIR, filename), JSON.stringify(obj, null, 2), 'utf8');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, path: `mujeres desesperadas/${filename}` }));
        console.log('Saved', filename);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e) }));
      }
    });
    return;
  }
  res.writeHead(404); res.end();
});

server.listen(PORT, '0.0.0.0', () => console.log(`Dev save receiver listening on port ${PORT} (POST /save)`));
