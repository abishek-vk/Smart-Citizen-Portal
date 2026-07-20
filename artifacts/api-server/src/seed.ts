import {
  db,
  usersTable, departmentsTable, complaintsTable, propertyTaxesTable, waterTaxesTable,
  certificatesTable, garbageRequestsTable, parkingLotsTable, parkingReservationsTable,
  transportRoutesTable, transportStopsTable, transportAlertsTable,
  parksTable, librariesTable, booksTable, borrowingsTable,
  paymentsTable, notificationsTable, feedbackTable, chatHistoryTable,
} from "@workspace/db";
import { randomUUID } from "crypto";

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

  // Parking Lots
  const lots = await db.insert(parkingLotsTable).values([
    { id: randomUUID(), name: "City Centre Parking", address: "1 Main St", latitude: 40.7128, longitude: -74.006, totalSpots: 200, availableSpots: 47, pricePerHour: 3.5, openingTime: "06:00", closingTime: "23:00", amenities: ["EV Charging", "CCTV", "Disabled Access"] },
    { id: randomUUID(), name: "Riverside Lot A", address: "45 River Rd", latitude: 40.7148, longitude: -74.009, totalSpots: 150, availableSpots: 92, pricePerHour: 2.0, openingTime: "05:00", closingTime: "24:00", amenities: ["CCTV", "24/7"] },
    { id: randomUUID(), name: "Tech Park Garage", address: "200 Innovation Ave", latitude: 40.7108, longitude: -74.003, totalSpots: 400, availableSpots: 215, pricePerHour: 4.0, openingTime: "06:00", closingTime: "22:00", amenities: ["EV Charging", "CCTV", "Car Wash", "Disabled Access"] },
  ]).onConflictDoNothing().returning();
  console.log(`Seeded ${lots.length} parking lots`);

  // Transport Routes
  const routes = await db.insert(transportRoutesTable).values([
    { id: randomUUID(), routeNumber: "B-101", name: "City Centre — Airport Express", type: "bus", origin: "City Hall", destination: "International Airport", frequency: 15, operatingHours: "05:00–23:30", fare: 2.5, totalStops: 12 },
    { id: randomUUID(), routeNumber: "M-1", name: "Red Line Metro", type: "metro", origin: "North Terminal", destination: "South Station", frequency: 5, operatingHours: "06:00–00:00", fare: 1.8, totalStops: 18 },
    { id: randomUUID(), routeNumber: "T-3", name: "Waterfront Tram", type: "tram", origin: "Museum Square", destination: "Harbour Front", frequency: 8, operatingHours: "07:00–22:00", fare: 1.5, totalStops: 9 },
  ]).onConflictDoNothing().returning();

  if (routes.length > 0) {
    const route1 = routes[0];
    await db.insert(transportStopsTable).values([
      { id: randomUUID(), routeId: route1.id, name: "City Hall", sequence: 1, latitude: 40.7128, longitude: -74.006, arrivalTime: "05:00" },
      { id: randomUUID(), routeId: route1.id, name: "Central Station", sequence: 2, latitude: 40.7138, longitude: -74.008, arrivalTime: "05:08" },
      { id: randomUUID(), routeId: route1.id, name: "Business District", sequence: 3, latitude: 40.7118, longitude: -74.004, arrivalTime: "05:14" },
    ]).onConflictDoNothing();
  }
  console.log(`Seeded ${routes.length} transport routes`);

  await db.insert(transportAlertsTable).values([
    { id: randomUUID(), routeId: routes[0]?.id, title: "Minor delay on B-101", message: "Bus route B-101 is running 5 minutes late due to roadworks on Main St.", severity: "info", expiresAt: new Date(Date.now() + 86400000) },
    { id: randomUUID(), routeId: routes[1]?.id, title: "Weekend service changes", message: "Red Line Metro will operate reduced frequency on Saturday 06:00–10:00 for maintenance.", severity: "warning" },
  ]).onConflictDoNothing();

  // Parks
  await db.insert(parksTable).values([
    { id: randomUUID(), name: "Riverside Central Park", description: "The city's largest green space with walking trails, sports courts, and a children's play area.", address: "Park Lane, Central District", latitude: 40.7158, longitude: -74.012, area: 45.5, openingTime: "05:00", closingTime: "22:00", amenities: ["Walking Trails", "Sports Courts", "Playground", "Cafe", "Restrooms", "Parking"] },
    { id: randomUUID(), name: "Sunrise Gardens", description: "A serene botanical garden featuring native plants and seasonal flower exhibitions.", address: "Garden Ave, East Side", latitude: 40.7098, longitude: -73.998, area: 12.3, openingTime: "06:00", closingTime: "20:00", amenities: ["Botanical Garden", "Benches", "Photography Area", "Guided Tours"] },
    { id: randomUUID(), name: "Innovation Square", description: "Modern urban park with outdoor seating, food trucks, and a weekend farmers market.", address: "Innovation Blvd, Tech District", latitude: 40.7115, longitude: -74.001, area: 8.0, openingTime: "00:00", closingTime: "23:59", amenities: ["Food Trucks", "Farmers Market", "Wi-Fi", "Seating Area", "Events Stage"] },
  ]).onConflictDoNothing();

  // Libraries
  const libraries = await db.insert(librariesTable).values([
    { id: randomUUID(), name: "Central Public Library", address: "10 Knowledge Square, City Centre", phone: "+1-555-0201", openingTime: "09:00", closingTime: "21:00", totalBooks: 85000, availableBooks: 62000 },
    { id: randomUUID(), name: "Eastside Community Library", address: "55 Reading Lane, East District", phone: "+1-555-0202", openingTime: "10:00", closingTime: "19:00", totalBooks: 22000, availableBooks: 18500 },
  ]).onConflictDoNothing().returning();

  if (libraries.length > 0) {
    await db.insert(booksTable).values([
      { id: randomUUID(), libraryId: libraries[0].id, title: "The Smart City Handbook", author: "Dr. Jane Morrison", isbn: "978-0-123456-78-9", genre: "Urban Planning", publishedYear: 2022, totalCopies: 5, availableCopies: 3 },
      { id: randomUUID(), libraryId: libraries[0].id, title: "Data-Driven Governance", author: "Prof. Michael Zhang", isbn: "978-0-987654-32-1", genre: "Technology & Society", publishedYear: 2023, totalCopies: 4, availableCopies: 4 },
      { id: randomUUID(), libraryId: libraries[0].id, title: "Urban Transport Solutions", author: "Sarah Williams", isbn: "978-0-246813-57-1", genre: "Engineering", publishedYear: 2021, totalCopies: 3, availableCopies: 2 },
      { id: randomUUID(), libraryId: libraries[1].id, title: "Community & Democracy", author: "Carlos Mendes", isbn: "978-0-135792-46-8", genre: "Political Science", publishedYear: 2020, totalCopies: 6, availableCopies: 5 },
      { id: randomUUID(), libraryId: libraries[1].id, title: "Green Cities of Tomorrow", author: "Liu Wei & Priya Nair", isbn: "978-0-864209-13-5", genre: "Environment", publishedYear: 2023, totalCopies: 4, availableCopies: 4 },
    ]).onConflictDoNothing();
  }
  console.log(`Seeded ${libraries.length} libraries with books`);

  console.log("Seed complete!");
}

seed().catch(e => { console.error(e); process.exit(1); });
