"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/nav";
import { fadeUp, tabContent, stagger, EASE_OUT, DURATION_SLOW } from "@/lib/animations";
import { formatDate } from "@/lib/format";

/* ─── Types ──────────────────────────────────────────────────────── */

type TabId = "supplements" | "nutrition" | "training";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "supplements",
    label: "Supplements",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 9h6m-3-3v6" />
      </svg>
    ),
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 010 8h-1" />
        <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    id: "training",
    label: "Training",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    ),
  },
];

const EASE_OUT_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

function RegeneratePlanButton({
  onRegenerateStart,
  regenerating,
}: {
  onRegenerateStart: () => void;
  regenerating: boolean;
}) {
  const regenerate = useMutation(api.healthPlans.regenerate);

  const handleRegenerate = async () => {
    onRegenerateStart();
    try {
      await regenerate({});
    } catch (err) {
      console.error("Regenerate failed:", err);
    }
  };

  return (
    <motion.button
      onClick={handleRegenerate}
      disabled={regenerating}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: "6px 14px",
        borderRadius: "8px",
        border: "1px solid var(--border-medium)",
        background: "transparent",
        color: "var(--text-secondary)",
        fontSize: "13px",
        fontWeight: 500,
        cursor: "pointer",
        fontFamily: "inherit",
        opacity: regenerating ? 0.6 : 1,
      }}
    >
      {regenerating ? "Regenerating…" : "Regenerate plan"}
    </motion.button>
  );
}

/* ─── Skeleton ───────────────────────────────────────────────────── */

function SkeletonPulse({
  width,
  height = "16px",
  borderRadius = "6px",
}: {
  width: string;
  height?: string;
  borderRadius?: string;
}) {
  return (
    <motion.div
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      style={{ width, height, borderRadius, background: "var(--bg-tertiary)" }}
    />
  );
}

/* ─── Macro Bar Component ────────────────────────────────────────── */

function MacroBar({
  label,
  value,
  total,
  unit,
  color,
}: {
  label: string;
  value: number;
  total: number;
  unit: string;
  color: string;
}) {
  const pct = total > 0 ? Math.min((value / total) * 100, 100) : 0;
  return (
    <div style={{ flex: 1 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontSize: "14px",
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            color: "var(--text-primary)",
          }}
        >
          {value}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 400,
              color: "var(--text-tertiary)",
              marginLeft: "2px",
            }}
          >
            {unit}
          </span>
        </span>
      </div>
      <div
        style={{
          height: "6px",
          borderRadius: "3px",
          background: "var(--border-subtle)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: DURATION_SLOW, ease: EASE_OUT, delay: 0.15 }}
          style={{
            height: "100%",
            borderRadius: "3px",
            background: color,
          }}
        />
      </div>
      <div
        style={{
          marginTop: "4px",
          fontSize: "11px",
          color: "var(--text-tertiary)",
        }}
      >
        {pct.toFixed(0)}% of daily calories
      </div>
    </div>
  );
}

