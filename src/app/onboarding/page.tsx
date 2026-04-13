"use client";

import { useState, useCallback, useRef, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_OUT, DURATION_NORMAL } from "@/lib/animations";

/* ─── Types ────────────────────────────────────────────────────────── */

type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type StressLevel = "low" | "moderate" | "high" | "very_high";
type SmokingStatus = "never" | "former" | "current";
type AlcoholFrequency = "none" | "occasional" | "moderate" | "heavy";
type DietaryPreference =
  | "omnivore"
  | "vegetarian"
  | "vegan"
  | "pescatarian"
  | "keto"
  | "paleo"
  | "other";

type HealthGoal =
  | "improve_energy"
  | "optimize_hormones"
  | "lose_fat"
  | "build_muscle"
  | "longevity"
  | "reduce_inflammation"
  | "improve_sleep"
  | "mental_clarity";

interface DemographicsData {
  dateOfBirth: string;
  biologicalSex: "male" | "female" | "";
  height: string;
  weight: string;
}

interface LifestyleData {
  activityLevel: ActivityLevel | "";
  sleepHoursAvg: number;
  stressLevel: StressLevel | "";
  smokingStatus: SmokingStatus | "";
  alcoholFrequency: AlcoholFrequency | "";
}

interface GoalsData {
  healthGoals: HealthGoal[];
  dietaryPreference: DietaryPreference | "";
  allergies: string[];
  supplements: string[];
  medicalConditions: string[];
  medications: string[];
}

interface ConsentData {
  data_processing: boolean;
  ai_analysis: boolean;
  data_sharing: boolean;
}

/* ─── Constants ────────────────────────────────────────────────────── */

const STEP_TITLES = ["Demographics", "Lifestyle", "Goals", "Consent"];

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; icon: string; desc: string }[] = [
  { value: "sedentary", label: "Sedentary", icon: "🪑", desc: "Little to no exercise" },
  { value: "light", label: "Light", icon: "🚶", desc: "1-2 days/week" },
  { value: "moderate", label: "Moderate", icon: "🏃", desc: "3-5 days/week" },
  { value: "active", label: "Active", icon: "💪", desc: "6-7 days/week" },
  { value: "very_active", label: "Very Active", icon: "🏋️", desc: "Athlete / 2x daily" },
];

const STRESS_OPTIONS: { value: StressLevel; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "high", label: "High" },
  { value: "very_high", label: "Very High" },
];

const SMOKING_OPTIONS: { value: SmokingStatus; label: string }[] = [
  { value: "never", label: "Never" },
  { value: "former", label: "Former" },
  { value: "current", label: "Current" },
];

const ALCOHOL_OPTIONS: { value: AlcoholFrequency; label: string }[] = [
  { value: "none", label: "None" },
  { value: "occasional", label: "Occasional" },
  { value: "moderate", label: "Moderate" },
  { value: "heavy", label: "Heavy" },
];

const HEALTH_GOAL_OPTIONS: { value: HealthGoal; label: string; icon: string }[] = [
  { value: "improve_energy", label: "Improve Energy", icon: "⚡" },
  { value: "optimize_hormones", label: "Optimize Hormones", icon: "🧬" },
  { value: "lose_fat", label: "Lose Fat", icon: "🔥" },
  { value: "build_muscle", label: "Build Muscle", icon: "💪" },
  { value: "longevity", label: "Longevity", icon: "🧪" },
  { value: "reduce_inflammation", label: "Reduce Inflammation", icon: "🩹" },
  { value: "improve_sleep", label: "Improve Sleep", icon: "😴" },
  { value: "mental_clarity", label: "Mental Clarity", icon: "🧠" },
];

const DIET_OPTIONS: { value: DietaryPreference; label: string }[] = [
  { value: "omnivore", label: "Omnivore" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "other", label: "Other" },
];

/* ─── Shared Styles ───────────────────────────────────────────────── */

