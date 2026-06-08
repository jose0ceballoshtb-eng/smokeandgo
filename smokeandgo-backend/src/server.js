import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";

import { initDb } from "./db/init.js";

dotenv.config();

const fastify = Fastify({ logger: true });

fastify.register(fastifyCors, { origin: true });

fastify.register(fastifyJwt, {
  secret: process.env.JWT_SECRET || 'dev-secret',
});

// Rutas
import authRoutes from "./routes/auth.routes.js";
import receiverPlugin from './receiverPlugin.js';

fastify.register(authRoutes, { prefix: "/auth" });

// Health check
fastify.get('/health', async () => ({ ok: true }));

// Receiver
fastify.register(receiverPlugin);

// Inicializar DB y arrancar servidor
async function start() {
  try {
    try {
      await initDb();
    } catch (dbErr) {
      fastify.log.warn({ err: dbErr }, 'DB init failed — continuing without DB');
    }

    const PORT = 3000;

    // FASTIFY 5: ESTA ES LA ÚNICA FORMA QUE RESPETA EL HOST
    fastify.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
      if (err) {
        fastify.log.error(err);
        process.exit(1);
      }
      console.log("Servidor backend funcionando en", address);
    });

  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();


