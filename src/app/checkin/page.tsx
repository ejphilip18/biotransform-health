"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/nav";
import { fadeUp, modalEnter, DURATION_NORMAL, EASE_OUT } from "@/lib/animations";
import { formatDate } from "@/lib/format";

/* ─── Constants ───────────────────────────────────────────────────── */

const SLEEP_QUALITY_OPTIONS = [
  { value: 1, emoji: "😩", label: "Terrible" },
  { value: 2, emoji: "😔", label: "Poor" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Excellent" },
];

const ENERGY_OPTIONS = [
  { value: 1, emoji: "🪫", label: "Drained" },
  { value: 2, emoji: "😴", label: "Low" },
  { value: 3, emoji: "😐", label: "Medium" },
  { value: 4, emoji: "⚡", label: "High" },
  { value: 5, emoji: "🔋", label: "Peak" },
];

const MOOD_OPTIONS = [
  { value: 1, emoji: "😢", label: "Awful" },
  { value: 2, emoji: "😔", label: "Low" },
  { value: 3, emoji: "😐", label: "Neutral" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Great" },
];

const STRESS_OPTIONS = [
  { value: 1, emoji: "😌", label: "Calm" },
  { value: 2, emoji: "🙂", label: "Mild" },
  { value: 3, emoji: "😐", label: "Moderate" },
  { value: 4, emoji: "😰", label: "High" },
  { value: 5, emoji: "🤯", label: "Extreme" },
];

const SLEEP_HOUR_OPTIONS = [5, 6, 7, 8, 9, 10];
const EASE_OUT_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

/* ─── Emoji Selector Component ────────────────────────────────────── */

function EmojiSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: number; emoji: string; label: string }[];
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label
        className="mb-2.5 block text-xs font-medium"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      <div className="flex gap-2">
        {options.map((opt) => {
          const isSelected = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.14, ease: EASE_OUT }}
              className="flex flex-1 flex-col items-center gap-1 rounded-xl border py-3"
              style={{
                borderColor: isSelected ? "var(--accent-teal)" : "var(--border-medium)",
                background: isSelected ? "rgba(0,240,181,0.06)" : "var(--bg-secondary)",
              }}
            >
              <span className="text-xl">{opt.emoji}</span>
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isSelected ? "var(--accent-teal)" : "var(--text-tertiary)",
                }}
              >
                {opt.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Toggle Component ────────────────────────────────────────────── */

function ToggleField({
  label,
  value,
  onChange,
  yesLabel = "Yes",
  noLabel = "No",
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
        {label}
      </label>
      <div className="flex gap-2">
        <motion.button
          type="button"
          onClick={() => onChange(true)}
          whileTap={{ scale: 0.97 }}
          className="rounded-lg border px-4 py-2 text-xs font-medium"
          style={{
            borderColor: value ? "var(--accent-teal)" : "var(--border-medium)",
            background: value ? "rgba(0,240,181,0.1)" : "var(--bg-secondary)",
            color: value ? "var(--accent-teal)" : "var(--text-tertiary)",
            transition: `color 0.16s ${EASE_OUT_CSS}, background-color 0.16s ${EASE_OUT_CSS}, border-color 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
          }}
        >
          {yesLabel}
        </motion.button>
        <motion.button
          type="button"
          onClick={() => onChange(false)}
          whileTap={{ scale: 0.97 }}
          className="rounded-lg border px-4 py-2 text-xs font-medium"
          style={{
            borderColor: !value ? "var(--accent-teal)" : "var(--border-medium)",
            background: !value ? "rgba(0,240,181,0.1)" : "var(--bg-secondary)",
            color: !value ? "var(--accent-teal)" : "var(--text-tertiary)",
            transition: `color 0.16s ${EASE_OUT_CSS}, background-color 0.16s ${EASE_OUT_CSS}, border-color 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
          }}
        >
          {noLabel}
        </motion.button>
      </div>
    </div>
  );
}

/* ─── Success State ───────────────────────────────────────────────── */

function SuccessState() {
  return (
    <motion.div
      initial={modalEnter.initial}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: DURATION_NORMAL, ease: EASE_OUT }}
      className="mx-auto max-w-md rounded-2xl border p-10 text-center"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.15, duration: DURATION_NORMAL, ease: EASE_OUT }}
        className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "rgba(0,240,181,0.12)" }}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--accent-teal)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </motion.div>
      <h2
        className="text-xl font-bold"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        Check-in Saved!
      </h2>
      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
        Great job staying consistent. Keep the streak alive!
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-opacity hover:opacity-90"
        style={{ background: "var(--accent-teal)", color: "var(--bg-primary)" }}
      >
        ← Back to Dashboard
      </Link>
    </motion.div>
  );
}

