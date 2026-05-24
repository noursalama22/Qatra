import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db, pool } from "./db";
import {
  ngosTable, providersTable, driversTable, zonesTable,
  distributionTasksTable, deliveryOrdersTable, usersTable,
  citizensTable, signalsTable, gpsPositionsTable,
  userRolesTable, contractsTable, trucksTable,
} from "@shared/schema";
import { eq, count, sum, sql, desc, and } from "drizzle-orm";

const app = express();
app.use((_req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  next();
});
app.use(express.json());

const PgSession = connectPgSimple(session);
const scryptAsync = promisify(scrypt);
const authRoles = ["admin", "ngo", "provider", "driver", "citizen"] as const;
const publicRegistrationRoles = ["ngo", "provider"] as const;
type AuthRole = typeof authRoles[number];
type ProfileRecord = Record<string, unknown> | null;

app.use(session({
  store: new PgSession({
    pool,
    tableName: "sessions",
    createTableIfMissing: false,
  }),
  name: "qatra.sid",
  secret: process.env.SESSION_SECRET || "qatra-local-dev-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 14,
  },
}));

app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

const isAuthRole = (role: string): role is AuthRole => authRoles.includes(role as AuthRole);
const isPublicRegistrationRole = (role: AuthRole) => publicRegistrationRoles.includes(role as typeof publicRegistrationRoles[number]);
const clean = (value: unknown) => String(value ?? "").trim();
const optionalClean = (value: unknown) => {
  const next = clean(value);
  return next || null;
};

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;
  const [scheme, salt, hash] = storedHash.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const derived = await scryptAsync(password, salt, 64) as Buffer;
  const stored = Buffer.from(hash, "hex");
  return stored.length === derived.length && timingSafeEqual(stored, derived);
}

function userIdFromSession(req: express.Request) {
  return (req.session as unknown as { userId?: string }).userId;
}

function setSessionUser(req: express.Request, userId: string) {
  (req.session as unknown as { userId?: string }).userId = userId;
}

function clearSessionUser(req: express.Request) {
  delete (req.session as unknown as { userId?: string }).userId;
}

async function getProfile(role: AuthRole, profileId: string | null): Promise<ProfileRecord> {
  if (!profileId) return null;
  if (role === "ngo") {
    const [profile] = await db.select().from(ngosTable).where(eq(ngosTable.id, profileId));
    return profile ?? null;
  }
  if (role === "provider") {
    const [profile] = await db.select().from(providersTable).where(eq(providersTable.id, profileId));
    return profile ?? null;
  }
  if (role === "driver") {
    const [profile] = await db.select().from(driversTable).where(eq(driversTable.id, profileId));
    return profile ?? null;
  }
  if (role === "citizen") {
    const [profile] = await db.select().from(citizensTable).where(eq(citizensTable.id, profileId));
    return profile ?? null;
  }
  return null;
}

async function getAuthUser(userId: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;

  const [roleRow] = await db.select().from(userRolesTable).where(eq(userRolesTable.userId, user.id));
  if (!roleRow || !isAuthRole(roleRow.role)) return null;

  const profile = await getProfile(roleRow.role, roleRow.profileId ?? null);
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.profileImageUrl,
    role: roleRow.role,
    roleStatus: roleRow.status,
    profile,
  };
}

async function requireAuth(req: express.Request, res: express.Response) {
  const userId = userIdFromSession(req);
  if (!userId) {
    res.status(401).json({ error: "You must be logged in" });
    return null;
  }
  const authUser = await getAuthUser(userId);
  if (!authUser) {
    clearSessionUser(req);
    res.status(401).json({ error: "Session user was not found" });
    return null;
  }
  return authUser;
}

