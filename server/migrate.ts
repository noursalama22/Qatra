import { pool } from "./db";

/** Idempotent schema patches applied at server startup (non-interactive). */
export async function runMigrations() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

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

  await pool.query(`
    ALTER TABLE drivers
      ADD COLUMN IF NOT EXISTS plate_number varchar(30),
      ADD COLUMN IF NOT EXISTS vehicle_model varchar(100),
      ADD COLUMN IF NOT EXISTS vehicle_capacity_liters integer,
      ADD COLUMN IF NOT EXISTS vehicle_year integer,
      ADD COLUMN IF NOT EXISTS vehicle_notes text,
      ADD COLUMN IF NOT EXISTS full_name varchar(200),
      ADD COLUMN IF NOT EXISTS zone varchar(200),
      ADD COLUMN IF NOT EXISTS last_activity_at timestamp with time zone
  `);

  await pool.query(`
    DO $$
    BEGIN
      CREATE TYPE truck_status AS ENUM ('available', 'on_trip', 'maintenance');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await pool.query(`
    DO $$
    BEGIN
      CREATE TYPE provider_contract_status AS ENUM ('review', 'active', 'rejected');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);
  await pool.query(`
    DO $$
    BEGIN
      CREATE TYPE contract_priority AS ENUM ('normal', 'high', 'vip');
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS provider_driver_invites (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name varchar(200) NOT NULL,
      email varchar(255) NOT NULL,
      phone varchar(50),
      zone varchar(200),
      id_number varchar(100),
      plate_number varchar(30),
      vehicle_model varchar(100),
      capacity_liters integer,
      vehicle_year integer,
      vehicle_notes text,
      provider_id varchar NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      provider_name varchar(200),
      token varchar(64) NOT NULL UNIQUE,
      status varchar(20) NOT NULL DEFAULT 'pending',
      created_at timestamp with time zone NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pdi_provider_id ON provider_driver_invites (provider_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_pdi_token ON provider_driver_invites (token)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS trucks (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      provider_id varchar NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      plate_number varchar(30) NOT NULL,
      model varchar(100) NOT NULL,
      capacity_liters integer NOT NULL,
      year integer NOT NULL,
      status truck_status NOT NULL DEFAULT 'available',
      notes text,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trucks_provider_id ON trucks (provider_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks (status)`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contracts (
      id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
      contract_number varchar(20) NOT NULL,
      provider_id varchar NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
      client_name varchar(255) NOT NULL,
      priority contract_priority NOT NULL DEFAULT 'normal',
      status provider_contract_status NOT NULL DEFAULT 'review',
      volume_liters integer NOT NULL,
      value_aed numeric(12, 2) NOT NULL,
      location varchar(255),
      sla_hours integer,
      notes text,
      start_date timestamp with time zone,
      end_date timestamp with time zone,
      created_at timestamp with time zone NOT NULL DEFAULT now(),
      updated_at timestamp with time zone NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contracts_provider_id ON contracts (provider_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts (status)`);
}
