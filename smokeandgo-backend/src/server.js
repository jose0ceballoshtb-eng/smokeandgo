// server.js
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import http from "http";

import { initDb } from "./db/init.js";
import authRoutes from "./routes/auth.routes.js";
import receiverPlugin from "./receiverPlugin.js";

dotenv.config();

// Crear servidor HTTP para compartir entre Fastify y Socket.IO
const httpServer = http.createServer();

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Crear Fastify usando el mismo httpServer
const fastify = Fastify({
  logger: true,
  serverFactory: (handler) => {
    httpServer.on("request", handler);
    return httpServer;
  },
});

// Hacer io accesible desde los controladores (ej: auth.controller.js)
fastify.decorate("io", io);

io.on("connection", (socket) => {
  console.log("🔌 Cliente WebSocket conectado:", socket.id);
  socket.emit("welcome", { message: "Conectado al servidor SmokeAndGo" });
  socket.on("disconnect", () => {
    console.log("🔌 Cliente WebSocket desconectado:", socket.id);
  });
});

async function start() {
  try {
    await fastify.register(fastifyCors, { origin: true });

    await fastify.register(fastifyJwt, {
      secret: process.env.JWT_SECRET || "dev-secret",
    });

    await fastify.register(authRoutes, { prefix: "/auth" });

    fastify.get("/health", async () => ({ ok: true }));

    await fastify.register(receiverPlugin);

    try {
      await initDb();
    } catch (dbErr) {
      fastify.log.warn({ err: dbErr }, "DB init failed — continuing without DB");
    }

    const PORT = Number(process.env.PORT || 3000);
    const PUBLIC_HOST = process.env.PUBLIC_HOST || "smokeandgo.orender.com";
    const PUBLIC_PORT = process.env.PUBLIC_PORT || PORT;
    const PUBLIC_PROTOCOL = process.env.PUBLIC_PROTOCOL || "http";
    const WS_PROTOCOL = PUBLIC_PROTOCOL === "https" ? "wss" : "ws";

    // Usar fastify.listen() que internamente llama httpServer.listen()
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Servidor SmokeAndGo iniciado en puerto ${PORT}`);
    console.log(`📍 API: ${PUBLIC_PROTOCOL}://${PUBLIC_HOST}:${PUBLIC_PORT}`);
    console.log(`📡 WebSocket: ${WS_PROTOCOL}://${PUBLIC_HOST}:${PUBLIC_PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();