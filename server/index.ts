import express from "express";

const app = express();
app.use(express.json());

const zones = [
  { id: "z1", name: "North Aleppo", status: "active", ngoId: "n1", populationEstimate: 12000, signalCount: 47, lastDeliveryAt: "2026-05-20T10:00:00Z", description: "Northern residential district" },
  { id: "z2", name: "East Homs", status: "active", ngoId: "n1", populationEstimate: 8500, signalCount: 23, lastDeliveryAt: "2026-05-18T14:00:00Z", description: "Eastern suburb area" },
  { id: "z3", name: "South Raqqa", status: "inactive", ngoId: "n2", populationEstimate: 5000, signalCount: 8, lastDeliveryAt: "2026-05-10T09:00:00Z", description: "Southern village cluster" },
  { id: "z4", name: "West Idlib", status: "active", ngoId: "n2", populationEstimate: 15000, signalCount: 62, lastDeliveryAt: "2026-05-22T08:00:00Z", description: "Western corridor settlements" },
];

const ngos = [
  { id: "n1", orgName: "WaterAid Syria", contactEmail: "ops@wateraid.sy", country: "Syria", status: "approved", description: "Humanitarian water delivery NGO" },
  { id: "n2", orgName: "AQUA Relief", contactEmail: "info@aquarelief.org", country: "Syria", status: "approved", description: "Emergency water relief organization" },
  { id: "n3", orgName: "Blue Crescent", contactEmail: "contact@bluecrescent.org", country: "Jordan", status: "pending", description: "Cross-border water assistance" },
];

const providers = [
  { id: "p1", companyName: "FastWater Co.", contactEmail: "ops@fastwater.com", status: "approved", operatingModes: ["humanitarian", "commercial"], description: "Regional water logistics company" },
  { id: "p2", companyName: "AquaFleet Ltd.", contactEmail: "fleet@aquafleet.com", status: "approved", operatingModes: ["commercial"], description: "Commercial water delivery fleet" },
  { id: "p3", companyName: "Relief Logistics", contactEmail: "ops@relieflog.org", status: "pending", operatingModes: ["humanitarian"], description: "NGO-focused water transport" },
];

const drivers = [
  { id: "d1", driverType: "owned", providerId: "p1", status: "active", phone: "+963-912-345-678", vehicleType: "Water Tanker 5000L", userId: "u1" },
  { id: "d2", driverType: "independent", providerId: null, status: "active", phone: "+963-933-222-111", vehicleType: "Pickup 1000L", userId: "u2" },
  { id: "d3", driverType: "owned", providerId: "p1", status: "pending", phone: "+963-944-777-888", vehicleType: "Water Tanker 3000L", userId: "u3" },
  { id: "d4", driverType: "owned", providerId: "p2", status: "active", phone: "+963-955-444-333", vehicleType: "Water Tanker 8000L", userId: "u4" },
];

const tasks = [
  { id: "t1", ngoId: "n1", zoneId: "z1", status: "in_progress", quantityLiters: "15000", scheduledAt: "2026-05-24T08:00:00Z", notes: "Priority delivery - high signal count" },
  { id: "t2", ngoId: "n1", zoneId: "z2", status: "pending", quantityLiters: "8000", scheduledAt: "2026-05-25T10:00:00Z", notes: null },
  { id: "t3", ngoId: "n2", zoneId: "z4", status: "delivered", quantityLiters: "20000", scheduledAt: "2026-05-22T07:00:00Z", notes: "Completed ahead of schedule" },
  { id: "t4", ngoId: "n2", zoneId: "z3", status: "cancelled", quantityLiters: "5000", scheduledAt: "2026-05-21T09:00:00Z", notes: "Access denied due to road conditions" },
  { id: "t5", ngoId: "n1", zoneId: "z1", status: "pending", quantityLiters: "12000", scheduledAt: "2026-05-26T08:00:00Z", notes: null },
];

const orders = [
  { id: "o1", citizenId: "c1", providerId: "p1", status: "delivered", quantityLiters: "500", totalAmount: "25.00", createdAt: "2026-05-20T10:00:00Z" },
  { id: "o2", citizenId: "c2", providerId: "p2", status: "dispatched", quantityLiters: "1000", totalAmount: "45.00", createdAt: "2026-05-23T09:00:00Z" },
  { id: "o3", citizenId: "c3", providerId: "p1", status: "pending", quantityLiters: "750", totalAmount: "35.00", createdAt: "2026-05-23T11:00:00Z" },
  { id: "o4", citizenId: "c1", providerId: "p2", status: "cancelled", quantityLiters: "500", totalAmount: "25.00", createdAt: "2026-05-19T08:00:00Z" },
];

app.get("/api/healthz", (_req, res) => res.json({ status: "ok" }));

app.get("/api/zones", (_req, res) => res.json({ data: zones, total: zones.length }));
app.get("/api/zones/:id", (req, res) => {
  const zone = zones.find(z => z.id === req.params.id);
  if (!zone) return res.status(404).json({ error: "Not found" });
  res.json(zone);
});
app.post("/api/zones", (req, res) => {
  const zone = { id: `z${Date.now()}`, signalCount: 0, lastDeliveryAt: null, ...req.body };
  zones.push(zone);
  res.status(201).json(zone);
});

app.get("/api/ngos", (_req, res) => res.json({ data: ngos, total: ngos.length }));
app.get("/api/providers", (_req, res) => res.json({ data: providers, total: providers.length }));

app.get("/api/drivers", (_req, res) => res.json({ data: drivers, total: drivers.length }));
app.patch("/api/drivers/:id", (req, res) => {
  const idx = drivers.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  drivers[idx] = { ...drivers[idx], ...req.body };
  res.json(drivers[idx]);
});

app.get("/api/tasks", (_req, res) => res.json({ data: tasks, total: tasks.length }));
app.post("/api/tasks", (req, res) => {
  const task = { id: `t${Date.now()}`, status: "pending", ...req.body };
  tasks.push(task);
  res.status(201).json(task);
});
app.patch("/api/tasks/:id", (req, res) => {
  const idx = tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  tasks[idx] = { ...tasks[idx], ...req.body };
  res.json(tasks[idx]);
});

app.get("/api/orders", (_req, res) => res.json({ data: orders, total: orders.length }));

app.get("/api/stats", (_req, res) => {
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
    deliveredTasks: tasks.filter(t => t.status === "delivered").length,
    totalOrders: orders.length,
    totalLitersDispatched: tasks.filter(t => t.status === "delivered").reduce((sum, t) => sum + parseFloat(t.quantityLiters), 0),
  });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
