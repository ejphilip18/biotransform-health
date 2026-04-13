"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { motion } from "framer-motion";
import { Nav } from "@/components/nav";
import { fadeUp, fadeIn, stagger } from "@/lib/animations";
import { formatDate } from "@/lib/format";

/* ─── Status Helpers ─────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  optimal: "var(--status-optimal)",
  normal: "var(--status-normal)",
  suboptimal: "var(--status-suboptimal)",
  critical: "var(--status-critical)",
};

const STATUS_LABELS: Record<string, string> = {
  optimal: "Optimal",
  normal: "Normal",
  suboptimal: "Suboptimal",
  critical: "Critical",
};

const SEVERITY_STYLES: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  low: {
    bg: "rgba(0, 240, 181, 0.08)",
    border: "rgba(0, 240, 181, 0.25)",
    text: "var(--accent-teal)",
  },
  moderate: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.25)",
    text: "var(--status-suboptimal)",
  },
  high: {
    bg: "rgba(239, 68, 68, 0.08)",
    border: "rgba(239, 68, 68, 0.25)",
    text: "var(--status-critical)",
  },
};

/* ─── Skeleton Components ────────────────────────────────────────── */

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
      style={{
        width,
        height,
        borderRadius,
        background: "var(--bg-tertiary)",
      }}
    />
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "16px",
        padding: "24px",
      }}
    >
      <SkeletonPulse width="40%" height="20px" />
      <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <SkeletonPulse width="100%" height="14px" />
        <SkeletonPulse width="80%" height="14px" />
        <SkeletonPulse width="60%" height="14px" />
      </div>
    </div>
  );
}

/* ─── Processing Spinner ─────────────────────────────────────────── */