const S = {
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid var(--border-medium)",
    background: "var(--bg-secondary)",
    color: "var(--text-primary)",
    fontSize: "14px",
    outline: "none",
    fontFamily: "var(--font-body)",
    transition: "border-color 0.2s",
  } as React.CSSProperties,
  label: {
    display: "block",
    marginBottom: "6px",
    fontSize: "12px",
    fontWeight: 500,
    color: "var(--text-secondary)",
    letterSpacing: "0.01em",
  } as React.CSSProperties,
  card: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "16px",
    padding: "32px",
  } as React.CSSProperties,
  btnPrimary: {
    padding: "14px 32px",
    borderRadius: "12px",
    border: "none",
    background: "var(--accent-teal)",
    color: "var(--bg-primary)",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "background-color 0.2s, opacity 0.2s",
    fontFamily: "var(--font-display)",
  } as React.CSSProperties,
  btnSecondary: {
    padding: "14px 24px",
    borderRadius: "12px",
    border: "1px solid var(--border-medium)",
    background: "transparent",
    color: "var(--text-secondary)",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "border-color 0.2s, color 0.2s, opacity 0.2s",
    fontFamily: "var(--font-body)",
  } as React.CSSProperties,
  errorText: {
    color: "var(--status-critical)",
    fontSize: "12px",
    marginTop: "4px",
  } as React.CSSProperties,
} as const;

/* ─── Animation Variants ──────────────────────────────────────────── */

const pageVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

/* ─── Progress Bar (module-level to avoid remount on parent state change) ─ */

function OnboardingProgressBar({ step }: { step: number }) {
  return (
    <div style={{ marginBottom: "40px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
        {STEP_TITLES.map((title, idx) => (
          <span
            key={title}
            style={{
              fontSize: "12px",
              fontWeight: step === idx + 1 ? 600 : 400,
              color: step > idx ? "var(--accent-teal)" : step === idx + 1 ? "var(--text-primary)" : "var(--text-tertiary)",
              transition: "color 0.2s",
              fontFamily: "var(--font-display)",
            }}
          >
            {title}
          </span>
        ))}
      </div>
      <div
        style={{
          height: "3px",
          borderRadius: "2px",
          background: "var(--border-subtle)",
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: DURATION_NORMAL, ease: EASE_OUT }}
          style={{
            height: "100%",
            borderRadius: "2px",
            background: "var(--accent-teal)",
          }}
        />
      </div>
      <div style={{ marginTop: "8px", textAlign: "right" }}>
        <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>Step {step} of 4</span>
      </div>
    </div>
  );
}

/* ─── Tag Input Component ─────────────────────────────────────────── */

function TagInput({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setValue("");
  }, [value, tags, onChange]);

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && value === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        padding: "8px 12px",
        borderRadius: "12px",
        border: "1px solid var(--border-medium)",
        background: "var(--bg-secondary)",
        minHeight: "48px",
        alignItems: "center",
        cursor: "text",
        transition: "border-color 0.2s",
      }}
    >
      {tags.map((tag, idx) => (
        <span
          key={tag + idx}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 10px",
            borderRadius: "8px",
            background: "rgba(0, 240, 181, 0.1)",
            border: "1px solid rgba(0, 240, 181, 0.2)",
            color: "var(--accent-teal)",
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(idx);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              border: "none",
              background: "rgba(0, 240, 181, 0.2)",
              color: "var(--accent-teal)",
              cursor: "pointer",
              fontSize: "10px",
              lineHeight: 1,
              padding: 0,
            }}
          >
            ✕
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ""}
        style={{
          flex: 1,
          minWidth: "80px",
          border: "none",
          background: "transparent",
          color: "var(--text-primary)",
          fontSize: "14px",
          outline: "none",
          padding: "4px 0",
          fontFamily: "var(--font-body)",
        }}
      />
    </div>
  );
}

/* ─── Step Components (module-level to avoid remount on parent state change) ─ */

