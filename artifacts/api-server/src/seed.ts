import {
  db,
  usersTable, departmentsTable, complaintsTable, propertyTaxesTable, waterTaxesTable,
  certificatesTable, garbageRequestsTable, parkingLotsTable, parkingReservationsTable,
  transportRoutesTable, transportStopsTable, transportAlertsTable,
  parksTable, librariesTable, booksTable, borrowingsTable,
  paymentsTable, notificationsTable, feedbackTable, chatHistoryTable,
} from "@workspace/db";
import { randomUUID } from "crypto";
import { seedDistricts } from "./seed-districts";

async function seed() {
  console.log("Seeding database...");

  // Departments
  const depts = await db.insert(departmentsTable).values([
    { id: randomUUID(), name: "Public Works", code: "PW", description: "Roads, drainage, infrastructure", headName: "Robert Chen", email: "pw@smartcity.gov", phone: "+1-555-0101" },
    { id: randomUUID(), name: "Water & Sanitation", code: "WS", description: "Water supply and garbage", headName: "Maria Santos", email: "ws@smartcity.gov", phone: "+1-555-0102" },
    { id: randomUUID(), name: "Electricity Board", code: "EB", description: "Power supply and street lights", headName: "James Kumar", email: "eb@smartcity.gov", phone: "+1-555-0103" },
    { id: randomUUID(), name: "Transport Authority", code: "TA", description: "Bus, metro and tram services", headName: "Linda Park", email: "ta@smartcity.gov", phone: "+1-555-0104" },
    { id: randomUUID(), name: "Parks & Recreation", code: "PR", description: "Parks, gardens and libraries", headName: "Ahmed Ali", email: "pr@smartcity.gov", phone: "+1-555-0105" },
  ]).onConflictDoNothing().returning();
  console.log(`Seeded ${depts.length} departments`);

  // Parking lots, transport routes, parks and libraries for 10 Tamil Nadu districts
  await seedDistricts();

  console.log("Seed complete!");
}

seed().catch(e => { console.error(e); process.exit(1); });
