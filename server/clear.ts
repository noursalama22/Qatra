import { db } from "./db";
import { sql } from "drizzle-orm";

async function clear() {
  await db.execute(sql`DELETE FROM gps_positions WHERE id LIKE 'seed-%'`);
  await db.execute(sql`DELETE FROM delivery_orders WHERE id LIKE 'seed-%'`);
  await db.execute(sql`DELETE FROM signals WHERE id LIKE 'seed-%'`);
  await db.execute(sql`DELETE FROM distribution_tasks WHERE id LIKE 'seed-%'`);
  await db.execute(sql`DELETE FROM citizens WHERE id LIKE 'seed-%'`);
  await db.execute(sql`DELETE FROM drivers WHERE id LIKE 'seed-%'`);
  await db.execute(sql`DELETE FROM zones WHERE id LIKE 'seed-%'`);
  await db.execute(sql`DELETE FROM providers WHERE id LIKE 'seed-%'`);
  await db.execute(sql`DELETE FROM ngos WHERE id LIKE 'seed-%'`);
  await db.execute(sql`DELETE FROM users WHERE id LIKE 'seed-%'`);
  console.log("✅ Cleared");
  process.exit(0);
}
clear().catch(e => { console.error(e); process.exit(1); });
