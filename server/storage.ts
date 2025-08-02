import {
  users,
  issues,
  issueFlags,
  issueVotes,
  issueStatusLogs,
  type User,
  type UpsertUser,
  type Issue,
  type InsertIssue,
  type IssueFlag,
  type InsertIssueFlag,
  type IssueVote,
  type InsertIssueVote,
  type IssueStatusLog,
  type InsertIssueStatusLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc, asc, gte, lte, count, ne } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Issue operations
  createIssue(issue: InsertIssue): Promise<Issue>;
  getIssue(id: string): Promise<Issue | undefined>;
  getIssuesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters?: {
      category?: string;
      status?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Issue[]>;
  updateIssueStatus(id: string, status: string, changedBy: string, notes?: string): Promise<Issue | undefined>;
  hideIssue(id: string): Promise<void>;
  incrementIssueReportCount(id: string): Promise<void>;
  
  // Flagging operations
  flagIssue(flag: InsertIssueFlag): Promise<void>;
  getUserFlaggedIssue(issueId: string, userId: string): Promise<IssueFlag | undefined>;
  incrementIssueFlagCount(issueId: string): Promise<void>;
  
  // Vote operations
  voteForIssue(vote: InsertIssueVote): Promise<void>;
  getUserVoteForIssue(issueId: string, userId: string): Promise<IssueVote | undefined>;
  
  // Status log operations
  createStatusLog(log: InsertIssueStatusLog): Promise<void>;
  getIssueStatusLogs(issueId: string): Promise<IssueStatusLog[]>;
  
  // Admin operations
  getFlaggedIssues(): Promise<Issue[]>;
  getIssueAnalytics(): Promise<{
    totalIssues: number;
    issuesByCategory: Record<string, number>;
    issuesByStatus: Record<string, number>;
  }>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Issue operations
  async createIssue(issue: InsertIssue): Promise<Issue> {
    const [newIssue] = await db.insert(issues).values(issue).returning();
    return newIssue;
  }

  async getIssue(id: string): Promise<Issue | undefined> {
    const [issue] = await db.select().from(issues).where(eq(issues.id, id));
    return issue;
  }

  async getIssuesNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    filters: {
      category?: string;
      status?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<Issue[]> {
    const { category, status, limit = 50, offset = 0 } = filters;

    // Haversine formula to calculate distance
    const distanceQuery = sql`
      6371 * acos(
        cos(radians(${latitude})) * cos(radians(${issues.latitude})) *
        cos(radians(${issues.longitude}) - radians(${longitude})) +
        sin(radians(${latitude})) * sin(radians(${issues.latitude}))
      )
    `;

    let query = db
      .select()
      .from(issues)
      .where(
        and(
          sql`${distanceQuery} <= ${radiusKm}`,
          eq(issues.isHidden, false),
          category ? eq(issues.category, category) : undefined,
          status ? eq(issues.status, status) : undefined
        )
      )
      .orderBy(desc(issues.createdAt))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  async updateIssueStatus(id: string, status: string, changedBy: string, notes?: string): Promise<Issue | undefined> {
    // Get current issue to log the status change
    const currentIssue = await this.getIssue(id);
    if (!currentIssue) return undefined;

    // Update the issue
    const [updatedIssue] = await db
      .update(issues)
      .set({ status, updatedAt: new Date() })
      .where(eq(issues.id, id))
      .returning();

    // Log the status change
    if (updatedIssue) {
      await this.createStatusLog({
        issueId: id,
        oldStatus: currentIssue.status,
        newStatus: status,
        changedBy,
        notes,
      });
    }

    return updatedIssue;
  }

  async hideIssue(id: string): Promise<void> {
    await db.update(issues).set({ isHidden: true }).where(eq(issues.id, id));
  }

  async incrementIssueReportCount(id: string): Promise<void> {
    await db
      .update(issues)
      .set({ reportCount: sql`${issues.reportCount} + 1` })
      .where(eq(issues.id, id));
  }

  // Flagging operations
  async flagIssue(flag: InsertIssueFlag): Promise<void> {
    await db.insert(issueFlags).values(flag);
    await this.incrementIssueFlagCount(flag.issueId);
  }

  async getUserFlaggedIssue(issueId: string, userId: string): Promise<IssueFlag | undefined> {
    const [flag] = await db
      .select()
      .from(issueFlags)
      .where(and(eq(issueFlags.issueId, issueId), eq(issueFlags.flaggerId, userId)));
    return flag;
  }

  async incrementIssueFlagCount(issueId: string): Promise<void> {
    await db
      .update(issues)
      .set({ flagCount: sql`${issues.flagCount} + 1` })
      .where(eq(issues.id, issueId));

    // Auto-hide if flagged by 5 or more users
    await db
      .update(issues)
      .set({ isHidden: true })
      .where(and(eq(issues.id, issueId), gte(issues.flagCount, 5)));
  }

  // Vote operations
  async voteForIssue(vote: InsertIssueVote): Promise<void> {
    await db.insert(issueVotes).values(vote);
    await this.incrementIssueReportCount(vote.issueId);
  }

  async getUserVoteForIssue(issueId: string, userId: string): Promise<IssueVote | undefined> {
    const [vote] = await db
      .select()
      .from(issueVotes)
      .where(and(eq(issueVotes.issueId, issueId), eq(issueVotes.voterId, userId)));
    return vote;
  }

  // Status log operations
  async createStatusLog(log: InsertIssueStatusLog): Promise<void> {
    await db.insert(issueStatusLogs).values(log);
  }

  async getIssueStatusLogs(issueId: string): Promise<IssueStatusLog[]> {
    return await db
      .select()
      .from(issueStatusLogs)
      .where(eq(issueStatusLogs.issueId, issueId))
      .orderBy(desc(issueStatusLogs.createdAt));
  }

  // Admin operations
  async getFlaggedIssues(): Promise<Issue[]> {
    return await db
      .select()
      .from(issues)
      .where(gte(issues.flagCount, 1))
      .orderBy(desc(issues.flagCount));
  }

  async getIssueAnalytics(): Promise<{
    totalIssues: number;
    issuesByCategory: Record<string, number>;
    issuesByStatus: Record<string, number>;
  }> {
    const totalIssues = await db
      .select({ count: count() })
      .from(issues)
      .where(eq(issues.isHidden, false));

    const categoryStats = await db
      .select({
        category: issues.category,
        count: count(),
      })
      .from(issues)
      .where(eq(issues.isHidden, false))
      .groupBy(issues.category);

    const statusStats = await db
      .select({
        status: issues.status,
        count: count(),
      })
      .from(issues)
      .where(eq(issues.isHidden, false))
      .groupBy(issues.status);

    const issuesByCategory: Record<string, number> = {};
    categoryStats.forEach(stat => {
      issuesByCategory[stat.category] = stat.count;
    });

    const issuesByStatus: Record<string, number> = {};
    statusStats.forEach(stat => {
      if (stat.status) {
        issuesByStatus[stat.status] = stat.count;
      }
    });

    return {
      totalIssues: totalIssues[0]?.count || 0,
      issuesByCategory,
      issuesByStatus,
    };
  }

  async banUser(userId: string): Promise<void> {
    await db.update(users).set({ isBanned: true }).where(eq(users.id, userId));
  }

  async unbanUser(userId: string): Promise<void> {
    await db.update(users).set({ isBanned: false }).where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