function DemographicsStep({
  demographics,
  setDemographics,
  errors,
}: {
  demographics: DemographicsData;
  setDemographics: React.Dispatch<React.SetStateAction<DemographicsData>>;
  errors: Record<string, string>;
}) {
  const maxDate = new Date().toISOString().split("T")[0];
  return (
    <div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}
      >
        Tell us about yourself
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>
        Basic information helps us personalize your health analysis.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div>
          <label style={S.label}>Date of Birth</label>
          <input
            type="date"
            value={demographics.dateOfBirth}
            onChange={(e) => setDemographics((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
            max={maxDate}
            style={{ ...S.input, colorScheme: "dark" }}
          />
          {errors.dateOfBirth && <p style={S.errorText}>{errors.dateOfBirth}</p>}
        </div>

        <div>
          <label style={S.label}>Biological Sex</label>
          <div style={{ display: "flex", gap: "12px" }}>
            {(["male", "female"] as const).map((sex) => (
              <button
                key={sex}
                type="button"
                onClick={() => setDemographics((prev) => ({ ...prev, biologicalSex: sex }))}
                style={{
                  flex: 1,
                  padding: "14px",
                  borderRadius: "12px",
                  border: demographics.biologicalSex === sex
                    ? "1.5px solid var(--accent-teal)"
                    : "1px solid var(--border-medium)",
                  background: demographics.biologicalSex === sex
                    ? "rgba(0, 240, 181, 0.06)"
                    : "var(--bg-secondary)",
                  color: demographics.biologicalSex === sex ? "var(--accent-teal)" : "var(--text-secondary)",
                  fontSize: "14px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "border-color 0.2s, background-color 0.2s, color 0.2s",
                  textTransform: "capitalize",
                  fontFamily: "var(--font-body)",
                }}
              >
                {sex === "male" ? "♂ " : "♀ "}{sex}
              </button>
            ))}
          </div>
          {errors.biologicalSex && <p style={S.errorText}>{errors.biologicalSex}</p>}
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Height (cm)</label>
            <input
              type="number"
              value={demographics.height}
              onChange={(e) => setDemographics((prev) => ({ ...prev, height: e.target.value }))}
              placeholder="175"
              min={50}
              max={300}
              style={S.input}
            />
            {errors.height && <p style={S.errorText}>{errors.height}</p>}
          </div>
          <div style={{ flex: 1 }}>
            <label style={S.label}>Weight (kg)</label>
            <input
              type="number"
              value={demographics.weight}
              onChange={(e) => setDemographics((prev) => ({ ...prev, weight: e.target.value }))}
              placeholder="70"
              min={20}
              max={500}
              style={S.input}
            />
            {errors.weight && <p style={S.errorText}>{errors.weight}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function LifestyleStep({
  lifestyle,
  setLifestyle,
  errors,
}: {
  lifestyle: LifestyleData;
  setLifestyle: React.Dispatch<React.SetStateAction<LifestyleData>>;
  errors: Record<string, string>;
}) {
  return (
    <div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}
      >
        Your lifestyle
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>
        Understanding your daily habits lets us tailor recommendations.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div>
          <label style={S.label}>Activity Level</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setLifestyle((prev) => ({ ...prev, activityLevel: opt.value }))}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  padding: "14px 8px",
                  borderRadius: "12px",
                  border: lifestyle.activityLevel === opt.value
                    ? "1.5px solid var(--accent-teal)"
                    : "1px solid var(--border-medium)",
                  background: lifestyle.activityLevel === opt.value
                    ? "rgba(0, 240, 181, 0.06)"
                    : "var(--bg-secondary)",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background-color 0.2s",
                }}
              >
                <span style={{ fontSize: "20px" }}>{opt.icon}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: lifestyle.activityLevel === opt.value ? "var(--accent-teal)" : "var(--text-primary)",
                  }}
                >
                  {opt.label}
                </span>
                <span style={{ fontSize: "9px", color: "var(--text-tertiary)", textAlign: "center", lineHeight: 1.3 }}>
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
          {errors.activityLevel && <p style={S.errorText}>{errors.activityLevel}</p>}
        </div>

        <div>
          <label style={S.label}>
            Average Sleep Hours:{" "}
            <span style={{ color: "var(--accent-teal)", fontWeight: 700 }}>{lifestyle.sleepHoursAvg}h</span>
          </label>
          <div style={{ position: "relative", padding: "8px 0" }}>
            <input
              type="range"
              min={4}
              max={12}
              step={0.5}
              value={lifestyle.sleepHoursAvg}
              onChange={(e) =>
                setLifestyle((prev) => ({ ...prev, sleepHoursAvg: Number(e.target.value) }))
              }
              style={{
                width: "100%",
                height: "4px",
                borderRadius: "2px",
                appearance: "none",
                background: `linear-gradient(to right, var(--accent-teal) ${((lifestyle.sleepHoursAvg - 4) / 8) * 100}%, var(--border-medium) ${((lifestyle.sleepHoursAvg - 4) / 8) * 100}%)`,
                outline: "none",
                cursor: "pointer",
                accentColor: "var(--accent-teal)",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>4h</span>
              <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>12h</span>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
          <div>
            <label style={S.label}>Stress Level</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {STRESS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLifestyle((prev) => ({ ...prev, stressLevel: opt.value }))}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: lifestyle.stressLevel === opt.value
                      ? "1.5px solid var(--accent-teal)"
                      : "1px solid var(--border-medium)",
                    background: lifestyle.stressLevel === opt.value
                      ? "rgba(0, 240, 181, 0.06)"
                      : "var(--bg-secondary)",
                    color: lifestyle.stressLevel === opt.value ? "var(--accent-teal)" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "border-color 0.2s, background-color 0.2s, color 0.2s",
                    textAlign: "left",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.stressLevel && <p style={S.errorText}>{errors.stressLevel}</p>}
          </div>

          <div>
            <label style={S.label}>Smoking Status</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {SMOKING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLifestyle((prev) => ({ ...prev, smokingStatus: opt.value }))}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: lifestyle.smokingStatus === opt.value
                      ? "1.5px solid var(--accent-teal)"
                      : "1px solid var(--border-medium)",
                    background: lifestyle.smokingStatus === opt.value
                      ? "rgba(0, 240, 181, 0.06)"
                      : "var(--bg-secondary)",
                    color: lifestyle.smokingStatus === opt.value ? "var(--accent-teal)" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "border-color 0.2s, background-color 0.2s, color 0.2s",
                    textAlign: "left",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.smokingStatus && <p style={S.errorText}>{errors.smokingStatus}</p>}
          </div>

          <div>
            <label style={S.label}>Alcohol Frequency</label>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {ALCOHOL_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLifestyle((prev) => ({ ...prev, alcoholFrequency: opt.value }))}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: lifestyle.alcoholFrequency === opt.value
                      ? "1.5px solid var(--accent-teal)"
                      : "1px solid var(--border-medium)",
                    background: lifestyle.alcoholFrequency === opt.value
                      ? "rgba(0, 240, 181, 0.06)"
                      : "var(--bg-secondary)",
                    color: lifestyle.alcoholFrequency === opt.value ? "var(--accent-teal)" : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "border-color 0.2s, background-color 0.2s, color 0.2s",
                    textAlign: "left",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {errors.alcoholFrequency && <p style={S.errorText}>{errors.alcoholFrequency}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalsStep({
  goals,
  setGoals,
  errors,
}: {
  goals: GoalsData;
  setGoals: React.Dispatch<React.SetStateAction<GoalsData>>;
  errors: Record<string, string>;
}) {
  const toggleGoal = (goal: HealthGoal) => {
    setGoals((prev) => ({
      ...prev,
      healthGoals: prev.healthGoals.includes(goal)
        ? prev.healthGoals.filter((g) => g !== goal)
        : [...prev.healthGoals, goal],
    }));
  };

  return (
    <div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}
      >
        Set your goals
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>
        Tell us what you want to optimize and any dietary details.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
        <div>
          <label style={S.label}>Health Goals (select all that apply)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {HEALTH_GOAL_OPTIONS.map((opt) => {
              const selected = goals.healthGoals.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleGoal(opt.value)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "10px 16px",
                    borderRadius: "100px",
                    border: selected ? "1.5px solid var(--accent-teal)" : "1px solid var(--border-medium)",
                    background: selected ? "rgba(0, 240, 181, 0.08)" : "var(--bg-secondary)",
                    color: selected ? "var(--accent-teal)" : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "border-color 0.2s, background-color 0.2s, color 0.2s",
                  }}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
          {errors.healthGoals && <p style={S.errorText}>{errors.healthGoals}</p>}
        </div>

        <div>
          <label style={S.label}>Dietary Preference</label>
          <select
            value={goals.dietaryPreference}
            onChange={(e) =>
              setGoals((prev) => ({ ...prev, dietaryPreference: e.target.value as DietaryPreference }))
            }
            style={{ ...S.input, cursor: "pointer", colorScheme: "dark" }}
          >
            <option value="" disabled>Select your diet</option>
            {DIET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {errors.dietaryPreference && <p style={S.errorText}>{errors.dietaryPreference}</p>}
        </div>

        <div>
          <label style={S.label}>Allergies</label>
          <TagInput
            tags={goals.allergies}
            onChange={(allergies) => setGoals((prev) => ({ ...prev, allergies }))}
            placeholder="Type and press Enter (e.g. Gluten, Dairy)"
          />
        </div>

        <div>
          <label style={S.label}>Current Supplements</label>
          <TagInput
            tags={goals.supplements}
            onChange={(supplements) => setGoals((prev) => ({ ...prev, supplements }))}
            placeholder="Type and press Enter (e.g. Vitamin D, Omega-3)"
          />
        </div>

        <div>
          <label style={S.label}>
            Medical Conditions{" "}
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(optional)</span>
          </label>
          <TagInput
            tags={goals.medicalConditions}
            onChange={(medicalConditions) => setGoals((prev) => ({ ...prev, medicalConditions }))}
            placeholder="Type and press Enter"
          />
        </div>

        <div>
          <label style={S.label}>
            Current Medications{" "}
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(optional)</span>
          </label>
          <TagInput
            tags={goals.medications}
            onChange={(medications) => setGoals((prev) => ({ ...prev, medications }))}
            placeholder="Type and press Enter"
          />
        </div>
      </div>
    </div>
  );
}

function ConsentStep({
  consent,
  setConsent,
  errors,
}: {
  consent: ConsentData;
  setConsent: React.Dispatch<React.SetStateAction<ConsentData>>;
  errors: Record<string, string>;
}) {
  return (
    <div>
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: "var(--text-primary)",
          marginBottom: "4px",
        }}
      >
        Almost there
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "32px" }}>
        Please review and accept the following to continue.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {/* Data Processing */}
        <label
          style={{
            display: "flex",
            gap: "14px",
            padding: "20px",
            borderRadius: "12px",
            border: consent.data_processing
              ? "1.5px solid var(--accent-teal)"
              : "1px solid var(--border-medium)",
            background: consent.data_processing ? "rgba(0, 240, 181, 0.04)" : "var(--bg-secondary)",
            cursor: "pointer",
            transition: "border-color 0.2s, background-color 0.2s",
            alignItems: "flex-start",
          }}
        >
          <input
            type="checkbox"
            checked={consent.data_processing}
            onChange={(e) => setConsent((prev) => ({ ...prev, data_processing: e.target.checked }))}
            style={{
              width: "20px",
              height: "20px",
              marginTop: "2px",
              accentColor: "var(--accent-teal)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Data Processing</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "100px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "var(--status-critical)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Required
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "6px", lineHeight: 1.5 }}>
              I consent to BioTransform processing my health data, including bloodwork results,
              demographic information, and lifestyle data, for the purpose of generating personalized
              health recommendations.
            </p>
          </div>
        </label>
        {errors.data_processing && <p style={{ ...S.errorText, marginTop: "-8px" }}>{errors.data_processing}</p>}

        {/* AI Analysis */}
        <label
          style={{
            display: "flex",
            gap: "14px",
            padding: "20px",
            borderRadius: "12px",
            border: consent.ai_analysis
              ? "1.5px solid var(--accent-teal)"
              : "1px solid var(--border-medium)",
            background: consent.ai_analysis ? "rgba(0, 240, 181, 0.04)" : "var(--bg-secondary)",
            cursor: "pointer",
            transition: "border-color 0.2s, background-color 0.2s",
            alignItems: "flex-start",
          }}
        >
          <input
            type="checkbox"
            checked={consent.ai_analysis}
            onChange={(e) => setConsent((prev) => ({ ...prev, ai_analysis: e.target.checked }))}
            style={{
              width: "20px",
              height: "20px",
              marginTop: "2px",
              accentColor: "var(--accent-teal)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>AI Analysis</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "100px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "var(--status-critical)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Required
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "6px", lineHeight: 1.5 }}>
              I understand that AI (Gemini) will analyze my health data to generate supplement stacks,
              nutrition plans, and training programs. Results are informational and should not replace
              medical advice.
            </p>
          </div>
        </label>
        {errors.ai_analysis && <p style={{ ...S.errorText, marginTop: "-8px" }}>{errors.ai_analysis}</p>}

        {/* Data Sharing */}
        <label
          style={{
            display: "flex",
            gap: "14px",
            padding: "20px",
            borderRadius: "12px",
            border: consent.data_sharing
              ? "1.5px solid var(--accent-teal)"
              : "1px solid var(--border-medium)",
            background: consent.data_sharing ? "rgba(0, 240, 181, 0.04)" : "var(--bg-secondary)",
            cursor: "pointer",
            transition: "border-color 0.2s, background-color 0.2s",
            alignItems: "flex-start",
          }}
        >
          <input
            type="checkbox"
            checked={consent.data_sharing}
            onChange={(e) => setConsent((prev) => ({ ...prev, data_sharing: e.target.checked }))}
            style={{
              width: "20px",
              height: "20px",
              marginTop: "2px",
              accentColor: "var(--accent-teal)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>Anonymized Data Sharing</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "100px",
                  background: "rgba(0, 240, 181, 0.1)",
                  color: "var(--accent-teal)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Optional
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "6px", lineHeight: 1.5 }}>
              I optionally consent to sharing anonymized, aggregated health data to help improve
              BioTransform&apos;s analysis algorithms. No personally identifiable information will be shared.
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}

