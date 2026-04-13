import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,

  users: defineTable({
    // Convex Auth fields
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.float64()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.float64()),
    isAnonymous: v.optional(v.boolean()),
    // Custom fields
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    onboardingComplete: v.optional(v.boolean()),
  })
    .index("email", ["email"]),

  profiles: defineTable({
    userId: v.id("users"),
    // Demographics
    dateOfBirth: v.optional(v.string()),
    biologicalSex: v.optional(v.union(v.literal("male"), v.literal("female"))),
    height: v.optional(v.float64()),
    weight: v.optional(v.float64()),
    ethnicity: v.optional(v.string()),
    // Lifestyle
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
    // Diet & Goals
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
    supplements: v.optional(v.array(v.string())),
    healthGoals: v.optional(v.array(v.string())),
    medicalConditions: v.optional(v.array(v.string())),
    medications: v.optional(v.array(v.string())),
    // Onboarding state
    onboardingStep: v.optional(
      v.union(
        v.literal("demographics"),
        v.literal("lifestyle"),
        v.literal("goals"),
        v.literal("consent"),
        v.literal("complete")
      )
    ),
    updatedAt: v.optional(v.float64()),
  })
    .index("by_userId", ["userId"]),

  consentRecords: defineTable({
    userId: v.id("users"),
    consentType: v.union(
      v.literal("data_processing"),
      v.literal("ai_analysis"),
      v.literal("data_sharing")
    ),
    version: v.string(),
    granted: v.boolean(),
    grantedAt: v.optional(v.float64()),
    revokedAt: v.optional(v.float64()),
    ipAddress: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_type", ["userId", "consentType"]),

  bloodworkUploads: defineTable({
    userId: v.id("users"),
    fileId: v.id("_storage"),
    uploadedAt: v.float64(),
    labDate: v.string(),
    labProvider: v.optional(v.string()),
    testType: v.union(
      v.literal("bloodwork"),
      v.literal("hormone"),
      v.literal("dna")
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("complete"),
      v.literal("failed")
    ),
    errorMessage: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_status", ["userId", "status"]),

  geneticResults: defineTable({
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
  })
    .index("by_uploadId", ["uploadId"])
    .index("by_userId", ["userId"])
    .index("by_userId_gene", ["userId", "gene"]),

  biomarkerResults: defineTable({
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
  })
    .index("by_uploadId", ["uploadId"])
    .index("by_userId", ["userId"])
    .index("by_userId_biomarker", ["userId", "biomarker"]),

  healthPlans: defineTable({
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
    generatedAt: v.float64(),
    isActive: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_uploadId", ["uploadId"])
    .index("by_userId_active", ["userId", "isActive"]),

  dailyCheckins: defineTable({
    userId: v.id("users"),
    date: v.string(),
    sleepQuality: v.float64(),
    sleepHours: v.float64(),
    energyLevel: v.float64(),
    mood: v.float64(),
    stressLevel: v.float64(),
    supplementsTaken: v.boolean(),
    workoutCompleted: v.boolean(),
    notes: v.optional(v.string()),
    createdAt: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_date", ["userId", "date"]),

  auditLogs: defineTable({
    userId: v.id("users"),
    actorId: v.id("users"),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    metadata: v.optional(v.string()),
    timestamp: v.float64(),
  })
    .index("by_userId", ["userId"])
    .index("by_actorId", ["actorId"])
    .index("by_timestamp", ["timestamp"]),
});