/* ─── Check-in Form (initializes state from props, no effect) ────── */

function CheckinForm({
  initialData,
  onSuccess,
}: {
  initialData: Doc<"dailyCheckins"> | null;
  onSuccess: () => void;
}) {
  const submitCheckin = useMutation(api.checkins.submit);

  // ✅ Derived — no state needed
  const isUpdate = initialData != null;

  // ✅ State initialised directly from props — no useEffect needed
  const [sleepQuality, setSleepQuality] = useState(() => initialData?.sleepQuality ?? 3);
  const [sleepHours, setSleepHours] = useState(() => initialData?.sleepHours ?? 8);
  const [energyLevel, setEnergyLevel] = useState(() => initialData?.energyLevel ?? 3);
  const [mood, setMood] = useState(() => initialData?.mood ?? 3);
  const [stressLevel, setStressLevel] = useState(() => initialData?.stressLevel ?? 3);
  const [supplementsTaken, setSupplementsTaken] = useState(() => initialData?.supplementsTaken ?? false);
  const [workoutCompleted, setWorkoutCompleted] = useState(() => initialData?.workoutCompleted ?? false);
  const [notes, setNotes] = useState(() => initialData?.notes ?? "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      await submitCheckin({
        sleepQuality,
        sleepHours,
        energyLevel,
        mood,
        stressLevel,
        supplementsTaken,
        workoutCompleted,
        notes: notes.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      key="form"
      initial="hidden"
      animate="visible"
      exit={{ opacity: 0, transition: { duration: 0.16, ease: EASE_OUT } }}
      className="rounded-2xl border p-6 sm:p-8"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <div className="space-y-7">
        {/* Sleep Quality */}
        <motion.div custom={0} variants={fadeUp}>
          <EmojiSelector
            label="Sleep Quality"
            options={SLEEP_QUALITY_OPTIONS}
            value={sleepQuality}
            onChange={setSleepQuality}
          />
        </motion.div>

        {/* Sleep Hours */}
        <motion.div custom={1} variants={fadeUp}>
          <label
            className="mb-2.5 block text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Sleep Hours
          </label>
          <div className="flex gap-2">
            {SLEEP_HOUR_OPTIONS.map((h) => {
              const isSelected = sleepHours === h;
              return (
                <motion.button
                  key={h}
                  type="button"
                  onClick={() => setSleepHours(h)}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.14, ease: EASE_OUT }}
                  className="flex-1 rounded-xl border py-3 text-sm font-bold"
                  style={{
                    borderColor: isSelected ? "var(--accent-teal)" : "var(--border-medium)",
                    background: isSelected ? "rgba(0,240,181,0.06)" : "var(--bg-secondary)",
                    color: isSelected ? "var(--accent-teal)" : "var(--text-secondary)",
                  }}
                >
                  {h}h
                </motion.button>
              );
            })}
          </div>
          {/* Custom input for non-standard hours */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              or enter custom:
            </span>
            <input
              type="number"
              min={0}
              max={24}
              step={0.5}
              value={sleepHours}
              onChange={(e) => setSleepHours(Number(e.target.value))}
              className="w-20 rounded-lg border px-3 py-1.5 text-xs outline-none transition-colors focus:border-[var(--accent-teal)]"
              style={{
                background: "var(--bg-secondary)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            />
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>hours</span>
          </div>
        </motion.div>

        {/* Energy Level */}
        <motion.div custom={2} variants={fadeUp}>
          <EmojiSelector
            label="Energy Level"
            options={ENERGY_OPTIONS}
            value={energyLevel}
            onChange={setEnergyLevel}
          />
        </motion.div>

        {/* Mood */}
        <motion.div custom={3} variants={fadeUp}>
          <EmojiSelector
            label="Mood"
            options={MOOD_OPTIONS}
            value={mood}
            onChange={setMood}
          />
        </motion.div>

        {/* Stress Level */}
        <motion.div custom={4} variants={fadeUp}>
          <EmojiSelector
            label="Stress Level"
            options={STRESS_OPTIONS}
            value={stressLevel}
            onChange={setStressLevel}
          />
        </motion.div>

        {/* Divider */}
        <div
          className="h-px"
          style={{ background: "var(--border-subtle)" }}
        />

        {/* Toggles */}
        <motion.div custom={5} variants={fadeUp} className="space-y-4">
          <ToggleField
            label="Supplements Taken?"
            value={supplementsTaken}
            onChange={setSupplementsTaken}
          />
          <ToggleField
            label="Workout Completed?"
            value={workoutCompleted}
            onChange={setWorkoutCompleted}
          />
        </motion.div>

        {/* Notes */}
        <motion.div custom={6} variants={fadeUp}>
          <label
            htmlFor="checkin-notes"
            className="mb-1.5 block text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Notes{" "}
            <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>
              (optional)
            </span>
          </label>
          <textarea
            id="checkin-notes"
            name="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth noting today…"
            rows={3}
            className="w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent-teal)]"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "var(--border-medium)",
              color: "var(--text-primary)",
            }}
          />
        </motion.div>

        {/* Error */}
        {error ? (
          <div
            className="rounded-lg px-4 py-2.5 text-xs"
            style={{ background: "rgba(239,68,68,0.1)", color: "var(--status-critical)" }}
          >
            {error}
          </div>
        ) : null}

        {/* Submit */}
        <motion.div custom={7} variants={fadeUp}>
          <motion.button
            onClick={handleSubmit}
            disabled={submitting}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.14, ease: EASE_OUT }}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:opacity-60"
            style={{ background: "var(--accent-teal)", color: "var(--bg-primary)" }}
          >
            {submitting ? (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block h-3.5 w-3.5 rounded-full"
                style={{
                  border: "2px solid transparent",
                  borderTopColor: "var(--bg-primary)",
                }}
              />
            ) : null}
            {submitting
              ? "Saving…"
              : isUpdate
                ? "Update Check-in"
                : "Submit Check-in"}
          </motion.button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ─── Main Check-in Page ──────────────────────────────────────────── */