async function createRoleProfile(userId: string, role: AuthRole, body: Record<string, unknown>) {
  if (role === "admin") return { profileId: null, status: "approved" as const };

  if (role === "ngo") {
    const orgName = clean(body.orgName);
    if (!orgName) throw new Error("اسم المنظمة مطلوب");
    const [profile] = await db.insert(ngosTable).values({
      userId,
      orgName,
      contactEmail: optionalClean(body.contactEmail) ?? optionalClean(body.email),
      country: optionalClean(body.country),
      description: optionalClean(body.description),
      status: "pending",
    }).returning();
    return { profileId: profile.id, status: "pending" as const };
  }

  if (role === "provider") {
    const companyName = clean(body.companyName);
    if (!companyName) throw new Error("اسم الشركة مطلوب");
    const modes = Array.isArray(body.operatingModes) ? body.operatingModes : [];
    const operatingModes = modes.filter((mode): mode is "humanitarian" | "commercial" => mode === "humanitarian" || mode === "commercial");
    const [profile] = await db.insert(providersTable).values({
      userId,
      companyName,
      contactEmail: optionalClean(body.contactEmail) ?? optionalClean(body.email),
      description: optionalClean(body.description),
      operatingModes: operatingModes.length ? operatingModes : ["commercial"],
      status: "pending",
    }).returning();
    return { profileId: profile.id, status: "pending" as const };
  }

  if (role === "driver") {
    const driverType = clean(body.driverType) === "independent" ? "independent" : "owned";
    const [profile] = await db.insert(driversTable).values({
      userId,
      driverType,
      providerId: driverType === "owned" ? optionalClean(body.providerId) : null,
      status: "pending",
      phone: optionalClean(body.phone),
      vehicleType: optionalClean(body.vehicleType),
    }).returning();
    return { profileId: profile.id, status: "pending" as const };
  }

  const zoneId = clean(body.zoneId);
  if (!zoneId) throw new Error("المنطقة مطلوبة");
  const [profile] = await db.insert(citizensTable).values({
    userId,
    zoneId,
    lat: optionalClean(body.lat),
    lng: optionalClean(body.lng),
  }).returning();
  return { profileId: profile.id, status: "approved" as const };
}

