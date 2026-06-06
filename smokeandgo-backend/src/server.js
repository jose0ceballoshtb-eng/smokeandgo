import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";

import { initDb } from "./db/init.js";

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(fastifyCors, { origin: true });
// Note: @fastify/helmet removed due to version mismatch with Fastify v5 in this environment.
// If you need helmet, install a compatible version and re-enable registration.
fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'dev-secret',
});

// Rutas (archivo en src/routes)
import authRoutes from "./routes/auth.routes.js";

fastify.register(authRoutes, { prefix: "/auth" });

// Health check for Render and load balancers
fastify.get('/health', async () => ({ ok: true }));

// Inicializar DB (crear tablas si hace falta) y arrancar servidor
async function start() {
  try {
    try {
      await initDb();
    } catch (dbErr) {
      fastify.log.warn({ err: dbErr }, 'DB init failed — continuing without DB (check env vars)');
    }

    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    console.log("Servidor backend funcionando en puerto", process.env.PORT || 3000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();