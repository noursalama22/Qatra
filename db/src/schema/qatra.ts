import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./auth";

// ── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "ngo",
  "provider",
  "driver",
  "citizen",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);

export const zoneStatusEnum = pgEnum("zone_status", ["active", "inactive"]);

export const taskStatusEnum = pgEnum("task_status", [
  "pending",
  "in_progress",
  "delivered",
  "cancelled",
]);

export const providerTaskStatusEnum = pgEnum("provider_task_status", [
  "pending",
  "acknowledged",
  "in_progress",
  "delivered",
]);

export const driverTypeEnum = pgEnum("driver_type", ["owned", "independent"]);

export const driverStatusEnum = pgEnum("driver_status", [
  "pending",
  "active",
  "inactive",
  "rejected",
]);

export const driverTaskStatusEnum = pgEnum("driver_task_status", [
  "pending",
  "invitation_pending",
  "in_progress",
  "delivered",
  "rejected",
]);

export const deliveryChainEnum = pgEnum("delivery_chain", [
  "humanitarian",
  "commercial",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "dispatched",
  "delivered",
  "cancelled",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "paused",
]);

export const subscriptionFrequencyEnum = pgEnum("subscription_frequency", [
  "weekly",
  "biweekly",
  "monthly",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "driver_assigned",
  "driver_en_route",
  "delivery_complete",
  "task_assigned",
  "order_placed",
  "proof_submitted",
  "application_approved",
  "application_rejected",
  "performance_alert",
  "task_invitation",
  "route_updated",
]);

export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "expired",
]);

// ── User Roles ────────────────────────────────────────────────────────────────

export const userRolesTable = pgTable(
  "user_roles",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    status: applicationStatusEnum("status").notNull().default("approved"),
    profileId: varchar("profile_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("uq_user_roles_user_id").on(table.userId),
    index("idx_user_roles_role").on(table.role),
  ],
);

// ── NGOs ──────────────────────────────────────────────────────────────────────

