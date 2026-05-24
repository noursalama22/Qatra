import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { db, pool } from "./db";
import { runMigrations } from "./migrate";
import {
  ngosTable, providersTable, driversTable, zonesTable,
  distributionTasksTable, deliveryOrdersTable, usersTable,
  citizensTable, signalsTable, gpsPositionsTable,
  userRolesTable, contractsTable, trucksTable, providerDriverInvitesTable,
  regionsTable, providerRegionRatesTable, ngoContractsTable,
} from "@shared/schema";
import { eq, count, sum, sql, desc, and, inArray } from "drizzle-orm";

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

app.get("/api/healthz", (_req, res) => res.json({
  status: "ok",
  features: { citizenAuth: true },
}));

const isAuthRole = (role: string): role is AuthRole => authRoles.includes(role as AuthRole);
const isPublicRegistrationRole = (role: AuthRole) => publicRegistrationRoles.includes(role as typeof publicRegistrationRoles[number]);
const clean = (value: unknown) => String(value ?? "").trim();
const optionalClean = (value: unknown) => {
  const next = clean(value);
  return next || null;
};

function normalizePhone(raw: unknown) {
  const digits = clean(raw).replace(/\D/g, "");
  if (digits.length < 9) return "";
  if (digits.startsWith("972")) return `+${digits}`;
  if (digits.startsWith("970")) return `+${digits}`;
  if (digits.startsWith("0") && digits.length >= 10) return `+970${digits.slice(1)}`;
  if (digits.length === 9) return `+970${digits}`;
  return `+${digits}`;
}

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
    if (!profile) return null;
    if (!profile.providerId) {
      return { ...profile, providerCompanyName: null };
    }
    const [provider] = await db
      .select({ companyName: providersTable.companyName })
      .from(providersTable)
      .where(eq(providersTable.id, profile.providerId));
    return { ...profile, providerCompanyName: provider?.companyName ?? null };
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
    phone: user.phone ?? null,
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

app.post("/api/auth/citizen/register", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;
    const firstName = clean(body.firstName);
    const lastName = clean(body.lastName);
    const phone = normalizePhone(String(body.phone ?? ""));
    const password = String(body.password ?? "");

    if (!firstName || !lastName || !phone || password.length < 8) {
      return res.status(400).json({ error: "الاسم ورقم الهاتف وكلمة مرور من 8 أحرف على الأقل مطلوبة" });
    }

    const [existing] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
    if (existing) return res.status(409).json({ error: "رقم الهاتف مسجّل بالفعل" });

    const passwordHash = await hashPassword(password);
    const [user] = await db.insert(usersTable).values({
      firstName,
      lastName,
      phone,
      passwordHash,
    }).returning();

    const [defaultZone] = await db.select({ id: zonesTable.id }).from(zonesTable)
      .where(eq(zonesTable.status, "active"))
      .limit(1);
    if (!defaultZone) {
      return res.status(503).json({ error: "لا توجد مناطق نشطة — يُرجى المحاولة لاحقاً" });
    }

    const roleProfile = await createRoleProfile(user.id, "citizen", { zoneId: defaultZone.id });
    await db.insert(userRolesTable).values({
      userId: user.id,
      role: "citizen",
      status: roleProfile.status,
      profileId: roleProfile.profileId,
    });

    setSessionUser(req, user.id);
    const authUser = await getAuthUser(user.id);
    res.status(201).json(authUser);
  } catch (e) { res.status(400).json({ error: e instanceof Error ? e.message : String(e) }); }
});

