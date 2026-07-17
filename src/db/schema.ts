import { pgTable, serial, text, timestamp, integer, boolean, numeric } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  isAdmin: boolean('is_admin').default(false),
  theme: text('theme').default('default'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(), // Using string IDs as in the existing JSON
  name: text('name').notNull(),
  price: numeric('price').notNull(),
  originalPrice: numeric('original_price'),
  image: text('image'),
  category: text('category'),
  stock: integer('stock').default(0),
  description: text('description'),
  rating: numeric('rating').default('5.0'),
  salesCount: integer('sales_count').default(0),
  isFlashSale: boolean('is_flash_sale').default(false),
  isPromo: boolean('is_promo').default(false),
  images: text('images'), // JSON string of additional images
  sizes: text('sizes'), // JSON string of sizes
  groupId: text('group_id'),
  isMainProduct: boolean('is_main_product').default(false),
  collectionId: text('collection_id'),
  isBannerProduct: boolean('is_banner_product').default(false),
  bannerId: text('banner_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  totalAmount: numeric('total_amount').notNull(),
  status: text('status').default('pending'), // pending, completed, cancelled
  items: text('items'), // JSON string of items
  createdAt: timestamp('created_at').defaultNow(),
});

export const workspaceData = pgTable('workspace_data', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  service: text('service').notNull(), // drive, sheets, gmail, etc.
  externalId: text('external_id'), // File ID, Message ID, etc.
  metadata: text('metadata'), // JSON string
  createdAt: timestamp('created_at').defaultNow(),
});

export const banners = pgTable('banners', {
  id: text('id').primaryKey(),
  image: text('image').notNull(),
  url: text('url'),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  badge: text('badge'),
  bgColor: text('bg_color'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const media = pgTable('media', {
  id: text('id').primaryKey(),
  type: text('type').notNull(), // image, video
  url: text('url').notNull(),
  title: text('title'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(), // JSON string
});

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  workspaceItems: many(workspaceData),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
}));
