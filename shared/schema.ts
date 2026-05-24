import { sql } from "drizzle-orm";
import {
  pgTable, pgEnum, varchar, text, timestamp, integer,
  numeric, boolean, jsonb, index, uniqueIndex,
} from "drizzle-orm/pg-core";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const applicationStatusEnum = pgEnum("application_status", ["pending", "approved", "rejected"]);
export const deliveryChainEnum = pgEnum("delivery_chain", ["humanitarian", "commercial"]);
export const driverStatusEnum = pgEnum("driver_status", ["pending", "active", "inactive", "rejected"]);
export const driverTaskStatusEnum = pgEnum("driver_task_status", ["pending", "invitation_pending", "in_progress", "delivered", "rejected"]);
export const driverTypeEnum = pgEnum("driver_type", ["owned", "independent"]);
export const invitationStatusEnum = pgEnum("invitation_status", ["pending", "accepted", "rejected", "expired"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "driver_assigned", "driver_en_route", "delivery_complete", "task_assigned",
  "order_placed", "proof_submitted", "application_approved", "application_rejected",
  "performance_alert", "task_invitation", "route_updated",
]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "dispatched", "delivered", "cancelled"]);
export const providerTaskStatusEnum = pgEnum("provider_task_status", ["pending", "acknowledged", "in_progress", "delivered"]);
export const subscriptionFrequencyEnum = pgEnum("subscription_frequency", ["weekly", "biweekly", "monthly"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "cancelled", "paused"]);
export const taskStatusEnum = pgEnum("task_status", ["pending", "in_progress", "delivered", "cancelled"]);
export const userRoleEnum = pgEnum("user_role", ["admin", "ngo", "provider", "driver", "citizen"]);
export const zoneStatusEnum = pgEnum("zone_status", ["active", "inactive"]);
export const paymentRelatedTypeEnum = pgEnum("payment_related_type", ["delivery_order", "subscription"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "completed", "failed", "refunded"]);
export const ngoContractStatusEnum = pgEnum("ngo_contract_status", ["active", "pending", "expired", "cancelled"]);

// ── Sessions (Replit Auth required) ───────────────────────────────────────────

export const sessionsTable = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (t) => [index("IDX_session_expire").on(t.expire)],
);

// ── Users (Replit Auth required) ──────────────────────────────────────────────

