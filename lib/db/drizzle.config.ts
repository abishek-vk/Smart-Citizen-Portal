import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL), ensure the database is provisioned");
}

const cleanDatabaseUrl = databaseUrl.replace(/\?sslmode=.*$/, "");

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanDatabaseUrl,
    ssl: { rejectUnauthorized: false },
  },
});
