import { pgTable, text, timestamp, integer, boolean, numeric, jsonb, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Authentication Tables (Better-Auth) ---
// Note: better-auth usually generates these, but we define them here for relations
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId').notNull().references(() => user.id),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId').notNull().references(() => user.id),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull(),
  updatedAt: timestamp('updatedAt').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
});

// --- WaResto Business Tables ---

export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const menus = pgTable('menus', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const menuOptions = pgTable('menu_options', {
  id: uuid('id').defaultRandom().primaryKey(),
  menuId: uuid('menu_id').references(() => menus.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  choices: jsonb('choices').notNull(), // Array of { name: string, price: number }
  required: boolean('required').default(false).notNull(),
});

export const tables = pgTable('tables', {
  id: uuid('id').defaultRandom().primaryKey(),
  number: text('number').notNull().unique(),
  status: text('status', { enum: ['kosong', 'terisi'] }).default('kosong').notNull(),
  qrCodeUrl: text('qr_code_url'),
  menuUrl: text('menu_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  tableId: uuid('table_id').references(() => tables.id),
  customerName: text('customer_name').notNull(),
  type: text('type', { enum: ['dine_in', 'take_away'] }).notNull(),
  arrivalStatus: text('arrival_status', { enum: ['sudah_tiba', 'belum_tiba'] }).default('sudah_tiba'),
  status: text('status', { enum: ['menunggu', 'proses', 'siap', 'selesai', 'dibatalkan'] }).default('menunggu').notNull(),
  specialNote: text('special_note'),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 }).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  menuId: uuid('menu_id').references(() => menus.id),
  quantity: integer('quantity').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  name: text('name').notNull(),
  options: jsonb('options'), // Array of selected options
});

export const restaurantProfile = pgTable('restaurant_profile', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  subtitle: text('subtitle'),
  address: text('address'),
  logoUrl: text('logo_url'),
  heroImageUrl: text('hero_image_url'),
  googlePlaceId: text('google_place_id'),
  googleMapsUrl: text('google_maps_url'),
  rating: numeric('rating', { precision: 3, scale: 2 }),
  reviewCount: integer('review_count'),
  taxRate: numeric('tax_rate', { precision: 5, scale: 2 }).default('0.10'),
  openTime: text('open_time').default('08:00'),
  closeTime: text('close_time').default('22:00'),
});

// --- Relations ---

export const categoriesRelations = relations(categories, ({ many }) => ({
  menus: many(menus),
}));

export const menusRelations = relations(menus, ({ one, many }) => ({
  category: one(categories, {
    fields: [menus.categoryId],
    references: [categories.id],
  }),
  options: many(menuOptions),
}));

export const menuOptionsRelations = relations(menuOptions, ({ one }) => ({
  menu: one(menus, {
    fields: [menuOptions.menuId],
    references: [menus.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  table: one(tables, {
    fields: [orders.tableId],
    references: [tables.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  menu: one(menus, {
    fields: [orderItems.menuId],
    references: [menus.id],
  }),
}));
