import { defineConfig } from "drizzle-kit";

process.loadEnvFile?.(".env");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

export default defineConfig({
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  out: "./drizzle",
});
