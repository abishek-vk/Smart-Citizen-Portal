import path from "node:path";
import dns from "node:dns";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(import.meta.dirname, "../../../.env") });
dotenv.config();
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL (or SUPABASE_DATABASE_URL) must be set. Did you forget to provision a database?",
  );
}

const cleanDatabaseUrl = databaseUrl.replace(/\?sslmode=.*$/, "");

export const pool = new Pool({
  connectionString: cleanDatabaseUrl,
  lookup: (hostname, _options, callback) => dns.lookup(hostname, { family: 4 }, callback),
  ssl: { rejectUnauthorized: false },
});
export const db = drizzle(pool, { schema });

export * from "./schema";
