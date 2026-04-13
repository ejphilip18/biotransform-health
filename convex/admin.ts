import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAdmin(ctx: QueryCtx | MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "admin") {
    throw new Error("Not authorized: admin role required");
  }
  return user;
}

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const users = await ctx.db.query("users").collect();

    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const uploads = await ctx.db
          .query("bloodworkUploads")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .collect();

        const consents = await ctx.db
          .query("consentRecords")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .collect();

        return {
          ...user,
          uploadCount: uploads.length,
          consentStatus: consents.filter((c) => c.granted).length > 0,
        };
      })
    );

    return usersWithDetails;
  },
});

export const getUserDetail = query({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const user = await ctx.db.get(args.targetUserId);
    if (!user) throw new Error("User not found");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .unique();

    const uploads = await ctx.db
      .query("bloodworkUploads")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();

    // Get latest biomarkers
    const allBiomarkers = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();

    const latestMap = new Map<string, (typeof allBiomarkers)[0]>();
    for (const result of allBiomarkers) {
      const existing = latestMap.get(result.biomarker);
      if (!existing || result.labDate > existing.labDate) {
        latestMap.set(result.biomarker, result);
      }
    }

    const activePlan = await ctx.db
      .query("healthPlans")
      .withIndex("by_userId_active", (q) =>
        q.eq("userId", args.targetUserId).eq("isActive", true)
      )
      .first();

    const consents = await ctx.db
      .query("consentRecords")
      .withIndex("by_userId", (q) => q.eq("userId", args.targetUserId))
      .collect();

    return {
      user,
      profile,
      uploads,
      latestBiomarkers: Array.from(latestMap.values()),
      activePlan,
      consents,
    };
  },
});

export const logUserView = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    await ctx.scheduler.runAfter(0, internal.audit.log, {
      userId: args.targetUserId,
      actorId: userId,
      action: "admin_view",
      resource: "users",
      resourceId: args.targetUserId,
    });
  },
});

export const getAggregateStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const users = await ctx.db.query("users").collect();
    const uploads = await ctx.db.query("bloodworkUploads").collect();

    // Uploads this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const uploadsThisMonth = uploads.filter(
      (u) => u.uploadedAt >= monthStart
    ).length;

    // Status breakdown
    const statusCounts = uploads.reduce(
      (acc, u) => {
        acc[u.status] = (acc[u.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const plans = await ctx.db.query("healthPlans").collect();
    const checkins = await ctx.db.query("dailyCheckins").collect();

    return {
      totalUsers: users.length,
      totalUploads: uploads.length,
      uploadsThisMonth,
      statusCounts,
      totalPlans: plans.length,
      totalCheckins: checkins.length,
    };
  },
});

export const getAuditLogs = query({
  args: {
    limit: v.optional(v.float64()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await requireAdmin(ctx, userId);

    const pageSize = args.limit ?? 50;

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .take(pageSize + 1);

    const hasMore = logs.length > pageSize;
    const page = hasMore ? logs.slice(0, pageSize) : logs;

    return {
      logs: page,
      hasMore,
      nextCursor: hasMore ? String(page[page.length - 1].timestamp) : null,
    };
  },
});
