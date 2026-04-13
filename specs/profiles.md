# User Profiles & Onboarding

**Status:** Draft
**Last Updated:** 2026-02-15

---

## Overview

The profile system captures user demographics, lifestyle, and health goals during onboarding. This data is essential context for the AI analysis pipeline — Gemini uses it to age/gender-adjust biomarker reference ranges and tailor supplement/nutrition/training recommendations. The onboarding wizard is a 4-step flow designed to feel quick (under 3 minutes) while capturing everything needed.

### Goals

- Capture essential user context for personalized AI analysis
- Fast, non-intimidating onboarding (under 3 minutes)
- Flexible — allow skipping non-critical fields and updating later
- Feed profile data into every Gemini analysis call

### Non-Goals

- Medical history intake (we're not a medical records system)
- Integration with wearables (future consideration)

---

## Core Types

### Profile

```typescript
interface Profile {
  _id: Id<"profiles">;
  userId: Id<"users">;

  // Demographics (Step 1)
  dateOfBirth: string;          // ISO date string, used to calculate age
  biologicalSex: "male" | "female";
  height: number;               // in cm
  weight: number;               // in kg
  ethnicity?: string;           // optional, affects some reference ranges

  // Lifestyle (Step 2)
  activityLevel: "sedentary" | "light" | "moderate" | "active" | "very_active";
  sleepHoursAvg: number;        // 0-24, typical hours per night
  stressLevel: "low" | "moderate" | "high" | "very_high";
  smokingStatus: "never" | "former" | "current";
  alcoholFrequency: "none" | "occasional" | "moderate" | "heavy";

  // Diet & Allergies (Step 3)
  dietaryPreference: "omnivore" | "vegetarian" | "vegan" | "pescatarian" | "keto" | "paleo" | "other";
  allergies: string[];          // free-text list: "shellfish", "gluten", etc.
  supplements: string[];        // current supplements user is already taking

  // Goals (Step 3)
  healthGoals: string[];        // e.g. ["improve_energy", "optimize_hormones", "lose_fat", "build_muscle", "longevity", "reduce_inflammation"]
  medicalConditions: string[];  // e.g. ["hypothyroid", "pcos", "diabetes_t2"]
  medications: string[];        // current medications

  // Meta
  onboardingStep: OnboardingStep;
  updatedAt: number;
}

type OnboardingStep =
  | "demographics"
  | "lifestyle"
  | "goals"
  | "consent"
  | "complete";
```

### Onboarding State Machine

```
demographics → lifestyle → goals → consent → complete
     ↑             ↑          ↑        ↑
     └─────────────┴──────────┴────────┘  (can go back)
```

Users can navigate back to any previous step. Forward navigation validates the current step. The "consent" step collects data processing consent before marking onboarding complete.

---

## Convex Functions

### Queries

| Function | Purpose | Auth |
| :--- | :--- | :--- |
| `profiles.get` | Get current user's profile | Yes |
| `profiles.getOnboardingStep` | Get current onboarding step | Yes |

### Mutations

| Function | Purpose | Auth |
| :--- | :--- | :--- |
| `profiles.saveDemographics` | Save step 1 fields | Yes |
| `profiles.saveLifestyle` | Save step 2 fields | Yes |
| `profiles.saveGoals` | Save step 3 fields | Yes |
| `profiles.completeOnboarding` | Mark onboarding done, set user flag | Yes |
| `profiles.update` | Update any profile fields (settings page) | Yes |

---

## Validation Rules

| Field | Rules |
| :--- | :--- |
| `dateOfBirth` | Valid ISO date, age 13-120 |
| `biologicalSex` | Must be "male" or "female" |
| `height` | 50-300 cm |
| `weight` | 20-500 kg |
| `activityLevel` | Must be one of enum values |
| `sleepHoursAvg` | 0-24, increments of 0.5 |
| `healthGoals` | At least 1 selected |
| `allergies` | Array of strings, max 20 items |

---

## Onboarding UI Flow

### Step 1: Demographics
- Date of birth (date picker)
- Biological sex (radio: male/female)
- Height (number input with unit toggle cm/ft)
- Weight (number input with unit toggle kg/lbs)
- Ethnicity (optional dropdown)

### Step 2: Lifestyle
- Activity level (visual selector with icons)
- Average sleep hours (slider)
- Stress level (radio buttons)
- Smoking status (radio)
- Alcohol frequency (radio)

### Step 3: Goals & Diet
- Health goals (multi-select chips)
- Dietary preference (single select)
- Allergies (tag input)
- Current supplements (tag input)
- Medical conditions (tag input, optional)
- Medications (tag input, optional)

### Step 4: Consent
- Data processing consent checkbox (required)
- AI analysis consent checkbox (required)
- Data sharing consent checkbox (optional)
- Links to privacy policy and terms
- "Complete Setup" button

---

## Design Decisions

### Why biological sex instead of gender?

**Context:** Biomarker reference ranges are calibrated to biological sex (testosterone, estrogen, etc.), not gender identity.

**Decision:** Collect biological sex for medical accuracy. We label it clearly as "biological sex" with a brief explanation of why it's needed for accurate health analysis.

### Why not collect medical history in detail?

**Context:** Detailed medical history would improve AI recommendations but adds friction and liability.

**Decision:** Collect conditions and medications as free-text tags. The AI prompt includes them as context but we're explicit this is not a medical system. Detailed history is a future consideration if we add practitioner oversight.