async function updateRoleProfile(role: AuthRole, profile: ProfileRecord, body: Record<string, unknown>) {
  if (!profile || typeof profile.id !== "string") return;
  if (role === "ngo") {
    await db.update(ngosTable).set({
      orgName: clean(body.orgName) || String(profile.orgName ?? ""),
      contactEmail: optionalClean(body.contactEmail),
      country: optionalClean(body.country),
      description: optionalClean(body.description),
      updatedAt: new Date(),
    }).where(eq(ngosTable.id, profile.id));
  } else if (role === "provider") {
    const modes = Array.isArray(body.operatingModes) ? body.operatingModes : [];
    const operatingModes = modes.filter((mode): mode is "humanitarian" | "commercial" => mode === "humanitarian" || mode === "commercial");
    await db.update(providersTable).set({
      companyName: clean(body.companyName) || String(profile.companyName ?? ""),
      contactEmail: optionalClean(body.contactEmail),
      description: optionalClean(body.description),
      operatingModes: operatingModes.length ? operatingModes : ["commercial"],
      updatedAt: new Date(),
    }).where(eq(providersTable.id, profile.id));
  } else if (role === "driver") {
    const driverType = clean(body.driverType) === "independent" ? "independent" : "owned";
    await db.update(driversTable).set({
      driverType,
      providerId: driverType === "owned" ? optionalClean(body.providerId) : null,
      phone: optionalClean(body.phone),
      vehicleType: optionalClean(body.vehicleType),
      updatedAt: new Date(),
    }).where(eq(driversTable.id, profile.id));
  } else if (role === "citizen") {
    await db.update(citizensTable).set({
      zoneId: clean(body.zoneId) || String(profile.zoneId ?? ""),
      lat: optionalClean(body.lat),
      lng: optionalClean(body.lng),
    }).where(eq(citizensTable.id, profile.id));
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────

app.get("/api/auth/me", async (req, res) => {
  try {
    const authUser = await requireAuth(req, res);
    if (!authUser) return;
    res.json(authUser);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const role = clean(body.role);
    const email = clean(body.email).toLowerCase();
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    const password = String(body.password ?? "");

    if (!isAuthRole(role)) return res.status(400).json({ error: "نوع المستخدم غير صحيح" });
    if (!isPublicRegistrationRole(role)) {
      return res.status(403).json({ error: "التسجيل العام متاح فقط للمنظمات ومزودي الخدمة" });
    }
    if (!email || !firstName || !lastName || password.length < 8) {
      return res.status(400).json({ error: "الاسم والبريد وكلمة مرور من 8 أحرف على الأقل مطلوبة" });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) return res.status(409).json({ error: "البريد الإلكتروني مستخدم بالفعل" });

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({ email, firstName, lastName, passwordHash }).returning();
    const roleProfile = await createRoleProfile(user.id, role, { ...body, email });
    await db.insert(userRolesTable).values({
      userId: user.id,
      role,
      status: roleProfile.status,
      profileId: roleProfile.profileId,
    });

    setSessionUser(req, user.id);
    const authUser = await getAuthUser(user.id);
    res.status(201).json(authUser);
  } catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : String(e) }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = clean(req.body.email).toLowerCase();
    const password = String(req.body.password ?? "");
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

    if (!user || !(await verifyPassword(password, user.passwordHash ?? null))) {
      return res.status(401).json({ error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
    }

    setSessionUser(req, user.id);
    const authUser = await getAuthUser(user.id);
    if (!authUser) return res.status(403).json({ error: "لا يوجد دور مرتبط بهذا المستخدم" });
    res.json(authUser);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(error => {
    if (error) return res.status(500).json({ error: "تعذر تسجيل الخروج" });
    res.clearCookie("qatra.sid");
    res.json({ ok: true });
  });
});

app.patch("/api/auth/me", async (req, res) => {
  try {
    const authUser = await requireAuth(req, res);
    if (!authUser) return;
    const body = req.body as Record<string, unknown>;
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    const email = clean(body.email).toLowerCase();

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "الاسم والبريد الإلكتروني مطلوبة" });
    }

    const [emailOwner] = await db.select().from(usersTable).where(and(eq(usersTable.email, email), sql`${usersTable.id} <> ${authUser.id}`));
    if (emailOwner) return res.status(409).json({ error: "البريد الإلكتروني مستخدم من حساب آخر" });

    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    let passwordHash: string | undefined;
    if (newPassword) {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, authUser.id));
      if (!currentPassword || !(await verifyPassword(currentPassword, user?.passwordHash ?? null))) {
        return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
      }
      if (newPassword.length < 8) return res.status(400).json({ error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" });
      passwordHash = await hashPassword(newPassword);
    }

    await db.update(usersTable)
      .set({ firstName, lastName, email, ...(passwordHash ? { passwordHash } : {}), updatedAt: new Date() })
      .where(eq(usersTable.id, authUser.id));
    await updateRoleProfile(authUser.role, authUser.profile, body);

    res.json(await getAuthUser(authUser.id));
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

const demoUsersByRole = {
  admin: "seed-u1",
  ngo: "seed-u2",
  provider: "seed-u3",
  driver: "seed-u5",
  citizen: "seed-u7",
} as const;

type DemoRole = keyof typeof demoUsersByRole;

const isDemoRole = (role: string): role is DemoRole => role in demoUsersByRole;

// ── Demo User Profile ───────────────────────────────────────────────────────

app.get("/api/demo-user/:role", async (req, res) => {
  try {
    if (!isDemoRole(req.params.role)) return res.status(400).json({ error: "Invalid role" });

    const [user] = await db.select().from(usersTable)
      .where(eq(usersTable.id, demoUsersByRole[req.params.role]));

    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ ...user, role: req.params.role });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.patch("/api/users/:id", async (req, res) => {
  try {
    const firstName = String(req.body.firstName ?? "").trim();
    const lastName = String(req.body.lastName ?? "").trim();
    const email = String(req.body.email ?? "").trim();

    if (!firstName || !lastName || !email) {
      return res.status(400).json({ error: "First name, last name, and email are required" });
    }

    const [updated] = await db.update(usersTable)
      .set({ firstName, lastName, email, updatedAt: new Date() })
      .where(eq(usersTable.id, req.params.id))
      .returning();

    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Zones ──────────────────────────────────────────────────────────────────

app.get("/api/zones", async (_req, res) => {
  try {
    const data = await db.select().from(zonesTable).orderBy(zonesTable.createdAt);
    res.json({ data, total: data.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/zones", async (req, res) => {
  try {
    const { name, description, ngoId, status, populationEstimate } = req.body;
    const [zone] = await db.insert(zonesTable).values({
      name, description, ngoId, status: status ?? "active",
      populationEstimate: Number(populationEstimate) || 0,
    }).returning();
    res.status(201).json(zone);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── NGOs ───────────────────────────────────────────────────────────────────

app.get("/api/ngos", async (_req, res) => {
  try {
    const data = await db.select().from(ngosTable).orderBy(ngosTable.createdAt);
    res.json({ data, total: data.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.patch("/api/ngos/:id", async (req, res) => {
  try {
    const [updated] = await db.update(ngosTable)
      .set({ status: req.body.status, updatedAt: new Date() })
      .where(eq(ngosTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Providers ──────────────────────────────────────────────────────────────

app.get("/api/providers", async (_req, res) => {
  try {
    const data = await db.select().from(providersTable).orderBy(providersTable.createdAt);
    res.json({ data, total: data.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.patch("/api/providers/:id", async (req, res) => {
  try {
    const [updated] = await db.update(providersTable)
      .set({ status: req.body.status, updatedAt: new Date() })
      .where(eq(providersTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Drivers ────────────────────────────────────────────────────────────────

app.get("/api/drivers", async (_req, res) => {
  try {
    const data = await db.select().from(driversTable).orderBy(driversTable.createdAt);
    res.json({ data, total: data.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.patch("/api/drivers/:id", async (req, res) => {
  try {
    const [updated] = await db.update(driversTable)
      .set({ status: req.body.status, updatedAt: new Date() })
      .where(eq(driversTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Tasks ──────────────────────────────────────────────────────────────────

app.get("/api/tasks", async (_req, res) => {
  try {
    const data = await db.select().from(distributionTasksTable).orderBy(distributionTasksTable.scheduledAt);
    res.json({ data, total: data.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { ngoId, zoneId, quantityLiters, scheduledAt, notes } = req.body;
    const [task] = await db.insert(distributionTasksTable).values({
      ngoId, zoneId, quantityLiters: String(quantityLiters),
      scheduledAt: new Date(scheduledAt), notes: notes || null,
    }).returning();
    res.status(201).json(task);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const [updated] = await db.update(distributionTasksTable)
      .set({ status: req.body.status, updatedAt: new Date() })
      .where(eq(distributionTasksTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });

    // When task is delivered, update zone's lastDeliveryAt
    if (req.body.status === "delivered" && updated.zoneId) {
      await db.update(zonesTable)
        .set({ lastDeliveryAt: new Date(), updatedAt: new Date() })
        .where(eq(zonesTable.id, updated.zoneId));
    }
    res.json(updated);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Orders ─────────────────────────────────────────────────────────────────

app.get("/api/orders", async (_req, res) => {
  try {
    const data = await db.select().from(deliveryOrdersTable).orderBy(deliveryOrdersTable.createdAt);
    res.json({ data, total: data.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.patch("/api/orders/:id", async (req, res) => {
  try {
    const [updated] = await db.update(deliveryOrdersTable)
      .set({ status: req.body.status, updatedAt: new Date() })
      .where(eq(deliveryOrdersTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Stats ──────────────────────────────────────────────────────────────────

app.get("/api/stats", async (_req, res) => {
  try {
    const [zones, ngos, providers, drivers, tasks, orders] = await Promise.all([
      db.select().from(zonesTable),
      db.select().from(ngosTable),
      db.select().from(providersTable),
      db.select().from(driversTable),
      db.select().from(distributionTasksTable),
      db.select().from(deliveryOrdersTable),
    ]);

    const deliveredTasks = tasks.filter(t => t.status === "delivered");
    const totalLiters = deliveredTasks.reduce((sum, t) => sum + parseFloat(t.quantityLiters ?? "0"), 0);

    res.json({
      totalZones: zones.length,
      activeZones: zones.filter(z => z.status === "active").length,
      totalNgos: ngos.length,
      approvedNgos: ngos.filter(n => n.status === "approved").length,
      totalProviders: providers.length,
      approvedProviders: providers.filter(p => p.status === "approved").length,
      totalDrivers: drivers.length,
      activeDrivers: drivers.filter(d => d.status === "active").length,
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === "pending").length,
      inProgressTasks: tasks.filter(t => t.status === "in_progress").length,
      deliveredTasks: deliveredTasks.length,
      totalOrders: orders.length,
      totalLitersDispatched: totalLiters,
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Map Endpoint ───────────────────────────────────────────────────────────

app.get("/api/map", async (_req, res) => {
  try {
    const [zones, tasks, drivers, providers, gpsRows] = await Promise.all([
      db.select().from(zonesTable),
      db.select().from(distributionTasksTable),
      db.select().from(driversTable),
      db.select().from(providersTable),
      db.select().from(gpsPositionsTable).orderBy(desc(gpsPositionsTable.recordedAt)),
    ]);

    // Latest GPS per driver
    const latestGps: Record<string, typeof gpsRows[0]> = {};
    for (const g of gpsRows) {
      if (!latestGps[g.driverId]) latestGps[g.driverId] = g;
    }

    const centroid = (pts: [number, number][]): [number, number] => {
      if (!pts || pts.length === 0) return [35.5, 37.5];
      const lat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
      const lng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
      return [lat, lng];
    };

    const zoneFeatures = zones.map(z => {
      const boundary = z.boundary as [number, number][] | null;
      return {
        id: z.id,
        name: z.name,
        status: z.status,
        populationEstimate: z.populationEstimate ?? 0,
        signalCount: z.signalCount,
        lastDeliveryAt: z.lastDeliveryAt,
        boundary,
        center: centroid(boundary ?? []),
        tasks: tasks.filter(t => t.zoneId === z.id).map(t => ({
          id: t.id, status: t.status,
          quantityLiters: t.quantityLiters, scheduledAt: t.scheduledAt,
        })),
      };
    });

    const driverFeatures = drivers
      .filter(d => latestGps[d.id])
      .map(d => {
        const gps = latestGps[d.id];
        const prov = providers.find(p => p.id === d.providerId);
        const activeTask = tasks.find(t =>
          t.status === "in_progress" && t.assignedProviderIds?.includes(d.providerId ?? "")
        ) ?? null;
        return {
          id: d.id,
          vehicleType: d.vehicleType,
          status: d.status,
          driverType: d.driverType,
          providerId: d.providerId,
          providerName: prov?.companyName ?? null,
          lat: parseFloat(gps.lat),
          lng: parseFloat(gps.lng),
          recordedAt: gps.recordedAt,
          activeTask: activeTask ? {
            zoneId: activeTask.zoneId,
            status: activeTask.status,
            quantityLiters: activeTask.quantityLiters,
          } : null,
        };
      });

    res.json({ zones: zoneFeatures, drivers: driverFeatures });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Citizen Endpoints ──────────────────────────────────────────────────────

// Active zones list (for zone picker)
app.get("/api/citizen/zones", async (_req, res) => {
  try {
    const data = await db.select().from(zonesTable)
      .where(eq(zonesTable.status, "active"))
      .orderBy(zonesTable.name);
    res.json({ data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Distribution schedule for a zone
app.get("/api/citizen/zones/:zoneId/schedule", async (req, res) => {
  try {
    const data = await db.select().from(distributionTasksTable)
      .where(eq(distributionTasksTable.zoneId, req.params.zoneId))
      .orderBy(distributionTasksTable.scheduledAt);
    res.json({ data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Approved providers (for order form)
app.get("/api/citizen/providers", async (_req, res) => {
  try {
    const data = await db.select().from(providersTable)
      .where(eq(providersTable.status, "approved"))
      .orderBy(providersTable.companyName);
    res.json({ data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Send water need signal
app.post("/api/citizen/signals", async (req, res) => {
  try {
    const { citizenId, zoneId } = req.body;
    // Insert signal
    const [signal] = await db.insert(signalsTable).values({ citizenId, zoneId }).returning();
    // Increment zone signal count
    await db.update(zonesTable)
      .set({ signalCount: sql`${zonesTable.signalCount} + 1`, updatedAt: new Date() })
      .where(eq(zonesTable.id, zoneId));
    res.status(201).json(signal);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Place a delivery order
app.post("/api/citizen/orders", async (req, res) => {
  try {
    const { citizenId, providerId, quantityLiters, totalAmount } = req.body;
    const [order] = await db.insert(deliveryOrdersTable).values({
      citizenId,
      providerId,
      quantityLiters: String(quantityLiters),
      totalAmount: String(totalAmount),
      status: "pending",
    }).returning();
    res.status(201).json(order);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Get orders for a citizen
app.get("/api/citizen/:citizenId/orders", async (req, res) => {
  try {
    const data = await db.select().from(deliveryOrdersTable)
      .where(eq(deliveryOrdersTable.citizenId, req.params.citizenId))
      .orderBy(deliveryOrdersTable.createdAt);
    res.json({ data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Trucks ─────────────────────────────────────────────────────────────────

app.get("/api/trucks", async (req, res) => {
  try {
    const providerId = req.query.providerId as string | undefined;
    if (providerId) {
      const data = await db.select().from(trucksTable)
        .where(eq(trucksTable.providerId, providerId))
        .orderBy(trucksTable.createdAt);
      return res.json({ data, total: data.length });
    }
    const data = await db.select().from(trucksTable).orderBy(trucksTable.createdAt);
    res.json({ data, total: data.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/trucks", async (req, res) => {
  try {
    const { providerId, plateNumber, model, capacityLiters, year, notes } = req.body;
    if (!providerId || !plateNumber || !model || !capacityLiters || !year) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const [truck] = await db.insert(trucksTable).values({
      providerId, plateNumber, model,
      capacityLiters: Number(capacityLiters),
      year: Number(year),
      notes: notes ?? null,
    }).returning();
    res.status(201).json(truck);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.patch("/api/trucks/:id", async (req, res) => {
  try {
    const allowed = ["available", "on_trip", "maintenance"] as const;
    const status = req.body.status;
    if (status && !allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const [updated] = await db.update(trucksTable)
      .set({ ...(status ? { status } : {}), updatedAt: new Date() })
      .where(eq(trucksTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Contracts ──────────────────────────────────────────────────────────────

app.get("/api/contracts", async (req, res) => {
  try {
    const providerId = req.query.providerId as string | undefined;
    const query = db.select().from(contractsTable).orderBy(contractsTable.createdAt);
    if (providerId) {
      const data = await db.select().from(contractsTable)
        .where(eq(contractsTable.providerId, providerId))
        .orderBy(contractsTable.createdAt);
      return res.json({ data, total: data.length });
    }
    const data = await query;
    res.json({ data, total: data.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/contracts/:id", async (req, res) => {
  try {
    const [contract] = await db.select().from(contractsTable).where(eq(contractsTable.id, req.params.id));
    if (!contract) return res.status(404).json({ error: "Not found" });
    res.json(contract);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.patch("/api/contracts/:id", async (req, res) => {
  try {
    const allowed = ["review", "active", "rejected"] as const;
    const status = req.body.status;
    if (status && !allowed.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const [updated] = await db.update(contractsTable)
      .set({ ...(status ? { status } : {}), updatedAt: new Date() })
      .where(eq(contractsTable.id, req.params.id))
      .returning();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

app.listen(PORT, "0.0.0.0", () => console.log(`API server running on port ${PORT}`));
