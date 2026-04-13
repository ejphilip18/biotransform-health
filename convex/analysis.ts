"use node";

import {
  GoogleGenAI,
  Type,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

const ANALYSIS_PROMPT = `You are an expert clinical nutritionist, endocrinologist, and sports scientist.
Analyze the attached lab results PDF and generate a comprehensive, personalized health optimization plan.

USER PROFILE:
{profileContext}

INSTRUCTIONS:
1. Extract ALL biomarkers from the PDF with their values and reference ranges.
2. Identify risk areas based on out-of-range or suboptimal values.
3. Create a personalized supplement stack addressing deficiencies and optimizing health.
4. Design a nutrition plan tailored to the user's goals, dietary preferences, and lab results.
5. Design a training program appropriate for the user's activity level and health status.
6. Provide a concise summary and key findings.

Be specific with dosages, timing, and evidence-based recommendations.
Consider drug-nutrient interactions if medications are listed.
Tailor everything to the user's biological sex, age, activity level, and health goals.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    biomarkers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          category: { type: Type.STRING },
          value: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          referenceRangeLow: { type: Type.NUMBER },
          referenceRangeHigh: { type: Type.NUMBER },
          optimalRangeLow: { type: Type.NUMBER },
          optimalRangeHigh: { type: Type.NUMBER },
          status: {
            type: Type.STRING,
            enum: ["optimal", "normal", "suboptimal", "critical"],
          },
          interpretation: { type: Type.STRING },
        },
        required: [
          "name",
          "category",
          "value",
          "unit",
          "referenceRangeLow",
          "referenceRangeHigh",
          "optimalRangeLow",
          "optimalRangeHigh",
          "status",
          "interpretation",
        ],
      },
    },
    riskAreas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING },
          severity: {
            type: Type.STRING,
            enum: ["low", "moderate", "high"],
          },
          description: { type: Type.STRING },
          relatedBiomarkers: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          actionItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          "area",
          "severity",
          "description",
          "relatedBiomarkers",
          "actionItems",
        ],
      },
    },
    supplementStack: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dosage: { type: Type.STRING },
          form: { type: Type.STRING },
          timing: { type: Type.STRING },
          purpose: { type: Type.STRING },
          duration: { type: Type.STRING },
          interactions: { type: Type.STRING },
        },
        required: [
          "name",
          "dosage",
          "form",
          "timing",
          "purpose",
          "duration",
          "interactions",
        ],
      },
    },
    nutritionPlan: {
      type: Type.OBJECT,
      properties: {
        dailyCalories: { type: Type.NUMBER },
        proteinGrams: { type: Type.NUMBER },
        carbGrams: { type: Type.NUMBER },
        fatGrams: { type: Type.NUMBER },
        keyFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
        avoidFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
        mealTiming: { type: Type.STRING },
        hydration: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: [
        "dailyCalories",
        "proteinGrams",
        "carbGrams",
        "fatGrams",
        "keyFoods",
        "avoidFoods",
        "mealTiming",
        "hydration",
        "notes",
      ],
    },
    trainingProgram: {
      type: Type.OBJECT,
      properties: {
        splitType: { type: Type.STRING },
        sessionsPerWeek: { type: Type.NUMBER },
        sessionDuration: { type: Type.STRING },
        intensity: { type: Type.STRING },
        focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
        cardioRecommendation: { type: Type.STRING },
        recoveryNotes: { type: Type.STRING },
        progressionModel: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: [
        "splitType",
        "sessionsPerWeek",
        "sessionDuration",
        "intensity",
        "focusAreas",
        "cardioRecommendation",
        "recoveryNotes",
        "progressionModel",
        "notes",
      ],
    },
    summary: { type: Type.STRING },
    keyFindings: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    "biomarkers",
    "riskAreas",
    "supplementStack",
    "nutritionPlan",
    "trainingProgram",
    "summary",
    "keyFindings",
  ],
};

function buildProfileContext(profile: Record<string, unknown> | null): string {
  if (!profile) return "No profile data available.";
  const parts: string[] = [];
  if (profile.biologicalSex) parts.push(`Sex: ${profile.biologicalSex}`);
  if (profile.dateOfBirth) parts.push(`DOB: ${profile.dateOfBirth}`);
  if (profile.height) parts.push(`Height: ${profile.height} cm`);
  if (profile.weight) parts.push(`Weight: ${profile.weight} kg`);
  if (profile.activityLevel) parts.push(`Activity: ${profile.activityLevel}`);
  if (profile.sleepHoursAvg)
    parts.push(`Sleep: ${profile.sleepHoursAvg} hrs/night`);
  if (profile.stressLevel) parts.push(`Stress: ${profile.stressLevel}`);
  if (profile.dietaryPreference) parts.push(`Diet: ${profile.dietaryPreference}`);
  if (profile.smokingStatus) parts.push(`Smoking: ${profile.smokingStatus}`);
  if (profile.alcoholFrequency)
    parts.push(`Alcohol: ${profile.alcoholFrequency}`);
  const arr = (field: unknown) =>
    Array.isArray(field) && field.length > 0 ? field.join(", ") : null;
  const allergies = arr(profile.allergies);
  if (allergies) parts.push(`Allergies: ${allergies}`);
  const supplements = arr(profile.supplements);
  if (supplements) parts.push(`Current supplements: ${supplements}`);
  const goals = arr(profile.healthGoals);
  if (goals) parts.push(`Goals: ${goals}`);
  const conditions = arr(profile.medicalConditions);
  if (conditions) parts.push(`Medical conditions: ${conditions}`);
  const medications = arr(profile.medications);
  if (medications) parts.push(`Medications: ${medications}`);
  return parts.join("\n");
}

const DNA_ANALYSIS_PROMPT = `You are an expert genetic counselor and clinical geneticist.
Analyze the attached DNA/genetic test report PDF and extract ALL genetic variants with clinical significance.

USER PROFILE (for context):
{profileContext}

INSTRUCTIONS:
1. Extract EVERY gene/variant reported in the PDF. Prioritize:
   - Cancer risk genes: BRCA1, BRCA2, Lynch syndrome (MLH1, MSH2, MSH6, PMS2), CHEK2, PALB2, APC, PTEN, RET (thyroid/MEN2), BRAF, DICER1
   - Diabetes/prediabetes risk: TCF7L2, SLC30A8, KCNJ11, PPARG, HNF1A, HNF4A, ABCC8
   - Thyroid: RET, BRAF, DICER1, PTEN (thyroid cancer risk)
   - Pharmacogenomics: CYP2D6, CYP2C19, CYP3A4, CYP1A2, SLCO1B1
   - Nutrigenomics: MTHFR, VDR, COMT, PEMT, GAD1
   - Cardiovascular: APOE, F5 (Factor V Leiden), F2 (prothrombin)
   - Other clinically relevant variants
2. For each variant, provide: gene, variant (rsID or HGVS), zygosity (homozygous/heterozygous/wild_type)
3. Classification: pathogenic, likely_pathogenic, vus (variant of uncertain significance), likely_benign, benign
4. diseaseCategory: e.g. breast_cancer, colon_cancer, thyroid_cancer, diabetes, cardiovascular, pharmacogenomics, methylation, vitamin_d
5. riskLevel: elevated, average, reduced, or unknown
6. interpretation: 1-2 sentence plain-language explanation
7. recommendations: array of actionable items (e.g. "Discuss with genetic counselor", "Consider methylfolate", "Earlier screening recommended")
8. If a variant is VUS, always recommend genetic counseling. Do not over-interpret.
9. Include only variants explicitly reported in the PDF. Do not infer or fabricate.`;

const dnaResponseSchema = {
  type: Type.OBJECT,
  properties: {
    geneticVariants: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          gene: { type: Type.STRING },
          variant: { type: Type.STRING },
          zygosity: {
            type: Type.STRING,
            enum: ["homozygous", "heterozygous", "wild_type"],
          },
          classification: {
            type: Type.STRING,
            enum: ["pathogenic", "likely_pathogenic", "vus", "likely_benign", "benign"],
          },
          diseaseCategory: { type: Type.STRING },
          riskLevel: {
            type: Type.STRING,
            enum: ["elevated", "average", "reduced", "unknown"],
          },
          interpretation: { type: Type.STRING },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          "gene",
          "variant",
          "zygosity",
          "classification",
          "diseaseCategory",
          "riskLevel",
          "interpretation",
          "recommendations",
        ],
      },
    },
  },
  required: ["geneticVariants"],
};

export const analyzeDNA = internalAction({
  args: {
    uploadId: v.id("bloodworkUploads"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    let uploadedFileName: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ai: any = null;

    try {
      await ctx.runMutation(internal.uploads.updateStatus, {
        uploadId: args.uploadId,
        status: "processing",
      });

      const upload = await ctx.runQuery(internal.uploads.getUploadInternal, {
        uploadId: args.uploadId,
      });
      if (!upload) throw new Error("Upload not found");

      const blob = await ctx.storage.get(upload.fileId);
      if (!blob) throw new Error("File not found in storage");

      const profile = await ctx.runQuery(internal.profiles.getByUserId, {
        userId: args.userId,
      });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
      ai = new GoogleGenAI({ apiKey });

      const uploaded = await ai.files.upload({
        file: blob,
        config: { mimeType: "application/pdf" },
      });
      if (!uploaded.name || !uploaded.uri || !uploaded.mimeType) {
        throw new Error("Failed to upload file to Gemini");
      }
      uploadedFileName = uploaded.name;

      const profileContext = buildProfileContext(
        profile as Record<string, unknown> | null
      );
      const prompt = DNA_ANALYSIS_PROMPT.replace("{profileContext}", profileContext);

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: createUserContent([
          createPartFromUri(uploaded.uri!, uploaded.mimeType!),
          prompt,
        ]),
        config: {
          responseMimeType: "application/json",
          responseSchema: dnaResponseSchema,
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");
      const result = JSON.parse(text);

      for (const g of result.geneticVariants ?? []) {
        await ctx.runMutation(internal.genetics.create, {
          userId: args.userId,
          uploadId: args.uploadId,
          gene: g.gene,
          variant: g.variant,
          zygosity: g.zygosity,
          classification: g.classification,
          diseaseCategory: g.diseaseCategory,
          riskLevel: g.riskLevel,
          interpretation: g.interpretation,
          recommendations: g.recommendations ?? [],
          labDate: upload.labDate,
        });
      }

      await ctx.runAction(internal.analysis.regenerateHealthPlan, {
        userId: args.userId,
        uploadId: args.uploadId,
      });

      await ctx.runMutation(internal.uploads.updateStatus, {
        uploadId: args.uploadId,
        status: "complete",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown analysis error";
      await ctx.runMutation(internal.uploads.updateStatus, {
        uploadId: args.uploadId,
        status: "failed",
        errorMessage: message,
      });
    } finally {
      if (uploadedFileName && ai) {
        try {
          await ai.files.delete({ name: uploadedFileName });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  },
});

export const analyzeBloodwork = internalAction({
  args: {
    uploadId: v.id("bloodworkUploads"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    let uploadedFileName: string | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ai: any = null;

    try {
      // Update status to processing
      await ctx.runMutation(internal.uploads.updateStatus, {
        uploadId: args.uploadId,
        status: "processing",
      });

      // Get the upload record
      const upload = await ctx.runQuery(internal.uploads.getUploadInternal, {
        uploadId: args.uploadId,
      });
      if (!upload) throw new Error("Upload not found");

      // Get the file blob from storage
      const blob = await ctx.storage.get(upload.fileId);
      if (!blob) throw new Error("File not found in storage");

      // Get user profile for context
      const profile = await ctx.runQuery(internal.profiles.getByUserId, {
        userId: args.userId,
      });

      // Initialize Gemini
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not configured");
      ai = new GoogleGenAI({ apiKey });

      // Upload PDF to Gemini
      const uploaded = await ai.files.upload({
        file: blob,
        config: { mimeType: "application/pdf" },
      });
      if (!uploaded.name || !uploaded.uri || !uploaded.mimeType) {
        throw new Error("Failed to upload file to Gemini");
      }
      uploadedFileName = uploaded.name;

      // Build the prompt with profile context
      const profileContext = buildProfileContext(
        profile as Record<string, unknown> | null
      );
      const prompt = ANALYSIS_PROMPT.replace("{profileContext}", profileContext);

      // Call Gemini for analysis
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: createUserContent([
          createPartFromUri(uploaded.uri!, uploaded.mimeType!),
          prompt,
        ]),
        config: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");
      const result = JSON.parse(text);

      // Store biomarker results
      for (const biomarker of result.biomarkers) {
        await ctx.runMutation(internal.biomarkers.create, {
          userId: args.userId,
          uploadId: args.uploadId,
          biomarker: biomarker.name,
          category: biomarker.category,
          value: biomarker.value,
          unit: biomarker.unit,
          referenceRangeLow: biomarker.referenceRangeLow,
          referenceRangeHigh: biomarker.referenceRangeHigh,
          optimalRangeLow: biomarker.optimalRangeLow,
          optimalRangeHigh: biomarker.optimalRangeHigh,
          status: biomarker.status,
          interpretation: biomarker.interpretation,
          labDate: upload.labDate,
        });
      }

      // Create plan from ALL biomarkers (bloodwork + DNA + hormones snapshot)
      await ctx.runAction(internal.analysis.regenerateHealthPlan, {
        userId: args.userId,
        uploadId: args.uploadId,
      });

      // Update upload status to complete
      await ctx.runMutation(internal.uploads.updateStatus, {
        uploadId: args.uploadId,
        status: "complete",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown analysis error";
      await ctx.runMutation(internal.uploads.updateStatus, {
        uploadId: args.uploadId,
        status: "failed",
        errorMessage: message,
      });
    } finally {
      // Clean up uploaded file from Gemini
      if (uploadedFileName && ai) {
        try {
          await ai.files.delete({ name: uploadedFileName });
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  },
});

const REGENERATE_PROMPT = `You are an expert clinical nutritionist, endocrinologist, and sports scientist.
Given the data below, generate a NEW personalized health optimization plan.

DNA is the map (long-term tendencies, genetic context); bloodwork is the compass (current state).
Use ALL data together — combine genetic insights with current biomarkers for a holistic plan.

USER PROFILE (may have changed — use this for diet, activity, goals):
{profileContext}

BIOMARKER RESULTS (from bloodwork, hormone panels — numeric values):
{biomarkersJson}

GENETIC FINDINGS (from DNA report — gene variants, risk levels):
{geneticsJson}

INSTRUCTIONS:
1. Identify risk areas from BOTH biomarkers (out-of-range values) AND genetic findings. For each genetic finding with elevated risk, create a corresponding risk area. Do not prioritize any condition — treat all flagged findings equally.
2. SUPPLEMENTS: Address biomarker deficiencies AND genetic needs. For EACH genetic finding in the data: incorporate its recommendations into supplement choices; add interaction warnings when a supplement could conflict with the finding (e.g. iodine with thyroid risk, blood-sugar-affecting supplements with diabetes risk). Use diseaseCategory and recommendations from each finding — do not ignore any. Tailor to dietary preference.
3. NUTRITION: For each genetic finding, incorporate its recommendations into keyFoods, avoidFoods, and notes. Use the interpretation and recommendations fields directly — they often specify diet changes. Do not overfit to any single condition; apply all findings proportionally.
4. TRAINING: Factor in genetic context. Use recommendations from findings (e.g. "prioritize strength training" for diabetes risk, "avoid unnecessary radiation" for thyroid). Adjust focusAreas, cardioRecommendation, and recoveryNotes based on what genetics flag.
5. Provide a concise summary and key findings that reference both lab and genetic data.

Be specific with dosages, timing, and evidence-based recommendations.
Consider drug-nutrient interactions if medications are listed.
If GENETIC FINDINGS is "None" — ignore genetics. Otherwise, EVERY genetic finding with elevated risk MUST influence supplements, nutrition, and/or training. Use each finding's recommendations field — it contains actionable guidance.`;

const planOnlySchema = {
  type: Type.OBJECT,
  properties: {
    riskAreas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING },
          severity: { type: Type.STRING, enum: ["low", "moderate", "high"] },
          description: { type: Type.STRING },
          relatedBiomarkers: { type: Type.ARRAY, items: { type: Type.STRING } },
          actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["area", "severity", "description", "relatedBiomarkers", "actionItems"],
      },
    },
    supplementStack: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          dosage: { type: Type.STRING },
          form: { type: Type.STRING },
          timing: { type: Type.STRING },
          purpose: { type: Type.STRING },
          duration: { type: Type.STRING },
          interactions: { type: Type.STRING },
        },
        required: ["name", "dosage", "form", "timing", "purpose", "duration", "interactions"],
      },
    },
    nutritionPlan: {
      type: Type.OBJECT,
      properties: {
        dailyCalories: { type: Type.NUMBER },
        proteinGrams: { type: Type.NUMBER },
        carbGrams: { type: Type.NUMBER },
        fatGrams: { type: Type.NUMBER },
        keyFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
        avoidFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
        mealTiming: { type: Type.STRING },
        hydration: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: ["dailyCalories", "proteinGrams", "carbGrams", "fatGrams", "keyFoods", "avoidFoods", "mealTiming", "hydration", "notes"],
    },
    trainingProgram: {
      type: Type.OBJECT,
      properties: {
        splitType: { type: Type.STRING },
        sessionsPerWeek: { type: Type.NUMBER },
        sessionDuration: { type: Type.STRING },
        intensity: { type: Type.STRING },
        focusAreas: { type: Type.ARRAY, items: { type: Type.STRING } },
        cardioRecommendation: { type: Type.STRING },
        recoveryNotes: { type: Type.STRING },
        progressionModel: { type: Type.STRING },
        notes: { type: Type.STRING },
      },
      required: ["splitType", "sessionsPerWeek", "sessionDuration", "intensity", "focusAreas", "cardioRecommendation", "recoveryNotes", "progressionModel", "notes"],
    },
    summary: { type: Type.STRING },
    keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["riskAreas", "supplementStack", "nutritionPlan", "trainingProgram", "summary", "keyFindings"],
};

