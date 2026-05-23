import { db } from "./db";
import {
  usersTable, ngosTable, providersTable, driversTable, zonesTable,
  distributionTasksTable, deliveryOrdersTable, citizensTable, gpsPositionsTable,
} from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  await db.insert(usersTable).values([
    { id: "seed-u1", email: "ngo1@wateraid.sy",      firstName: "Amira",  lastName: "Hassan"  },
    { id: "seed-u2", email: "ngo2@aquarelief.org",   firstName: "Omar",   lastName: "Khalil"  },
    { id: "seed-u3", email: "provider1@fastwater.com",firstName: "Tariq",  lastName: "Saleh"   },
    { id: "seed-u4", email: "provider2@aquafleet.com",firstName: "Layla",  lastName: "Mahmoud" },
    { id: "seed-u5", email: "driver1@qatra.com",     firstName: "Bilal",  lastName: "Yusuf"   },
    { id: "seed-u6", email: "driver2@qatra.com",     firstName: "Rania",  lastName: "Ahmad"   },
    { id: "seed-u7", email: "citizen1@qatra.com",    firstName: "Sara",   lastName: "Ibrahim" },
  ]).onConflictDoNothing();

  await db.insert(ngosTable).values([
    { id: "seed-n1", userId: "seed-u1", orgName: "WaterAid Syria",  contactEmail: "ops@wateraid.sy",     country: "Syria", status: "approved", description: "Humanitarian water delivery NGO" },
    { id: "seed-n2", userId: "seed-u2", orgName: "AQUA Relief",     contactEmail: "info@aquarelief.org", country: "Syria", status: "approved", description: "Emergency water relief organization" },
  ]).onConflictDoNothing();

  await db.insert(providersTable).values([
    { id: "seed-p1", userId: "seed-u3", companyName: "FastWater Co.",  contactEmail: "ops@fastwater.com",   status: "approved", operatingModes: ["humanitarian","commercial"], description: "Regional water logistics" },
    { id: "seed-p2", userId: "seed-u4", companyName: "AquaFleet Ltd.", contactEmail: "fleet@aquafleet.com", status: "approved", operatingModes: ["commercial"],               description: "Commercial water fleet"    },
  ]).onConflictDoNothing();

  // Zone boundaries: arrays of [lat, lng] forming polygons around real Syrian cities
  const boundaries = {
    "seed-z1": [ // North Aleppo
      [36.28, 37.08], [36.28, 37.24], [36.20, 37.24], [36.20, 37.08]
    ],
    "seed-z2": [ // East Homs
      [34.78, 36.72], [34.78, 36.88], [34.68, 36.88], [34.68, 36.72]
    ],
    "seed-z3": [ // South Raqqa
      [35.88, 38.92], [35.88, 39.08], [35.78, 39.08], [35.78, 38.92]
    ],
    "seed-z4": [ // West Idlib
      [35.96, 36.52], [35.96, 36.68], [35.86, 36.68], [35.86, 36.52]
    ],
  };

  await db.insert(zonesTable).values([
    { id: "seed-z1", ngoId: "seed-n1", name: "North Aleppo", status: "active",   populationEstimate: 12000, signalCount: 47, description: "Northern residential district", lastDeliveryAt: new Date("2026-05-20T10:00:00Z"), boundary: boundaries["seed-z1"] },
    { id: "seed-z2", ngoId: "seed-n1", name: "East Homs",    status: "active",   populationEstimate:  8500, signalCount: 23, description: "Eastern suburb area",           lastDeliveryAt: new Date("2026-05-18T14:00:00Z"), boundary: boundaries["seed-z2"] },
    { id: "seed-z3", ngoId: "seed-n2", name: "South Raqqa",  status: "inactive", populationEstimate:  5000, signalCount:  8, description: "Southern village cluster",      lastDeliveryAt: new Date("2026-05-10T09:00:00Z"), boundary: boundaries["seed-z3"] },
    { id: "seed-z4", ngoId: "seed-n2", name: "West Idlib",   status: "active",   populationEstimate: 15000, signalCount: 62, description: "Western corridor settlements",   lastDeliveryAt: new Date("2026-05-22T08:00:00Z"), boundary: boundaries["seed-z4"] },
  ]).onConflictDoNothing();

  await db.insert(driversTable).values([
    { id: "seed-d1", userId: "seed-u5", driverType: "owned",       providerId: "seed-p1", status: "active", phone: "+963-912-345-678", vehicleType: "Water Tanker 5000L" },
    { id: "seed-d2", userId: "seed-u6", driverType: "independent", providerId: null,       status: "active", phone: "+963-933-222-111", vehicleType: "Pickup 1000L"       },
  ]).onConflictDoNothing();

  await db.insert(citizensTable).values([
    { id: "seed-c1", userId: "seed-u7", zoneId: "seed-z1" },
  ]).onConflictDoNothing();

  await db.insert(distributionTasksTable).values([
    { id: "seed-t1", ngoId: "seed-n1", zoneId: "seed-z1", status: "in_progress", quantityLiters: "15000", scheduledAt: new Date("2026-05-24T08:00:00Z"), notes: "Priority delivery"          },
    { id: "seed-t2", ngoId: "seed-n1", zoneId: "seed-z2", status: "pending",     quantityLiters: "8000",  scheduledAt: new Date("2026-05-25T10:00:00Z")                                        },
    { id: "seed-t3", ngoId: "seed-n2", zoneId: "seed-z4", status: "delivered",   quantityLiters: "20000", scheduledAt: new Date("2026-05-22T07:00:00Z"), notes: "Completed ahead of schedule" },
    { id: "seed-t4", ngoId: "seed-n2", zoneId: "seed-z3", status: "cancelled",   quantityLiters: "5000",  scheduledAt: new Date("2026-05-21T09:00:00Z"), notes: "Access denied"               },
    { id: "seed-t5", ngoId: "seed-n1", zoneId: "seed-z1", status: "pending",     quantityLiters: "12000", scheduledAt: new Date("2026-05-26T08:00:00Z")                                        },
  ]).onConflictDoNothing();

  await db.insert(deliveryOrdersTable).values([
    { id: "seed-o1", citizenId: "seed-c1", providerId: "seed-p1", status: "delivered", quantityLiters: "500",  totalAmount: "25.00" },
    { id: "seed-o2", citizenId: "seed-c1", providerId: "seed-p2", status: "dispatched",quantityLiters: "1000", totalAmount: "45.00" },
    { id: "seed-o3", citizenId: "seed-c1", providerId: "seed-p1", status: "pending",   quantityLiters: "750",  totalAmount: "35.00" },
  ]).onConflictDoNothing();

  // GPS positions — driver 1 near North Aleppo (active task), driver 2 near East Homs
  await db.insert(gpsPositionsTable).values([
    { id: "seed-g1", driverId: "seed-d1", lat: "36.235", lng: "37.165", accuracy: "8.5",  recordedAt: new Date(Date.now() - 2 * 60000)  },
    { id: "seed-g2", driverId: "seed-d1", lat: "36.240", lng: "37.170", accuracy: "6.2",  recordedAt: new Date(Date.now() - 1 * 60000)  },
    { id: "seed-g3", driverId: "seed-d1", lat: "36.244", lng: "37.175", accuracy: "5.0",  recordedAt: new Date()                         },
    { id: "seed-g4", driverId: "seed-d2", lat: "34.740", lng: "36.780", accuracy: "10.1", recordedAt: new Date(Date.now() - 5 * 60000)  },
    { id: "seed-g5", driverId: "seed-d2", lat: "34.748", lng: "36.790", accuracy: "7.8",  recordedAt: new Date()                         },
  ]).onConflictDoNothing();

  console.log("✅ Seed complete.");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