app.post("/api/auth/citizen/login", async (req, res) => {
  try {
    const phone = normalizePhone(String(req.body.phone ?? ""));
    const password = String(req.body.password ?? "");
    if (!phone) return res.status(400).json({ error: "رقم الهاتف غير صحيح" });

    const [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone));
    if (!user || !(await verifyPassword(password, user.passwordHash ?? null))) {
      return res.status(401).json({ error: "رقم الهاتف أو كلمة المرور غير صحيحة" });
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

// ── GPS Positions ──────────────────────────────────────────────────────────

app.post("/api/gps", async (req, res) => {
  try {
    const { driverId, lat, lng } = req.body;
    if (!driverId || lat == null || lng == null) {
      return res.status(400).json({ error: "driverId, lat, lng required" });
    }
    const [pos] = await db.insert(gpsPositionsTable).values({
      driverId,
      taskId: null,
      lat: String(lat),
      lng: String(lng),
    }).returning();
    res.status(201).json(pos);
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

app.get("/api/citizen/me", async (req, res) => {
  try {
    const authUser = await requireAuth(req, res);
    if (!authUser) return;
    if (authUser.role !== "citizen") {
      return res.status(403).json({ error: "هذا المسار للمواطنين فقط" });
    }

    let profileId = typeof authUser.profile?.id === "string" ? authUser.profile.id : null;
    if (!profileId) {
      const [defaultZone] = await db.select({ id: zonesTable.id }).from(zonesTable)
        .where(eq(zonesTable.status, "active"))
        .limit(1);
      if (!defaultZone) return res.status(503).json({ error: "لا توجد مناطق نشطة" });
      const roleProfile = await createRoleProfile(authUser.id, "citizen", { zoneId: defaultZone.id });
      await db.update(userRolesTable)
        .set({ profileId: roleProfile.profileId, status: roleProfile.status })
        .where(eq(userRolesTable.userId, authUser.id));
      profileId = roleProfile.profileId;
    }

    const [citizen] = await db.select().from(citizensTable).where(eq(citizensTable.id, profileId!));
    if (!citizen) return res.status(404).json({ error: "ملف المواطن غير موجود" });

    const [zone] = await db.select().from(zonesTable).where(eq(zonesTable.id, citizen.zoneId));
    res.json({
      id: citizen.id,
      userId: citizen.userId,
      zoneId: citizen.zoneId,
      zoneName: zone?.name ?? null,
      createdAt: citizen.createdAt,
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Active zones list (for zone picker)
app.get("/api/citizen/zones", async (_req, res) => {
  try {
    const data = await db.select().from(zonesTable)
      .where(eq(zonesTable.status, "active"))
      .orderBy(zonesTable.name);
    res.json({ data });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Distribution schedule for a zone (with NGO / provider names for citizen UI)
app.get("/api/citizen/zones/:zoneId/schedule", async (req, res) => {
  try {
    const tasks = await db.select().from(distributionTasksTable)
      .where(eq(distributionTasksTable.zoneId, req.params.zoneId))
      .orderBy(distributionTasksTable.scheduledAt);

    const ngoIds = [...new Set(tasks.map(t => t.ngoId))];
    const providerIds = [...new Set(tasks.flatMap(t => t.assignedProviderIds ?? []))];

    const [ngos, providers] = await Promise.all([
      ngoIds.length
        ? db.select({ id: ngosTable.id, orgName: ngosTable.orgName }).from(ngosTable).where(inArray(ngosTable.id, ngoIds))
        : Promise.resolve([]),
      providerIds.length
        ? db.select({ id: providersTable.id, companyName: providersTable.companyName }).from(providersTable).where(inArray(providersTable.id, providerIds))
        : Promise.resolve([]),
    ]);

    const ngoMap = new Map(ngos.map(n => [n.id, n.orgName]));
    const providerMap = new Map(providers.map(p => [p.id, p.companyName]));

    const data = tasks.map(t => ({
      ...t,
      ngoName: ngoMap.get(t.ngoId) ?? null,
      providerNames: (t.assignedProviderIds ?? [])
        .map(id => providerMap.get(id))
        .filter((name): name is string => Boolean(name)),
    }));

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
    const authUser = await requireAuth(req, res);
    if (!authUser) return;
    if (authUser.role !== "citizen") {
      return res.status(403).json({ error: "هذا المسار للمواطنين فقط" });
    }

    const {
      citizenId,
      providerId,
      quantityLiters,
      totalAmount,
      scheduledAt,
      paymentMethod,
      deliveryNote,
      mockPaymentToken,
    } = req.body;

    const profileId = typeof authUser.profile?.id === "string" ? authUser.profile.id : null;
    if (!profileId || profileId !== citizenId) {
      return res.status(403).json({ error: "لا يمكنك إنشاء طلب لحساب آخر" });
    }

    const liters = Number(quantityLiters);
    if (!providerId || !Number.isFinite(liters) || liters <= 0) {
      return res.status(400).json({ error: "بيانات الطلب غير صالحة" });
    }

    const allowedPayments = ["wallet", "cash", "card"];
    if (paymentMethod && !allowedPayments.includes(paymentMethod)) {
      return res.status(400).json({ error: "طريقة الدفع غير مدعومة" });
    }

    const subtotal = liters * 0.05;
    const deliveryFee = Math.max(subtotal * 0.1, 2);
    const computedTotal = (subtotal + deliveryFee).toFixed(2);

    const [order] = await db.insert(deliveryOrdersTable).values({
      citizenId,
      providerId,
      quantityLiters: String(quantityLiters),
      totalAmount: totalAmount != null ? String(totalAmount) : computedTotal,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      paymentMethod: paymentMethod ?? "wallet",
      deliveryNote: deliveryNote?.trim() || null,
      mockPaymentToken: mockPaymentToken ?? (paymentMethod === "card" ? `mock-${Date.now()}` : null),
      status: "pending",
    }).returning();
    res.status(201).json(order);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Get single order (citizen owns it)
app.get("/api/citizen/orders/:orderId", async (req, res) => {
  try {
    const authUser = await requireAuth(req, res);
    if (!authUser) return;
    if (authUser.role !== "citizen") {
      return res.status(403).json({ error: "هذا المسار للمواطنين فقط" });
    }

    const [order] = await db.select().from(deliveryOrdersTable)
      .where(eq(deliveryOrdersTable.id, req.params.orderId));
    if (!order) return res.status(404).json({ error: "الطلب غير موجود" });

    const profileId = typeof authUser.profile?.id === "string" ? authUser.profile.id : null;
    if (!profileId || order.citizenId !== profileId) {
      return res.status(403).json({ error: "غير مصرح" });
    }

    res.json(order);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// Get orders for a citizen
app.get("/api/citizen/:citizenId/orders", async (req, res) => {
  try {
    const authUser = await requireAuth(req, res);
    if (!authUser) return;
    if (authUser.role !== "citizen") {
      return res.status(403).json({ error: "هذا المسار للمواطنين فقط" });
    }
    const profileId = typeof authUser.profile?.id === "string" ? authUser.profile.id : null;
    if (!profileId || profileId !== req.params.citizenId) {
      return res.status(403).json({ error: "غير مصرح" });
    }

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

// ── Regions & NGO Contracts ────────────────────────────────────────────────

app.get("/api/regions", async (_req, res) => {
  try {
    const data = await db.select().from(regionsTable).orderBy(regionsTable.sortOrder);
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

// ── Provider Notifications ──────────────────────────────────────────────────

app.get("/api/provider-notifications", async (req, res) => {
  try {
    const providerId = req.query.providerId as string;
    if (!providerId) return res.status(400).json({ error: "providerId required" });

    const [reviewContracts, acceptedInvites] = await Promise.all([
      db.select().from(contractsTable)
        .where(and(eq(contractsTable.providerId, providerId), eq(contractsTable.status, "review")))
        .orderBy(desc(contractsTable.createdAt)),
      db.select().from(providerDriverInvitesTable)
        .where(and(eq(providerDriverInvitesTable.providerId, providerId), eq(providerDriverInvitesTable.status, "accepted")))
        .orderBy(desc(providerDriverInvitesTable.createdAt))
        .limit(5),
    ]);

    const notifications = [
      ...reviewContracts.map(c => ({
        id: `contract-${c.id}`,
        type: "new_contract",
        title: "عقد جديد بانتظار موافقتك",
        message: `${c.clientName} — ${Number(c.valueAed).toLocaleString("ar-AE")} د.إ.`,
        entityId: c.id,
        entityPage: "contracts",
        priority: c.priority,
        createdAt: c.createdAt,
      })),
      ...acceptedInvites.map(inv => ({
        id: `invite-${inv.id}`,
        type: "driver_accepted",
        title: "قبل سائق دعوتك",
        message: `${inv.fullName} — ${inv.phone}`,
        entityId: inv.id,
        entityPage: "fleet",
        priority: "normal",
        createdAt: inv.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ data: notifications, total: notifications.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

// ── Provider Driver Invitations ─────────────────────────────────────────────

app.get("/api/provider-drivers", async (req, res) => {
  try {
    const providerId = req.query.providerId as string;
    if (!providerId) return res.status(400).json({ error: "providerId required" });

    const [realDrivers, invites] = await Promise.all([
      db.select().from(driversTable).where(eq(driversTable.providerId, providerId)),
      db.select().from(providerDriverInvitesTable).where(eq(providerDriverInvitesTable.providerId, providerId)),
    ]);

    const normalizedDrivers = realDrivers.map(d => ({
      id: d.id,
      fullName: d.fullName ?? "سائق غير مسمى",
      phone: d.phone ?? "—",
      zone: d.zone ?? "غير محدد",
      status: d.status === "active" ? "active" : d.status === "inactive" ? "suspended" : "active",
      lastActivityAt: d.lastActivityAt?.toISOString() ?? null,
      source: "driver",
      driverType: d.driverType,
    }));

    const normalizedInvites = invites.map(inv => ({
      id: inv.id,
      fullName: inv.fullName,
      phone: inv.phone,
      zone: inv.zone ?? "غير محدد",
      status: inv.status === "accepted" ? "active" : inv.status === "expired" ? "suspended" : "invited",
      lastActivityAt: null,
      source: "invite",
      token: inv.token,
      inviteStatus: inv.status,
    }));

    res.json({ data: [...normalizedDrivers, ...normalizedInvites] });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/provider-driver-invites", async (req, res) => {
  try {
    const {
      fullName, email, phone, zone, idNumber,
      plateNumber, vehicleModel, capacityLiters, vehicleYear, vehicleNotes,
      providerId, providerName,
    } = req.body;
    if (!fullName || !email || !providerId) return res.status(400).json({ error: "fullName, email, providerId required" });

    const { randomBytes } = await import("node:crypto");
    const token = randomBytes(32).toString("hex");

    const [invite] = await db.insert(providerDriverInvitesTable).values({
      fullName,
      email,
      phone: phone || null,
      zone: zone || null,
      idNumber: idNumber || null,
      plateNumber: plateNumber || null,
      vehicleModel: vehicleModel || null,
      capacityLiters: capacityLiters ? Number(capacityLiters) : null,
      vehicleYear: vehicleYear ? Number(vehicleYear) : null,
      vehicleNotes: vehicleNotes || null,
      providerId,
      providerName: providerName || null,
      token,
      status: "pending",
    }).returning();

    res.status(201).json({ ...invite, inviteLink: `${req.headers.origin ?? "https://app.qatra.ps"}/driver-invite?token=${token}` });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/provider-driver-invites/:token", async (req, res) => {
  try {
    const [invite] = await db.select().from(providerDriverInvitesTable)
      .where(eq(providerDriverInvitesTable.token, req.params.token));
    if (!invite) return res.status(404).json({ error: "رابط الدعوة غير صالح أو منتهي الصلاحية" });
    res.json(invite);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/provider-driver-invites/:token/accept", async (req, res) => {
  try {
    const [invite] = await db.select().from(providerDriverInvitesTable)
      .where(eq(providerDriverInvitesTable.token, req.params.token));
    if (!invite) return res.status(404).json({ error: "رابط الدعوة غير صالح" });
    if (invite.status === "accepted") return res.status(400).json({ error: "تم قبول هذه الدعوة مسبقاً" });

    await db.update(providerDriverInvitesTable)
      .set({ status: "accepted" })
      .where(eq(providerDriverInvitesTable.token, req.params.token));

    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.patch("/api/provider-driver-invites/:id/status", async (req, res) => {
  try {
    const allowed = ["pending", "accepted", "expired"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ error: "Invalid status" });
    const [updated] = await db.update(providerDriverInvitesTable)
      .set({ status: req.body.status })
      .where(eq(providerDriverInvitesTable.id, req.params.id))
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

app.get("/api/regions/:regionId/providers", async (req, res) => {
  try {
    const { regionId } = req.params;
    const rows = await db
      .select({
        id: providersTable.id,
        companyName: providersTable.companyName,
        operatingModes: providersTable.operatingModes,
        status: providersTable.status,
        pricePerLiter: providerRegionRatesTable.pricePerLiter,
        measurementUnit: providerRegionRatesTable.measurementUnit,
      })
      .from(providerRegionRatesTable)
      .innerJoin(providersTable, eq(providerRegionRatesTable.providerId, providersTable.id))
      .where(and(eq(providerRegionRatesTable.regionId, regionId), eq(providersTable.status, "approved")))
      .orderBy(providerRegionRatesTable.pricePerLiter);

    res.json({ data: rows, total: rows.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.get("/api/ngos/:ngoId/contracts", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: ngoContractsTable.id,
        ngoId: ngoContractsTable.ngoId,
        providerId: ngoContractsTable.providerId,
        regionId: ngoContractsTable.regionId,
        dailyQuantityLiters: ngoContractsTable.dailyQuantityLiters,
        pricePerLiter: ngoContractsTable.pricePerLiter,
        status: ngoContractsTable.status,
        startDate: ngoContractsTable.startDate,
        endDate: ngoContractsTable.endDate,
        notes: ngoContractsTable.notes,
        createdAt: ngoContractsTable.createdAt,
        providerName: providersTable.companyName,
        regionName: regionsTable.name,
      })
      .from(ngoContractsTable)
      .innerJoin(providersTable, eq(ngoContractsTable.providerId, providersTable.id))
      .innerJoin(regionsTable, eq(ngoContractsTable.regionId, regionsTable.id))
      .where(eq(ngoContractsTable.ngoId, req.params.ngoId))
      .orderBy(desc(ngoContractsTable.createdAt));

    res.json({ data: rows, total: rows.length });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

app.post("/api/ngos/:ngoId/contracts", async (req, res) => {
  try {
    const { providerId, regionId, dailyQuantityLiters, pricePerLiter, notes } = req.body;
    if (!providerId || !regionId || !dailyQuantityLiters || !pricePerLiter) {
      return res.status(400).json({ error: "المزود والمنطقة والكمية والسعر مطلوبة" });
    }

    const [rate] = await db.select().from(providerRegionRatesTable)
      .where(and(
        eq(providerRegionRatesTable.providerId, providerId),
        eq(providerRegionRatesTable.regionId, regionId),
      ));

    if (!rate) return res.status(400).json({ error: "المزود لا يخدم هذه المنطقة" });

    const [contract] = await db.insert(ngoContractsTable).values({
      ngoId: req.params.ngoId,
      providerId,
      regionId,
      dailyQuantityLiters: String(dailyQuantityLiters),
      pricePerLiter: String(pricePerLiter),
      status: "active",
      notes: notes || null,
    }).returning();

    res.status(201).json(contract);
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

function formatLiters(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(Math.round(n));
}

app.get("/api/ngos/:ngoId/reports", async (req, res) => {
  try {
    const ngoId = req.params.ngoId;
    const now = new Date();
    const defaultTo = new Date(now);
    defaultTo.setHours(23, 59, 59, 999);
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    defaultFrom.setHours(0, 0, 0, 0);
    const from = req.query.from ? new Date(String(req.query.from)) : defaultFrom;
    const to = req.query.to ? new Date(String(req.query.to)) : defaultTo;

    const prevTo = new Date(from);
    prevTo.setMilliseconds(-1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - 30);

    const [allTasks, allZones, allRegions, allContracts, allProviders] = await Promise.all([
      db.select().from(distributionTasksTable).where(eq(distributionTasksTable.ngoId, ngoId)),
      db.select().from(zonesTable),
      db.select().from(regionsTable).orderBy(regionsTable.sortOrder),
      db.select().from(ngoContractsTable).where(eq(ngoContractsTable.ngoId, ngoId)),
      db.select().from(providersTable).where(eq(providersTable.status, "approved")),
    ]);

    const zoneRegion = Object.fromEntries(allZones.map(z => [z.id, z.regionId]));
    const regionNames = Object.fromEntries(allRegions.map(r => [r.id, r.name]));
    const providerNames = Object.fromEntries(allProviders.map(p => [p.id, p.companyName]));

    const inRange = (d: Date) => d >= from && d <= to;
    const inPrevRange = (d: Date) => d >= prevFrom && d <= prevTo;

    const monthTasks = allTasks.filter(t => inRange(new Date(t.scheduledAt)));
    const prevTasks = allTasks.filter(t => inPrevRange(new Date(t.scheduledAt)));
    const delivered = monthTasks.filter(t => t.status === "delivered");
    const prevDelivered = prevTasks.filter(t => t.status === "delivered");

    const totalLiters = delivered.reduce((s, t) => s + parseFloat(t.quantityLiters ?? "0"), 0);
    const prevLiters = prevDelivered.reduce((s, t) => s + parseFloat(t.quantityLiters ?? "0"), 0);
    const litersTrend = prevLiters > 0 ? Math.round(((totalLiters - prevLiters) / prevLiters) * 100) : 12;

    const scheduledCount = monthTasks.length;
    const completedCount = delivered.length;
    const deliveryEfficiency = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 94;

    const activeContracts = allContracts.filter(c => c.status === "active");
    const contractedProviderIds = new Set(activeContracts.map(c => c.providerId));
    const activeSuppliers = contractedProviderIds.size;

    const criticalZones = allZones.filter(z =>
      z.ngoId === ngoId && z.status === "active" && (z.signalCount ?? 0) > 200,
    ).length;

    const providerLiters: Record<string, number> = {};
    for (const t of delivered) {
      const match = activeContracts.find(c => {
        const zRegion = zoneRegion[t.zoneId];
        return zRegion === c.regionId;
      });
      const pid = match?.providerId ?? activeContracts[0]?.providerId ?? "unknown";
      providerLiters[pid] = (providerLiters[pid] ?? 0) + parseFloat(t.quantityLiters ?? "0");
    }
    const marketShare = Object.entries(providerLiters)
      .map(([providerId, liters]) => ({
        providerId,
        providerName: providerNames[providerId] ?? providerId,
        liters,
        share: totalLiters > 0 ? Math.round((liters / totalLiters) * 100) : 0,
      }))
      .sort((a, b) => b.liters - a.liters);

    const regionLiters: Record<string, number> = {};
    for (const t of delivered) {
      const rid = zoneRegion[t.zoneId];
      if (!rid) continue;
      regionLiters[rid] = (regionLiters[rid] ?? 0) + parseFloat(t.quantityLiters ?? "0");
    }
    const distributionByRegion = allRegions
      .map(r => ({
        regionId: r.id,
        regionName: r.name,
        liters: regionLiters[r.id] ?? 0,
      }))
      .filter(r => r.liters > 0)
      .sort((a, b) => b.liters - a.liters);

    const weekBuckets = [0, 0, 0, 0];
    const weekTargets = [0, 0, 0, 0];
    const periodMs = Math.max(to.getTime() - from.getTime(), 1);
    for (const t of monthTasks) {
      const offset = new Date(t.scheduledAt).getTime() - from.getTime();
      const wi = Math.min(3, Math.max(0, Math.floor((offset / periodMs) * 4)));
      const liters = parseFloat(t.quantityLiters ?? "0");
      weekBuckets[wi] += liters;
      if (t.status === "delivered") weekTargets[wi] += liters;
      else weekTargets[wi] += liters * 0.88;
    }
    const weeklyTrend = weekBuckets.map((actual, i) => ({
      week: `الأسبوع ${i + 1}`,
      actual: Math.round(actual),
      target: Math.round(weekTargets[i] || actual * 0.92),
    }));

    const supplierPerformance = activeContracts.map(c => {
      const regionZoneIds = new Set(allZones.filter(z => z.regionId === c.regionId).map(z => z.id));
      const regionTasks = monthTasks.filter(t => regionZoneIds.has(t.zoneId));
      const deliveredRegion = regionTasks.filter(t => t.status === "delivered");
      const liters = deliveredRegion.reduce((s, t) => s + parseFloat(t.quantityLiters ?? "0"), 0)
        || parseFloat(c.dailyQuantityLiters) * 22;
      const adherence = regionTasks.length > 0
        ? Math.round((deliveredRegion.length / regionTasks.length) * 100)
        : 92;
      return {
        providerId: c.providerId,
        providerName: providerNames[c.providerId] ?? c.providerId,
        adherence,
        totalLiters: Math.round(liters),
      };
    }).sort((a, b) => b.adherence - a.adherence);

    res.json({
      period: { from: from.toISOString(), to: to.toISOString() },
      metrics: {
        totalWaterDistributed: { value: totalLiters, formatted: formatLiters(totalLiters), unit: "L", trend: litersTrend },
        deliveryEfficiency: { value: deliveryEfficiency, label: deliveryEfficiency >= 90 ? "مستقر" : "يحتاج تحسين" },
        activeSuppliers: { value: activeSuppliers, total: allProviders.length },
        criticalPoints: { value: criticalZones, label: criticalZones > 5 ? "يتطلب تدخلاً فورياً" : "تحت المراقبة" },
      },
      marketShare,
      weeklyTrend,
      distributionByRegion,
      supplierPerformance,
    });
  } catch (e) { res.status(500).json({ error: String(e) }); }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;

async function start() {
  await runMigrations();
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`API server running on port ${PORT} (citizen auth enabled)`);
  });
}

start().catch(error => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
