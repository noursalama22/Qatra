import { pool } from "./db";

/** Idempotent schema patches applied at server startup (non-interactive). */
export async function runMigrations() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(50)`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique
    ON users (phone)
    WHERE phone IS NOT NULL
  `);
}
