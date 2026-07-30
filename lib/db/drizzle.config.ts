import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const databaseUrl = process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL (or SUPABASE_DATABASE_URL), ensure the database is provisioned");
}

const cleanDatabaseUrl = databaseUrl.replace(/\?sslmode=.*$/, "");

export default defineConfig({
  schema: "./src/schema",
  dialect: "postgresql",
  dbCredentials: {
    url: cleanDatabaseUrl,
    ssl: { rejectUnauthorized: false },
  },
});

