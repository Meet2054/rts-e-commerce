// src/db/schema.ts
import { pgTable, text, timestamp, boolean, integer, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ======================= EXISTING AUTH TABLES (Updated) =======================
export const user = pgTable("user", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
  image: text('image'),
  role: text('role').$default('customer').notNull(), // ADD THIS LINE TO YOUR EXISTING TABLE
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

export const session = pgTable("session", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = pgTable("account", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = pgTable("verification", {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date())
});

// ======================= NEW E-COMMERCE TABLES =======================

// Categories for products (Printers, Cartridges, etc.)
export const categories = pgTable("categories", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id').references(() => categories.id),
  isActive: boolean('is_active').$default(true).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Brands/Companies (HP, Canon, etc.)
export const brands = pgTable("brands", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  logo: text('logo'),
  description: text('description'),
  isActive: boolean('is_active').$default(true).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Main products table
export const products = pgTable("products", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku').notNull().unique(),
  categoryId: text('category_id').notNull().references(() => categories.id),
  brandId: text('brand_id').notNull().references(() => brands.id),
  basePrice: decimal('base_price', { precision: 10, scale: 2 }).notNull(),
  images: jsonb('images').$type<string[]>().default([]),
  specifications: jsonb('specifications').$type<Record<string, any>>().default({}),
  isActive: boolean('is_active').$default(true).notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  minOrderQuantity: integer('min_order_quantity').default(1).notNull(),
  tags: jsonb('tags').$type<string[]>().default([]),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Product variants (different colors, sizes, etc.)
export const productVariants = pgTable("product_variants", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(),
  value: text('value').notNull(),
  priceAdjustment: decimal('price_adjustment', { precision: 10, scale: 2 }).default('0').notNull(),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  sku: text('sku'),
  isActive: boolean('is_active').$default(true).notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Customer-specific pricing
export const customerPricing = pgTable("customer_pricing", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerEmail: text('customer_email').notNull(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),
  customPrice: decimal('custom_price', { precision: 10, scale: 2 }).notNull(),
  discountPercentage: decimal('discount_percentage', { precision: 5, scale: 2 }),
  isActive: boolean('is_active').$default(true).notNull(),
  validFrom: timestamp('valid_from').$defaultFn(() => new Date()).notNull(),
  validUntil: timestamp('valid_until'),
  notes: text('notes'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
  createdBy: text('created_by').notNull().references(() => user.id)
});

// Orders table
export const orders = pgTable("orders", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: text('order_number').notNull().unique(),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone'),
  customerAddress: jsonb('customer_address').$type<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  }>(),
  status: text('status').default('pending').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Order items
export const orderItems = pgTable("order_items", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  productSnapshot: jsonb('product_snapshot').$type<{
    name: string;
    sku: string;
    specifications: Record<string, any>;
  }>().notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull()
});

// Support tickets/chat issues
export const supportTickets = pgTable("support_tickets", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketNumber: text('ticket_number').notNull().unique(),
  customerEmail: text('customer_email').notNull(),
  customerName: text('customer_name'),
  subject: text('subject').notNull(),
  description: text('description').notNull(),
  priority: text('priority').default('medium').notNull(),
  status: text('status').default('open').notNull(),
  assignedTo: text('assigned_to').references(() => user.id),
  source: text('source').default('chatbot').notNull(),
  chatConversation: jsonb('chat_conversation').$type<Array<{
    role: 'user' | 'bot' | 'admin';
    message: string;
    timestamp: string;
  }>>().default([]),
  resolution: text('resolution'),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull(),
  resolvedAt: timestamp('resolved_at')
});

// Chatbot interactions log
export const chatInteractions = pgTable("chat_interactions", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull(),
  customerEmail: text('customer_email'),
  messages: jsonb('messages').$type<Array<{
    role: 'user' | 'bot';
    message: string;
    timestamp: string;
    intent?: string;
    confidence?: number;
  }>>().default([]),
  escalatedToSupport: boolean('escalated_to_support').default(false).notNull(),
  supportTicketId: text('support_ticket_id').references(() => supportTickets.id),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// Bulk price update history
export const priceUpdateHistory = pgTable("price_update_history", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  customerEmail: text('customer_email').notNull(),
  fileName: text('file_name').notNull(),
  totalProducts: integer('total_products').notNull(),
  successfulUpdates: integer('successful_updates').notNull(),
  failedUpdates: integer('failed_updates').notNull(),
  updateDetails: jsonb('update_details').$type<Array<{
    productId: string;
    sku: string;
    oldPrice: number;
    newPrice: number;
    status: 'success' | 'failed';
    error?: string;
  }>>().default([]),
  uploadedBy: text('uploaded_by').notNull().references(() => user.id),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()).notNull()
});

// Shopping cart (temporary storage)
export const cartItems = pgTable("cart_items", {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text('session_id').notNull(),
  customerEmail: text('customer_email'),
  productId: text('product_id').notNull().references(() => products.id),
  variantId: text('variant_id').references(() => productVariants.id),
  quantity: integer('quantity').notNull(),
  addedAt: timestamp('added_at').$defaultFn(() => new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()).notNull()
});

// ======================= RELATIONS =======================

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  supportTickets: many(supportTickets),
  priceUpdates: many(priceUpdateHistory)
}));

export const productRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id]
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id]
  }),
  variants: many(productVariants),
  customerPricing: many(customerPricing),
  orderItems: many(orderItems)
}));

export const orderRelations = relations(orders, ({ many }) => ({
  items: many(orderItems)
}));

export const supportTicketRelations = relations(supportTickets, ({ one }) => ({
  assignedUser: one(user, {
    fields: [supportTickets.assignedTo],
    references: [user.id]
  })
}));