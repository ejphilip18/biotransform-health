import { query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getByUploadInternal = internalQuery({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("biomarkerResults")
      .withIndex("by_uploadId", (q) => q.eq("uploadId", args.uploadId))
      .collect();
  },
});

/** All biomarkers for user across all uploads. Merged by name, latest labDate wins. */
export const getAllForUserInternal = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const byName = new Map<string, (typeof all)[0]>();
    for (const b of all) {
      const existing = byName.get(b.biomarker);
      if (!existing || b.labDate > existing.labDate) {
        byName.set(b.biomarker, b);
      }
    }
    return Array.from(byName.values());
  },
});

export const deleteByUploadId = internalMutation({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    const results = await ctx.db
      .query("biomarkerResults")
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
    biomarker: v.string(),
    category: v.string(),
    value: v.float64(),
    unit: v.string(),
    referenceRangeLow: v.float64(),
    referenceRangeHigh: v.float64(),
    optimalRangeLow: v.float64(),
    optimalRangeHigh: v.float64(),
    status: v.union(
      v.literal("optimal"),
      v.literal("normal"),
      v.literal("suboptimal"),
      v.literal("critical")
    ),
    interpretation: v.optional(v.string()),
    labDate: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("biomarkerResults", args);
  },
});

export const getByUpload = query({
  args: { uploadId: v.id("bloodworkUploads") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Verify the user owns this upload
    const upload = await ctx.db.get(args.uploadId);
    if (!upload || upload.userId !== userId) return [];

    return await ctx.db
      .query("biomarkerResults")
      .withIndex("by_uploadId", (q) => q.eq("uploadId", args.uploadId))
      .collect();
  },
});

/** All biomarker results for the user (for progress/trend charts). */
export const getAllResults = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("biomarkerResults")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();
  },
});

export const getLatest = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const allResults = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    // Group by biomarker name and take the latest by labDate
    const latestMap = new Map<string, (typeof allResults)[0]>();
    for (const result of allResults) {
      const existing = latestMap.get(result.biomarker);
      if (!existing || result.labDate > existing.labDate) {
        latestMap.set(result.biomarker, result);
      }
    }

    return Array.from(latestMap.values());
  },
});

/** Merged biomarkers (all uploads) with source info — same data the plan uses. */
export const getMergedWithSources = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { biomarkers: [], sources: [] };

    const all = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const byName = new Map<string, (typeof all)[0]>();
    for (const b of all) {
      const existing = byName.get(b.biomarker);
      if (!existing || b.labDate > existing.labDate) {
        byName.set(b.biomarker, b);
      }
    }

    const biomarkers = Array.from(byName.values());
    const uploadIds = [...new Set(biomarkers.map((b) => b.uploadId))];
    const uploadMap = new Map<
      (typeof uploadIds)[0],
      { testType: string; labDate: string }
    >();
    for (const id of uploadIds) {
      const u = await ctx.db.get(id);
      if (u) uploadMap.set(id, { testType: u.testType, labDate: u.labDate });
    }

    const sourcesMap = new Map<string, { testType: string; labDate: string }>();
    for (const s of uploadMap.values()) {
      const key = `${s.testType}-${s.labDate}`;
      if (!sourcesMap.has(key)) sourcesMap.set(key, s);
    }
    const sources = Array.from(sourcesMap.values()).sort((a, b) =>
      b.labDate.localeCompare(a.labDate)
    );

    return {
      biomarkers: biomarkers.map((b) => {
        const u = uploadMap.get(b.uploadId);
        return {
          ...b,
          source: u ? { testType: u.testType, labDate: u.labDate } : null,
        };
      }),
      sources,
    };
  },
});

/** Combined report data: biomarkers, genetics, and sources from both. */
export const getReportData = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { biomarkers: [], genetics: [], sources: [] };

    const [allBiomarkers, allGenetics] = await Promise.all([
      ctx.db
        .query("biomarkerResults")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("geneticResults")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    const byName = new Map<string, (typeof allBiomarkers)[0]>();
    for (const b of allBiomarkers) {
      if (!byName.has(b.biomarker) || b.labDate > byName.get(b.biomarker)!.labDate) {
        byName.set(b.biomarker, b);
      }
    }
    const biomarkers = Array.from(byName.values());

    const byGeneVariant = new Map<string, (typeof allGenetics)[0]>();
    for (const g of allGenetics) {
      const key = `${g.gene}-${g.variant}`;
      if (!byGeneVariant.has(key) || g.labDate > byGeneVariant.get(key)!.labDate) {
        byGeneVariant.set(key, g);
      }
    }
    const genetics = Array.from(byGeneVariant.values());

    const uploadIds = new Set<typeof allBiomarkers[0]["uploadId"]>();
    for (const b of biomarkers) uploadIds.add(b.uploadId);
    for (const g of genetics) uploadIds.add(g.uploadId);

    const uploadMap = new Map<
      (typeof allBiomarkers)[0]["uploadId"],
      { testType: string; labDate: string }
    >();
    for (const id of uploadIds) {
      const u = await ctx.db.get(id);
      if (u) uploadMap.set(id, { testType: u.testType, labDate: u.labDate });
    }
    const sourcesMap = new Map<string, { testType: string; labDate: string }>();
    for (const s of uploadMap.values()) {
      const key = `${s.testType}-${s.labDate}`;
      if (!sourcesMap.has(key)) sourcesMap.set(key, s);
    }
    const sources = Array.from(sourcesMap.values()).sort((a, b) =>
      b.labDate.localeCompare(a.labDate)
    );

    return {
      biomarkers: biomarkers.map((b) => {
        const u = uploadMap.get(b.uploadId);
        return { ...b, source: u ? { testType: u.testType, labDate: u.labDate } : null };
      }),
      genetics,
      sources,
    };
  },
});

export const getHistory = query({
  args: { biomarker: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const results = await ctx.db
      .query("biomarkerResults")
      .withIndex("by_userId_biomarker", (q) =>
        q.eq("userId", userId).eq("biomarker", args.biomarker)
      )
      .collect();

    // Sort by labDate ascending for charting
    return results.sort((a, b) => a.labDate.localeCompare(b.labDate));
  },
});
