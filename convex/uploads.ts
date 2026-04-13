import { query, mutation, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    return await ctx.storage.generateUploadUrl();
  },
});

export const createUpload = mutation({
  args: {
    fileId: v.id("_storage"),
    labDate: v.string(),
    labProvider: v.optional(v.string()),
    testType: v.union(
      v.literal("bloodwork"),
      v.literal("hormone"),
      v.literal("dna")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const uploadId = await ctx.db.insert("bloodworkUploads", {
      userId,
      fileId: args.fileId,
      uploadedAt: Date.now(),
      labDate: args.labDate,
      labProvider: args.labProvider,
      testType: args.testType,
      status: "pending",
    });

    const analyzeAction =
      args.testType === "dna"
        ? internal.analysis.analyzeDNA
        : internal.analysis.analyzeBloodwork;
    await ctx.scheduler.runAfter(0, analyzeAction, {
      uploadId,
      userId,
    });

    return uploadId;
  },
});

export const updateStatus = internalMutation({
  args: {
    uploadId: v.id("bloodworkUploads"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("complete"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.uploadId, {
      status: args.status,
      errorMessage: args.errorMessage,
    });
  },
});

export const getUploadInternal = internalQuery({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.uploadId);
  },
});

export const getUpload = query({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const upload = await ctx.db.get(args.uploadId);
    if (!upload || upload.userId !== userId) return null;

    return upload;
  },
});

export const listUploadsInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("bloodworkUploads")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const getMostRecentCompleteUploadInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const uploads = await ctx.db
      .query("bloodworkUploads")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    const complete = uploads.filter((u) => u.status === "complete");
    complete.sort((a, b) => b.uploadedAt - a.uploadedAt);
    return complete[0] ?? null;
  },
});

export const listUploads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const uploads = await ctx.db
      .query("bloodworkUploads")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return uploads;
  },
});

/** Re-analyze an existing upload: clear results, re-run extraction, then regenerate plan. */
export const reAnalyze = mutation({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const upload = await ctx.db.get(args.uploadId);
    if (!upload || upload.userId !== userId) {
      throw new Error("Upload not found or access denied");
    }

    if (upload.status === "processing") {
      throw new Error("Analysis already in progress");
    }

    if (upload.status === "pending") {
      throw new Error("Initial analysis not yet complete");
    }

    await ctx.db.patch(args.uploadId, {
      status: "pending",
      errorMessage: undefined,
    });

    if (upload.testType === "dna") {
      await ctx.runMutation(internal.genetics.deleteByUploadId, {
        uploadId: args.uploadId,
      });
    } else {
      await ctx.runMutation(internal.biomarkers.deleteByUploadId, {
        uploadId: args.uploadId,
      });
    }

    const analyzeAction =
      upload.testType === "dna"
        ? internal.analysis.analyzeDNA
        : internal.analysis.analyzeBloodwork;
    await ctx.scheduler.runAfter(0, analyzeAction, {
      uploadId: args.uploadId,
      userId,
    });

    return true;
  },
});

/** All complete uploads except current, for user to pick comparison baseline. Sorted by labDate desc. */
export const getComparableUploads = query({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const current = await ctx.db.get(args.uploadId);
    if (!current || current.userId !== userId) return [];

    const uploads = await ctx.db
      .query("bloodworkUploads")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const complete = uploads
      .filter((u) => u.status === "complete" && u._id !== args.uploadId)
      .sort((a, b) => b.labDate.localeCompare(a.labDate));

    return complete;
  },
});

/** Previous upload (by labDate) for comparison when generating reports. */
export const getPreviousUpload = query({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const current = await ctx.db.get(args.uploadId);
    if (!current || current.userId !== userId || current.status !== "complete") return null;

    const uploads = await ctx.db
      .query("bloodworkUploads")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const complete = uploads.filter((u) => u.status === "complete");
    complete.sort((a, b) => a.labDate.localeCompare(b.labDate));

    const idx = complete.findIndex((u) => u._id === args.uploadId);
    if (idx <= 0) return null;
    return complete[idx - 1];
  },
});
