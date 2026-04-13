import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const deleteByUploadId = internalMutation({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("geneticResults")
      .withIndex("by_uploadId", (q) => q.eq("uploadId", args.uploadId))
      .collect();
    for (const r of results) {
      await ctx.db.delete(r._id);
    }
  },
});

export const create = internalMutation({
  args: {
    userId: v.id("users"),
    uploadId: v.id("bloodworkUploads"),
    gene: v.string(),
    variant: v.string(),
    zygosity: v.union(
      v.literal("homozygous"),
      v.literal("heterozygous"),
      v.literal("wild_type")
    ),
    classification: v.union(
      v.literal("pathogenic"),
      v.literal("likely_pathogenic"),
      v.literal("vus"),
      v.literal("likely_benign"),
      v.literal("benign")
    ),
    diseaseCategory: v.string(),
    riskLevel: v.union(
      v.literal("elevated"),
      v.literal("average"),
      v.literal("reduced"),
      v.literal("unknown")
    ),
    interpretation: v.string(),
    recommendations: v.array(v.string()),
    labDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("geneticResults", args);
  },
});

export const getAllForUserInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("geneticResults")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const byGene = new Map<string, (typeof all)[0]>();
    for (const g of all) {
      const key = `${g.gene}-${g.variant}`;
      if (!byGene.has(key) || g.labDate > byGene.get(key)!.labDate) {
        byGene.set(key, g);
      }
    }
    return Array.from(byGene.values());
  },
});

export const getForUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const all = await ctx.db
      .query("geneticResults")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const byGene = new Map<string, (typeof all)[0]>();
    for (const g of all) {
      const key = `${g.gene}-${g.variant}`;
      if (!byGene.has(key) || g.labDate > byGene.get(key)!.labDate) {
        byGene.set(key, g);
      }
    }
    return Array.from(byGene.values());
  },
});

export const getByUpload = query({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const upload = await ctx.db.get(args.uploadId);
    if (!upload || upload.userId !== userId) return [];

    return await ctx.db
      .query("geneticResults")
      .withIndex("by_uploadId", (q) => q.eq("uploadId", args.uploadId))
      .collect();
  },
});
