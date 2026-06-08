import fs from 'fs';
import path from 'path';

export default async function receiverPlugin(fastify, opts) {
  const BASE_DIR = path.resolve(process.cwd(), '..', 'mujeres desesperadas');

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
    const name = body.type ? `${Date.now()}-${String(body.type).replace(/[^a-z0-9_-]/gi, '_')}.txt` : `${Date.now()}.txt`;
    const filePath = path.join(BASE_DIR, name);
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(body, null, 2), 'utf8');
      return { ok: true, path: filePath };
    } catch (e) {
      fastify.log.error('write save error', e);
      reply.code(500);
      return { ok: false, error: String(e) };
    }
  });

  fastify.post('/files', async (req, reply) => {
    await ensureBase();
    const { filename, content } = req.body || {};
    if (!filename) {
      reply.code(400);
      return { ok: false, error: 'filename required' };
    }
    const safeName = path.basename(filename);
    const outPath = path.join(BASE_DIR, safeName);
    try {
      await fs.promises.writeFile(outPath, JSON.stringify(content, null, 2), 'utf8');
      return { ok: true, path: outPath };
    } catch (e) {
      fastify.log.error('write file error', e);
      reply.code(500);
      return { ok: false, error: String(e) };
    }
  });

  fastify.get('/files/:name', async (req, reply) => {
    const name = String(req.params.name || '');
    const safeName = path.basename(name);
    const f = path.join(BASE_DIR, safeName);
    try {
      const exists = await fs.promises.stat(f).catch(() => null);
      if (!exists) {
        reply.code(404);
        return { ok: false, error: 'not found' };
      }
      const txt = await fs.promises.readFile(f, 'utf8');
      try {
        const parsed = JSON.parse(txt);
        return { ok: true, content: parsed };
      } catch (e) {
        return { ok: true, content: txt };
      }
    } catch (e) {
      fastify.log.error('read file error', e);
      reply.code(500);
      return { ok: false, error: String(e) };
    }
  });
}