function ProcessingSpinner() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 0",
        gap: "24px",
      }}
    >
      <div style={{ position: "relative", width: "80px", height: "80px" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: "3px solid var(--border-subtle)",
            borderTopColor: "var(--accent-teal)",
          }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          style={{
            position: "absolute",
            inset: "8px",
            borderRadius: "50%",
            border: "2px solid var(--border-subtle)",
            borderBottomColor: "var(--accent-teal)",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "18px",
            borderRadius: "50%",
            background: "var(--accent-teal-glow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-teal)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          Analyzing your results…
        </h3>
        <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
          Our AI is reviewing 50+ biomarkers against functional optimal ranges.
          This usually takes 30-60 seconds.
        </p>
      </div>
      <motion.div
        animate={{ width: ["0%", "70%", "85%", "90%"] }}
        transition={{ duration: 15, ease: "easeOut" }}
        style={{
          height: "3px",
          borderRadius: "2px",
          background: "var(--accent-teal)",
          maxWidth: "240px",
          alignSelf: "center",
        }}
      />
    </div>
  );
}

/* ─── Main Page Component ────────────────────────────────────────── */

export default function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const uploadId = id as Id<"bloodworkUploads">;

  const upload = useQuery(api.uploads.getUpload, { uploadId });
  const biomarkers = useQuery(api.biomarkers.getByUpload, { uploadId });
  const genetics = useQuery(api.genetics.getByUpload, { uploadId });
  const healthPlan = useQuery(api.healthPlans.getByUpload, { uploadId });
  const reAnalyze = useMutation(api.uploads.reAnalyze);
  const [reAnalyzing, setReAnalyzing] = useState(false);

  /* Group biomarkers by category */
  const grouped = useMemo(() => {
    if (!biomarkers || biomarkers.length === 0) return {};
    const map: Record<string, typeof biomarkers> = {};
    for (const bm of biomarkers) {
      if (!map[bm.category]) map[bm.category] = [];
      map[bm.category].push(bm);
    }
    return map;
  }, [biomarkers]);

  const categoryOrder = [
    "CBC",
    "CMP",
    "Lipids",
    "Thyroid",
    "Hormones",
    "Vitamins",
    "Minerals",
    "Inflammation",
    "Liver",
    "Kidney",
    "Iron",
    "Metabolic",
  ];
  const sortedCategories = useMemo(() => {
    const keys = Object.keys(grouped);
    return keys.sort((a, b) => {
      const ia = categoryOrder.indexOf(a);
      const ib = categoryOrder.indexOf(b);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grouped]);

  /* ─── Loading State ─────────────────────────────────────── */

  if (upload === undefined) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
        <Nav />
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
          <SkeletonPulse width="200px" height="28px" />
          <div style={{ marginTop: "12px" }}>
            <SkeletonPulse width="300px" height="16px" />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              marginTop: "32px",
            }}
          >
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Not found ─────────────────────────────────────────── */

  if (upload === null) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
        <Nav />
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "120px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--status-critical)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Upload not found
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
              marginTop: "8px",
            }}
          >
            This upload doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              marginTop: "24px",
              padding: "12px 24px",
              borderRadius: "10px",
              background: "var(--accent-teal)",
              color: "var(--bg-primary)",
              fontWeight: 700,
              fontSize: "14px",
              textDecoration: "none",
              fontFamily: "var(--font-display)",
            }}
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  /* ─── Processing / Failed States ────────────────────────── */

  if (upload.status === "pending" || upload.status === "processing") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
        <Nav />
        <div style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 24px" }}>
          <ProcessingSpinner />
        </div>
      </div>
    );
  }

  if (upload.status === "failed") {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
        <Nav />
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "80px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--status-critical)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "22px",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Analysis failed
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "14px",
              marginTop: "8px",
              maxWidth: "400px",
              margin: "8px auto 0",
            }}
          >
            {upload.errorMessage ||
              "Something went wrong during analysis. Please try uploading again."}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "28px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={async () => {
                setReAnalyzing(true);
                try {
                  await reAnalyze({ uploadId });
                } finally {
                  setReAnalyzing(false);
                }
              }}
              disabled={reAnalyzing}
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                background: "var(--accent-teal)",
                color: "var(--bg-primary)",
                fontWeight: 700,
                fontSize: "14px",
                fontFamily: "var(--font-display)",
                border: "none",
                cursor: reAnalyzing ? "not-allowed" : "pointer",
                opacity: reAnalyzing ? 0.7 : 1,
              }}
            >
              {reAnalyzing ? "Re-analyzing…" : "Re-analyze PDF"}
            </button>
            <Link
              href="/dashboard"
              style={{
                padding: "12px 24px",
                borderRadius: "10px",
                border: "1px solid var(--border-medium)",
                color: "var(--text-secondary)",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Complete State — Full Results ─────────────────────── */

  const uploadDate = formatDate(upload.uploadedAt, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const testTypeLabel =
    upload.testType === "bloodwork"
      ? "Blood Panel"
      : upload.testType === "hormone"
        ? "Hormone Panel"
        : "DNA Analysis";

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <Nav />

      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          top: "-20%",
          right: "-10%",
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
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 24px 80px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* ─── Header ──────────────────────────────── */}
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          <motion.div variants={fadeUp}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: "100px",
                  background: "var(--accent-teal-glow)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--accent-teal)",
                }}
              >
                {testTypeLabel}
              </div>
              <div
                style={{
                  padding: "4px 12px",
                  borderRadius: "100px",
                  background: "rgba(34, 197, 94, 0.1)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--status-optimal)",
                }}
              >
                Complete
              </div>
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
              Biomarker Analysis
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "8px",
                fontSize: "14px",
                color: "var(--text-secondary)",
              }}
            >
              <span>{uploadDate}</span>
              {upload.labProvider && (
                <>
                  <span style={{ color: "var(--text-tertiary)" }}>|</span>
                  <span>{upload.labProvider}</span>
                </>
              )}
              <span style={{ color: "var(--text-tertiary)" }}>|</span>
              <span>
                {upload.testType === "dna"
                  ? `${genetics?.length ?? 0} genetic variants`
                  : `${biomarkers?.length ?? 0} biomarkers analyzed`}
              </span>
            </div>
          </motion.div>

          {/* ─── AI Summary ────────────────────────────── */}
          {healthPlan && (
            <motion.div
              variants={fadeUp}
              style={{
                marginTop: "32px",
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
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "var(--accent-teal-glow)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--accent-teal)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                  }}
                >
                  AI Summary
                </h2>
              </div>
              <p
                style={{
                  fontSize: "14px",
                  lineHeight: 1.7,
                  color: "var(--text-secondary)",
                }}
              >
                {healthPlan.summary}
              </p>

              {/* Key Findings */}
              {healthPlan.keyFindings.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Key Findings
                  </h3>
                  <ol
                    style={{
                      listStyle: "none",
                      padding: 0,
                      margin: 0,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {healthPlan.keyFindings.map((finding, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          fontSize: "13px",
                          lineHeight: 1.6,
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span
                          style={{
                            flexShrink: 0,
                            width: "22px",
                            height: "22px",
                            borderRadius: "6px",
                            background: "var(--accent-teal-glow)",
                            color: "var(--accent-teal)",
                            fontSize: "11px",
                            fontWeight: 700,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {i + 1}
                        </span>
                        {finding}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── Risk Areas ────────────────────────────── */}
          {healthPlan && healthPlan.riskAreas.length > 0 && (
            <motion.div variants={fadeUp} style={{ marginTop: "32px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              >
                Risk Areas
              </h2>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                  gap: "16px",
                }}
              >
                {healthPlan.riskAreas.map((risk, i) => {
                  const sev = SEVERITY_STYLES[risk.severity] ?? SEVERITY_STYLES.low;
                  return (
                    <motion.div
                      key={i}
                      variants={fadeUp}
                      style={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "16px",
                        padding: "24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
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
                          {risk.area}
                        </h3>
                        <span
                          style={{
                            padding: "4px 12px",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            background: sev.bg,
                            border: `1px solid ${sev.border}`,
                            color: sev.text,
                          }}
                        >
                          {risk.severity}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "13px",
                          lineHeight: 1.6,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {risk.description}
                      </p>

                      {/* Related biomarkers */}
                      {risk.relatedBiomarkers.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "6px",
                          }}
                        >
                          {risk.relatedBiomarkers.map((bm) => (
                            <span
                              key={bm}
                              style={{
                                padding: "3px 10px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 500,
                                background: "var(--bg-tertiary)",
                                color: "var(--text-secondary)",
                              }}
                            >
                              {bm}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action items */}
                      {risk.actionItems.length > 0 && (
                        <div
                          style={{
                            borderTop: "1px solid var(--border-subtle)",
                            paddingTop: "12px",
                            marginTop: "2px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "var(--text-tertiary)",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              marginBottom: "8px",
                            }}
                          >
                            Action Items
                          </p>
                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: 0,
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px",
                            }}
                          >
                            {risk.actionItems.map((item, j) => (
                              <li
                                key={j}
                                style={{
                                  display: "flex",
                                  alignItems: "flex-start",
                                  gap: "8px",
                                  fontSize: "12px",
                                  lineHeight: 1.5,
                                  color: "var(--text-secondary)",
                                }}
                              >
                                <span
                                  style={{
                                    flexShrink: 0,
                                    marginTop: "3px",
                                    width: "5px",
                                    height: "5px",
                                    borderRadius: "50%",
                                    background: sev.text,
                                  }}
                                />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </motion.div>
          )}

          {/* ─── Genetic Findings (DNA) ───────────────── */}
          {upload.testType === "dna" && genetics && genetics.length > 0 && (
            <motion.div variants={fadeUp} style={{ marginTop: "40px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "20px",
                }}
              >
                Genetic Findings
              </h2>
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                {genetics.map((g) => (
                  <motion.div
                    key={g._id}
                    variants={fadeIn}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "16px",
                      padding: "20px 24px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "12px",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "16px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {g.gene} {g.variant}
                      </span>
                      <span
                        style={{
                          padding: "4px 12px",
                          borderRadius: "100px",
                          fontSize: "11px",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          background:
                            g.riskLevel === "elevated"
                              ? "rgba(239, 68, 68, 0.15)"
                              : g.riskLevel === "average"
                                ? "rgba(59, 130, 246, 0.15)"
                                : "var(--bg-tertiary)",
                          color:
                            g.riskLevel === "elevated"
                              ? "var(--status-critical)"
                              : g.riskLevel === "average"
                                ? "var(--status-normal)"
                                : "var(--text-tertiary)",
                        }}
                      >
                        {g.riskLevel}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                        marginBottom: "8px",
                      }}
                    >
                      {g.interpretation}
                    </p>
                    {g.recommendations.length > 0 && (
                      <ul
                        style={{
                          margin: 0,
                          paddingLeft: "18px",
                          fontSize: "12px",
                          color: "var(--text-tertiary)",
                          lineHeight: 1.6,
                        }}
                      >
                        {g.recommendations.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ─── Biomarker Results Table ───────────────── */}
          {sortedCategories.length > 0 && (
            <motion.div variants={fadeUp} style={{ marginTop: "40px" }}>
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: "20px",
                }}
              >
                Biomarker Results
              </h2>

              <motion.div
                variants={stagger}
                initial="hidden"
                animate="visible"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                {sortedCategories.map((category) => (
                  <motion.div
                    key={category}
                    variants={fadeIn}
                    style={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "16px",
                      overflow: "hidden",
                    }}
                  >
                    {/* Category Header */}
                    <div
                      style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid var(--border-subtle)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                        }}
                      >
                        {category}
                      </h3>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-tertiary)",
                        }}
                      >
                        {grouped[category].length} markers
                      </span>
                    </div>

                    {/* Table Header */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1.5fr 100px",
                        padding: "10px 24px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "var(--text-tertiary)",
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <span>Biomarker</span>
                      <span>Value</span>
                      <span>Unit</span>
                      <span>Optimal Range</span>
                      <span style={{ textAlign: "right" }}>Status</span>
                    </div>

                    {/* Rows */}
                    {grouped[category].map((bm, idx) => (
                      <div
                        key={bm._id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1.5fr 100px",
                          padding: "14px 24px",
                          fontSize: "13px",
                          alignItems: "center",
                          borderBottom:
                            idx < grouped[category].length - 1
                              ? "1px solid var(--border-subtle)"
                              : "none",
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.02)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <span
                          style={{
                            fontWeight: 500,
                            color: "var(--text-primary)",
                          }}
                        >
                          {bm.biomarker}
                        </span>
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: "var(--font-display)",
                            color: STATUS_COLORS[bm.status],
                          }}
                        >
                          {bm.value}
                        </span>
                        <span style={{ color: "var(--text-tertiary)" }}>
                          {bm.unit}
                        </span>
                        <span style={{ color: "var(--text-secondary)" }}>
                          {bm.optimalRangeLow} – {bm.optimalRangeHigh}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "6px",
                          }}
                        >
                          <div
                            style={{
                              width: "7px",
                              height: "7px",
                              borderRadius: "50%",
                              background: STATUS_COLORS[bm.status],
                              boxShadow: `0 0 6px ${STATUS_COLORS[bm.status]}`,
                            }}
                          />
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              color: STATUS_COLORS[bm.status],
                            }}
                          >
                            {STATUS_LABELS[bm.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* ─── Action Buttons ────────────────────────── */}
          <motion.div
            variants={fadeUp}
            style={{
              marginTop: "40px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={async () => {
                setReAnalyzing(true);
                try {
                  await reAnalyze({ uploadId });
                } finally {
                  setReAnalyzing(false);
                }
              }}
              disabled={reAnalyzing}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "12px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-secondary)",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                cursor: reAnalyzing ? "not-allowed" : "pointer",
                opacity: reAnalyzing ? 0.7 : 1,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              {reAnalyzing ? "Re-analyzing…" : "Re-analyze PDF"}
            </button>
            <Link
              href={`/report/${id}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "12px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-medium)",
                color: "var(--text-primary)",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
                fontFamily: "var(--font-display)",
                transition: "opacity 0.15s ease, transform 0.15s ease",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Generate PDF Report
            </Link>
            <Link
              href="/plan"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "12px",
                background: "var(--accent-teal)",
                color: "var(--bg-primary)",
                fontSize: "14px",
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: "var(--font-display)",
                transition: "opacity 0.15s ease, transform 0.15s ease",
              }}
            >
              View Health Plan
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
