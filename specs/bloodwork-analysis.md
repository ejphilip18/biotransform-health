# Bloodwork & Biomarker Analysis

**Status:** Draft
**Last Updated:** 2026-02-15

---

## Overview

This is the core system of BioTransform. Users upload bloodwork, hormone panel, or DNA test PDFs. The system stores the PDF in Convex file storage, then triggers a Convex action that sends the PDF to Gemini 3 Flash Preview for analysis. Gemini parses the PDF, extracts biomarker values, maps them to reference ranges (adjusted for user's age/sex), identifies risk areas, and generates a full health protocol — all in a single structured JSON response.

### Goals

- Accept any standard lab report PDF (Quest, LabCorp, private labs, international)
- Extract 50+ biomarkers with values and units
- Map to optimal ranges (not just "normal" — functional/optimal medicine ranges)
- Generate actionable supplement stack, nutrition framework, and training program
- Real-time processing status via Convex subscriptions
- Support multiple uploads for longitudinal tracking

### Non-Goals

- Real-time API integration with lab providers (manual PDF upload only)
- OCR for photographed paper reports (PDF only)
- DNA sequencing (accept existing DNA test reports only)

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  Upload Page │────▶│  Convex      │────▶│  Convex File │
│  (client)    │     │  Mutation    │     │  Storage     │
└─────────────┘     └──────┬───────┘     └──────────────┘
                           │ schedule action
                    ┌──────▼───────┐
                    │  Convex      │
                    │  Action      │
                    │  ("use node")│
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Gemini 3    │
                    │  Flash       │
                    │  Preview API │
                    └──────┬───────┘
                           │ structured JSON
                    ┌──────▼───────┐
                    │  Store       │
                    │  Results     │
                    │  (mutations) │
                    └──────────────┘
```

---

## Core Types

### BloodworkUpload

```typescript
interface BloodworkUpload {
  _id: Id<"bloodworkUploads">;
  userId: Id<"users">;
  fileId: Id<"_storage">;       // Convex file storage reference
  uploadedAt: number;           // timestamp
  labDate: string;              // ISO date — when the blood was drawn
  labProvider?: string;         // e.g. "Quest Diagnostics", "LabCorp"
  testType: "bloodwork" | "hormone" | "dna";
  status: UploadStatus;
  errorMessage?: string;        // populated if status is "failed"
}

type UploadStatus = "pending" | "processing" | "complete" | "failed";
```

### BiomarkerResult

```typescript
interface BiomarkerResult {
  _id: Id<"biomarkerResults">;
  userId: Id<"users">;
  uploadId: Id<"bloodworkUploads">;
  biomarker: string;            // e.g. "Vitamin D (25-OH)"
  category: BiomarkerCategory;
  value: number;
  unit: string;                 // e.g. "ng/mL", "pg/mL", "IU/L"
  referenceRangeLow: number;
  referenceRangeHigh: number;
  optimalRangeLow: number;      // functional/optimal range
  optimalRangeHigh: number;
  status: BiomarkerStatus;
  labDate: string;
}

type BiomarkerCategory =
  | "cbc"
  | "cmp"
  | "lipids"
  | "iron"
  | "vitamins"
  | "inflammatory"
  | "metabolic"
  | "thyroid"
  | "hormones_male"
  | "hormones_female"
  | "hormones_general"
  | "genetic";

type BiomarkerStatus = "optimal" | "normal" | "suboptimal" | "critical";
```

### GeminiAnalysisResponse (structured JSON schema)

```typescript
interface GeminiAnalysisResponse {
  biomarkers: ExtractedBiomarker[];
  riskAreas: RiskArea[];
  supplementStack: Supplement[];
  nutritionPlan: NutritionPlan;
  trainingProgram: TrainingProgram;
  summary: string;              // 2-3 sentence overview
  keyFindings: string[];        // top 5 findings
}

interface ExtractedBiomarker {
  name: string;
  value: number;
  unit: string;
  referenceRangeLow: number;
  referenceRangeHigh: number;
  optimalRangeLow: number;
  optimalRangeHigh: number;
  status: "optimal" | "normal" | "suboptimal" | "critical";
  category: string;
  interpretation: string;       // 1-2 sentence explanation
}

interface RiskArea {
  area: string;                 // e.g. "Cardiovascular", "Thyroid", "Inflammation"
  severity: "low" | "moderate" | "high";
  description: string;
  relatedBiomarkers: string[];
  actionItems: string[];
}
```

---

## Gemini Integration

### Package and Model

```typescript
"use node";
import { GoogleGenAI, Type, createUserContent, createPartFromUri } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-3-flash-preview";
```

### Analysis Flow

1. **Retrieve PDF** from Convex file storage as a Blob
2. **Upload to Gemini File API**: `ai.files.upload({ file: blob, config: { mimeType: "application/pdf" } })`
3. **Generate structured analysis**: `ai.models.generateContent()` with:
   - PDF file part via `createPartFromUri()`
   - System prompt with user profile context (age, sex, goals, medications, etc.)
   - `responseMimeType: "application/json"`
   - `responseSchema` using `Type` system for full response structure
4. **Parse response**: `JSON.parse(response.text)`
5. **Store results**: Run mutations to save biomarkerResults and healthPlan
6. **Update status**: Set upload status to "complete"
7. **Clean up**: Delete file from Gemini File API: `ai.files.delete({ name: uploaded.name })`

### System Prompt (Template)

```
You are a clinical health analyst specializing in functional medicine and preventive health optimization. Analyze the attached lab report PDF and provide a comprehensive health assessment.

USER CONTEXT:
- Age: {age} years old
- Biological Sex: {biologicalSex}
- Height: {height}cm, Weight: {weight}kg
- Activity Level: {activityLevel}
- Health Goals: {healthGoals}
- Current Medications: {medications}
- Current Supplements: {supplements}
- Medical Conditions: {medicalConditions}
- Dietary Preference: {dietaryPreference}
- Allergies: {allergies}

INSTRUCTIONS:
1. Extract ALL biomarker values from the PDF with their units
2. For each biomarker, provide both standard reference ranges AND optimal/functional ranges adjusted for the user's age and sex
3. Flag any values that are suboptimal or critical
4. Identify correlations between biomarkers that suggest risk areas
5. Generate a supplement stack with specific dosages, timing, and forms (e.g., "Vitamin D3 5000 IU with K2 MK-7 100mcg, morning with fat-containing meal")
6. Create a nutrition framework with macros, key foods to emphasize, foods to avoid, and meal timing
7. Design a training program with split type, sessions per week, volume, intensity, and progression model

IMPORTANT: Use functional/optimal ranges, not just standard lab ranges. Optimal ranges are narrower and represent where someone performs and feels best, not just "absence of disease."

DISCLAIMER: All recommendations are educational and informational. They are not medical advice. Users should consult with a healthcare provider before making changes.
```

### Response Schema (Type system)

```typescript
const analysisResponseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
    biomarkers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          value: { type: Type.NUMBER },
          unit: { type: Type.STRING },
          referenceRangeLow: { type: Type.NUMBER },
          referenceRangeHigh: { type: Type.NUMBER },
          optimalRangeLow: { type: Type.NUMBER },
          optimalRangeHigh: { type: Type.NUMBER },
          status: { type: Type.STRING },
          category: { type: Type.STRING },
          interpretation: { type: Type.STRING },
        },
      },
    },
    riskAreas: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          area: { type: Type.STRING },
          severity: { type: Type.STRING },
          description: { type: Type.STRING },
          relatedBiomarkers: { type: Type.ARRAY, items: { type: Type.STRING } },
          actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
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
    },
  },
};
```

---

## Convex Functions

### Mutations

| Function | Purpose | Auth |
| :--- | :--- | :--- |
| `uploads.generateUploadUrl` | Generate Convex storage upload URL | Yes |
| `uploads.createUpload` | Create bloodworkUpload record after file stored | Yes |
| `uploads.updateStatus` | Update processing status | Internal |

### Actions

| Function | Purpose | Auth |
| :--- | :--- | :--- |
| `analysis.analyzeBloodwork` | Send PDF to Gemini, parse, store results | Internal |

### Queries

| Function | Purpose | Auth |
| :--- | :--- | :--- |
| `uploads.getUpload` | Get single upload with status | Yes |
| `uploads.listUploads` | List all uploads for current user | Yes |
| `biomarkers.getByUpload` | Get biomarker results for an upload | Yes |
| `biomarkers.getLatest` | Get most recent results per biomarker | Yes |
| `biomarkers.getHistory` | Get historical values for a biomarker | Yes |

---

## Biomarker Reference List

### Bloodwork — CBC

| Biomarker | Unit | Standard Range | Optimal Range (Male) | Optimal Range (Female) |
| :--- | :--- | :--- | :--- | :--- |
| RBC | M/uL | 4.0-5.5 | 4.5-5.2 | 4.0-4.8 |
| WBC | K/uL | 4.0-11.0 | 5.0-8.0 | 5.0-8.0 |
| Hemoglobin | g/dL | 12.0-17.5 | 14.0-16.5 | 12.5-15.0 |
| Hematocrit | % | 36-50 | 42-48 | 37-44 |
| Platelets | K/uL | 150-400 | 200-350 | 200-350 |

### Bloodwork — CMP

| Biomarker | Unit | Standard Range | Optimal Range |
| :--- | :--- | :--- | :--- |
| Glucose (fasting) | mg/dL | 65-100 | 75-90 |
| BUN | mg/dL | 7-25 | 10-20 |
| Creatinine | mg/dL | 0.6-1.3 | 0.8-1.1 |
| eGFR | mL/min | >60 | >90 |
| Sodium | mEq/L | 135-146 | 138-142 |
| Potassium | mEq/L | 3.5-5.3 | 4.0-4.8 |
| Calcium | mg/dL | 8.5-10.5 | 9.2-10.0 |
| Albumin | g/dL | 3.5-5.0 | 4.2-5.0 |
| ALT | IU/L | 7-56 | 10-30 |
| AST | IU/L | 10-40 | 10-30 |
| ALP | IU/L | 44-147 | 50-100 |
| Total Bilirubin | mg/dL | 0.1-1.2 | 0.2-0.9 |

### Lipid Panel

| Biomarker | Unit | Standard Range | Optimal Range |
| :--- | :--- | :--- | :--- |
| Total Cholesterol | mg/dL | <200 | 160-200 |
| LDL | mg/dL | <100 | <80 |
| HDL | mg/dL | >40 | >60 |
| Triglycerides | mg/dL | <150 | <80 |
| VLDL | mg/dL | 5-40 | <20 |

### Iron Panel

| Biomarker | Unit | Optimal Range (Male) | Optimal Range (Female) |
| :--- | :--- | :--- | :--- |
| Ferritin | ng/mL | 50-150 | 40-100 |
| Serum Iron | mcg/dL | 60-170 | 60-170 |
| TIBC | mcg/dL | 250-370 | 250-370 |
| Transferrin Sat | % | 25-45 | 25-45 |

### Vitamins & Inflammatory

| Biomarker | Unit | Optimal Range |
| :--- | :--- | :--- |
| Vitamin D (25-OH) | ng/mL | 50-80 |
| Vitamin B12 | pg/mL | 500-1000 |
| Folate | ng/mL | >15 |
| hs-CRP | mg/L | <1.0 |
| ESR | mm/hr | <10 |
| Homocysteine | umol/L | <8 |

### Metabolic

| Biomarker | Unit | Optimal Range |
| :--- | :--- | :--- |
| HbA1c | % | 4.8-5.2 |
| Fasting Insulin | uIU/mL | 3-8 |
| HOMA-IR | ratio | <1.5 |

### Thyroid

| Biomarker | Unit | Optimal Range |
| :--- | :--- | :--- |
| TSH | mIU/L | 1.0-2.5 |
| Free T3 | pg/mL | 3.0-4.0 |
| Free T4 | ng/dL | 1.0-1.5 |
| Reverse T3 | ng/dL | <20 |
| TPO Antibodies | IU/mL | <15 |

### Hormones

| Biomarker | Unit | Optimal Range (Male) | Optimal Range (Female) |
| :--- | :--- | :--- | :--- |
| Total Testosterone | ng/dL | 600-900 | 15-70 |
| Free Testosterone | pg/mL | 15-25 | 1-5 |
| Estradiol | pg/mL | 20-40 | varies by cycle |
| DHEA-S | mcg/dL | 200-400 | 150-350 |
| Cortisol (AM) | mcg/dL | 10-18 | 10-18 |
| SHBG | nmol/L | 20-50 | 40-120 |
| LH | mIU/mL | 2-12 | varies by cycle |
| FSH | mIU/mL | 2-12 | varies by cycle |
| Prolactin | ng/mL | 2-18 | 2-29 |
| IGF-1 | ng/mL | 115-350 | 115-350 |
| Progesterone | ng/mL | 0.3-1.2 | varies by cycle |

### DNA/Genetic Markers

| Gene | Variant | Impact |
| :--- | :--- | :--- |
| MTHFR | C677T, A1298C | Methylation, folate metabolism |
| COMT | Val158Met | Estrogen, dopamine metabolism |
| VDR | Bsm, Taq, Fok | Vitamin D receptor sensitivity |
| APOE | e2/e3/e4 | Cardiovascular, Alzheimer's risk |
| CYP1A2 | *1A/*1F | Caffeine metabolism speed |
| BDNF | Val66Met | Neuroplasticity, mood |
| SOD2 | Ala16Val | Antioxidant capacity |
| GAD1 | various | GABA synthesis |
| PEMT | rs7946 | Choline requirements |

---

## Error Handling

| Error | Cause | Action |
| :--- | :--- | :--- |
| `INVALID_FILE_TYPE` | Not a PDF | Reject upload, show error |
| `FILE_TOO_LARGE` | PDF > 20MB | Reject upload, show size limit |
| `GEMINI_TIMEOUT` | Gemini API takes > 60s | Retry once, then fail |
| `GEMINI_PARSE_ERROR` | Response not valid JSON | Fail, log error, show message |
| `PARTIAL_EXTRACTION` | Some biomarkers unreadable | Store what was extracted, flag partial |
| `NO_BIOMARKERS_FOUND` | PDF not a lab report | Fail with helpful message |

---

## Design Decisions

### Why single Gemini call instead of extract-then-analyze?

**Context:** Could split into two calls: one to extract biomarkers, one to generate recommendations.

**Decision:** Single call. Gemini 3 Flash Preview handles both in one pass with structured output. Reduces latency, cost (fewer tokens total), and complexity. The structured JSON schema ensures we get both extraction and analysis in one response.

### Why functional/optimal ranges instead of just standard lab ranges?

**Context:** Standard lab ranges represent 95% of the population including unhealthy people. "Normal" doesn't mean "optimal."

**Decision:** Include both standard and optimal ranges. The AI uses optimal ranges for status determination. This is the core value proposition — showing users where they are vs. where they could be, not just whether they have a disease.
