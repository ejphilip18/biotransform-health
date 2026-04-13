# Health Plans

**Status:** Draft
**Last Updated:** 2026-02-15

---

## Overview

Health plans are the AI-generated output from bloodwork analysis. Each plan contains three components: a supplement stack (specific products, dosages, timing), a nutrition framework (macros, key foods, meal timing), and a training program (split, volume, intensity). Plans are tied to a specific bloodwork upload and user profile. When new bloodwork is uploaded, a new plan is generated, and the old plan is archived for comparison.

### Goals

- Present actionable health protocols, not vague suggestions
- Specific supplement dosages, forms, and timing
- Nutrition framework with macros and food lists (not a rigid meal plan)
- Training program appropriate to the user's level and goals
- Clear "why" for every recommendation tied back to biomarkers

### Non-Goals

- Meal-by-meal planning (too rigid, too much data)
- Exercise video demonstrations
- Supplement purchase links (no affiliate model)

---

## Core Types

### HealthPlan

```typescript
interface HealthPlan {
  _id: Id<"healthPlans">;
  userId: Id<"users">;
  uploadId: Id<"bloodworkUploads">;
  summary: string;
  keyFindings: string[];
  riskAreas: RiskArea[];
  supplements: Supplement[];
  nutritionPlan: NutritionPlan;
  trainingProgram: TrainingProgram;
  generatedAt: number;
  isActive: boolean;            // only latest plan is active
}
```

### Supplement

```typescript
interface Supplement {
  name: string;               // e.g. "Vitamin D3 + K2"
  dosage: string;             // e.g. "5000 IU D3 / 100mcg K2 MK-7"
  form: string;               // e.g. "softgel", "capsule", "liquid"
  timing: string;             // e.g. "Morning with fat-containing meal"
  purpose: string;            // e.g. "Optimize vitamin D levels (currently 28 ng/mL)"
  duration: string;           // e.g. "Ongoing — retest in 90 days"
  interactions: string;       // e.g. "Take 2+ hours apart from thyroid medication"
}
```

### NutritionPlan

```typescript
interface NutritionPlan {
  dailyCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  keyFoods: string[];         // Foods to emphasize
  avoidFoods: string[];       // Foods to reduce/avoid
  mealTiming: string;         // e.g. "3 meals + 1 post-workout snack"
  hydration: string;          // e.g. "3L water/day, electrolytes post-training"
  notes: string;              // Additional context
}
```

### TrainingProgram

```typescript
interface TrainingProgram {
  splitType: string;          // e.g. "Upper/Lower 4-day split"
  sessionsPerWeek: number;
  sessionDuration: string;    // e.g. "45-60 minutes"
  intensity: string;          // e.g. "Moderate-high, RPE 7-8"
  focusAreas: string[];       // e.g. ["compound lifts", "zone 2 cardio"]
  cardioRecommendation: string;
  recoveryNotes: string;      // e.g. "Prioritize sleep 7-8hrs given elevated cortisol"
  progressionModel: string;   // e.g. "Double progression: increase reps then weight"
  notes: string;
}
```

---

## Convex Functions

### Queries

| Function | Purpose | Auth |
| :--- | :--- | :--- |
| `healthPlans.getActive` | Get the user's current active plan | Yes |
| `healthPlans.getByUpload` | Get the plan generated from a specific upload | Yes |
| `healthPlans.listAll` | List all plans for comparison | Yes |

### Mutations

| Function | Purpose | Auth |
| :--- | :--- | :--- |
| `healthPlans.create` | Store AI-generated plan | Internal |
| `healthPlans.setActive` | Mark a plan as the active one | Yes |

---

## UI Pages

### `/plan` — Active Health Protocol

Three tabbed sections:

1. **Supplements** — Table/card view of supplement stack with name, dosage, timing, purpose
2. **Nutrition** — Macro breakdown (visual pie chart), key foods grid, avoid list, timing notes
3. **Training** — Program overview, weekly split, intensity guidelines, recovery notes

Each recommendation links back to the biomarker that triggered it (e.g. "Based on your Vitamin D level of 28 ng/mL").

### `/results/[id]` — includes plan comparison

When viewing a specific upload's results, show the plan generated for that upload alongside the biomarker data.

---

## Design Decisions

### Why framework over rigid meal plans?

**Context:** Could generate day-by-day meal plans with specific recipes.

**Decision:** Framework approach (macros + key foods + timing) is more sustainable. Rigid meal plans fail because people don't follow them. A framework gives structure with flexibility. Users know their macros, know which foods to emphasize, and can build meals they actually enjoy.

### Why not link to specific supplement products?

**Context:** Could generate Amazon/iHerb links for specific products.

**Decision:** Recommend the compound, form, and dosage — not a specific brand. Avoids conflicts of interest, affiliate bias, and keeps recommendations clinical. Users can find products matching the spec.
