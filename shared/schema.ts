import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  decimal,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false),
  isBanned: boolean("is_banned").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Issues table
export const issues = pgTable("issues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // roads, lighting, water, cleanliness, safety, obstructions
  status: varchar("status", { length: 20 }).default("reported"), // reported, in_progress, resolved
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  address: text("address"),
  photos: text("photos").array(),
  reporterId: varchar("reporter_id").references(() => users.id),
  isAnonymous: boolean("is_anonymous").default(false),
  isHidden: boolean("is_hidden").default(false),
  flagCount: integer("flag_count").default(0),
  reportCount: integer("report_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Issue status logs table
export const issueStatusLogs = pgTable("issue_status_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => issues.id, { onDelete: "cascade" }).notNull(),
  oldStatus: varchar("old_status", { length: 20 }),
  newStatus: varchar("new_status", { length: 20 }).notNull(),
  changedBy: varchar("changed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Issue flags table (for community moderation)
export const issueFlags = pgTable("issue_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => issues.id, { onDelete: "cascade" }).notNull(),
  flaggerId: varchar("flagger_id").references(() => users.id).notNull(),
  reason: varchar("reason", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Issue votes table (for community validation)
export const issueVotes = pgTable("issue_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  issueId: varchar("issue_id").references(() => issues.id, { onDelete: "cascade" }).notNull(),
  voterId: varchar("voter_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  issues: many(issues),
  flags: many(issueFlags),
  votes: many(issueVotes),
  statusLogs: many(issueStatusLogs),
}));

export const issuesRelations = relations(issues, ({ one, many }) => ({
  reporter: one(users, {
    fields: [issues.reporterId],
    references: [users.id],
  }),
  flags: many(issueFlags),
  votes: many(issueVotes),
  statusLogs: many(issueStatusLogs),
}));

export const issueFlagsRelations = relations(issueFlags, ({ one }) => ({
  issue: one(issues, {
    fields: [issueFlags.issueId],
    references: [issues.id],
  }),
  flagger: one(users, {
    fields: [issueFlags.flaggerId],
    references: [users.id],
  }),
}));

export const issueVotesRelations = relations(issueVotes, ({ one }) => ({
  issue: one(issues, {
    fields: [issueVotes.issueId],
    references: [issues.id],
  }),
  voter: one(users, {
    fields: [issueVotes.voterId],
    references: [users.id],
  }),
}));

export const issueStatusLogsRelations = relations(issueStatusLogs, ({ one }) => ({
  issue: one(issues, {
    fields: [issueStatusLogs.issueId],
    references: [issues.id],
  }),
  changedBy: one(users, {
    fields: [issueStatusLogs.changedBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertIssueSchema = createInsertSchema(issues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  flagCount: true,
  reportCount: true,
  isHidden: true,
});

export const insertIssueFlagSchema = createInsertSchema(issueFlags).omit({
  id: true,
  createdAt: true,
});

export const insertIssueVoteSchema = createInsertSchema(issueVotes).omit({
  id: true,
  createdAt: true,
});

export const insertIssueStatusLogSchema = createInsertSchema(issueStatusLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type IssueFlag = typeof issueFlags.$inferSelect;
export type InsertIssueFlag = z.infer<typeof insertIssueFlagSchema>;
export type IssueVote = typeof issueVotes.$inferSelect;
export type InsertIssueVote = z.infer<typeof insertIssueVoteSchema>;
export type IssueStatusLog = typeof issueStatusLogs.$inferSelect;
export type InsertIssueStatusLog = z.infer<typeof insertIssueStatusLogSchema>;
