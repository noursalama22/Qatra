import express from "express";
import { db } from "./db";
import {
  ngosTable, providersTable, driversTable, zonesTable,
  distributionTasksTable, deliveryOrdersTable, usersTable,
  citizensTable, signalsTable, gpsPositionsTable,
} from "@shared/schema";
import { eq, count, sum, sql, desc } from "drizzle-orm";

const app = express();
app.use(express.json());

app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

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

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
