// server.js
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import dotenv from "dotenv";
import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

import { initDb } from "./db/init.js";
import authRoutes from "./routes/auth.routes.js";
import receiverPlugin from "./receiverPlugin.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const PUBLIC_HOST = process.env.PUBLIC_HOST || "smokeandgo.onrender.com";
    const PUBLIC_PORT = process.env.PUBLIC_PORT || "";
    const PUBLIC_PROTOCOL = process.env.PUBLIC_PROTOCOL || "https";
    const WS_PROTOCOL = PUBLIC_PROTOCOL === "https" ? "wss" : "ws";
    const publicPortSegment = PUBLIC_PORT && PUBLIC_PORT !== "443" && PUBLIC_PORT !== "80" ? `:${PUBLIC_PORT}` : "";
    const publicBaseUrl = `${PUBLIC_PROTOCOL}://${PUBLIC_HOST}${publicPortSegment}`;

    // Usar fastify.listen() que internamente llama httpServer.listen()
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Servidor SmokeAndGo iniciado en puerto ${PORT}`);
    console.log(`📍 API: ${publicBaseUrl}`);
    console.log(`📡 WebSocket: ${WS_PROTOCOL}://${PUBLIC_HOST}${publicPortSegment}`);

    const shouldAutoStartPopup =
      process.platform === "win32" &&
      process.env.AUTO_WINDOWS_POPUP !== "false" &&
      process.env.POPUP_RECEIVER_STARTED !== "1";

    if (shouldAutoStartPopup) {
      try {
        const receiverPath = path.join(__dirname, "receiverLocal.js");
        const receiver = spawn(process.execPath, [receiverPath], {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
          env: {
            ...process.env,
            SERVER_URL: publicBaseUrl,
            POPUP_RECEIVER_STARTED: "1",
          },
        });
        receiver.unref();
        fastify.log.info("🪟 Receptor de popup Windows iniciado automaticamente");
      } catch (err) {
        fastify.log.warn({ err }, "No se pudo iniciar el receptor de popup Windows");
      }
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();