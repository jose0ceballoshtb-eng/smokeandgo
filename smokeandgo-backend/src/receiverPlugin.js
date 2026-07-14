// receiverPlugin.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export default async function receiverPlugin(fastify, opts) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const BASE_DIR = path.join(__dirname, 'storage');

  async function ensureBase() {
    try {
      await fs.promises.mkdir(BASE_DIR, { recursive: true });
    } catch (e) {
      fastify.log.error('Could not create base dir', e);
    }
  }

  fastify.post('/save', async (req, reply) => {
    await ensureBase();
    const body = req.body || {};

    const safeType = body.type
      ? String(body.type).replace(/[^a-z0-9_-]/gi, '_')
      : 'data';

    const filename = `${Date.now()}-${safeType}.json`;
    const filePath = path.join(BASE_DIR, filename);

    try {
      await fs.promises.writeFile(filePath, JSON.stringify(body, null, 2), 'utf8');
      try {
        if (body?.type === 'user_register' && fastify.io) {
          const clientIp = req.headers['x-forwarded-for'] || req.ip || req.socket?.remoteAddress || null;
          fastify.io.emit('new-registration', {
            id: Date.now(),
            email: body.email || null,
            name: body.name || null,
            birthdate: body.birthdate || null,
            created_at: new Date().toISOString(),
            clientIp,
            userAgent: req.headers['user-agent'] || null,
            device: body.device || null,
            source: 'save-endpoint',
          });
          fastify.log.info('📡 Evento WebSocket emitido desde /save: new-registration');
        }
      } catch (emitErr) {
        fastify.log.warn({ err: emitErr }, 'No se pudo emitir notificacion WebSocket desde /save');
      }
      return reply.send({ ok: true, path: filename });
    } catch (e) {
      fastify.log.error('write save error', e);
      return reply.code(500).send({ ok: false, error: String(e) });
    }
  });

  fastify.post('/files', async (req, reply) => {
    await ensureBase();
    const { filename, content } = req.body || {};

    if (!filename) {
      return reply.code(400).send({ ok: false, error: 'filename required' });
    }

    const safeName = path.basename(filename).replace(/[^a-z0-9._-]/gi, '_');
    const outPath = path.join(BASE_DIR, safeName);

    try {
      await fs.promises.writeFile(outPath, JSON.stringify(content, null, 2), 'utf8');
      return reply.send({ ok: true, path: safeName });
    } catch (e) {
      fastify.log.error('write file error', e);
      return reply.code(500).send({ ok: false, error: String(e) });
    }
  });

  fastify.get('/files/:name', async (req, reply) => {
    const safeName = path.basename(req.params.name).replace(/[^a-z0-9._-]/gi, '_');
    const filePath = path.join(BASE_DIR, safeName);

    try {
      await fs.promises.access(filePath);
      const txt = await fs.promises.readFile(filePath, 'utf8');

      try {
        return reply.send({ ok: true, content: JSON.parse(txt) });
      } catch {
        return reply.send({ ok: true, content: txt });
      }
    } catch {
      return reply.code(404).send({ ok: false, error: 'not found' });
    }
  });
}
