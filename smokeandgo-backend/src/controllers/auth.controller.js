import bcrypt from "bcrypt";
import xss from "xss";
import { pool } from "../db/pool.js";
import fs from 'fs/promises';
import path from 'path';

const SALT_ROUNDS = 10;

export async function registerHandler(request, reply) {
  const { email, password, name } = request.body;

  const safeEmail = xss(String(email).trim().toLowerCase());
  const safeName = name ? xss(String(name).trim()) : null;

  if (!safeEmail || !password) {
    return reply.status(400).send({ error: "Email y password requeridos" });
  }

  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    const res = await pool.query(
      `INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name, created_at`,
      [safeEmail, hash, safeName]
    );

    const user = res.rows[0];
    // No devolvemos el hash
    // Create JWT token for the new user
    let token = null;
    try {
      token = request.server.jwt.sign({ id: user.id, email: user.email });
    } catch (e) {
      request.log.warn('Could not sign token on register', e);
    }

    // If client requested export, write a record to a local file (desktop folder)
    try {
      const shouldExport = request.body?.export === true || request.body?.export === 'true';
      if (shouldExport) {
        const outDir = process.env.REG_EXPORT_DIR || 'C:\\Users\\Cosmos\\Desktop\\mujeres desesperadas temp 1-7';
        const outFile = path.join(outDir, 'registrations.txt');
        const clientIp = request.headers['x-forwarded-for'] || request.ip || request.socket?.remoteAddress || null;
        const ua = request.headers['user-agent'] || null;
        const device = request.body?.device || null;
        const record = {
          id: user.id,
          email: user.email,
          name: user.name,
          created_at: user.created_at,
          exported_at: new Date().toISOString(),
          clientIp,
          userAgent: ua,
          device,
        };
        const line = JSON.stringify(record) + '\n';
        await fs.appendFile(outFile, line, { encoding: 'utf8' });
      }
    } catch (e) {
      request.log.warn('Error exporting registration:', e);
    }

    return reply.status(201).send({ user, token });
  } catch (err) {
    if (err.code === "23505") {
      // unique_violation
      return reply.status(409).send({ error: "El email ya está registrado" });
    }
    request.log.error(err);
    return reply.status(500).send({ error: "Error interno del servidor" });
  }
}

export async function loginHandler(request, reply) {
  const { email, password } = request.body;

  const safeEmail = xss(String(email).trim().toLowerCase());

  if (!safeEmail || !password) {
    return reply.status(400).send({ error: "Email y password requeridos" });
  }

  try {
    const res = await pool.query(`SELECT id, email, password_hash FROM users WHERE email = $1`, [safeEmail]);
    const user = res.rows[0];
    if (!user) return reply.status(401).send({ error: "Credenciales inválidas" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return reply.status(401).send({ error: "Credenciales inválidas" });

    const token = request.server.jwt.sign({ id: user.id, email: user.email });
    return reply.send({ token });
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: "Error interno del servidor" });
  }
}

export async function exportHandler(request, reply) {
  try {
    const payload = request.body || {};
    const outDir = process.env.REG_EXPORT_DIR || 'C:\\Users\\Cosmos\\Desktop\\mujeres desesperadas temp 1-7';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    // Save machines if provided (as text file)
    if (payload.machines) {
      const machinesFile = path.join(outDir, `machines_${timestamp}.txt`);
      const text = typeof payload.machines === 'string' ? payload.machines : JSON.stringify(payload.machines, null, 2);
      await fs.writeFile(machinesFile, text, 'utf8');
    }
    // Save user if provided (as text file)
    if (payload.user) {
      const userFile = path.join(outDir, `user_${timestamp}.txt`);
      const text = typeof payload.user === 'string' ? payload.user : JSON.stringify(payload.user, null, 2);
      await fs.writeFile(userFile, text, 'utf8');
    }
    return reply.send({ ok: true });
  } catch (e) {
    request.log.error('exportHandler error', e);
    return reply.status(500).send({ error: 'Export error' });
  }
}

export default { registerHandler, loginHandler };
