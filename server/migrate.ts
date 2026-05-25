import { pool } from "./db";

/** Idempotent schema patches applied at server startup (non-interactive). */
export async function runMigrations() {
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone varchar(50)`);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique
    ON users (phone)
    WHERE phone IS NOT NULL
  `);
  await pool.query(`
    ALTER TABLE delivery_orders
      ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone,
      ADD COLUMN IF NOT EXISTS payment_method varchar(32),
      ADD COLUMN IF NOT EXISTS delivery_note text
  `);
}
