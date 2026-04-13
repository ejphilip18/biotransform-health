import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const deleteMyAccount = action({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // 1. Delete all files from storage (uploaded PDFs)
    const uploads = await ctx.runQuery(internal.uploads.listUploadsInternal, {
      userId,
    });
    for (const upload of uploads) {
      try {
        await ctx.storage.delete(upload.fileId);
      } catch {
        // File may already be deleted, continue
      }
    }

    // 2. Delete all daily checkins
    await ctx.runMutation(internal.deleteAccount.deleteUserCheckins, {
      userId,
    });

    // 3. Delete all biomarker results
    await ctx.runMutation(internal.deleteAccount.deleteUserBiomarkers, {
      userId,
    });

    // 4. Delete all health plans
    await ctx.runMutation(internal.deleteAccount.deleteUserHealthPlans, {
      userId,
    });

    // 5. Delete all bloodwork uploads
    await ctx.runMutation(internal.deleteAccount.deleteUserUploads, {
      userId,
    });

    // 6. Delete profile
    await ctx.runMutation(internal.deleteAccount.deleteUserProfile, {
      userId,
    });

    // 7. Log the deletion (audit logs and consent records are RETAINED)
    await ctx.runMutation(internal.audit.log, {
      userId,
      actorId: userId,
      action: "account_deleted",
      resource: "users",
      resourceId: userId,
      metadata: JSON.stringify({
        deletedAt: new Date().toISOString(),
        note: "User-initiated account deletion. Consent records and audit logs retained.",
      }),
    });

    // 8. Delete user record
    await ctx.runMutation(internal.deleteAccount.deleteUserRecord, {
      userId,
    });
  },
});

// Internal mutations for cascade deletion
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteUserCheckins = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const checkins = await ctx.db
      .query("dailyCheckins")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const checkin of checkins) {
      await ctx.db.delete(checkin._id);
    }
  },
});

export const deleteUserBiomarkers = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const results = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const result of results) {
      await ctx.db.delete(result._id);
    }
  },
});

export const deleteUserHealthPlans = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const plans = await ctx.db
      .query("healthPlans")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const plan of plans) {
      await ctx.db.delete(plan._id);
    }
  },
});

export const deleteUserUploads = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const uploads = await ctx.db
      .query("bloodworkUploads")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
    for (const upload of uploads) {
      await ctx.db.delete(upload._id);
    }
  },
});

export const deleteUserProfile = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (profile) {
      await ctx.db.delete(profile._id);
    }
  },
});

export const deleteUserRecord = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await ctx.db.delete(userId);
  },
});
