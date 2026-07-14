import dotenv from "dotenv";
dotenv.config(); // Cargar variables de entorno ANTES de usar process.env

import pkg from "pg";
const { Pool } = pkg;

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

const poolConfig = hasDatabaseUrl
  ? {
      connectionString: process.env.DATABASE_URL,
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