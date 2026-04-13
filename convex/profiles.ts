import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByUserId = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
  },
});

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const getOnboardingStep = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return profile?.onboardingStep ?? "demographics";
  },
});

export const saveDemographics = mutation({
  args: {
    dateOfBirth: v.string(),
    biologicalSex: v.union(v.literal("male"), v.literal("female")),
    height: v.float64(),
    weight: v.float64(),
    ethnicity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        onboardingStep: "lifestyle",
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("profiles", {
        userId,
        ...args,
        onboardingStep: "lifestyle",
        updatedAt: Date.now(),
      });
    }
  },
});

export const saveLifestyle = mutation({
  args: {
    activityLevel: v.union(
      v.literal("sedentary"),
      v.literal("light"),
      v.literal("moderate"),
      v.literal("active"),
      v.literal("very_active")
    ),
    sleepHoursAvg: v.float64(),
    stressLevel: v.union(
      v.literal("low"),
      v.literal("moderate"),
      v.literal("high"),
      v.literal("very_high")
    ),
    smokingStatus: v.union(
      v.literal("never"),
      v.literal("former"),
      v.literal("current")
    ),
    alcoholFrequency: v.union(
      v.literal("none"),
      v.literal("occasional"),
      v.literal("moderate"),
      v.literal("heavy")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found. Complete step 1 first.");

    await ctx.db.patch(profile._id, {
      ...args,
      onboardingStep: "goals",
      updatedAt: Date.now(),
    });
  },
});

export const saveGoals = mutation({
  args: {
    dietaryPreference: v.union(
      v.literal("omnivore"),
      v.literal("vegetarian"),
      v.literal("vegan"),
      v.literal("pescatarian"),
      v.literal("keto"),
      v.literal("paleo"),
      v.literal("other")
    ),
    allergies: v.array(v.string()),
    supplements: v.array(v.string()),
    healthGoals: v.array(v.string()),
    medicalConditions: v.optional(v.array(v.string())),
    medications: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found. Complete step 1 first.");

    await ctx.db.patch(profile._id, {
      ...args,
      medicalConditions: args.medicalConditions ?? [],
      medications: args.medications ?? [],
      onboardingStep: "consent",
      updatedAt: Date.now(),
    });
  },
});

export const completeOnboarding = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found.");

    await ctx.db.patch(profile._id, {
      onboardingStep: "complete",
      updatedAt: Date.now(),
    });

    await ctx.db.patch(userId, { onboardingComplete: true });
  },
});

export const update = mutation({
  args: {
    dateOfBirth: v.optional(v.string()),
    biologicalSex: v.optional(v.union(v.literal("male"), v.literal("female"))),
    height: v.optional(v.float64()),
    weight: v.optional(v.float64()),
    ethnicity: v.optional(v.string()),
    activityLevel: v.optional(
      v.union(
        v.literal("sedentary"),
        v.literal("light"),
        v.literal("moderate"),
        v.literal("active"),
        v.literal("very_active")
      )
    ),
    sleepHoursAvg: v.optional(v.float64()),
    stressLevel: v.optional(
      v.union(
        v.literal("low"),
        v.literal("moderate"),
        v.literal("high"),
        v.literal("very_high")
      )
    ),
    smokingStatus: v.optional(
      v.union(v.literal("never"), v.literal("former"), v.literal("current"))
    ),
    alcoholFrequency: v.optional(
      v.union(
        v.literal("none"),
        v.literal("occasional"),
        v.literal("moderate"),
        v.literal("heavy")
      )
    ),
    dietaryPreference: v.optional(
      v.union(
        v.literal("omnivore"),
        v.literal("vegetarian"),
        v.literal("vegan"),
        v.literal("pescatarian"),
        v.literal("keto"),
        v.literal("paleo"),
        v.literal("other")
      )
    ),
    allergies: v.optional(v.array(v.string())),
    healthGoals: v.optional(v.array(v.string())),
    medicalConditions: v.optional(v.array(v.string())),
    medications: v.optional(v.array(v.string())),
    supplements: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    const payload = Object.fromEntries(
      Object.entries({ ...args, updatedAt: Date.now() }).filter(([, v]) => v !== undefined)
    );

    if (profile) {
      await ctx.db.patch(profile._id, payload);
    } else {
      await ctx.db.insert("profiles", { userId, ...payload });
    }
  },
});