export default function CheckinPage() {
  const todayCheckin = useQuery(api.checkins.getToday);
  const [showSuccess, setShowSuccess] = useState(false);

  // ✅ Derived
  const isLoading = todayCheckin === undefined;
  const isUpdate = todayCheckin != null && !isLoading;

  const todayFormatted = formatDate(new Date(), {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg-primary)" }}>
      <Nav />

      <main id="main-content" className="mx-auto max-w-xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION_NORMAL, ease: EASE_OUT }}
          className="mb-8"
        >
          <h1
            className="text-2xl font-black text-balance md:text-3xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Daily Check-in
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            {todayFormatted}
          </p>
          {isUpdate && !showSuccess ? (
            <span
              className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "rgba(59,130,246,0.12)", color: "var(--status-normal)" }}
            >
              Updating today&apos;s check-in
            </span>
          ) : null}
        </motion.div>

        <AnimatePresence mode="wait" initial={false}>
          {showSuccess ? (
            <SuccessState key="success" />
          ) : isLoading ? (
            <motion.div
              key="loading"
              className="space-y-4"
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-xl"
                  style={{ background: "var(--bg-tertiary)", height: 72 }}
                />
              ))}
            </motion.div>
          ) : (
            <CheckinForm
              key={todayCheckin?._id ?? "new"}
              initialData={todayCheckin}
              onSuccess={() => setShowSuccess(true)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
