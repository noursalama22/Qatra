import { db } from "./db";
import {
  usersTable, ngosTable, providersTable, driversTable, zonesTable,
  distributionTasksTable, deliveryOrdersTable, citizensTable, gpsPositionsTable,
} from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding Gaza data...");

  await db.insert(usersTable).values([
    { id: "seed-u1", email: "ops@wash-gaza.org",      firstName: "أحمد",    lastName: "أبو حسن"   },
    { id: "seed-u2", email: "water@unrwa-gaza.org",   firstName: "سمر",     lastName: "الكحلوت"   },
    { id: "seed-u3", email: "ops@meyah-januob.ps",    firstName: "محمود",   lastName: "الشريف"    },
    { id: "seed-u4", email: "fleet@meyah-amal.ps",    firstName: "خالد",    lastName: "العمل"     },
    { id: "seed-u5", email: "driver1@qatra.ps",       firstName: "يوسف",    lastName: "البطران"   },
    { id: "seed-u6", email: "driver2@qatra.ps",       firstName: "نادر",    lastName: "أبو عوض"   },
    { id: "seed-u7", email: "citizen1@qatra.ps",      firstName: "فاطمة",   lastName: "الغلبان"   },
  ]).onConflictDoNothing();

  await db.insert(ngosTable).values([
    { id: "seed-n1", userId: "seed-u1", orgName: "برنامج WASH غزة",       contactEmail: "ops@wash-gaza.org",    country: "فلسطين", status: "approved", description: "توزيع مياه الشرب النظيفة لسكان قطاع غزة" },
    { id: "seed-n2", userId: "seed-u2", orgName: "خدمات مياه الأونروا",   contactEmail: "water@unrwa-gaza.org", country: "فلسطين", status: "approved", description: "الدعم الإنساني للمخيمات وسكان قطاع غزة" },
  ]).onConflictDoNothing();

  await db.insert(providersTable).values([
    { id: "seed-p1", userId: "seed-u3", companyName: "شركة مياه الجنوب",  contactEmail: "ops@meyah-januob.ps",  status: "approved", operatingModes: ["humanitarian", "commercial"], description: "أكبر مشغّل مياه في الجزء الجنوبي من غزة" },
    { id: "seed-p2", userId: "seed-u4", companyName: "مياه الأمل",         contactEmail: "fleet@meyah-amal.ps",  status: "approved", operatingModes: ["commercial"],                 description: "توصيل مياه تجاري — الوسطى وخان يونس"  },
  ]).onConflictDoNothing();

  // ── Gaza zone boundaries (lat/lng rectangles) ───────────────────────────
  const boundaries: Record<string, [number, number][]> = {
    "seed-z1": [[31.558, 34.430], [31.558, 34.540], [31.488, 34.540], [31.488, 34.430]], // شمال غزة / جباليا
    "seed-z2": [[31.520, 34.420], [31.520, 34.510], [31.460, 34.510], [31.460, 34.420]], // مدينة غزة
    "seed-z3": [[31.450, 34.280], [31.450, 34.420], [31.380, 34.420], [31.380, 34.280]], // الوسطى / دير البلح
    "seed-z4": [[31.380, 34.240], [31.380, 34.370], [31.315, 34.370], [31.315, 34.240]], // خان يونس
    "seed-z5": [[31.315, 34.210], [31.315, 34.350], [31.245, 34.350], [31.245, 34.210]], // رفح
  };

  await db.insert(zonesTable).values([
    { id: "seed-z1", ngoId: "seed-n1", name: "شمال غزة / جباليا",  status: "active",   populationEstimate: 450000, signalCount: 847, description: "المنطقة الشمالية — كثافة عالية جداً ونقص حاد بالمياه", lastDeliveryAt: new Date("2026-05-21T06:00:00Z"), boundary: boundaries["seed-z1"] },
    { id: "seed-z2", ngoId: "seed-n1", name: "مدينة غزة — المركز", status: "active",   populationEstimate: 750000, signalCount: 1240,description: "قلب المدينة — تضم أعلى تركيز سكاني",                lastDeliveryAt: new Date("2026-05-20T08:00:00Z"), boundary: boundaries["seed-z2"] },
    { id: "seed-z3", ngoId: "seed-n2", name: "الوسطى / دير البلح", status: "active",   populationEstimate: 300000, signalCount: 523, description: "المنطقة الوسطى — يصلها التوصيل بصعوبة أحياناً",       lastDeliveryAt: new Date("2026-05-22T10:00:00Z"), boundary: boundaries["seed-z3"] },
    { id: "seed-z4", ngoId: "seed-n2", name: "خان يونس",            status: "active",   populationEstimate: 380000, signalCount: 689, description: "جنوب غزة — نقاط تجمع النازحين",                       lastDeliveryAt: new Date("2026-05-23T07:00:00Z"), boundary: boundaries["seed-z4"] },
    { id: "seed-z5", ngoId: "seed-n2", name: "رفح",                  status: "inactive", populationEstimate: 280000, signalCount: 412, description: "أقصى الجنوب — وصول محدود بسبب الأوضاع الميدانية",     lastDeliveryAt: new Date("2026-05-15T09:00:00Z"), boundary: boundaries["seed-z5"] },
  ]).onConflictDoNothing();

  await db.insert(driversTable).values([
    { id: "seed-d1", userId: "seed-u5", driverType: "owned",       providerId: "seed-p1", status: "active", phone: "+970-599-123-456", vehicleType: "خزان مياه 5000 لتر" },
    { id: "seed-d2", userId: "seed-u6", driverType: "independent", providerId: null,       status: "active", phone: "+970-598-987-654", vehicleType: "بيكب 1000 لتر"      },
  ]).onConflictDoNothing();

  await db.insert(citizensTable).values([
    { id: "seed-c1", userId: "seed-u7", zoneId: "seed-z1" },
  ]).onConflictDoNothing();

  await db.insert(distributionTasksTable).values([
    { id: "seed-t1", ngoId: "seed-n1", zoneId: "seed-z2", status: "in_progress", quantityLiters: "50000", scheduledAt: new Date("2026-05-23T06:00:00Z"), notes: "أولوية قصوى — مدينة غزة" },
    { id: "seed-t2", ngoId: "seed-n1", zoneId: "seed-z1", status: "pending",     quantityLiters: "35000", scheduledAt: new Date("2026-05-24T07:00:00Z"), notes: "توزيع شمال جباليا"         },
    { id: "seed-t3", ngoId: "seed-n2", zoneId: "seed-z4", status: "pending",     quantityLiters: "28000", scheduledAt: new Date("2026-05-24T09:00:00Z")                                      },
    { id: "seed-t4", ngoId: "seed-n2", zoneId: "seed-z3", status: "delivered",   quantityLiters: "20000", scheduledAt: new Date("2026-05-22T10:00:00Z"), notes: "مُنجز — الوسطى"           },
    { id: "seed-t5", ngoId: "seed-n1", zoneId: "seed-z2", status: "pending",     quantityLiters: "40000", scheduledAt: new Date("2026-05-25T06:00:00Z")                                      },
    { id: "seed-t6", ngoId: "seed-n2", zoneId: "seed-z5", status: "cancelled",   quantityLiters: "15000", scheduledAt: new Date("2026-05-21T08:00:00Z"), notes: "ملغي — مناطق غير آمنة"   },
  ]).onConflictDoNothing();

  await db.insert(deliveryOrdersTable).values([
    { id: "seed-o1", citizenId: "seed-c1", providerId: "seed-p1", status: "delivered",  quantityLiters: "500",  totalAmount: "15.00" },
    { id: "seed-o2", citizenId: "seed-c1", providerId: "seed-p2", status: "dispatched", quantityLiters: "1000", totalAmount: "28.00" },
    { id: "seed-o3", citizenId: "seed-c1", providerId: "seed-p1", status: "pending",    quantityLiters: "750",  totalAmount: "21.00" },
  ]).onConflictDoNothing();

  // GPS positions near Gaza City (seed-d1 delivering in zone z2)
  // GPS for driver 2 near Khan Yunis (seed-d2)
  await db.insert(gpsPositionsTable).values([
    { id: "seed-g1", driverId: "seed-d1", lat: "31.496", lng: "34.462", accuracy: "5.2", recordedAt: new Date(Date.now() - 4 * 60000) },
    { id: "seed-g2", driverId: "seed-d1", lat: "31.499", lng: "34.468", accuracy: "4.8", recordedAt: new Date(Date.now() - 2 * 60000) },
    { id: "seed-g3", driverId: "seed-d1", lat: "31.502", lng: "34.472", accuracy: "4.1", recordedAt: new Date()                        },
    { id: "seed-g4", driverId: "seed-d2", lat: "31.346", lng: "34.308", accuracy: "7.3", recordedAt: new Date(Date.now() - 3 * 60000) },
    { id: "seed-g5", driverId: "seed-d2", lat: "31.350", lng: "34.315", accuracy: "6.1", recordedAt: new Date()                        },
  ]).onConflictDoNothing();

  console.log("✅ Gaza seed complete.");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
