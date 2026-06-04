import { pool } from "./pool.js";

export async function initDb() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`;

  try {
    await pool.query(createUsersTable);
    console.log("Tabla 'users' creada o ya existente");
  } catch (err) {
    console.error("Error creando tabla users:", err);
    throw err;
  }
}

export default initDb;
