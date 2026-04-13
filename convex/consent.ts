import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("consentRecords")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const grant = mutation({
  args: {
    consentType: v.union(
      v.literal("data_processing"),
      v.literal("ai_analysis"),
      v.literal("data_sharing")
    ),
    version: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if consent already exists for this type
    const existing = await ctx.db
      .query("consentRecords")
      .withIndex("by_userId_type", (q) =>
        q.eq("userId", userId).eq("consentType", args.consentType)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        granted: true,
        version: args.version,
        grantedAt: Date.now(),
        revokedAt: undefined,
      });
    } else {
      await ctx.db.insert("consentRecords", {
        userId,
        consentType: args.consentType,
        version: args.version,
        granted: true,
        grantedAt: Date.now(),
      });
    }
  },
});

export const revoke = mutation({
  args: {
    consentType: v.union(
      v.literal("data_processing"),
      v.literal("ai_analysis"),
      v.literal("data_sharing")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("consentRecords")
      .withIndex("by_userId_type", (q) =>
        q.eq("userId", userId).eq("consentType", args.consentType)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        granted: false,
        revokedAt: Date.now(),
      });
    }
  },
});
