import { db } from "./db";
import {
  usersTable, ngosTable, providersTable, driversTable, zonesTable,
  distributionTasksTable, deliveryOrdersTable, citizensTable, gpsPositionsTable,
  userRolesTable,
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { scryptSync, randomBytes } from "node:crypto";

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
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
    { id: "seed-z1",  ngoId: "seed-n1", name: "شمال غزة / جباليا",    status: "active",   populationEstimate: 450000, signalCount: 847,  description: "المنطقة الشمالية — كثافة عالية جداً ونقص حاد بالمياه", lastDeliveryAt: new Date("2026-05-21T06:00:00Z"), boundary: b["seed-z1"] },
    { id: "seed-z2",  ngoId: "seed-n1", name: "مدينة غزة — المركز",   status: "active",   populationEstimate: 750000, signalCount: 1240, description: "قلب المدينة — تضم أعلى تركيز سكاني",                 lastDeliveryAt: new Date("2026-05-20T08:00:00Z"), boundary: b["seed-z2"] },
    { id: "seed-z3",  ngoId: "seed-n2", name: "الوسطى / دير البلح",   status: "active",   populationEstimate: 300000, signalCount: 523,  description: "المنطقة الوسطى — يصلها التوصيل بصعوبة أحياناً",        lastDeliveryAt: new Date("2026-05-22T10:00:00Z"), boundary: b["seed-z3"] },
    { id: "seed-z4",  ngoId: "seed-n2", name: "خان يونس",              status: "active",   populationEstimate: 380000, signalCount: 689,  description: "جنوب غزة — نقاط تجمع النازحين",                        lastDeliveryAt: new Date("2026-05-23T07:00:00Z"), boundary: b["seed-z4"] },
    { id: "seed-z5",  ngoId: "seed-n2", name: "رفح",                   status: "inactive", populationEstimate: 280000, signalCount: 412,  description: "أقصى الجنوب — وصول محدود بسبب الأوضاع الميدانية",      lastDeliveryAt: new Date("2026-05-15T09:00:00Z"), boundary: b["seed-z5"] },

    // ── North Gaza neighbourhoods ─────────────────────────────────────────
    { id: "seed-z6",  ngoId: "seed-n1", name: "بيت لاهيا",             status: "active",   populationEstimate: 88000,  signalCount: 195,  description: "الزاوية الشمالية الغربية — ساحلية، نقص مياه حاد",      lastDeliveryAt: new Date("2026-05-20T07:00:00Z"), boundary: b["seed-z6"] },
    { id: "seed-z7",  ngoId: "seed-n1", name: "بيت حانون",             status: "active",   populationEstimate: 68000,  signalCount: 158,  description: "الزاوية الشمالية الشرقية — مناطق صناعية سابقة",        lastDeliveryAt: new Date("2026-05-19T08:00:00Z"), boundary: b["seed-z7"] },
    { id: "seed-z8",  ngoId: "seed-n1", name: "جباليا المخيم",         status: "active",   populationEstimate: 130000, signalCount: 342,  description: "مخيم جباليا — أعلى كثافة سكانية في شمال غزة",          lastDeliveryAt: new Date("2026-05-21T09:00:00Z"), boundary: b["seed-z8"] },

    // ── Gaza City neighbourhoods ──────────────────────────────────────────
    { id: "seed-z9",  ngoId: "seed-n1", name: "الشيخ رضوان",           status: "active",   populationEstimate: 82000,  signalCount: 214,  description: "شمال مدينة غزة — تجمعات سكانية كثيفة",                 lastDeliveryAt: new Date("2026-05-22T06:00:00Z"), boundary: b["seed-z9"] },
    { id: "seed-z10", ngoId: "seed-n1", name: "الرمال",                 status: "active",   populationEstimate: 72000,  signalCount: 188,  description: "المنطقة الساحلية الوسطى — حي راقٍ سابقاً",              lastDeliveryAt: new Date("2026-05-21T10:00:00Z"), boundary: b["seed-z10"] },
    { id: "seed-z11", ngoId: "seed-n2", name: "الشجاعية",               status: "active",   populationEstimate: 105000, signalCount: 290,  description: "شرق مدينة غزة — تكتل سكاني كثيف",                      lastDeliveryAt: new Date("2026-05-20T07:00:00Z"), boundary: b["seed-z11"] },
    { id: "seed-z12", ngoId: "seed-n1", name: "الدرج",                  status: "active",   populationEstimate: 78000,  signalCount: 200,  description: "وسط-شرق غزة — قريب من الميناء",                        lastDeliveryAt: new Date("2026-05-23T08:00:00Z"), boundary: b["seed-z12"] },
    { id: "seed-z13", ngoId: "seed-n2", name: "الزيتون",                status: "active",   populationEstimate: 95000,  signalCount: 248,  description: "جنوب شرق غزة — حي قديم وكثيف السكان",                  lastDeliveryAt: new Date("2026-05-22T08:00:00Z"), boundary: b["seed-z13"] },

    // ── Central area neighbourhoods ───────────────────────────────────────
    { id: "seed-z14", ngoId: "seed-n2", name: "النصيرات",               status: "active",   populationEstimate: 98000,  signalCount: 262,  description: "مخيم النصيرات — المنطقة الوسطى الشمالية",               lastDeliveryAt: new Date("2026-05-21T08:00:00Z"), boundary: b["seed-z14"] },
    { id: "seed-z15", ngoId: "seed-n2", name: "البريج",                 status: "active",   populationEstimate: 58000,  signalCount: 142,  description: "مخيم البريج — وسط القطاع",                              lastDeliveryAt: new Date("2026-05-20T09:00:00Z"), boundary: b["seed-z15"] },
    { id: "seed-z16", ngoId: "seed-n1", name: "المغازي",                status: "active",   populationEstimate: 62000,  signalCount: 155,  description: "مخيم المغازي — يصعب الوصول إليه أحياناً",               lastDeliveryAt: new Date("2026-05-19T07:00:00Z"), boundary: b["seed-z16"] },
    { id: "seed-z17", ngoId: "seed-n1", name: "دير البلح المدينة",      status: "active",   populationEstimate: 77000,  signalCount: 198,  description: "مدينة دير البلح — مركز المنطقة الوسطى",                 lastDeliveryAt: new Date("2026-05-22T09:00:00Z"), boundary: b["seed-z17"] },

    // ── Khan Younis neighbourhoods ────────────────────────────────────────
    { id: "seed-z18", ngoId: "seed-n2", name: "خان يونس المدينة",       status: "active",   populationEstimate: 125000, signalCount: 322,  description: "مركز مدينة خان يونس — تكتل نازحين كبير",               lastDeliveryAt: new Date("2026-05-23T06:00:00Z"), boundary: b["seed-z18"] },
    { id: "seed-z19", ngoId: "seed-n2", name: "بني سهيلا / خزاعة",      status: "active",   populationEstimate: 48000,  signalCount: 112,  description: "شرق خان يونس — تضم مزارع ومناطق سكنية",                lastDeliveryAt: new Date("2026-05-20T10:00:00Z"), boundary: b["seed-z19"] },
    { id: "seed-z20", ngoId: "seed-n1", name: "المواصي الجنوبية",        status: "active",   populationEstimate: 95000,  signalCount: 276,  description: "الشريط الساحلي — كثافة نازحين عالية جداً",              lastDeliveryAt: new Date("2026-05-22T07:00:00Z"), boundary: b["seed-z20"] },

    // ── Rafah neighbourhoods ──────────────────────────────────────────────
    { id: "seed-z21", ngoId: "seed-n2", name: "رفح المدينة",            status: "active",   populationEstimate: 88000,  signalCount: 232,  description: "وسط مدينة رفح — تركيز نازحين من شمال القطاع",          lastDeliveryAt: new Date("2026-05-21T07:00:00Z"), boundary: b["seed-z21"] },
    { id: "seed-z22", ngoId: "seed-n2", name: "تل السلطان",             status: "active",   populationEstimate: 65000,  signalCount: 172,  description: "غرب رفح — منطقة مكتظة ووصول محدود للمياه",             lastDeliveryAt: new Date("2026-05-20T06:00:00Z"), boundary: b["seed-z22"] },
  ]).onConflictDoNothing();

  await db.insert(driversTable).values([
    { id: "seed-d1", userId: "seed-u5", driverType: "owned",       providerId: "seed-p1", status: "active", phone: "+970-599-123-456", vehicleType: "خزان مياه 5000 لتر" },
    { id: "seed-d2", userId: "seed-u6", driverType: "independent", providerId: null,       status: "active", phone: "+970-598-987-654", vehicleType: "بيكب 1000 لتر"      },
  ]).onConflictDoNothing();

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

  await db.insert(gpsPositionsTable).values([
    { id: "seed-g1", driverId: "seed-d1", lat: "31.496", lng: "34.462", accuracy: "5.2", recordedAt: new Date(Date.now() - 4 * 60000) },
    { id: "seed-g2", driverId: "seed-d1", lat: "31.499", lng: "34.468", accuracy: "4.8", recordedAt: new Date(Date.now() - 2 * 60000) },
    { id: "seed-g3", driverId: "seed-d1", lat: "31.502", lng: "34.472", accuracy: "4.1", recordedAt: new Date()                        },
    { id: "seed-g4", driverId: "seed-d2", lat: "31.346", lng: "34.308", accuracy: "7.3", recordedAt: new Date(Date.now() - 3 * 60000) },
    { id: "seed-g5", driverId: "seed-d2", lat: "31.350", lng: "34.315", accuracy: "6.1", recordedAt: new Date()                        },
  ]).onConflictDoNothing();

  console.log("✅ Gaza seed complete — 22 zones inserted.");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
