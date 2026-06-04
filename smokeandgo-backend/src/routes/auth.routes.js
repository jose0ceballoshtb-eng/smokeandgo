import { registerHandler, loginHandler } from "../controllers/auth.controller.js";

export default async function (fastify, opts) {
  const registerSchema = {
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string", minLength: 8 },
        name: { type: "string" }
      }
    }
  };

  const loginSchema = {
    body: {
      type: "object",
      required: ["email", "password"],
      properties: {
        email: { type: "string", format: "email" },
        password: { type: "string" }
      }
    }
  };

  fastify.post("/register", { schema: registerSchema }, registerHandler);
  fastify.post("/login", { schema: loginSchema }, loginHandler);
  fastify.post("/export", async (request, reply) => await import('../controllers/auth.controller.js').then(m => m.exportHandler(request, reply)));
}
