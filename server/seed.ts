import { db } from "./db";
import {
  usersTable, ngosTable, providersTable, driversTable, zonesTable,
  distributionTasksTable, deliveryOrdersTable, citizensTable, gpsPositionsTable,
  userRolesTable, regionsTable, providerRegionRatesTable, ngoContractsTable,
  providerNgoTasksTable, driverTasksTable,
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { scryptSync, randomBytes } from "node:crypto";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function daysAgo(n: number, hour = 8) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function seed() {
  console.log("🌱 Seeding Gaza data...");
  const demoPasswordHash = hashPassword("qatra12345");

  await db.insert(usersTable).values([
    { id: "seed-u1", email: "ops@wash-gaza.org",      firstName: "أحمد",    lastName: "أبو حسن", passwordHash: demoPasswordHash },
    { id: "seed-u2", email: "water@unrwa-gaza.org",   firstName: "سمر",     lastName: "الكحلوت", passwordHash: demoPasswordHash },
    { id: "seed-u3", email: "ops@meyah-januob.ps",    firstName: "محمود",   lastName: "الشريف", passwordHash: demoPasswordHash },
    { id: "seed-u4", email: "fleet@meyah-amal.ps",    firstName: "خالد",    lastName: "العمل", passwordHash: demoPasswordHash },
    { id: "seed-u5", email: "driver1@qatra.ps",       firstName: "يوسف",    lastName: "البطران", passwordHash: demoPasswordHash },
    { id: "seed-u6", email: "driver2@qatra.ps",       firstName: "نادر",    lastName: "أبو عوض", passwordHash: demoPasswordHash },
    { id: "seed-u7", email: "citizen1@qatra.ps",      firstName: "فاطمة",   lastName: "الغلبان", passwordHash: demoPasswordHash },
  ]).onConflictDoNothing();

  for (const id of ["seed-u1", "seed-u2", "seed-u3", "seed-u4", "seed-u5", "seed-u6", "seed-u7"]) {
    await db.update(usersTable).set({ passwordHash: demoPasswordHash }).where(eq(usersTable.id, id));
  }

  await db.insert(ngosTable).values([
    { id: "seed-n1", userId: "seed-u1", orgName: "برنامج WASH غزة",       contactEmail: "ops@wash-gaza.org",    country: "فلسطين", status: "approved", description: "توزيع مياه الشرب النظيفة لسكان قطاع غزة" },
    { id: "seed-n2", userId: "seed-u2", orgName: "خدمات مياه الأونروا",   contactEmail: "water@unrwa-gaza.org", country: "فلسطين", status: "approved", description: "الدعم الإنساني للمخيمات وسكان قطاع غزة" },
  ]).onConflictDoNothing();

  await db.insert(providersTable).values([
    { id: "seed-p1", userId: "seed-u3", companyName: "شركة مياه الجنوب",  contactEmail: "ops@meyah-januob.ps",  status: "approved", operatingModes: ["humanitarian", "commercial"], description: "أكبر مشغّل مياه في الجزء الجنوبي من غزة" },
    { id: "seed-p2", userId: "seed-u4", companyName: "مياه الأمل",         contactEmail: "fleet@meyah-amal.ps",  status: "approved", operatingModes: ["humanitarian", "commercial"], description: "توصيل مياه — الوسطى وخان يونس" },
  ]).onConflictDoNothing();

  await db.insert(regionsTable).values([
    { id: "seed-rg1", name: "شمال غزة",     description: "بيت لاهيا · بيت حانون · جباليا", sortOrder: 1 },
    { id: "seed-rg2", name: "مدينة غزة",    description: "المركز · الرمال · الشجاعية",      sortOrder: 2 },
    { id: "seed-rg3", name: "الوسطى",       description: "دير البلح · النصيرات · المغازي",  sortOrder: 3 },
    { id: "seed-rg4", name: "خان يونس",     description: "المدينة · بني سهيلا · المواصي",   sortOrder: 4 },
    { id: "seed-rg5", name: "رفح",          description: "رفح المدينة · تل السلطان",        sortOrder: 5 },
  ]).onConflictDoNothing();

  const rates: Array<{ providerId: string; regionId: string; pricePerLiter: string }> = [];
  const priceMatrix: Record<string, Record<string, string>> = {
    "seed-p1": { "seed-rg1": "0.048", "seed-rg2": "0.045", "seed-rg3": "0.042", "seed-rg4": "0.040", "seed-rg5": "0.038" },
    "seed-p2": { "seed-rg1": "0.044", "seed-rg2": "0.041", "seed-rg3": "0.039", "seed-rg4": "0.037", "seed-rg5": "0.035" },
  };
  for (const [providerId, regions] of Object.entries(priceMatrix)) {
    for (const [regionId, pricePerLiter] of Object.entries(regions)) {
      rates.push({ providerId, regionId, pricePerLiter });
    }
  }
  await db.insert(providerRegionRatesTable).values(
    rates.map((r, i) => ({ id: `seed-prr${i + 1}`, ...r, measurementUnit: "liter" })),
  ).onConflictDoNothing();

  // ── Gaza zone boundaries — precise polygons per neighbourhood ────────────
  const b: Record<string, [number, number][]> = {
    // 5 original large zones (kept for task FK compatibility)
    "seed-z1":  [[31.558, 34.430], [31.558, 34.540], [31.488, 34.540], [31.488, 34.430]],
    "seed-z2":  [[31.520, 34.420], [31.520, 34.510], [31.460, 34.510], [31.460, 34.420]],
    "seed-z3":  [[31.450, 34.280], [31.450, 34.420], [31.380, 34.420], [31.380, 34.280]],
    "seed-z4":  [[31.380, 34.240], [31.380, 34.370], [31.315, 34.370], [31.315, 34.240]],
    "seed-z5":  [[31.315, 34.210], [31.315, 34.350], [31.245, 34.350], [31.245, 34.210]],

    // ── NORTH GAZA ────────────────────────────────────────────────────────
    "seed-z6":  [[31.590, 34.415], [31.590, 34.492], [31.548, 34.492], [31.548, 34.415]], // بيت لاهيا
    "seed-z7":  [[31.590, 34.490], [31.590, 34.558], [31.530, 34.558], [31.530, 34.490]], // بيت حانون
    "seed-z8":  [[31.548, 34.460], [31.548, 34.513], [31.515, 34.513], [31.515, 34.460]], // جباليا المخيم

    // ── GAZA CITY ─────────────────────────────────────────────────────────
    "seed-z9":  [[31.546, 34.438], [31.546, 34.480], [31.518, 34.480], [31.518, 34.438]], // الشيخ رضوان
    "seed-z10": [[31.520, 34.436], [31.520, 34.475], [31.497, 34.475], [31.497, 34.436]], // الرمال
    "seed-z11": [[31.520, 34.477], [31.520, 34.538], [31.487, 34.538], [31.487, 34.477]], // الشجاعية
    "seed-z12": [[31.497, 34.450], [31.497, 34.478], [31.478, 34.478], [31.478, 34.450]], // الدرج
    "seed-z13": [[31.484, 34.460], [31.484, 34.505], [31.460, 34.505], [31.460, 34.460]], // الزيتون

    // ── MIDDLE AREA ───────────────────────────────────────────────────────
    "seed-z14": [[31.468, 34.368], [31.468, 34.420], [31.440, 34.420], [31.440, 34.368]], // النصيرات
    "seed-z15": [[31.440, 34.362], [31.440, 34.408], [31.418, 34.408], [31.418, 34.362]], // البريج
    "seed-z16": [[31.420, 34.358], [31.420, 34.403], [31.400, 34.403], [31.400, 34.358]], // المغازي
    "seed-z17": [[31.415, 34.338], [31.415, 34.368], [31.395, 34.368], [31.395, 34.338]], // دير البلح المدينة

    // ── KHAN YOUNIS ───────────────────────────────────────────────────────
    "seed-z18": [[31.368, 34.298], [31.368, 34.360], [31.335, 34.360], [31.335, 34.298]], // خان يونس المدينة
    "seed-z19": [[31.352, 34.353], [31.352, 34.382], [31.320, 34.382], [31.320, 34.353]], // بني سهيلا / خزاعة
    "seed-z20": [[31.370, 34.213], [31.370, 34.248], [31.295, 34.248], [31.295, 34.213]], // المواصي الجنوبية

    // ── RAFAH ─────────────────────────────────────────────────────────────
    "seed-z21": [[31.308, 34.228], [31.308, 34.295], [31.268, 34.295], [31.268, 34.228]], // رفح المدينة
    "seed-z22": [[31.278, 34.213], [31.278, 34.255], [31.248, 34.255], [31.248, 34.213]], // تل السلطان
  };

  await db.insert(zonesTable).values([
    // ── Original 5 large zones (FK anchors for existing tasks) ────────────
    { id: "seed-z1",  ngoId: "seed-n1", regionId: "seed-rg1", name: "شمال غزة / جباليا",    status: "active",   populationEstimate: 450000, signalCount: 847,  description: "المنطقة الشمالية — كثافة عالية جداً ونقص حاد بالمياه", lastDeliveryAt: new Date("2026-05-21T06:00:00Z"), boundary: b["seed-z1"] },
    { id: "seed-z2",  ngoId: "seed-n1", regionId: "seed-rg2", name: "مدينة غزة — المركز",   status: "active",   populationEstimate: 750000, signalCount: 1240, description: "قلب المدينة — تضم أعلى تركيز سكاني",                 lastDeliveryAt: new Date("2026-05-20T08:00:00Z"), boundary: b["seed-z2"] },
    { id: "seed-z3",  ngoId: "seed-n2", regionId: "seed-rg3", name: "الوسطى / دير البلح",   status: "active",   populationEstimate: 300000, signalCount: 523,  description: "المنطقة الوسطى — يصلها التوصيل بصعوبة أحياناً",        lastDeliveryAt: new Date("2026-05-22T10:00:00Z"), boundary: b["seed-z3"] },
    { id: "seed-z4",  ngoId: "seed-n2", regionId: "seed-rg4", name: "خان يونس",              status: "active",   populationEstimate: 380000, signalCount: 689,  description: "جنوب غزة — نقاط تجمع النازحين",                        lastDeliveryAt: new Date("2026-05-23T07:00:00Z"), boundary: b["seed-z4"] },
    { id: "seed-z5",  ngoId: "seed-n2", regionId: "seed-rg5", name: "رفح",                   status: "inactive", populationEstimate: 280000, signalCount: 412,  description: "أقصى الجنوب — وصول محدود بسبب الأوضاع الميدانية",      lastDeliveryAt: new Date("2026-05-15T09:00:00Z"), boundary: b["seed-z5"] },

    // ── North Gaza neighbourhoods ─────────────────────────────────────────
    { id: "seed-z6",  ngoId: "seed-n1", regionId: "seed-rg1", name: "بيت لاهيا",             status: "active",   populationEstimate: 88000,  signalCount: 195,  description: "الزاوية الشمالية الغربية — ساحلية، نقص مياه حاد",      lastDeliveryAt: new Date("2026-05-20T07:00:00Z"), boundary: b["seed-z6"] },
    { id: "seed-z7",  ngoId: "seed-n1", regionId: "seed-rg1", name: "بيت حانون",             status: "active",   populationEstimate: 68000,  signalCount: 158,  description: "الزاوية الشمالية الشرقية — مناطق صناعية سابقة",        lastDeliveryAt: new Date("2026-05-19T08:00:00Z"), boundary: b["seed-z7"] },
    { id: "seed-z8",  ngoId: "seed-n1", regionId: "seed-rg1", name: "جباليا المخيم",         status: "active",   populationEstimate: 130000, signalCount: 342,  description: "مخيم جباليا — أعلى كثافة سكانية في شمال غزة",          lastDeliveryAt: new Date("2026-05-21T09:00:00Z"), boundary: b["seed-z8"] },

    // ── Gaza City neighbourhoods ──────────────────────────────────────────
    { id: "seed-z9",  ngoId: "seed-n1", regionId: "seed-rg2", name: "الشيخ رضوان",           status: "active",   populationEstimate: 82000,  signalCount: 214,  description: "شمال مدينة غزة — تجمعات سكانية كثيفة",                 lastDeliveryAt: new Date("2026-05-22T06:00:00Z"), boundary: b["seed-z9"] },
    { id: "seed-z10", ngoId: "seed-n1", regionId: "seed-rg2", name: "الرمال",                 status: "active",   populationEstimate: 72000,  signalCount: 188,  description: "المنطقة الساحلية الوسطى — حي راقٍ سابقاً",              lastDeliveryAt: new Date("2026-05-21T10:00:00Z"), boundary: b["seed-z10"] },
    { id: "seed-z11", ngoId: "seed-n2", regionId: "seed-rg2", name: "الشجاعية",               status: "active",   populationEstimate: 105000, signalCount: 290,  description: "شرق مدينة غزة — تكتل سكاني كثيف",                      lastDeliveryAt: new Date("2026-05-20T07:00:00Z"), boundary: b["seed-z11"] },
    { id: "seed-z12", ngoId: "seed-n1", regionId: "seed-rg2", name: "الدرج",                  status: "active",   populationEstimate: 78000,  signalCount: 200,  description: "وسط-شرق غزة — قريب من الميناء",                        lastDeliveryAt: new Date("2026-05-23T08:00:00Z"), boundary: b["seed-z12"] },
    { id: "seed-z13", ngoId: "seed-n2", regionId: "seed-rg2", name: "الزيتون",                status: "active",   populationEstimate: 95000,  signalCount: 248,  description: "جنوب شرق غزة — حي قديم وكثيف السكان",                  lastDeliveryAt: new Date("2026-05-22T08:00:00Z"), boundary: b["seed-z13"] },

    // ── Central area neighbourhoods ───────────────────────────────────────
    { id: "seed-z14", ngoId: "seed-n2", regionId: "seed-rg3", name: "النصيرات",               status: "active",   populationEstimate: 98000,  signalCount: 262,  description: "مخيم النصيرات — المنطقة الوسطى الشمالية",               lastDeliveryAt: new Date("2026-05-21T08:00:00Z"), boundary: b["seed-z14"] },
    { id: "seed-z15", ngoId: "seed-n2", regionId: "seed-rg3", name: "البريج",                 status: "active",   populationEstimate: 58000,  signalCount: 142,  description: "مخيم البريج — وسط القطاع",                              lastDeliveryAt: new Date("2026-05-20T09:00:00Z"), boundary: b["seed-z15"] },
    { id: "seed-z16", ngoId: "seed-n1", regionId: "seed-rg3", name: "المغازي",                status: "active",   populationEstimate: 62000,  signalCount: 155,  description: "مخيم المغازي — يصعب الوصول إليه أحياناً",               lastDeliveryAt: new Date("2026-05-19T07:00:00Z"), boundary: b["seed-z16"] },
    { id: "seed-z17", ngoId: "seed-n1", regionId: "seed-rg3", name: "دير البلح المدينة",      status: "active",   populationEstimate: 77000,  signalCount: 198,  description: "مدينة دير البلح — مركز المنطقة الوسطى",                 lastDeliveryAt: new Date("2026-05-22T09:00:00Z"), boundary: b["seed-z17"] },

    // ── Khan Younis neighbourhoods ────────────────────────────────────────
    { id: "seed-z18", ngoId: "seed-n2", regionId: "seed-rg4", name: "خان يونس المدينة",       status: "active",   populationEstimate: 125000, signalCount: 322,  description: "مركز مدينة خان يونس — تكتل نازحين كبير",               lastDeliveryAt: new Date("2026-05-23T06:00:00Z"), boundary: b["seed-z18"] },
    { id: "seed-z19", ngoId: "seed-n2", regionId: "seed-rg4", name: "بني سهيلا / خزاعة",      status: "active",   populationEstimate: 48000,  signalCount: 112,  description: "شرق خان يونس — تضم مزارع ومناطق سكنية",                lastDeliveryAt: new Date("2026-05-20T10:00:00Z"), boundary: b["seed-z19"] },
    { id: "seed-z20", ngoId: "seed-n1", regionId: "seed-rg4", name: "المواصي الجنوبية",        status: "active",   populationEstimate: 95000,  signalCount: 276,  description: "الشريط الساحلي — كثافة نازحين عالية جداً",              lastDeliveryAt: new Date("2026-05-22T07:00:00Z"), boundary: b["seed-z20"] },

    // ── Rafah neighbourhoods ──────────────────────────────────────────────
    { id: "seed-z21", ngoId: "seed-n2", regionId: "seed-rg5", name: "رفح المدينة",            status: "active",   populationEstimate: 88000,  signalCount: 232,  description: "وسط مدينة رفح — تركيز نازحين من شمال القطاع",          lastDeliveryAt: new Date("2026-05-21T07:00:00Z"), boundary: b["seed-z21"] },
    { id: "seed-z22", ngoId: "seed-n2", regionId: "seed-rg5", name: "تل السلطان",             status: "active",   populationEstimate: 65000,  signalCount: 172,  description: "غرب رفح — منطقة مكتظة ووصول محدود للمياه",             lastDeliveryAt: new Date("2026-05-20T06:00:00Z"), boundary: b["seed-z22"] },
  ]).onConflictDoNothing();

  const zoneRegionMap: Record<string, string> = {
    "seed-z1": "seed-rg1", "seed-z6": "seed-rg1", "seed-z7": "seed-rg1", "seed-z8": "seed-rg1",
    "seed-z2": "seed-rg2", "seed-z9": "seed-rg2", "seed-z10": "seed-rg2", "seed-z11": "seed-rg2", "seed-z12": "seed-rg2", "seed-z13": "seed-rg2",
    "seed-z3": "seed-rg3", "seed-z14": "seed-rg3", "seed-z15": "seed-rg3", "seed-z16": "seed-rg3", "seed-z17": "seed-rg3",
    "seed-z4": "seed-rg4", "seed-z18": "seed-rg4", "seed-z19": "seed-rg4", "seed-z20": "seed-rg4",
    "seed-z5": "seed-rg5", "seed-z21": "seed-rg5", "seed-z22": "seed-rg5",
  };
  for (const [zoneId, regionId] of Object.entries(zoneRegionMap)) {
    await db.update(zonesTable).set({ regionId }).where(eq(zonesTable.id, zoneId));
  }

  await db.insert(driversTable).values([
    { id: "seed-d1", userId: "seed-u5", driverType: "owned",       providerId: "seed-p1", status: "active", phone: "+970-599-123-456", vehicleType: "خزان مياه", vehicleCapacityLiters: 5000, fullName: "يوسف البطران", plateNumber: "GZ-4821", zone: "مدينة غزة" },
    { id: "seed-d2", userId: "seed-u6", driverType: "independent", providerId: null,       status: "active", phone: "+970-598-987-654", vehicleType: "بيكب",       vehicleCapacityLiters: 1000, fullName: "نادر أبو عوض",  plateNumber: "GZ-7711", zone: "خان يونس" },
  ]).onConflictDoNothing();

  await db.update(driversTable).set({ fullName: "يوسف البطران", plateNumber: "GZ-4821", vehicleCapacityLiters: 5000, vehicleType: "خزان مياه", zone: "مدينة غزة" }).where(eq(driversTable.id, "seed-d1"));
  await db.update(driversTable).set({ fullName: "نادر أبو عوض",  plateNumber: "GZ-7711", vehicleCapacityLiters: 1000, vehicleType: "بيكب",       zone: "خان يونس" }).where(eq(driversTable.id, "seed-d2"));

  await db.insert(citizensTable).values([
    { id: "seed-c1", userId: "seed-u7", zoneId: "seed-z1" },
  ]).onConflictDoNothing();

  await db.insert(userRolesTable).values([
    { id: "seed-r1", userId: "seed-u1", role: "admin", status: "approved" },
    { id: "seed-r2", userId: "seed-u2", role: "ngo", status: "approved", profileId: "seed-n2" },
    { id: "seed-r3", userId: "seed-u3", role: "provider", status: "approved", profileId: "seed-p1" },
    { id: "seed-r4", userId: "seed-u4", role: "provider", status: "approved", profileId: "seed-p2" },
    { id: "seed-r5", userId: "seed-u5", role: "driver", status: "approved", profileId: "seed-d1" },
    { id: "seed-r6", userId: "seed-u6", role: "driver", status: "approved", profileId: "seed-d2" },
    { id: "seed-r7", userId: "seed-u7", role: "citizen", status: "approved", profileId: "seed-c1" },
  ]).onConflictDoNothing();

  await db.insert(distributionTasksTable).values([
    { id: "seed-t1", ngoId: "seed-n1", zoneId: "seed-z2",  status: "in_progress", quantityLiters: "50000", scheduledAt: new Date("2026-05-23T06:00:00Z"), notes: "أولوية قصوى — مدينة غزة"       },
    { id: "seed-t2", ngoId: "seed-n1", zoneId: "seed-z1",  status: "pending",     quantityLiters: "35000", scheduledAt: new Date("2026-05-24T07:00:00Z"), notes: "توزيع شمال جباليا"              },
    { id: "seed-t3", ngoId: "seed-n2", zoneId: "seed-z4",  status: "pending",     quantityLiters: "28000", scheduledAt: new Date("2026-05-24T09:00:00Z")                                          },
    { id: "seed-t4", ngoId: "seed-n2", zoneId: "seed-z3",  status: "delivered",   quantityLiters: "20000", scheduledAt: new Date("2026-05-22T10:00:00Z"), notes: "مُنجز — الوسطى"                },
    { id: "seed-t5", ngoId: "seed-n1", zoneId: "seed-z2",  status: "pending",     quantityLiters: "40000", scheduledAt: new Date("2026-05-25T06:00:00Z")                                          },
    { id: "seed-t6", ngoId: "seed-n2", zoneId: "seed-z5",  status: "cancelled",   quantityLiters: "15000", scheduledAt: new Date("2026-05-21T08:00:00Z"), notes: "ملغي — مناطق غير آمنة"         },
    { id: "seed-t7", ngoId: "seed-n2", zoneId: "seed-z8",  status: "pending",     quantityLiters: "22000", scheduledAt: new Date("2026-05-24T08:00:00Z"), notes: "جباليا المخيم — احتياج عاجل"   },
    { id: "seed-t8", ngoId: "seed-n1", zoneId: "seed-z11", status: "pending",     quantityLiters: "18000", scheduledAt: new Date("2026-05-25T10:00:00Z"), notes: "الشجاعية — مرحلة أولى"          },
    { id: "seed-t9", ngoId: "seed-n2", zoneId: "seed-z14", status: "in_progress", quantityLiters: "25000", scheduledAt: new Date("2026-05-23T08:00:00Z"), notes: "النصيرات — توزيع جارٍ"          },
  ]).onConflictDoNothing();

  await db.insert(deliveryOrdersTable).values([
    { id: "seed-o1", citizenId: "seed-c1", providerId: "seed-p1", status: "delivered",  quantityLiters: "500",  totalAmount: "15.00" },
    { id: "seed-o2", citizenId: "seed-c1", providerId: "seed-p2", status: "dispatched", quantityLiters: "1000", totalAmount: "28.00" },
    { id: "seed-o3", citizenId: "seed-c1", providerId: "seed-p1", status: "pending",    quantityLiters: "750",  totalAmount: "21.00" },
  ]).onConflictDoNothing();

  await db.insert(ngoContractsTable).values([
    { id: "seed-ct1", ngoId: "seed-n1", providerId: "seed-p1", regionId: "seed-rg2", dailyQuantityLiters: "50000", pricePerLiter: "0.045", status: "active", startDate: new Date("2026-04-01T00:00:00Z"), notes: "عقد توزيع يومي — مدينة غزة" },
    { id: "seed-ct2", ngoId: "seed-n1", providerId: "seed-p2", regionId: "seed-rg1", dailyQuantityLiters: "35000", pricePerLiter: "0.044", status: "active", startDate: new Date("2026-04-15T00:00:00Z"), notes: "عقد شمال غزة" },
    { id: "seed-ct3", ngoId: "seed-n1", providerId: "seed-p1", regionId: "seed-rg3", dailyQuantityLiters: "28000", pricePerLiter: "0.042", status: "pending", startDate: new Date("2026-05-20T00:00:00Z"), notes: "بانتظار الموافقة" },
  ]).onConflictDoNothing();

  // ── Demo data (refreshed on each seed run) ────────────────────────────────
  await db.delete(distributionTasksTable).where(sql`${distributionTasksTable.id} LIKE 'demo-%'`);
  await db.delete(ngoContractsTable).where(sql`${ngoContractsTable.id} LIKE 'demo-%'`);

  await db.insert(ngoContractsTable).values([
    { id: "demo-ct1", ngoId: "seed-n1", providerId: "seed-p2", regionId: "seed-rg2", dailyQuantityLiters: "42000", pricePerLiter: "0.041", status: "active", startDate: daysAgo(60), notes: "تغطية الرمال والشيخ رضوان" },
    { id: "demo-ct2", ngoId: "seed-n1", providerId: "seed-p1", regionId: "seed-rg4", dailyQuantityLiters: "32000", pricePerLiter: "0.040", status: "active", startDate: daysAgo(45), notes: "خان يونس — المواصي" },
    { id: "demo-ct3", ngoId: "seed-n1", providerId: "seed-p2", regionId: "seed-rg3", dailyQuantityLiters: "24000", pricePerLiter: "0.039", status: "active", startDate: daysAgo(30), notes: "الوسطى — النصيرات والمغازي" },
    { id: "demo-ct4", ngoId: "seed-n1", providerId: "seed-p1", regionId: "seed-rg5", dailyQuantityLiters: "18000", pricePerLiter: "0.038", status: "expired", startDate: daysAgo(90), endDate: daysAgo(10), notes: "منتهٍ — رفح" },
    { id: "demo-ct5", ngoId: "seed-n1", providerId: "seed-p2", regionId: "seed-rg5", dailyQuantityLiters: "22000", pricePerLiter: "0.035", status: "cancelled", startDate: daysAgo(20), notes: "ملغي — ظروف ميدانية" },
    { id: "demo-ct6", ngoId: "seed-n2", providerId: "seed-p1", regionId: "seed-rg3", dailyQuantityLiters: "30000", pricePerLiter: "0.042", status: "active", startDate: daysAgo(50), notes: "أونروا — الوسطى" },
    { id: "demo-ct7", ngoId: "seed-n2", providerId: "seed-p2", regionId: "seed-rg4", dailyQuantityLiters: "26000", pricePerLiter: "0.037", status: "active", startDate: daysAgo(40), notes: "أونروا — خان يونس" },
    { id: "demo-ct8", ngoId: "seed-n2", providerId: "seed-p1", regionId: "seed-rg2", dailyQuantityLiters: "38000", pricePerLiter: "0.045", status: "active", startDate: daysAgo(35), notes: "أونروا — الشجاعية" },
  ]);

  const demoTaskRows: Array<{
    id: string; ngoId: string; zoneId: string; status: "delivered" | "pending" | "in_progress" | "cancelled";
    quantityLiters: string; scheduledAt: Date; notes: string | null;
  }> = [
    // seed-n1 — last 30 days delivered (reports fuel)
    { id: "demo-t01", ngoId: "seed-n1", zoneId: "seed-z2",  status: "delivered", quantityLiters: "48000", scheduledAt: daysAgo(1, 6),  notes: "مدينة غزة — صباحي" },
    { id: "demo-t02", ngoId: "seed-n1", zoneId: "seed-z10", status: "delivered", quantityLiters: "32000", scheduledAt: daysAgo(2, 8),  notes: "الرمال" },
    { id: "demo-t03", ngoId: "seed-n1", zoneId: "seed-z9",  status: "delivered", quantityLiters: "28000", scheduledAt: daysAgo(3, 10), notes: "الشيخ رضوان" },
    { id: "demo-t04", ngoId: "seed-n1", zoneId: "seed-z1",  status: "delivered", quantityLiters: "52000", scheduledAt: daysAgo(4, 7),  notes: "شمال غزة" },
    { id: "demo-t05", ngoId: "seed-n1", zoneId: "seed-z8",  status: "delivered", quantityLiters: "41000", scheduledAt: daysAgo(5, 9),  notes: "جباليا المخيم" },
    { id: "demo-t06", ngoId: "seed-n1", zoneId: "seed-z17", status: "delivered", quantityLiters: "22000", scheduledAt: daysAgo(6, 8),  notes: "دير البلح" },
    { id: "demo-t07", ngoId: "seed-n1", zoneId: "seed-z2",  status: "delivered", quantityLiters: "55000", scheduledAt: daysAgo(8, 6),  notes: "مدينة غزة — أسبوع 2" },
    { id: "demo-t08", ngoId: "seed-n1", zoneId: "seed-z6",  status: "delivered", quantityLiters: "19000", scheduledAt: daysAgo(9, 11), notes: "بيت لاهيا" },
    { id: "demo-t09", ngoId: "seed-n1", zoneId: "seed-z12", status: "delivered", quantityLiters: "24000", scheduledAt: daysAgo(10, 7), notes: "الدرج" },
    { id: "demo-t10", ngoId: "seed-n1", zoneId: "seed-z20", status: "delivered", quantityLiters: "36000", scheduledAt: daysAgo(12, 8), notes: "المواصي" },
    { id: "demo-t11", ngoId: "seed-n1", zoneId: "seed-z2",  status: "delivered", quantityLiters: "47000", scheduledAt: daysAgo(14, 6), notes: null },
    { id: "demo-t12", ngoId: "seed-n1", zoneId: "seed-z16", status: "delivered", quantityLiters: "18000", scheduledAt: daysAgo(15, 10), notes: "المغازي" },
    { id: "demo-t13", ngoId: "seed-n1", zoneId: "seed-z8",  status: "delivered", quantityLiters: "39000", scheduledAt: daysAgo(17, 7), notes: null },
    { id: "demo-t14", ngoId: "seed-n1", zoneId: "seed-z10", status: "delivered", quantityLiters: "31000", scheduledAt: daysAgo(19, 9), notes: "الرمال" },
    { id: "demo-t15", ngoId: "seed-n1", zoneId: "seed-z1",  status: "delivered", quantityLiters: "44000", scheduledAt: daysAgo(21, 6), notes: null },
    { id: "demo-t16", ngoId: "seed-n1", zoneId: "seed-z9",  status: "delivered", quantityLiters: "26000", scheduledAt: daysAgo(23, 8), notes: null },
    { id: "demo-t17", ngoId: "seed-n1", zoneId: "seed-z2",  status: "delivered", quantityLiters: "51000", scheduledAt: daysAgo(25, 7), notes: "أسبوع 4" },
    { id: "demo-t18", ngoId: "seed-n1", zoneId: "seed-z17", status: "delivered", quantityLiters: "21000", scheduledAt: daysAgo(27, 10), notes: null },
    { id: "demo-t19", ngoId: "seed-n1", zoneId: "seed-z7",  status: "delivered", quantityLiters: "16000", scheduledAt: daysAgo(28, 8),  notes: "بيت حانون" },
    { id: "demo-t20", ngoId: "seed-n1", zoneId: "seed-z2",  status: "delivered", quantityLiters: "46000", scheduledAt: daysAgo(29, 6),  notes: null },
    // mix of non-delivered for efficiency metric
    { id: "demo-t21", ngoId: "seed-n1", zoneId: "seed-z2",  status: "pending",     quantityLiters: "40000", scheduledAt: daysAgo(0, 14), notes: "مجدول اليوم" },
    { id: "demo-t22", ngoId: "seed-n1", zoneId: "seed-z8",  status: "in_progress", quantityLiters: "35000", scheduledAt: daysAgo(0, 8),  notes: "جارٍ التوصيل" },
    { id: "demo-t23", ngoId: "seed-n1", zoneId: "seed-z11", status: "pending",     quantityLiters: "22000", scheduledAt: daysAgo(-2, 10), notes: "قادم" },
    { id: "demo-t24", ngoId: "seed-n1", zoneId: "seed-z5",  status: "cancelled",   quantityLiters: "12000", scheduledAt: daysAgo(11, 9),  notes: "ملغي" },
    // seed-n2 demo history
    { id: "demo-t25", ngoId: "seed-n2", zoneId: "seed-z14", status: "delivered", quantityLiters: "25000", scheduledAt: daysAgo(3, 8),  notes: "النصيرات" },
    { id: "demo-t26", ngoId: "seed-n2", zoneId: "seed-z18", status: "delivered", quantityLiters: "33000", scheduledAt: daysAgo(7, 7),  notes: "خان يونس" },
    { id: "demo-t27", ngoId: "seed-n2", zoneId: "seed-z11", status: "delivered", quantityLiters: "29000", scheduledAt: daysAgo(12, 9), notes: "الشجاعية" },
    { id: "demo-t28", ngoId: "seed-n2", zoneId: "seed-z21", status: "delivered", quantityLiters: "21000", scheduledAt: daysAgo(18, 8), notes: "رفح" },
    { id: "demo-t29", ngoId: "seed-n2", zoneId: "seed-z4",  status: "delivered", quantityLiters: "27000", scheduledAt: daysAgo(22, 6), notes: null },
    { id: "demo-t30", ngoId: "seed-n2", zoneId: "seed-z13", status: "delivered", quantityLiters: "23000", scheduledAt: daysAgo(26, 10), notes: "الزيتون" },
  ];
  await db.insert(distributionTasksTable).values(demoTaskRows);

  // ── Provider NGO Tasks & Driver Tasks (demo linkage) ─────────────────────
  await db.delete(driverTasksTable).where(sql`${driverTasksTable.id} LIKE 'seed-dt%'`);
  await db.delete(providerNgoTasksTable).where(sql`${providerNgoTasksTable.id} LIKE 'seed-pnt%'`);

  await db.insert(providerNgoTasksTable).values([
    { id: "seed-pnt1", distributionTaskId: "seed-t1", providerId: "seed-p1", assignedDriverId: "seed-d1", status: "in_progress" },
    { id: "seed-pnt2", distributionTaskId: "seed-t4", providerId: "seed-p1", assignedDriverId: "seed-d1", status: "delivered"   },
    { id: "seed-pnt3", distributionTaskId: "seed-t5", providerId: "seed-p1", assignedDriverId: null,       status: "pending"     },
  ]).onConflictDoNothing();

  await db.insert(driverTasksTable).values([
    {
      id: "seed-dt1", driverId: "seed-d1", providerNgoTaskId: "seed-pnt1",
      taskType: "humanitarian", status: "in_progress",
      zoneId: "seed-z2", providerId: "seed-p1",
      scheduledAt: new Date("2026-05-23T06:00:00Z"), quantityLiters: "50000",
      startedAt: new Date("2026-05-23T07:30:00Z"),
    },
    {
      id: "seed-dt2", driverId: "seed-d1", providerNgoTaskId: "seed-pnt2",
      taskType: "humanitarian", status: "delivered",
      zoneId: "seed-z3", providerId: "seed-p1",
      scheduledAt: new Date("2026-05-22T10:00:00Z"), quantityLiters: "20000",
      startedAt: new Date("2026-05-22T10:30:00Z"), deliveredAt: new Date("2026-05-22T13:00:00Z"),
    },
  ]).onConflictDoNothing();

  await db.insert(gpsPositionsTable).values([
    { id: "seed-g1", driverId: "seed-d1", lat: "31.496", lng: "34.462", accuracy: "5.2", recordedAt: new Date(Date.now() - 4 * 60000) },
    { id: "seed-g2", driverId: "seed-d1", lat: "31.499", lng: "34.468", accuracy: "4.8", recordedAt: new Date(Date.now() - 2 * 60000) },
    { id: "seed-g3", driverId: "seed-d1", lat: "31.502", lng: "34.472", accuracy: "4.1", recordedAt: new Date()                        },
    { id: "seed-g4", driverId: "seed-d2", lat: "31.346", lng: "34.308", accuracy: "7.3", recordedAt: new Date(Date.now() - 3 * 60000) },
    { id: "seed-g5", driverId: "seed-d2", lat: "31.350", lng: "34.315", accuracy: "6.1", recordedAt: new Date()                        },
  ]).onConflictDoNothing();

  console.log("✅ Gaza seed complete — demo contracts, 30-day task history, and 22 zones.");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
