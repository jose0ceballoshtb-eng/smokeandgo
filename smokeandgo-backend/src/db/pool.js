import dotenv from "dotenv";
dotenv.config(); // Cargar variables de entorno ANTES de usar process.env

import pkg from "pg";
const { Pool } = pkg;

function normalizeDbUrl(value) {
  if (!value) return "";
  return String(value).trim().replace(/^['"]|['"]$/g, "");
}

const databaseUrl = normalizeDbUrl(
  process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.SUPABASE_DB_URL
);

const hasDatabaseUrl = Boolean(databaseUrl);

const poolConfig = hasDatabaseUrl
  ? {
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    };

export const pool = new Pool(poolConfig);