export const regenerateHealthPlan = internalAction({
  args: {
    userId: v.id("users"),
    uploadId: v.optional(v.id("bloodworkUploads")),
  },
  handler: async (ctx, args) => {
    const [biomarkers, genetics, profile, uploads, latestUpload] = await Promise.all([
      ctx.runQuery(internal.biomarkers.getAllForUserInternal, { userId: args.userId }),
      ctx.runQuery(internal.genetics.getAllForUserInternal, { userId: args.userId }),
      ctx.runQuery(internal.profiles.getByUserId, { userId: args.userId }),
      ctx.runQuery(internal.uploads.listUploadsInternal, { userId: args.userId }),
      args.uploadId
        ? ctx.runQuery(internal.uploads.getUploadInternal, { uploadId: args.uploadId })
        : ctx.runQuery(internal.uploads.getMostRecentCompleteUploadInternal, { userId: args.userId }),
    ]);

    if (biomarkers.length === 0 && genetics.length === 0) {
      throw new Error("No biomarkers or genetic results found. Upload lab or DNA results first.");
    }
    const planUploadId = args.uploadId ?? latestUpload?._id;
    if (!planUploadId) {
      throw new Error("No completed analysis found.");
    }

    const uploadMap = new Map(uploads.map((u) => [u._id, u]));
    const profileContext = buildProfileContext(profile as Record<string, unknown> | null);
    const biomarkersJson =
      biomarkers.length > 0
        ? JSON.stringify(
            biomarkers.map((b) => {
              const upload = uploadMap.get(b.uploadId);
              return {
                name: b.biomarker,
                category: b.category,
                source: upload?.testType ?? "unknown",
                value: b.value,
                unit: b.unit,
                referenceRange: [b.referenceRangeLow, b.referenceRangeHigh],
                optimalRange: [b.optimalRangeLow, b.optimalRangeHigh],
                status: b.status,
                interpretation: b.interpretation,
              };
            }),
            null,
            2
          )
        : "None (no bloodwork or hormone data)";

    const geneticsJson =
      genetics.length > 0
        ? JSON.stringify(
            genetics.map((g) => ({
              gene: g.gene,
              variant: g.variant,
              zygosity: g.zygosity,
              classification: g.classification,
              diseaseCategory: g.diseaseCategory,
              riskLevel: g.riskLevel,
              interpretation: g.interpretation,
              recommendations: g.recommendations,
            })),
            null,
            2
          )
        : "None (no DNA data)";

    const prompt = REGENERATE_PROMPT.replace("{profileContext}", profileContext)
      .replace("{biomarkersJson}", biomarkersJson)
      .replace("{geneticsJson}", geneticsJson);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: createUserContent([prompt]),
      config: {
        responseMimeType: "application/json",
        responseSchema: planOnlySchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    const result = JSON.parse(text);

    await ctx.runMutation(internal.healthPlans.create, {
      userId: args.userId,
      uploadId: planUploadId,
      summary: result.summary,
      keyFindings: result.keyFindings,
      riskAreas: result.riskAreas,
      supplements: result.supplementStack,
      nutritionPlan: result.nutritionPlan,
      trainingProgram: {
        ...result.trainingProgram,
        sessionsPerWeek: Number(result.trainingProgram.sessionsPerWeek) || 3,
      },
    });
  },
});
