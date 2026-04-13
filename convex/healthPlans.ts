import { query, mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getActive = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    return await ctx.db
      .query("healthPlans")
      .withIndex("by_userId_active", (q) =>
        q.eq("userId", userId).eq("isActive", true)
      )
      .first();
  },
});

export const getByUpload = query({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const plan = await ctx.db
      .query("healthPlans")
      .withIndex("by_uploadId", (q) => q.eq("uploadId", args.uploadId))
      .first();

    if (!plan || plan.userId !== userId) return null;
    return plan;
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const plans = await ctx.db
      .query("healthPlans")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Sort by generatedAt descending
    return plans.sort((a, b) => b.generatedAt - a.generatedAt);
  },
});

export const create = internalMutation({
  args: {
    userId: v.id("users"),
    uploadId: v.id("bloodworkUploads"),
    summary: v.string(),
    keyFindings: v.array(v.string()),
    riskAreas: v.array(
      v.object({
        area: v.string(),
        severity: v.union(
          v.literal("low"),
          v.literal("moderate"),
          v.literal("high")
        ),
        description: v.string(),
        relatedBiomarkers: v.array(v.string()),
        actionItems: v.array(v.string()),
      })
    ),
    supplements: v.array(
      v.object({
        name: v.string(),
        dosage: v.string(),
        form: v.string(),
        timing: v.string(),
        purpose: v.string(),
        duration: v.string(),
        interactions: v.string(),
      })
    ),
    nutritionPlan: v.object({
      dailyCalories: v.float64(),
      proteinGrams: v.float64(),
      carbGrams: v.float64(),
      fatGrams: v.float64(),
      keyFoods: v.array(v.string()),
      avoidFoods: v.array(v.string()),
      mealTiming: v.string(),
      hydration: v.string(),
      notes: v.string(),
    }),
    trainingProgram: v.object({
      splitType: v.string(),
      sessionsPerWeek: v.float64(),
      sessionDuration: v.string(),
      intensity: v.string(),
      focusAreas: v.array(v.string()),
      cardioRecommendation: v.string(),
      recoveryNotes: v.string(),
      progressionModel: v.string(),
      notes: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    // Deactivate all existing plans for this user
    const existingPlans = await ctx.db
      .query("healthPlans")
      .withIndex("by_userId_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .collect();

    for (const plan of existingPlans) {
      await ctx.db.patch(plan._id, { isActive: false });
    }

    // Insert the new active plan
    return await ctx.db.insert("healthPlans", {
      userId: args.userId,
      uploadId: args.uploadId,
      summary: args.summary,
      keyFindings: args.keyFindings,
      riskAreas: args.riskAreas,
      supplements: args.supplements,
      nutritionPlan: args.nutritionPlan,
      trainingProgram: args.trainingProgram,
      generatedAt: Date.now(),
      isActive: true,
    });
  },
});

export const regenerate = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.scheduler.runAfter(0, internal.analysis.regenerateHealthPlan, {
      userId,
    });

    return true;
  },
});
