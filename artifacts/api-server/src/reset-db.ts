import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function main() {
  console.log("Dropping old conflicting tables if present...");
  
  const dropTables = [
    "parks",
    "citizens",
    "admins",
    "park_facilities",
    "parking_slots",
    "parking_bookings",
    "certificate_requests",
    "complaint_categories",
    "complaints",
    "feedback",
    "notifications",
    "users",
    "departments",
    "property_taxes",
    "water_taxes",
    "certificates",
    "garbage_requests",
    "parking_lots",
    "parking_reservations",
    "transport_routes",
    "transport_stops",
    "transport_alerts",
    "libraries",
    "books",
    "borrowings",
    "payments",
    "chat_history",
    "audit_logs"
  ];

  for (const table of dropTables) {
    try {
      await db.execute(sql.raw(`DROP TABLE IF EXISTS "${table}" CASCADE;`));
      console.log(`Dropped table ${table}`);
    } catch (err: any) {
      console.error(`Error dropping ${table}:`, err.message);
    }
  }

  console.log("Old tables dropped cleanly. Ready for drizzle-kit push.");
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
