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
    { id: randomUUID(), name: "Gandhipuram Multi-Level Parking", address: "Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu 641012", latitude: 11.0168, longitude: 76.9558, totalSpots: 200, availableSpots: 47, pricePerHour: 30, openingTime: "06:00", closingTime: "23:00", amenities: ["EV Charging", "CCTV", "Disabled Access"] },
    { id: randomUUID(), name: "Ukkadam Lakefront Parking Lot", address: "Ukkadam Bypass Road, Ukkadam, Coimbatore, Tamil Nadu 641001", latitude: 10.9950, longitude: 76.9620, totalSpots: 150, availableSpots: 92, pricePerHour: 20, openingTime: "05:00", closingTime: "24:00", amenities: ["CCTV", "24/7"] },
    { id: randomUUID(), name: "TIDEL Park IT Garage", address: "Civil Aerodrome Post, Peelamedu, Coimbatore, Tamil Nadu 641014", latitude: 11.0280, longitude: 77.0270, totalSpots: 400, availableSpots: 215, pricePerHour: 40, openingTime: "06:00", closingTime: "22:00", amenities: ["EV Charging", "CCTV", "Car Wash", "Disabled Access"] },
  ]).onConflictDoNothing().returning();
  console.log(`Seeded ${lots.length} parking lots`);

  // Transport Routes
  const routes = await db.insert(transportRoutesTable).values([
    { id: randomUUID(), routeNumber: "B-101", name: "Gandhipuram — Airport Express", type: "bus", origin: "Gandhipuram Town Bus Stand", destination: "Coimbatore International Airport", frequency: 15, operatingHours: "05:00–23:30", fare: 25, totalStops: 12 },
    { id: randomUUID(), routeNumber: "M-1", name: "Railway Station — Marudhamalai Route", type: "bus", origin: "Coimbatore Junction Railway Station", destination: "Marudhamalai Murugan Temple", frequency: 10, operatingHours: "05:30–22:30", fare: 20, totalStops: 18 },
    { id: randomUUID(), routeNumber: "T-3", name: "Ukkadam — Singanallur Express", type: "bus", origin: "Ukkadam Central Bus Terminal", destination: "Singanallur Bus Stand", frequency: 8, operatingHours: "06:00–22:00", fare: 15, totalStops: 9 },
  ]).onConflictDoNothing().returning();

  if (routes.length > 0) {
    const route1 = routes[0];
    await db.insert(transportStopsTable).values([
      { id: randomUUID(), routeId: route1.id, name: "Gandhipuram Bus Stand", sequence: 1, latitude: 11.0168, longitude: 76.9558, arrivalTime: "05:00" },
      { id: randomUUID(), routeId: route1.id, name: "Lakshmi Mills Junction", sequence: 2, latitude: 11.0102, longitude: 76.9790, arrivalTime: "05:08" },
      { id: randomUUID(), routeId: route1.id, name: "Peelamedu / PSG Tech", sequence: 3, latitude: 11.0245, longitude: 77.0028, arrivalTime: "05:14" },
      { id: randomUUID(), routeId: route1.id, name: "Coimbatore Airport (CJB)", sequence: 4, latitude: 11.0300, longitude: 77.0434, arrivalTime: "05:22" },
    ]).onConflictDoNothing();
  }
  console.log(`Seeded ${routes.length} transport routes`);

  await db.insert(transportAlertsTable).values([
    { id: randomUUID(), routeId: routes[0]?.id, title: "Minor delay on B-101", message: "Bus route B-101 is running 10 minutes late due to flyover construction work on Avinashi Road.", severity: "info", expiresAt: new Date(Date.now() + 86400000) },
    { id: randomUUID(), routeId: routes[1]?.id, title: "Weekend pilgrim extra service", message: "Marudhamalai route buses will operate extra trips on Sunday morning for Temple pilgrims.", severity: "warning" },
  ]).onConflictDoNothing();

  // Parks
  await db.insert(parksTable).values([
    { id: randomUUID(), name: "VOC Park & Zoo", description: "Coimbatore's premier civic park featuring lush gardens, a children's play area, miniature train rides, and animal enclosures.", address: "Park Gate Road, Gopalapuram, Coimbatore, Tamil Nadu 641018", latitude: 11.0020, longitude: 76.9720, area: 45.5, openingTime: "05:00", closingTime: "22:00", amenities: ["Walking Trails", "Children's Playground", "Toy Train", "Food Kiosks", "Restrooms", "Parking"] },
    { id: randomUUID(), name: "Valankulam Lakefront Promenade", description: "A serene water-front park featuring paved walking paths, deck views of Valankulam lake, and evening lighting.", address: "Ukkadam Lake Road, Coimbatore, Tamil Nadu 641001", latitude: 10.9920, longitude: 76.9610, area: 12.3, openingTime: "06:00", closingTime: "20:00", amenities: ["Lakefront Deck", "Benches", "Walking Path", "Sunset Viewpoint", "Illuminated Fountains"] },
    { id: randomUUID(), name: "Kurichi Lake Eco Park", description: "Modern rejuvenated eco-park with outdoor fitness stations, cycling tracks, and food stalls.", address: "Sundarapuram, Podanur Road, Coimbatore, Tamil Nadu 641021", latitude: 10.9560, longitude: 76.9680, area: 8.0, openingTime: "00:00", closingTime: "23:59", amenities: ["Cycling Track", "Outdoor Gym", "Food Court", "Wi-Fi Zone", "Seating Area"] },
  ]).onConflictDoNothing();

  // Libraries
  const libraries = await db.insert(librariesTable).values([
    { id: randomUUID(), name: "District Central Library", address: "Cowley Brown Road, RS Puram, Coimbatore, Tamil Nadu 641002", phone: "+91-422-2541201", openingTime: "08:00", closingTime: "20:00", totalBooks: 85000, availableBooks: 62000 },
    { id: randomUUID(), name: "Singanallur Branch Library", address: "Trichy Road, Singanallur, Coimbatore, Tamil Nadu 641005", phone: "+91-422-2578202", openingTime: "09:00", closingTime: "19:00", totalBooks: 22000, availableBooks: 18500 },
  ]).onConflictDoNothing().returning();

  if (libraries.length > 0) {
    await db.insert(booksTable).values([
      { id: randomUUID(), libraryId: libraries[0].id, title: "The History of Kongu Nadu", author: "K. S. Vaidyanathan", isbn: "978-0-123456-78-9", genre: "History", publishedYear: 2022, totalCopies: 5, availableCopies: 3 },
      { id: randomUUID(), libraryId: libraries[0].id, title: "Coimbatore: Textile City of South India", author: "Dr. R. Palaniswamy", isbn: "978-0-987654-32-1", genre: "Local Heritage", publishedYear: 2023, totalCopies: 4, availableCopies: 4 },
      { id: randomUUID(), libraryId: libraries[0].id, title: "Urban Transport Solutions for Indian Cities", author: "S. Subramanian", isbn: "978-0-246813-57-1", genre: "Engineering", publishedYear: 2021, totalCopies: 3, availableCopies: 2 },
      { id: randomUUID(), libraryId: libraries[1].id, title: "Tamil Literature & Cultural Heritage", author: "V. Kalyanasundaram", isbn: "978-0-135792-46-8", genre: "Literature", publishedYear: 2020, totalCopies: 6, availableCopies: 5 },
      { id: randomUUID(), libraryId: libraries[1].id, title: "Sustainable Eco-Cities of Tomorrow", author: "Dr. A. Meenakshi", isbn: "978-0-864209-13-5", genre: "Environment", publishedYear: 2023, totalCopies: 4, availableCopies: 4 },
    ]).onConflictDoNothing();
  }
  console.log(`Seeded ${libraries.length} libraries with books`);

  console.log("Seed complete!");
}

seed().catch(e => { console.error(e); process.exit(1); });