export const usersTable = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phone: varchar("phone", { length: 50 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type User = typeof usersTable.$inferSelect;
export type UpsertUser = typeof usersTable.$inferInsert;

// ── User Roles ────────────────────────────────────────────────────────────────

export const userRolesTable = pgTable(
  "user_roles",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    status: applicationStatusEnum("status").notNull().default("approved"),
    profileId: varchar("profile_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [uniqueIndex("uq_user_roles_user_id").on(t.userId), index("idx_user_roles_role").on(t.role)],
);

// ── NGOs ──────────────────────────────────────────────────────────────────────

export const ngosTable = pgTable(
  "ngos",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    orgName: varchar("org_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }),
    country: varchar("country", { length: 100 }),
    description: text("description"),
    status: applicationStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_ngos_user_id").on(t.userId)],
);

export type Ngo = typeof ngosTable.$inferSelect;

// ── Providers ─────────────────────────────────────────────────────────────────

export const providersTable = pgTable(
  "providers",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }),
    description: text("description"),
    status: applicationStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    operatingModes: jsonb("operating_modes").$type<Array<"humanitarian" | "commercial">>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_providers_user_id").on(t.userId)],
);

export type Provider = typeof providersTable.$inferSelect;

// ── Drivers ───────────────────────────────────────────────────────────────────

export const driversTable = pgTable(
  "drivers",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    driverType: driverTypeEnum("driver_type").notNull(),
    providerId: varchar("provider_id").references(() => providersTable.id, { onDelete: "set null" }),
    status: driverStatusEnum("status").notNull().default("pending"),
    phone: varchar("phone", { length: 50 }),
    vehicleType: varchar("vehicle_type", { length: 100 }),
    fullName: varchar("full_name", { length: 200 }),
    zone: varchar("zone", { length: 200 }),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_drivers_user_id").on(t.userId), index("idx_drivers_provider_id").on(t.providerId)],
);

export type Driver = typeof driversTable.$inferSelect;

// ── Provider Driver Invites ────────────────────────────────────────────────────

export const providerDriverInvitesTable = pgTable(
  "provider_driver_invites",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    fullName: varchar("full_name", { length: 200 }).notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    zone: varchar("zone", { length: 200 }),
    idNumber: varchar("id_number", { length: 100 }),
    providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
    providerName: varchar("provider_name", { length: 200 }),
    token: varchar("token", { length: 64 }).notNull().unique(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_pdi_provider_id").on(t.providerId), index("idx_pdi_token").on(t.token)],
);

export type ProviderDriverInvite = typeof providerDriverInvitesTable.$inferSelect;

// ── Citizens ──────────────────────────────────────────────────────────────────

export const citizensTable = pgTable(
  "citizens",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    zoneId: varchar("zone_id").notNull(),
    lat: numeric("lat", { precision: 10, scale: 7 }),
    lng: numeric("lng", { precision: 10, scale: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_citizens_user_id").on(t.userId), index("idx_citizens_zone_id").on(t.zoneId)],
);

// ── Regions (governorate-level areas for NGO contracts) ───────────────────────

export const regionsTable = pgTable("regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Region = typeof regionsTable.$inferSelect;

// ── Provider regional pricing ─────────────────────────────────────────────────

export const providerRegionRatesTable = pgTable(
  "provider_region_rates",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
    regionId: varchar("region_id").notNull().references(() => regionsTable.id, { onDelete: "cascade" }),
    pricePerLiter: numeric("price_per_liter", { precision: 10, scale: 4 }).notNull(),
    measurementUnit: varchar("measurement_unit", { length: 50 }).notNull().default("liter"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    uniqueIndex("uq_provider_region_rates").on(t.providerId, t.regionId),
    index("idx_provider_region_rates_region").on(t.regionId),
  ],
);

export type ProviderRegionRate = typeof providerRegionRatesTable.$inferSelect;

// ── NGO ↔ Provider contracts ──────────────────────────────────────────────────

export const ngoContractsTable = pgTable(
  "ngo_contracts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ngoId: varchar("ngo_id").notNull().references(() => ngosTable.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
    regionId: varchar("region_id").notNull().references(() => regionsTable.id, { onDelete: "cascade" }),
    dailyQuantityLiters: numeric("daily_quantity_liters", { precision: 12, scale: 2 }).notNull(),
    pricePerLiter: numeric("price_per_liter", { precision: 10, scale: 4 }).notNull(),
    status: ngoContractStatusEnum("status").notNull().default("active"),
    startDate: timestamp("start_date", { withTimezone: true }).notNull().defaultNow(),
    endDate: timestamp("end_date", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_ngo_contracts_ngo_id").on(t.ngoId),
    index("idx_ngo_contracts_region_id").on(t.regionId),
    index("idx_ngo_contracts_provider_id").on(t.providerId),
  ],
);

export type NgoContract = typeof ngoContractsTable.$inferSelect;

// ── Zones ─────────────────────────────────────────────────────────────────────

export const zonesTable = pgTable(
  "zones",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ngoId: varchar("ngo_id").notNull().references(() => ngosTable.id, { onDelete: "cascade" }),
    regionId: varchar("region_id").references(() => regionsTable.id, { onDelete: "set null" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    boundary: jsonb("boundary"),
    populationEstimate: integer("population_estimate"),
    status: zoneStatusEnum("status").notNull().default("active"),
    signalCount: integer("signal_count").notNull().default(0),
    lastDeliveryAt: timestamp("last_delivery_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_zones_ngo_id").on(t.ngoId), index("idx_zones_region_id").on(t.regionId)],
);

export type Zone = typeof zonesTable.$inferSelect;

// ── Distribution Tasks ────────────────────────────────────────────────────────

export const distributionTasksTable = pgTable(
  "distribution_tasks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ngoId: varchar("ngo_id").notNull().references(() => ngosTable.id, { onDelete: "cascade" }),
    zoneId: varchar("zone_id").notNull().references(() => zonesTable.id, { onDelete: "cascade" }),
    status: taskStatusEnum("status").notNull().default("pending"),
    quantityLiters: numeric("quantity_liters", { precision: 10, scale: 2 }).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    assignedProviderIds: jsonb("assigned_provider_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_distribution_tasks_ngo_id").on(t.ngoId), index("idx_distribution_tasks_zone_id").on(t.zoneId)],
);

export type DistributionTask = typeof distributionTasksTable.$inferSelect;

// ── Provider NGO Tasks ────────────────────────────────────────────────────────

export const providerNgoTasksTable = pgTable(
  "provider_ngo_tasks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    distributionTaskId: varchar("distribution_task_id").notNull().references(() => distributionTasksTable.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
    status: providerTaskStatusEnum("status").notNull().default("pending"),
    assignedDriverId: varchar("assigned_driver_id").references(() => driversTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_provider_ngo_tasks_provider_id").on(t.providerId), index("idx_provider_ngo_tasks_dist_task_id").on(t.distributionTaskId)],
);

// ── Driver Tasks ──────────────────────────────────────────────────────────────

export const driverTasksTable = pgTable(
  "driver_tasks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    driverId: varchar("driver_id").notNull().references(() => driversTable.id, { onDelete: "cascade" }),
    providerNgoTaskId: varchar("provider_ngo_task_id").references(() => providerNgoTasksTable.id, { onDelete: "set null" }),
    orderId: varchar("order_id"),
    taskType: deliveryChainEnum("task_type").notNull(),
    status: driverTaskStatusEnum("status").notNull().default("pending"),
    zoneId: varchar("zone_id").references(() => zonesTable.id, { onDelete: "set null" }),
    providerId: varchar("provider_id").references(() => providersTable.id, { onDelete: "set null" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    quantityLiters: numeric("quantity_liters", { precision: 10, scale: 2 }),
    routeData: jsonb("route_data"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_driver_tasks_driver_id").on(t.driverId), index("idx_driver_tasks_status").on(t.status)],
);

// ── Delivery Proofs ───────────────────────────────────────────────────────────

export const deliveryProofsTable = pgTable(
  "delivery_proofs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    taskId: varchar("task_id").notNull().references(() => driverTasksTable.id, { onDelete: "cascade" }),
    photoUrl: varchar("photo_url", { length: 1024 }).notNull(),
    signatureUrl: varchar("signature_url", { length: 1024 }),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_proofs_task_id").on(t.taskId)],
);

// ── GPS Positions ─────────────────────────────────────────────────────────────

export const gpsPositionsTable = pgTable(
  "gps_positions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    driverId: varchar("driver_id").notNull().references(() => driversTable.id, { onDelete: "cascade" }),
    taskId: varchar("task_id").references(() => driverTasksTable.id, { onDelete: "set null" }),
    lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
    lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
    accuracy: numeric("accuracy", { precision: 8, scale: 2 }),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_gps_driver_id").on(t.driverId), index("idx_gps_recorded_at").on(t.recordedAt)],
);

// ── Signals ───────────────────────────────────────────────────────────────────

export const signalsTable = pgTable(
  "signals",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    citizenId: varchar("citizen_id").notNull().references(() => citizensTable.id, { onDelete: "cascade" }),
    zoneId: varchar("zone_id").notNull().references(() => zonesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_signals_zone_id").on(t.zoneId), index("idx_signals_citizen_id").on(t.citizenId), index("idx_signals_created_at").on(t.createdAt)],
);

// ── Subscriptions ─────────────────────────────────────────────────────────────

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    citizenId: varchar("citizen_id").notNull().references(() => citizensTable.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
    planName: varchar("plan_name", { length: 100 }).notNull(),
    pricePerDelivery: numeric("price_per_delivery", { precision: 10, scale: 2 }),
    frequency: subscriptionFrequencyEnum("frequency"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    mockPaymentToken: varchar("mock_payment_token", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_subscriptions_citizen_id").on(t.citizenId), index("idx_subscriptions_provider_id").on(t.providerId)],
);

// ── Delivery Orders ───────────────────────────────────────────────────────────

export const deliveryOrdersTable = pgTable(
  "delivery_orders",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    citizenId: varchar("citizen_id").notNull().references(() => citizensTable.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    quantityLiters: numeric("quantity_liters", { precision: 10, scale: 2 }),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    paymentMethod: varchar("payment_method", { length: 32 }),
    deliveryNote: text("delivery_note"),
    taskId: varchar("task_id").references(() => driverTasksTable.id, { onDelete: "set null" }),
    mockPaymentToken: varchar("mock_payment_token", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_orders_citizen_id").on(t.citizenId), index("idx_orders_provider_id").on(t.providerId), index("idx_orders_status").on(t.status)],
);

// ── Driver Invitations ────────────────────────────────────────────────────────

export const driverInvitationsTable = pgTable(
  "driver_invitations",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    taskId: varchar("task_id").notNull().references(() => providerNgoTasksTable.id, { onDelete: "cascade" }),
    driverIdentifier: varchar("driver_identifier", { length: 255 }).notNull(),
    driverId: varchar("driver_id").references(() => driversTable.id, { onDelete: "set null" }),
    status: invitationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_invitations_task_id").on(t.taskId)],
);

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsTable = pgTable(
  "notifications",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    message: text("message").notNull(),
    entityId: varchar("entity_id"),
    entityType: varchar("entity_type", { length: 100 }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_notifications_user_id").on(t.userId), index("idx_notifications_read").on(t.read)],
);

// ── System Config ─────────────────────────────────────────────────────────────

export const systemConfigTable = pgTable("system_config", {
  id: varchar("id").primaryKey().default("default"),
  signalDensityWeight: numeric("signal_density_weight", { precision: 5, scale: 2 }).notNull().default("0.5"),
  daysSinceDeliveryWeight: numeric("days_since_delivery_weight", { precision: 5, scale: 2 }).notNull().default("0.3"),
  populationWeight: numeric("population_weight", { precision: 5, scale: 2 }).notNull().default("0.2"),
  signalThreshold: integer("signal_threshold").notNull().default(10),
  platformFeePercent: numeric("platform_fee_percent", { precision: 5, scale: 2 }).notNull().default("5.0"),
  autoEscalationDays: integer("auto_escalation_days").notNull().default(3),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

// ── Payments ──────────────────────────────────────────────────────────────────

export const paymentsTable = pgTable(
  "payments",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    relatedType: paymentRelatedTypeEnum("related_type"),
    relatedId: varchar("related_id"),
    mockPaymentToken: varchar("mock_payment_token"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_payments_user_id").on(t.userId), index("idx_payments_status").on(t.status)],
);

// ── Trucks ────────────────────────────────────────────────────────────────────

export const truckStatusEnum = pgEnum("truck_status", ["available", "on_trip", "maintenance"]);

export const trucksTable = pgTable(
  "trucks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
    plateNumber: varchar("plate_number", { length: 30 }).notNull(),
    model: varchar("model", { length: 100 }).notNull(),
    capacityLiters: integer("capacity_liters").notNull(),
    year: integer("year").notNull(),
    status: truckStatusEnum("status").notNull().default("available"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_trucks_provider_id").on(t.providerId), index("idx_trucks_status").on(t.status)],
);

export type Truck = typeof trucksTable.$inferSelect;

// ── Contracts ─────────────────────────────────────────────────────────────────

export const contractStatusEnum = pgEnum("provider_contract_status", ["review", "active", "rejected"]);
export const contractPriorityEnum = pgEnum("contract_priority", ["normal", "high", "vip"]);

export const contractsTable = pgTable(
  "contracts",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    contractNumber: varchar("contract_number", { length: 20 }).notNull(),
    providerId: varchar("provider_id").notNull().references(() => providersTable.id, { onDelete: "cascade" }),
    clientName: varchar("client_name", { length: 255 }).notNull(),
    priority: contractPriorityEnum("priority").notNull().default("normal"),
    status: contractStatusEnum("status").notNull().default("review"),
    volumeLiters: integer("volume_liters").notNull(),
    valueAed: numeric("value_aed", { precision: 12, scale: 2 }).notNull(),
    location: varchar("location", { length: 255 }),
    slaHours: integer("sla_hours"),
    notes: text("notes"),
    startDate: timestamp("start_date", { withTimezone: true }),
    endDate: timestamp("end_date", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (t) => [index("idx_contracts_provider_id").on(t.providerId), index("idx_contracts_status").on(t.status)],
);

export type Contract = typeof contractsTable.$inferSelect;

// ── Audit Log ─────────────────────────────────────────────────────────────────

export const auditLogTable = pgTable(
  "audit_log",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    actorId: varchar("actor_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    actorRole: varchar("actor_role", { length: 50 }),
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: varchar("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("idx_audit_log_actor_id").on(t.actorId), index("idx_audit_log_created_at").on(t.createdAt)],
);