export const ngosTable = pgTable(
  "ngos",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    orgName: varchar("org_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }),
    country: varchar("country", { length: 100 }),
    description: text("description"),
    status: applicationStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_ngos_user_id").on(table.userId)],
);

// ── Service Providers ─────────────────────────────────────────────────────────

export const providersTable = pgTable(
  "providers",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    companyName: varchar("company_name", { length: 255 }).notNull(),
    contactEmail: varchar("contact_email", { length: 255 }),
    description: text("description"),
    status: applicationStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    operatingModes: jsonb("operating_modes")
      .$type<Array<"humanitarian" | "commercial">>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_providers_user_id").on(table.userId)],
);

// ── Drivers ───────────────────────────────────────────────────────────────────

export const driversTable = pgTable(
  "drivers",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    driverType: driverTypeEnum("driver_type").notNull(),
    providerId: varchar("provider_id").references(() => providersTable.id, {
      onDelete: "set null",
    }),
    status: driverStatusEnum("status").notNull().default("pending"),
    phone: varchar("phone", { length: 50 }),
    vehicleType: varchar("vehicle_type", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_drivers_user_id").on(table.userId),
    index("idx_drivers_provider_id").on(table.providerId),
  ],
);

// ── Citizens ──────────────────────────────────────────────────────────────────

export const citizensTable = pgTable(
  "citizens",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    zoneId: varchar("zone_id").notNull(),
    lat: numeric("lat", { precision: 10, scale: 7 }),
    lng: numeric("lng", { precision: 10, scale: 7 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_citizens_user_id").on(table.userId),
    index("idx_citizens_zone_id").on(table.zoneId),
  ],
);

// ── Zones ─────────────────────────────────────────────────────────────────────

export const zonesTable = pgTable(
  "zones",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ngoId: varchar("ngo_id")
      .notNull()
      .references(() => ngosTable.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    boundary: jsonb("boundary"),
    populationEstimate: integer("population_estimate"),
    status: zoneStatusEnum("status").notNull().default("active"),
    signalCount: integer("signal_count").notNull().default(0),
    lastDeliveryAt: timestamp("last_delivery_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_zones_ngo_id").on(table.ngoId)],
);

// ── Distribution Tasks (NGO → Provider) ───────────────────────────────────────

export const distributionTasksTable = pgTable(
  "distribution_tasks",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    ngoId: varchar("ngo_id")
      .notNull()
      .references(() => ngosTable.id, { onDelete: "cascade" }),
    zoneId: varchar("zone_id")
      .notNull()
      .references(() => zonesTable.id, { onDelete: "cascade" }),
    status: taskStatusEnum("status").notNull().default("pending"),
    quantityLiters: numeric("quantity_liters", {
      precision: 10,
      scale: 2,
    }).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    assignedProviderIds: jsonb("assigned_provider_ids")
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_distribution_tasks_ngo_id").on(table.ngoId),
    index("idx_distribution_tasks_zone_id").on(table.zoneId),
  ],
);

// ── Provider NGO Tasks (Provider's view of a distribution task) ───────────────

export const providerNgoTasksTable = pgTable(
  "provider_ngo_tasks",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    distributionTaskId: varchar("distribution_task_id")
      .notNull()
      .references(() => distributionTasksTable.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id")
      .notNull()
      .references(() => providersTable.id, { onDelete: "cascade" }),
    status: providerTaskStatusEnum("status").notNull().default("pending"),
    assignedDriverId: varchar("assigned_driver_id").references(
      () => driversTable.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_provider_ngo_tasks_provider_id").on(table.providerId),
    index("idx_provider_ngo_tasks_dist_task_id").on(table.distributionTaskId),
  ],
);

// ── Driver Tasks ──────────────────────────────────────────────────────────────

export const driverTasksTable = pgTable(
  "driver_tasks",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    driverId: varchar("driver_id")
      .notNull()
      .references(() => driversTable.id, { onDelete: "cascade" }),
    providerNgoTaskId: varchar("provider_ngo_task_id").references(
      () => providerNgoTasksTable.id,
      { onDelete: "set null" },
    ),
    orderId: varchar("order_id"),
    taskType: deliveryChainEnum("task_type").notNull(),
    status: driverTaskStatusEnum("status").notNull().default("pending"),
    zoneId: varchar("zone_id").references(() => zonesTable.id, {
      onDelete: "set null",
    }),
    providerId: varchar("provider_id").references(() => providersTable.id, {
      onDelete: "set null",
    }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    quantityLiters: numeric("quantity_liters", { precision: 10, scale: 2 }),
    routeData: jsonb("route_data"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_driver_tasks_driver_id").on(table.driverId),
    index("idx_driver_tasks_status").on(table.status),
  ],
);

// ── Delivery Proofs ───────────────────────────────────────────────────────────

export const deliveryProofsTable = pgTable(
  "delivery_proofs",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    taskId: varchar("task_id")
      .notNull()
      .references(() => driverTasksTable.id, { onDelete: "cascade" }),
    photoUrl: varchar("photo_url", { length: 1024 }).notNull(),
    signatureUrl: varchar("signature_url", { length: 1024 }),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_proofs_task_id").on(table.taskId)],
);

// ── GPS Positions ─────────────────────────────────────────────────────────────

export const gpsPositionsTable = pgTable(
  "gps_positions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    driverId: varchar("driver_id")
      .notNull()
      .references(() => driversTable.id, { onDelete: "cascade" }),
    taskId: varchar("task_id").references(() => driverTasksTable.id, {
      onDelete: "set null",
    }),
    lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
    lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
    accuracy: numeric("accuracy", { precision: 8, scale: 2 }),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_gps_driver_id").on(table.driverId),
    index("idx_gps_recorded_at").on(table.recordedAt),
  ],
);

// ── Water Need Signals ────────────────────────────────────────────────────────

export const signalsTable = pgTable(
  "signals",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    citizenId: varchar("citizen_id")
      .notNull()
      .references(() => citizensTable.id, { onDelete: "cascade" }),
    zoneId: varchar("zone_id")
      .notNull()
      .references(() => zonesTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_signals_zone_id").on(table.zoneId),
    index("idx_signals_citizen_id").on(table.citizenId),
    index("idx_signals_created_at").on(table.createdAt),
  ],
);

// ── Subscriptions (commercial) ────────────────────────────────────────────────

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    citizenId: varchar("citizen_id")
      .notNull()
      .references(() => citizensTable.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id")
      .notNull()
      .references(() => providersTable.id, { onDelete: "cascade" }),
    planName: varchar("plan_name", { length: 100 }).notNull(),
    pricePerDelivery: numeric("price_per_delivery", {
      precision: 10,
      scale: 2,
    }),
    frequency: subscriptionFrequencyEnum("frequency"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    mockPaymentToken: varchar("mock_payment_token", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_subscriptions_citizen_id").on(table.citizenId),
    index("idx_subscriptions_provider_id").on(table.providerId),
  ],
);

// ── Delivery Orders (commercial) ──────────────────────────────────────────────

export const deliveryOrdersTable = pgTable(
  "delivery_orders",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    citizenId: varchar("citizen_id")
      .notNull()
      .references(() => citizensTable.id, { onDelete: "cascade" }),
    providerId: varchar("provider_id")
      .notNull()
      .references(() => providersTable.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    quantityLiters: numeric("quantity_liters", { precision: 10, scale: 2 }),
    totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    paymentMethod: varchar("payment_method", { length: 32 }),
    deliveryNote: text("delivery_note"),
    taskId: varchar("task_id").references(() => driverTasksTable.id, {
      onDelete: "set null",
    }),
    mockPaymentToken: varchar("mock_payment_token", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_orders_citizen_id").on(table.citizenId),
    index("idx_orders_provider_id").on(table.providerId),
    index("idx_orders_status").on(table.status),
  ],
);

// ── Driver Invitations ────────────────────────────────────────────────────────

export const driverInvitationsTable = pgTable(
  "driver_invitations",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    taskId: varchar("task_id")
      .notNull()
      .references(() => providerNgoTasksTable.id, { onDelete: "cascade" }),
    driverIdentifier: varchar("driver_identifier", { length: 255 }).notNull(),
    driverId: varchar("driver_id").references(() => driversTable.id, {
      onDelete: "set null",
    }),
    status: invitationStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_invitations_task_id").on(table.taskId)],
);

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationsTable = pgTable(
  "notifications",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    message: text("message").notNull(),
    entityId: varchar("entity_id"),
    entityType: varchar("entity_type", { length: 100 }),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_notifications_user_id").on(table.userId),
    index("idx_notifications_read").on(table.read),
  ],
);

// ── System Config ─────────────────────────────────────────────────────────────

export const systemConfigTable = pgTable("system_config", {
  id: varchar("id").primaryKey().default("default"),
  signalDensityWeight: numeric("signal_density_weight", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("0.5"),
  daysSinceDeliveryWeight: numeric("days_since_delivery_weight", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("0.3"),
  populationWeight: numeric("population_weight", { precision: 5, scale: 2 })
    .notNull()
    .default("0.2"),
  signalThreshold: integer("signal_threshold").notNull().default(10),
  platformFeePercent: numeric("platform_fee_percent", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("5.0"),
  autoEscalationDays: integer("auto_escalation_days").notNull().default(3),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ── Payments ──────────────────────────────────────────────────────────────────

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const paymentRelatedTypeEnum = pgEnum("payment_related_type", [
  "delivery_order",
  "subscription",
]);

export const paymentsTable = pgTable(
  "payments",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    relatedType: paymentRelatedTypeEnum("related_type"),
    relatedId: varchar("related_id"),
    mockPaymentToken: varchar("mock_payment_token"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_payments_user_id").on(table.userId),
    index("idx_payments_status").on(table.status),
    index("idx_payments_related").on(table.relatedType, table.relatedId),
  ],
);

// ── Audit Log ─────────────────────────────────────────────────────────────────

export const auditLogTable = pgTable(
  "audit_log",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    actorId: varchar("actor_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    actorRole: varchar("actor_role", { length: 50 }),
    action: varchar("action", { length: 255 }).notNull(),
    entityType: varchar("entity_type", { length: 100 }).notNull(),
    entityId: varchar("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_audit_log_actor_id").on(table.actorId),
    index("idx_audit_log_created_at").on(table.createdAt),
  ],
);

// ── Insert Schemas ────────────────────────────────────────────────────────────

export const insertNgoSchema = createInsertSchema(ngosTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProviderSchema = createInsertSchema(providersTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDriverSchema = createInsertSchema(driversTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertCitizenSchema = createInsertSchema(citizensTable).omit({
  id: true,
  createdAt: true,
});
export const insertZoneSchema = createInsertSchema(zonesTable).omit({
  id: true,
  signalCount: true,
  lastDeliveryAt: true,
  createdAt: true,
  updatedAt: true,
});
export const insertDistributionTaskSchema = createInsertSchema(
  distributionTasksTable,
).omit({ id: true, status: true, createdAt: true, updatedAt: true });
export const insertSignalSchema = createInsertSchema(signalsTable).omit({
  id: true,
  createdAt: true,
});
export const insertSubscriptionSchema = createInsertSchema(
  subscriptionsTable,
).omit({ id: true, status: true, createdAt: true, updatedAt: true });
export const insertDeliveryOrderSchema = createInsertSchema(
  deliveryOrdersTable,
).omit({
  id: true,
  status: true,
  taskId: true,
  createdAt: true,
  updatedAt: true,
});
export const insertNotificationSchema = createInsertSchema(
  notificationsTable,
).omit({ id: true, read: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogTable).omit({
  id: true,
  createdAt: true,
});
export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type Ngo = typeof ngosTable.$inferSelect;
export type InsertNgo = z.infer<typeof insertNgoSchema>;

export type Provider = typeof providersTable.$inferSelect;
export type InsertProvider = z.infer<typeof insertProviderSchema>;

export type Driver = typeof driversTable.$inferSelect;
export type InsertDriver = z.infer<typeof insertDriverSchema>;

export type Citizen = typeof citizensTable.$inferSelect;
export type InsertCitizen = z.infer<typeof insertCitizenSchema>;

export type Zone = typeof zonesTable.$inferSelect;
export type InsertZone = z.infer<typeof insertZoneSchema>;

export type DistributionTask = typeof distributionTasksTable.$inferSelect;
export type ProviderNgoTask = typeof providerNgoTasksTable.$inferSelect;
export type DriverTask = typeof driverTasksTable.$inferSelect;
export type DeliveryProof = typeof deliveryProofsTable.$inferSelect;
export type GpsPosition = typeof gpsPositionsTable.$inferSelect;
export type Signal = typeof signalsTable.$inferSelect;
export type Subscription = typeof subscriptionsTable.$inferSelect;
export type DeliveryOrder = typeof deliveryOrdersTable.$inferSelect;
export type DriverInvitation = typeof driverInvitationsTable.$inferSelect;
export type Notification = typeof notificationsTable.$inferSelect;
export type SystemConfig = typeof systemConfigTable.$inferSelect;
export type AuditLogEntry = typeof auditLogTable.$inferSelect;
export type UserRole = typeof userRolesTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