/* ─── Main Onboarding Page ────────────────────────────────────────── */

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mutations
  const saveDemographics = useMutation(api.profiles.saveDemographics);
  const saveLifestyle = useMutation(api.profiles.saveLifestyle);
  const saveGoals = useMutation(api.profiles.saveGoals);
  const grantConsent = useMutation(api.consent.grant);
  const completeOnboarding = useMutation(api.profiles.completeOnboarding);

  // Step 1: Demographics
  const [demographics, setDemographics] = useState<DemographicsData>({
    dateOfBirth: "",
    biologicalSex: "",
    height: "",
    weight: "",
  });

  // Step 2: Lifestyle
  const [lifestyle, setLifestyle] = useState<LifestyleData>({
    activityLevel: "",
    sleepHoursAvg: 8,
    stressLevel: "",
    smokingStatus: "",
    alcoholFrequency: "",
  });

  // Step 3: Goals
  const [goals, setGoals] = useState<GoalsData>({
    healthGoals: [],
    dietaryPreference: "",
    allergies: [],
    supplements: [],
    medicalConditions: [],
    medications: [],
  });

  // Step 4: Consent
  const [consent, setConsent] = useState<ConsentData>({
    data_processing: false,
    ai_analysis: false,
    data_sharing: false,
  });

  /* ─── Validation ───────────────────────────────────────── */

  const validateDemographics = (): boolean => {
    const errs: Record<string, string> = {};
    if (!demographics.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
    if (!demographics.biologicalSex) errs.biologicalSex = "Please select your biological sex";
    if (!demographics.height || Number(demographics.height) <= 0)
      errs.height = "Please enter a valid height";
    if (!demographics.weight || Number(demographics.weight) <= 0)
      errs.weight = "Please enter a valid weight";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateLifestyle = (): boolean => {
    const errs: Record<string, string> = {};
    if (!lifestyle.activityLevel) errs.activityLevel = "Please select your activity level";
    if (!lifestyle.stressLevel) errs.stressLevel = "Please select your stress level";
    if (!lifestyle.smokingStatus) errs.smokingStatus = "Please select your smoking status";
    if (!lifestyle.alcoholFrequency) errs.alcoholFrequency = "Please select alcohol frequency";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateGoals = (): boolean => {
    const errs: Record<string, string> = {};
    if (goals.healthGoals.length === 0) errs.healthGoals = "Select at least one health goal";
    if (!goals.dietaryPreference) errs.dietaryPreference = "Please select a dietary preference";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateConsent = (): boolean => {
    const errs: Record<string, string> = {};
    if (!consent.data_processing) errs.data_processing = "Data processing consent is required";
    if (!consent.ai_analysis) errs.ai_analysis = "AI analysis consent is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ─── Navigation ───────────────────────────────────────── */

  const goBack = () => {
    setDirection(-1);
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const handleNext = async () => {
    setLoading(true);
    try {
      if (step === 1) {
        if (!validateDemographics()) return;
        await saveDemographics({
          dateOfBirth: demographics.dateOfBirth,
          biologicalSex: demographics.biologicalSex as "male" | "female",
          height: Number(demographics.height),
          weight: Number(demographics.weight),
        });
        setDirection(1);
        setErrors({});
        setStep(2);
      } else if (step === 2) {
        if (!validateLifestyle()) return;
        await saveLifestyle({
          activityLevel: lifestyle.activityLevel as ActivityLevel,
          sleepHoursAvg: lifestyle.sleepHoursAvg,
          stressLevel: lifestyle.stressLevel as StressLevel,
          smokingStatus: lifestyle.smokingStatus as SmokingStatus,
          alcoholFrequency: lifestyle.alcoholFrequency as AlcoholFrequency,
        });
        setDirection(1);
        setErrors({});
        setStep(3);
      } else if (step === 3) {
        if (!validateGoals()) return;
        await saveGoals({
          healthGoals: goals.healthGoals,
          dietaryPreference: goals.dietaryPreference as DietaryPreference,
          allergies: goals.allergies,
          supplements: goals.supplements,
          medicalConditions: goals.medicalConditions.length > 0 ? goals.medicalConditions : undefined,
          medications: goals.medications.length > 0 ? goals.medications : undefined,
        });
        setDirection(1);
        setErrors({});
        setStep(4);
      } else if (step === 4) {
        if (!validateConsent()) return;
        // Grant each consent
        const consentVersion = "1.0";
        const consentPromises: Promise<void>[] = [];

        if (consent.data_processing) {
          consentPromises.push(
            grantConsent({ consentType: "data_processing", version: consentVersion }).then(() => undefined)
          );
        }
        if (consent.ai_analysis) {
          consentPromises.push(
            grantConsent({ consentType: "ai_analysis", version: consentVersion }).then(() => undefined)
          );
        }
        if (consent.data_sharing) {
          consentPromises.push(
            grantConsent({ consentType: "data_sharing", version: consentVersion }).then(() => undefined)
          );
        }

        await Promise.all(consentPromises);
        await completeOnboarding();
        router.push("/dashboard");
      }
    } catch (err) {
      setErrors({ _form: err instanceof Error ? err.message : "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  /* ─── Render Step ──────────────────────────────────────── */

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <DemographicsStep
            demographics={demographics}
            setDemographics={setDemographics}
            errors={errors}
          />
        );
      case 2:
        return (
          <LifestyleStep
            lifestyle={lifestyle}
            setLifestyle={setLifestyle}
            errors={errors}
          />
        );
      case 3:
        return (
          <GoalsStep
            goals={goals}
            setGoals={setGoals}
            errors={errors}
          />
        );
      case 4:
        return (
          <ConsentStep
            consent={consent}
            setConsent={setConsent}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  /* ─── Main Render ──────────────────────────────────────── */

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "40px 16px 80px",
        position: "relative",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          borderRadius: "50%",
          background: "var(--accent-teal)",
          opacity: 0.06,
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      <main id="main-content" style={{ width: "100%", maxWidth: "640px", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--accent-teal)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--bg-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "16px",
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            BioTransform
          </span>
        </div>

        {/* Progress Bar */}
        <OnboardingProgressBar step={step} />

        {/* Step Content */}
        <div style={S.card}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Form-level error */}
          {errors._form && (
            <div
              style={{
                marginTop: "20px",
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(239, 68, 68, 0.1)",
                color: "var(--status-critical)",
                fontSize: "13px",
              }}
            >
              {errors._form}
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: step > 1 ? "space-between" : "flex-end",
              marginTop: "36px",
              gap: "12px",
            }}
          >
            {step > 1 && (
              <button
                type="button"
                onClick={goBack}
                disabled={loading}
                style={{
                  ...S.btnSecondary,
                  opacity: loading ? 0.5 : 1,
                }}
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              style={{
                ...S.btnPrimary,
                opacity: loading ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {loading && (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  style={{
                    display: "inline-block",
                    width: "14px",
                    height: "14px",
                    border: "2px solid transparent",
                    borderTop: "2px solid var(--bg-primary)",
                    borderRadius: "50%",
                  }}
                />
              )}
              {step === 4 ? "Complete Setup" : "Continue →"}
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "var(--text-tertiary)",
            marginTop: "24px",
          }}
        >
          Your data is encrypted and stored securely. You can update these settings anytime.
        </p>
      </main>
    </div>
  );
}
