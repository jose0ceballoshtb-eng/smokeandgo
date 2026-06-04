import dotenv from "dotenv";
dotenv.config(); // Cargar variables de entorno ANTES de usar process.env

import pkg from "pg";
const { Pool } = pkg;

// Mostrar las variables para depuración (puedes quitar esto luego)
console.log("=== VARIABLES DESDE pool.js ===");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("===============================");

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});