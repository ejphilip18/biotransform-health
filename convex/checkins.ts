import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getToday = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const today = new Date().toISOString().split("T")[0];
    return await ctx.db
      .query("dailyCheckins")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .unique();
  },
});

export const getStreak = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const checkins = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    if (checkins.length === 0) return 0;

    // Build a set of dates for fast lookup
    const dateSet = new Set(checkins.map((c) => c.date));

    // Count consecutive days backwards from today
    let streak = 0;
    const current = new Date();
    while (true) {
      const dateStr = current.toISOString().split("T")[0];
      if (dateSet.has(dateStr)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },
});

export const getHistory = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const checkins = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Filter by date range
    return checkins
      .filter((c) => c.date >= args.startDate && c.date <= args.endDate)
      .sort((a, b) => a.date.localeCompare(b.date));
  },
});

export const getHealthScore = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    // --- Biomarker score (60%) ---
    const allBiomarkers = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Get latest for each unique biomarker
    const latestMap = new Map<string, (typeof allBiomarkers)[0]>();
    for (const result of allBiomarkers) {
      const existing = latestMap.get(result.biomarker);
      if (!existing || result.labDate > existing.labDate) {
        latestMap.set(result.biomarker, result);
      }
    }
    const latestBiomarkers = Array.from(latestMap.values());

    let biomarkerScore = 50; // default if no data
    if (latestBiomarkers.length > 0) {
      const weights: Record<string, number> = {
        optimal: 100,
        normal: 75,
        suboptimal: 40,
        critical: 10,
      };
      const total = latestBiomarkers.reduce(
        (sum, b) => sum + (weights[b.status] ?? 50),
        0
      );
      biomarkerScore = total / latestBiomarkers.length;
    }

    // --- Consistency score (25%) ---
    const checkins = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const dateSet = new Set(checkins.map((c) => c.date));
    let streak = 0;
    const current = new Date();
    while (true) {
      const dateStr = current.toISOString().split("T")[0];
      if (dateSet.has(dateStr)) {
        streak++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    let consistencyScore: number;
    if (streak >= 7) consistencyScore = 100;
    else if (streak >= 5) consistencyScore = 85;
    else if (streak >= 3) consistencyScore = 65;
    else if (streak >= 1) consistencyScore = 40;
    else consistencyScore = 20;

    // --- Adherence score (15%) ---
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
    const todayStr = today.toISOString().split("T")[0];

    const recentCheckins = checkins.filter(
      (c) => c.date >= sevenDaysAgoStr && c.date <= todayStr
    );

    let adherenceScore = 20; // default if no check-ins
    if (recentCheckins.length > 0) {
      const supplementRate =
        recentCheckins.filter((c) => c.supplementsTaken).length /
        recentCheckins.length;
      const workoutRate =
        recentCheckins.filter((c) => c.workoutCompleted).length /
        recentCheckins.length;
      adherenceScore = supplementRate * 50 + workoutRate * 50;
    }

    // Composite score
    const composite = Math.round(
      biomarkerScore * 0.6 + consistencyScore * 0.25 + adherenceScore * 0.15
    );

    return {
      overall: composite,
      biomarkerScore: Math.round(biomarkerScore),
      consistencyScore: Math.round(consistencyScore),
      adherenceScore: Math.round(adherenceScore),
      streak,
      totalBiomarkers: latestBiomarkers.length,
      recentCheckins: recentCheckins.length,
    };
  },
});

export const submit = mutation({
  args: {
    sleepQuality: v.float64(),
    sleepHours: v.float64(),
    energyLevel: v.float64(),
    mood: v.float64(),
    stressLevel: v.float64(),
    supplementsTaken: v.boolean(),
    workoutCompleted: v.boolean(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const today = new Date().toISOString().split("T")[0];

    // Upsert: check if today's check-in exists
    const existing = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_userId_date", (q) =>
        q.eq("userId", userId).eq("date", today)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        createdAt: Date.now(),
      });
      return existing._id;
    } else {
      return await ctx.db.insert("dailyCheckins", {
        userId,
        date: today,
        ...args,
        createdAt: Date.now(),
      });
    }
  },
});
