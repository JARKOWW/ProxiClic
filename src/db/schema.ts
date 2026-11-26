import { relations } from 'drizzle-orm';
import { blob, index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { BOOKING_STATUSES, CATEGORY_KEYS, REQUEST_STATUSES, ROLES } from '../lib/constants';

const createdAt = () =>
  integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .$defaultFn(() => new Date());

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ROLES }).notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  neighborhood: text('neighborhood').notNull(),
  city: text('city').notNull(),
  postalCode: text('postal_code').notNull(),
  phone: text('phone'),
  bio: text('bio'),
  skills: text('skills'),
  /** Date de naissance (AAAA-MM-JJ). Jamais montrée aux autres membres ; sert à choisir l'affichage. */
  birthDate: text('birth_date'),
  /**
   * Demandeurs uniquement : affichage simplifié sur une seule page (/mon-espace).
   * Attribué selon l'âge (45 ans et plus, voir lib/age.ts) à l'inscription ou quand la date de naissance
   * change ; la personne peut ensuite en changer à tout moment.
   */
  simpleView: integer('simple_view', { mode: 'boolean' }).notNull().default(false),
  /**
   * Version des sessions : incluse dans le jeton de session et augmentée à chaque changement de mot de passe,
   * ce qui déconnecte tous les appareils.
   */
  sessionVersion: integer('session_version').notNull().default(0),
  /** Dernière connexion : sert à supprimer les comptes inactifs (voir scripts/purge.ts). */
  lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }),
  /** Date d'acceptation des CGU (preuve du consentement au contrat). */
  termsAcceptedAt: integer('terms_accepted_at', { mode: 'timestamp_ms' }),
  createdAt: createdAt(),
});

/**
 * Compteurs de la limitation des tentatives (connexion, inscription, messages, assistant).
 * Stockés dans la base pour fonctionner aussi quand le site tourne sur plusieurs instances.
 */
export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  resetAt: integer('reset_at').notNull(),
});

export const requests = sqliteTable(
  'requests',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    category: text('category', { enum: CATEGORY_KEYS }).notNull(),
    availability: text('availability'),
    neighborhood: text('neighborhood').notNull(),
    city: text('city').notNull(),
    status: text('status', { enum: REQUEST_STATUSES }).notNull().default('open'),
    createdAt: createdAt(),
  },
  (t) => [index('requests_status_idx').on(t.status), index('requests_client_idx').on(t.clientId)],
);

export const bookings = sqliteTable(
  'bookings',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    requestId: integer('request_id')
      .notNull()
      .references(() => requests.id, { onDelete: 'cascade' }),
    helperId: integer('helper_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    scheduledAt: integer('scheduled_at', { mode: 'timestamp_ms' }).notNull(),
    durationMin: integer('duration_min').notNull().default(60),
    note: text('note'),
    status: text('status', { enum: BOOKING_STATUSES }).notNull().default('pending'),
    createdAt: createdAt(),
  },
  (t) => [index('bookings_request_idx').on(t.requestId), index('bookings_helper_idx').on(t.helperId)],
);

export const conversations = sqliteTable(
  'conversations',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    requestId: integer('request_id')
      .notNull()
      .references(() => requests.id, { onDelete: 'cascade' }),
    clientId: integer('client_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    helperId: integer('helper_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('conversations_request_helper_idx').on(t.requestId, t.helperId),
    index('conversations_client_idx').on(t.clientId),
    index('conversations_helper_idx').on(t.helperId),
  ],
);

export const messages = sqliteTable(
  'messages',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    conversationId: integer('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    senderId: integer('sender_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    readAt: integer('read_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
  },
  (t) => [index('messages_conversation_idx').on(t.conversationId)],
);

/** Avis laissé par le demandeur après une intervention effectuée (un seul par rendez-vous). */
export const reviews = sqliteTable(
  'reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    bookingId: integer('booking_id')
      .notNull()
      .unique()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    authorId: integer('author_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    helperId: integer('helper_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    /** Compliments cochés par l'auteur : clés de REVIEW_TAGS séparées par des virgules. */
    tags: text('tags'),
    /** Réponse de l'aidant, visible sous l'avis. */
    reply: text('reply'),
    repliedAt: integer('replied_at', { mode: 'timestamp_ms' }),
    createdAt: createdAt(),
  },
  (t) => [index('reviews_helper_idx').on(t.helperId)],
);

/**
 * Photos jointes à un avis, stockées dans la base (pas de disque persistant chez l'hébergeur).
 * Ne jamais sélectionner `data` dans une liste : les images sont servies par /api/photos/[id].
 */
export const reviewPhotos = sqliteTable(
  'review_photos',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    reviewId: integer('review_id')
      .notNull()
      .references(() => reviews.id, { onDelete: 'cascade' }),
    mime: text('mime').notNull(),
    data: blob('data', { mode: 'buffer' }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('review_photos_review_idx').on(t.reviewId)],
);

export const reviewsRelations = relations(reviews, ({ one, many }) => ({
  booking: one(bookings, { fields: [reviews.bookingId], references: [bookings.id] }),
  author: one(users, { fields: [reviews.authorId], references: [users.id] }),
  helper: one(users, { fields: [reviews.helperId], references: [users.id] }),
  photos: many(reviewPhotos),
}));

export const reviewPhotosRelations = relations(reviewPhotos, ({ one }) => ({
  review: one(reviews, { fields: [reviewPhotos.reviewId], references: [reviews.id] }),
}));

export const requestsRelations = relations(requests, ({ one, many }) => ({
  client: one(users, { fields: [requests.clientId], references: [users.id] }),
  bookings: many(bookings),
  conversations: many(conversations),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  request: one(requests, { fields: [bookings.requestId], references: [requests.id] }),
  helper: one(users, { fields: [bookings.helperId], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  request: one(requests, { fields: [conversations.requestId], references: [requests.id] }),
  client: one(users, { fields: [conversations.clientId], references: [users.id] }),
  helper: one(users, { fields: [conversations.helperId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type Request = typeof requests.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type ReviewPhoto = typeof reviewPhotos.$inferSelect;