/* ─── Detail Row ─────────────────────────────────────────────────── */

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <span
        style={{ fontSize: "13px", color: "var(--text-secondary)" }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Main Page Component ────────────────────────────────────────── */

export default function PlanPage() {
  const [activeTab, setActiveTab] = useState<TabId>("supplements");
  const [regenerating, setRegenerating] = useState(false);
  const [regeneratingStartedAt, setRegeneratingStartedAt] = useState(0);
  const plan = useQuery(api.healthPlans.getActive);
  const uploads = useQuery(api.uploads.listUploads);
  const reportData = useQuery(api.biomarkers.getReportData);

  const hasProcessingUploads =
    uploads?.some((u) => u.status === "pending" || u.status === "processing") ?? false;

  // Derive "still regenerating" during render — avoid setState in effect
  const isRegenerating =
    regenerating &&
    !(plan?.generatedAt && plan.generatedAt > regeneratingStartedAt);

  // Safety: clear regenerating after 90s in case backend fails
  useEffect(() => {
    if (!regenerating) return;
    const t = setTimeout(() => {
      setRegenerating(false);
      setRegeneratingStartedAt(0);
    }, 90_000);
    return () => clearTimeout(t);
  }, [regenerating]);

  const handleRegenerateStart = () => {
    setRegeneratingStartedAt(Date.now());
    setRegenerating(true);
  };

  /* ─── Loading ───────────────────────────────────────────── */

  if (plan === undefined || isRegenerating) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
        <Nav />
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
          <SkeletonPulse width="260px" height="28px" />
          <div style={{ marginTop: "12px" }}>
            <SkeletonPulse width="180px" height="16px" />
          </div>
          {isRegenerating && (
            <p style={{ marginTop: "16px", fontSize: "14px", color: "var(--text-secondary)" }}>
              Regenerating your plan with latest data…
            </p>
          )}
          <div style={{ marginTop: "40px", display: "flex", gap: "12px" }}>
            <SkeletonPulse width="120px" height="40px" borderRadius="10px" />
            <SkeletonPulse width="120px" height="40px" borderRadius="10px" />
            <SkeletonPulse width="120px" height="40px" borderRadius="10px" />
          </div>
          <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <SkeletonPulse width="100%" height="80px" borderRadius="12px" />
            <SkeletonPulse width="100%" height="80px" borderRadius="12px" />
            <SkeletonPulse width="100%" height="80px" borderRadius="12px" />
          </div>
        </div>
      </div>
    );
  }

  /* ─── No plan / empty state ─────────────────────────────── */

  if (plan === null) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
        <Nav />
        <div
          style={{
            maxWidth: "520px",
            margin: "0 auto",
            padding: "120px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "var(--accent-teal-glow)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent-teal)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "8px",
            }}
          >
            No active protocol
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
              maxWidth: "380px",
              margin: "0 auto",
            }}
          >
            Upload your bloodwork to get your personalized supplement stack,
            nutrition plan, and training program.
          </p>
          <Link
            href="/upload"
            style={{
              display: "inline-block",
              marginTop: "28px",
              padding: "14px 28px",
              borderRadius: "12px",
              background: "var(--accent-teal)",
              color: "var(--bg-primary)",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
              fontFamily: "var(--font-display)",
            }}
          >
            Upload Bloodwork
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Active plan ───────────────────────────────────────── */

  const generatedDate = formatDate(plan.generatedAt, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const nutrition = plan.nutritionPlan;
  const training = plan.trainingProgram;

  // Calorie breakdown for macro bars
  const proteinCal = nutrition.proteinGrams * 4;
  const carbCal = nutrition.carbGrams * 4;
  const fatCal = nutrition.fatGrams * 9;
  const totalMacroCal = proteinCal + carbCal + fatCal;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <Nav />

      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: "10%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "var(--accent-teal)",
          opacity: 0.04,
          filter: "blur(120px)",
          pointerEvents: "none",
        }}
      />

      <main
        id="main-content"
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "40px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Processing banner — show when new data is being analyzed */}
        {hasProcessingUploads && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl border px-4 py-4"
            style={{
              background: "rgba(0,240,181,0.08)",
              borderColor: "rgba(0,240,181,0.3)",
            }}
          >
            <div
              className="h-6 w-6 shrink-0 animate-spin rounded-full border-2 border-[var(--accent-teal)] border-t-transparent"
            />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                New lab data is being processed
              </p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                Your plan will update automatically when analysis is complete (usually 1–2 min)
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── Header ──────────────────────────────── */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "100px",
                background: "rgba(34, 197, 94, 0.1)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--status-optimal)",
                marginBottom: "12px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--status-optimal)",
                }}
              />
              Active Protocol
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Your Health Protocol
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "6px", flexWrap: "wrap" }}>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-secondary)",
                  margin: 0,
                }}
              >
                Generated {generatedDate} from{" "}
                {reportData?.sources?.length
                  ? reportData.sources.map((s) => s.testType).join(", ")
                  : "your lab data"}
                .{" "}
                {reportData?.genetics?.length ? (
                  <span style={{ color: "var(--accent-teal)" }}>Includes {reportData.genetics.length} genetic variants.</span>
                ) : (() => {
                  const dnaUpload = uploads?.find((u) => u.testType === "dna" && u.status === "complete");
                  return dnaUpload ? (
                    <span style={{ color: "var(--text-tertiary)" }}>
                      <Link href={`/results/${dnaUpload._id}`} style={{ color: "var(--accent-teal)", textDecoration: "underline" }}>
                        Re-analyze your DNA upload
                      </Link>{" "}
                      to extract genetic variants.
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-tertiary)" }}>
                      <Link href="/upload" style={{ color: "var(--text-tertiary)", textDecoration: "underline" }}>
                        Upload DNA
                      </Link>{" "}
                      for genetic insights.
                    </span>
                  );
                })()}{" "}
                <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>
                  Click Regenerate to incorporate new uploads.
                </span>
              </p>
              <RegeneratePlanButton onRegenerateStart={handleRegenerateStart} regenerating={isRegenerating} />
              <motion.div whileTap={{ scale: 0.97 }}>
              <Link
                href={`/report/${plan.uploadId}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  background: "var(--accent-teal)",
                  color: "var(--bg-primary)",
                  fontSize: "13px",
                  fontWeight: 600,
                  textDecoration: "none",
                  fontFamily: "inherit",
                  transition: `opacity 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="M9 15l3 3 3-3" />
                </svg>
                Generate PDF Report
              </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* ─── Tabs ──────────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            style={{
              display: "flex",
              gap: "4px",
              marginTop: "32px",
              padding: "4px",
              borderRadius: "12px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              width: "fit-content",
            }}
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "transparent",
                    color: isActive ? "var(--accent-teal)" : "var(--text-secondary)",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 400,
                    cursor: "pointer",
                    transition: `color 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
                    fontFamily: "var(--font-body)",
                    zIndex: 1,
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "8px",
                        background: "var(--accent-teal-glow)",
                        border: "1px solid rgba(0, 240, 181, 0.2)",
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
                    {tab.icon}
                    {tab.label}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>

          {/* ─── Tab Content ───────────────────────────── */}
          <div style={{ marginTop: "24px" }}>
            <AnimatePresence mode="wait" initial={false}>
              {activeTab === "supplements" && (
                <motion.div
                  key="supplements"
                  variants={tabContent}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <SupplementsTab supplements={plan.supplements} />
                </motion.div>
              )}
              {activeTab === "nutrition" && (
                <motion.div
                  key="nutrition"
                  variants={tabContent}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <NutritionTab
                    nutrition={nutrition}
                    proteinCal={proteinCal}
                    carbCal={carbCal}
                    fatCal={fatCal}
                    totalMacroCal={totalMacroCal}
                  />
                </motion.div>
              )}
              {activeTab === "training" && (
                <motion.div
                  key="training"
                  variants={tabContent}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <TrainingTab training={training} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

/* ─── Supplements Tab ────────────────────────────────────────────── */

interface Supplement {
  name: string;
  dosage: string;
  form: string;
  timing: string;
  purpose: string;
  duration: string;
  interactions: string;
}

function SupplementsTab({ supplements }: { supplements: Supplement[] }) {
  if (supplements.length === 0) {
    return (
      <div
        style={{
          padding: "60px 24px",
          textAlign: "center",
          color: "var(--text-tertiary)",
          fontSize: "14px",
        }}
      >
        No supplements recommended at this time.
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {supplements.map((supp, i) => (
        <motion.div
          key={i}
          variants={fadeUp}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            padding: "24px",
            transition: `border-color 0.16s ${EASE_OUT_CSS}`,
          }}
          whileHover={{
            borderColor: "rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <h3
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  {supp.name}
                </h3>
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "var(--accent-teal-glow)",
                    color: "var(--accent-teal)",
                  }}
                >
                  {supp.form}
                </span>
              </div>
              <p
                style={{
                  fontSize: "13px",
                  lineHeight: 1.5,
                  color: "var(--text-secondary)",
                  marginBottom: "14px",
                }}
              >
                {supp.purpose}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                  gap: "12px",
                }}
              >
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "4px",
                    }}
                  >
                    Dosage
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      color: "var(--accent-teal)",
                    }}
                  >
                    {supp.dosage}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "4px",
                    }}
                  >
                    Timing
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {supp.timing}
                  </span>
                </div>
                <div>
                  <span
                    style={{
                      display: "block",
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: "4px",
                    }}
                  >
                    Duration
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {supp.duration}
                  </span>
                </div>
              </div>
              {supp.interactions && supp.interactions !== "None" && (
                <div
                  style={{
                    marginTop: "12px",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(245, 158, 11, 0.06)",
                    border: "1px solid rgba(245, 158, 11, 0.15)",
                    fontSize: "12px",
                    color: "var(--status-suboptimal)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  {supp.interactions}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ─── Nutrition Tab ──────────────────────────────────────────────── */

interface NutritionPlan {
  dailyCalories: number;
  proteinGrams: number;
  carbGrams: number;
  fatGrams: number;
  keyFoods: string[];
  avoidFoods: string[];
  mealTiming: string;
  hydration: string;
  notes: string;
}

function NutritionTab({
  nutrition,
  proteinCal,
  carbCal,
  fatCal,
  totalMacroCal,
}: {
  nutrition: NutritionPlan;
  proteinCal: number;
  carbCal: number;
  fatCal: number;
  totalMacroCal: number;
}) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* Macro Breakdown Card */}
      <motion.div
        variants={fadeUp}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          padding: "28px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Macro Breakdown
          </h3>
          <div
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              background: "var(--accent-teal-glow)",
              fontFamily: "var(--font-display)",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--accent-teal)",
            }}
          >
            {nutrition.dailyCalories.toLocaleString()} kcal
          </div>
        </div>

        <div style={{ display: "flex", gap: "24px" }}>
          <MacroBar
            label="Protein"
            value={nutrition.proteinGrams}
            total={nutrition.dailyCalories / 4}
            unit="g"
            color="var(--status-optimal)"
          />
          <MacroBar
            label="Carbs"
            value={nutrition.carbGrams}
            total={nutrition.dailyCalories / 4}
            unit="g"
            color="var(--status-normal)"
          />
          <MacroBar
            label="Fat"
            value={nutrition.fatGrams}
            total={nutrition.dailyCalories / 9}
            unit="g"
            color="var(--status-suboptimal)"
          />
        </div>

        {/* Percentage summary */}
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "16px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "var(--bg-secondary)",
          }}
        >
          {[
            { label: "Protein", pct: Math.round((proteinCal / totalMacroCal) * 100), color: "var(--status-optimal)" },
            { label: "Carbs", pct: Math.round((carbCal / totalMacroCal) * 100), color: "var(--status-normal)" },
            { label: "Fat", pct: Math.round((fatCal / totalMacroCal) * 100), color: "var(--status-suboptimal)" },
          ].map((m) => (
            <div key={m.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: m.color }} />
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                {m.label} {m.pct}%
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Key Foods + Avoid Foods */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <motion.div
          variants={fadeUp}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Key Foods
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {nutrition.keyFoods.map((food) => (
              <span
                key={food}
                style={{
                  padding: "6px 14px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                  color: "var(--status-optimal)",
                }}
              >
                {food}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "16px",
            padding: "24px",
          }}
        >
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "16px",
            }}
          >
            Foods to Avoid
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {nutrition.avoidFoods.map((food) => (
              <span
                key={food}
                style={{
                  padding: "6px 14px",
                  borderRadius: "100px",
                  fontSize: "12px",
                  fontWeight: 500,
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "var(--status-critical)",
                }}
              >
                {food}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Timing, Hydration, Notes */}
      <motion.div
        variants={fadeUp}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          Guidelines
        </h3>
        <DetailRow label="Meal Timing" value={nutrition.mealTiming} />
        <DetailRow label="Hydration" value={nutrition.hydration} />
        {nutrition.notes && (
          <div style={{ paddingTop: "12px" }}>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "6px",
              }}
            >
              Notes
            </span>
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
              }}
            >
              {nutrition.notes}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── Training Tab ───────────────────────────────────────────────── */

interface TrainingProgram {
  splitType: string;
  sessionsPerWeek: number;
  sessionDuration: string;
  intensity: string;
  focusAreas: string[];
  cardioRecommendation: string;
  recoveryNotes: string;
  progressionModel: string;
  notes: string;
}

function TrainingTab({ training }: { training: TrainingProgram }) {
  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}
    >
      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        {[
          { label: "Split Type", value: training.splitType, accent: true },
          { label: "Sessions / Week", value: String(training.sessionsPerWeek), accent: false },
          { label: "Duration", value: training.sessionDuration, accent: false },
          { label: "Intensity", value: training.intensity, accent: false },
        ].map((stat, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "14px",
              padding: "20px",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "8px",
              }}
            >
              {stat.label}
            </span>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: stat.accent ? "18px" : "20px",
                fontWeight: 700,
                color: stat.accent
                  ? "var(--accent-teal)"
                  : "var(--text-primary)",
              }}
            >
              {stat.value}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Focus Areas */}
      <motion.div
        variants={fadeUp}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "16px",
          }}
        >
          Focus Areas
        </h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {training.focusAreas.map((area) => (
            <span
              key={area}
              style={{
                padding: "8px 16px",
                borderRadius: "100px",
                fontSize: "13px",
                fontWeight: 500,
                background: "var(--accent-teal-glow)",
                border: "1px solid rgba(0, 240, 181, 0.2)",
                color: "var(--accent-teal)",
              }}
            >
              {area}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Program Details */}
      <motion.div
        variants={fadeUp}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "16px",
          padding: "24px",
        }}
      >
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "15px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "4px",
          }}
        >
          Program Details
        </h3>
        <DetailRow label="Cardio" value={training.cardioRecommendation} />
        <DetailRow label="Recovery" value={training.recoveryNotes} />
        <DetailRow label="Progression Model" value={training.progressionModel} />
        {training.notes && (
          <div style={{ paddingTop: "12px" }}>
            <span
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-tertiary)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: "6px",
              }}
            >
              Additional Notes
            </span>
            <p
              style={{
                fontSize: "13px",
                lineHeight: 1.6,
                color: "var(--text-secondary)",
              }}
            >
              {training.notes}
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
