import {
  db, parkingLotsTable, parksTable, librariesTable, booksTable,
  transportRoutesTable, transportAlertsTable,
} from "@workspace/db";
import { isNull, sql } from "drizzle-orm";
import { DISTRICTS } from "./data/tamil-nadu-districts";

// Upserts district data with stable ids, so it is safe to run again after editing the data file.
// Live counters (available spots / copies) are only set on first insert and never overwritten.
export async function seedDistricts(): Promise<void> {
  const excluded = (column: string) => sql.raw(`excluded."${column}"`);

  // Older demo rows have no district; hide them instead of deleting, because reservations,
  // borrowings and alerts may still reference them.
  await db.update(parkingLotsTable).set({ isActive: false }).where(isNull(parkingLotsTable.district));
  await db.update(parksTable).set({ isActive: false }).where(isNull(parksTable.district));
  await db.update(librariesTable).set({ isActive: false }).where(isNull(librariesTable.district));
  await db.update(transportRoutesTable).set({ isActive: false }).where(isNull(transportRoutesTable.district));

  for (const d of DISTRICTS) {
    if (d.parkingLots.length > 0) {
      await db.insert(parkingLotsTable).values(d.parkingLots.map((lot, i) => ({
        id: `${d.slug}-parking-${i + 1}`, district: d.name, ...lot,
        availableSpots: Math.round(lot.totalSpots * 0.4), isActive: true,
      }))).onConflictDoUpdate({
        target: parkingLotsTable.id,
        set: {
          name: excluded("name"), address: excluded("address"), district: excluded("district"),
          latitude: excluded("latitude"), longitude: excluded("longitude"), totalSpots: excluded("total_spots"),
          pricePerHour: excluded("price_per_hour"), openingTime: excluded("opening_time"),
          closingTime: excluded("closing_time"), amenities: excluded("amenities"), isActive: true,
        },
      });
    }

    if (d.parks.length > 0) {
      await db.insert(parksTable).values(d.parks.map((park, i) => ({
        id: `${d.slug}-park-${i + 1}`, district: d.name, ...park, isActive: true,
      }))).onConflictDoUpdate({
        target: parksTable.id,
        set: {
          name: excluded("name"), description: excluded("description"), address: excluded("address"),
          district: excluded("district"), latitude: excluded("latitude"), longitude: excluded("longitude"),
          area: excluded("area"), openingTime: excluded("opening_time"), closingTime: excluded("closing_time"),
          amenities: excluded("amenities"), isActive: true,
        },
      });
    }

    for (const [i, lib] of d.libraries.entries()) {
      const libraryId = `${d.slug}-library-${i + 1}`;
      await db.insert(librariesTable).values({
        id: libraryId, district: d.name, name: lib.name, address: lib.address,
        // Public library phone numbers are not verified, so none is shown
        phone: "Not listed", openingTime: lib.openingTime, closingTime: lib.closingTime,
        totalBooks: lib.totalBooks, availableBooks: Math.round(lib.totalBooks * 0.85), isActive: true,
      }).onConflictDoUpdate({
        target: librariesTable.id,
        set: {
          name: excluded("name"), address: excluded("address"), district: excluded("district"),
          openingTime: excluded("opening_time"), closingTime: excluded("closing_time"),
          totalBooks: excluded("total_books"), isActive: true,
        },
      });

      if (lib.books.length > 0) {
        await db.insert(booksTable).values(lib.books.map((b, j) => ({
          id: `${libraryId}-book-${j + 1}`, libraryId, title: b.title, author: b.author, isbn: null,
          genre: b.genre, publishedYear: b.publishedYear, totalCopies: b.totalCopies, availableCopies: b.totalCopies,
        }))).onConflictDoUpdate({
          target: booksTable.id,
          set: {
            title: excluded("title"), author: excluded("author"), genre: excluded("genre"),
            publishedYear: excluded("published_year"), totalCopies: excluded("total_copies"),
          },
        });
      }
    }

    for (const route of d.routes) {
      const routeId = `${d.slug}-route-${route.code.toLowerCase()}`;
      await db.insert(transportRoutesTable).values({
        id: routeId, district: d.name, routeNumber: route.code, name: route.name, type: route.type,
        origin: route.origin, destination: route.destination, frequency: route.frequency,
        operatingHours: route.operatingHours, fare: route.fare, totalStops: route.totalStops, isActive: true,
      }).onConflictDoUpdate({
        target: transportRoutesTable.id,
        set: {
          routeNumber: excluded("route_number"), name: excluded("name"), type: excluded("type"),
          district: excluded("district"), origin: excluded("origin"), destination: excluded("destination"),
          frequency: excluded("frequency"), operatingHours: excluded("operating_hours"), fare: excluded("fare"),
          totalStops: excluded("total_stops"), isActive: true,
        },
      });

      if (route.alert) {
        await db.insert(transportAlertsTable).values({
          id: `${routeId}-alert`, routeId, ...route.alert, expiresAt: null,
        }).onConflictDoUpdate({
          target: transportAlertsTable.id,
          set: { title: excluded("title"), message: excluded("message"), severity: excluded("severity") },
        });
      }
    }

    console.log(`Seeded ${d.name}: ${d.parkingLots.length} parking lots, ${d.parks.length} parks, ${d.libraries.length} libraries, ${d.routes.length} routes`);
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("seed-districts.ts")) {
  seedDistricts()
    .then(() => process.exit(0))
    .catch(e => { console.error(e); process.exit(1); });
}
