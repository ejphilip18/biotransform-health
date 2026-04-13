"use client";

import { use, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/nav";
import { fadeUp, fadeIn, stagger } from "@/lib/animations";
import { formatDate } from "@/lib/format";

/* ─── Status Helpers ──────────────────────────────────────────────── */

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

const PDF_STATUS_COLORS: Record<string, string> = {
  optimal: "#22C55E",
  normal: "#3B82F6",
  suboptimal: "#F59E0B",
  critical: "#EF4444",
};

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string }> = {
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

/* ─── Skeleton ────────────────────────────────────────────────────── */

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

/* ─── Styles ──────────────────────────────────────────────────────── */

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "16px",
  padding: "24px",
};

/* ─── Loading ─────────────────────────────────────────────────────── */

function ReportLoading() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <Nav />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 24px" }}>
        <SkeletonPulse width="280px" height="28px" />
        <div style={{ marginTop: "8px" }}>
          <SkeletonPulse width="200px" height="14px" />
        </div>
        <div style={{ marginTop: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <SkeletonPulse width="100%" height="200px" borderRadius="16px" />
          <SkeletonPulse width="100%" height="300px" borderRadius="16px" />
          <SkeletonPulse width="100%" height="200px" borderRadius="16px" />
        </div>
      </div>
    </div>
  );
}

/* ─── Error State ─────────────────────────────────────────────────── */

function ReportError({ message }: { message: string }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <Nav />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px",
          textAlign: "center",
        }}
      >
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--status-critical)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: "8px" }}>
            Report Not Found
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-tertiary)", maxWidth: "360px", marginBottom: "24px" }}>
            {message}
          </p>
          <Link
            href="/dashboard"
            style={{
              display: "inline-block",
              padding: "10px 24px",
              borderRadius: "10px",
              background: "var(--accent-teal)",
              color: "var(--bg-primary)",
              fontSize: "14px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Back to Dashboard
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Preview Sections ────────────────────────────────────────────── */

function ComparisonPreview({
  currentLabDate,
  previousLabDate,
  currentBiomarkers,
  previousBiomarkers,
}: {
  currentLabDate: string;
  previousLabDate: string;
  currentBiomarkers: Array<{ biomarker: string; value: number; unit: string; status: string }>;
  previousBiomarkers: Array<{ biomarker: string; value: number; unit: string }>;
}) {
  const prevMap = new Map(previousBiomarkers.map((b) => [b.biomarker, b]));
  const rows = currentBiomarkers
    .map((curr) => {
      const prev = prevMap.get(curr.biomarker);
      if (!prev || prev.unit !== curr.unit) return null;
      const delta = curr.value - prev.value;
      const pct = prev.value !== 0 ? ((delta / prev.value) * 100).toFixed(1) : null;
      let dir: "improved" | "worsened" | "stable" = "stable";
      if (Math.abs(delta) > 0.01) dir = delta < 0 ? "improved" : "worsened";
      return { biomarker: curr.biomarker, unit: curr.unit, before: prev.value, after: curr.value, delta, pct, dir };
    })
    .filter(Boolean) as Array<{ biomarker: string; unit: string; before: number; after: number; delta: number; pct: string | null; dir: string }>;

  if (rows.length === 0) return null;

  return (
    <motion.div custom={0.5} variants={fadeUp} style={cardStyle}>
      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: "8px" }}>
        Change Since Last Test
      </h3>
      <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "16px" }}>
        {previousLabDate} → {currentLabDate}
      </p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>Biomarker</th>
              <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>Before</th>
              <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>After</th>
              <th style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)" }}>Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 10).map((r) => (
              <tr key={r.biomarker} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                <td style={{ padding: "10px 12px", fontSize: "13px", color: "var(--text-primary)", fontWeight: 500 }}>{r.biomarker}</td>
                <td style={{ padding: "10px 12px", fontSize: "13px", color: "var(--text-secondary)" }}>{r.before} {r.unit}</td>
                <td style={{ padding: "10px 12px", fontSize: "13px", color: "var(--text-secondary)" }}>{r.after} {r.unit}</td>
                <td style={{ padding: "10px 12px", fontSize: "13px", color: r.dir === "improved" ? "var(--status-optimal)" : r.dir === "worsened" ? "var(--status-suboptimal)" : "var(--text-tertiary)" }}>
                  {r.pct ? `${r.delta > 0 ? "+" : ""}${r.pct}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

function CoverPreview({
  upload,
  profile,
  hasComparison,
}: {
  upload: { labDate: string; labProvider?: string; testType: string };
  profile: { dateOfBirth?: string; biologicalSex?: string } | null;
  hasComparison?: boolean;
}) {
  return (
    <motion.div
      custom={0}
      variants={fadeUp}
      style={{
        ...cardStyle,
        textAlign: "center",
        padding: "48px 24px",
        background: "var(--bg-card)",
        border: "1px solid rgba(0, 240, 181, 0.15)",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "16px",
          background: "var(--accent-teal)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 16px",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
      <h2
        style={{
          fontSize: "22px",
          fontWeight: 800,
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          letterSpacing: "-0.02em",
          marginBottom: "8px",
        }}
      >
        60-Day Health Plan
      </h2>
      <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "4px" }}>
        {upload.testType.charAt(0).toUpperCase() + upload.testType.slice(1)} · Your personalized roadmap to target change
      </p>
      {hasComparison && (
        <span
          style={{
            display: "inline-block",
            marginTop: "8px",
            fontSize: "12px",
            padding: "4px 12px",
            borderRadius: "100px",
            background: "rgba(0, 240, 181, 0.15)",
            color: "var(--accent-teal)",
            fontWeight: 600,
          }}
        >
          Includes comparison to previous test
        </span>
      )}
      <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "16px" }}>
        <div>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Lab Date</span>
          <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, margin: "2px 0 0" }}>{upload.labDate}</p>
        </div>
        {upload.labProvider && (
          <div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Provider</span>
            <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, margin: "2px 0 0" }}>{upload.labProvider}</p>
          </div>
        )}
        {profile?.biologicalSex && (
          <div>
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sex</span>
            <p style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: 600, margin: "2px 0 0" }}>
              {profile.biologicalSex.charAt(0).toUpperCase() + profile.biologicalSex.slice(1)}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const TEST_TYPE_LABELS: Record<string, string> = {
  bloodwork: "Bloodwork",
  hormone: "Hormones",
  dna: "DNA",
};

function ComparisonSelector({
  comparableUploads,
  selectedId,
  onSelect,
  currentLabDate,
}: {
  comparableUploads: Array<{ _id: Id<"bloodworkUploads">; labDate: string; testType: string; labProvider?: string }>;
  selectedId?: Id<"bloodworkUploads">;
  onSelect: (id: Id<"bloodworkUploads">) => void;
  currentLabDate: string;
}) {
  return (
    <motion.div
      custom={0.4}
      variants={fadeUp}
      style={{
        ...cardStyle,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
          Compare to baseline:
        </span>
        <select
          value={selectedId ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v) onSelect(v as Id<"bloodworkUploads">);
          }}
          style={{
            flex: "1 1 200px",
            minWidth: "200px",
            maxWidth: "320px",
            padding: "8px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border-medium)",
            background: "var(--bg-secondary)",
            color: "var(--text-primary)",
            fontSize: "14px",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          {!selectedId && <option value="">Select previous test…</option>}
          {comparableUploads.map((u) => (
            <option key={u._id} value={u._id}>
              {TEST_TYPE_LABELS[u.testType] ?? u.testType} · {u.labDate}
              {u.labProvider ? ` (${u.labProvider})` : ""}
            </option>
          ))}
        </select>
      </div>
      {selectedId && (
        <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
          Track progress to {currentLabDate}
        </span>
      )}
    </motion.div>
  );
}

function DataSourcesCallout({ sources }: { sources: Array<{ testType: string; labDate: string }> }) {
  if (sources.length === 0) return null;
  return (
    <motion.div
      custom={0.5}
      variants={fadeUp}
      style={{
        ...cardStyle,
        background: "rgba(0, 240, 181, 0.06)",
        border: "1px solid rgba(0, 240, 181, 0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div
          style={{
            width: "24px",
            height: "24px",
            borderRadius: "8px",
            background: "var(--accent-teal-glow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
            Combined lab data
          </h4>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5, margin: "0 0 8px" }}>
            This plan uses your combined biomarkers from all uploads — bloodwork, DNA, and hormones together.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {sources.map((s, i) => (
              <span
                key={`${s.testType}-${s.labDate}-${i}`}
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontWeight: 500,
                }}
              >
                {TEST_TYPE_LABELS[s.testType] ?? s.testType} · {s.labDate}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BiomarkerTablePreview({
  biomarkers,
  showSource,
}: {
  biomarkers: Array<{
    _id: string;
    biomarker: string;
    category: string;
    value: number;
    unit: string;
    referenceRangeLow: number;
    referenceRangeHigh: number;
    status: string;
    source?: { testType: string; labDate: string } | null;
  }>;
  showSource?: boolean;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof biomarkers>();
    for (const bm of biomarkers) {
      const existing = map.get(bm.category) ?? [];
      existing.push(bm);
      map.set(bm.category, existing);
    }
    return Array.from(map.entries());
  }, [biomarkers]);

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "8px 12px",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border-subtle)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "13px",
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-subtle)",
  };

  return (
    <motion.div custom={1} variants={fadeUp} style={cardStyle}>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          marginBottom: "16px",
        }}
      >
        Biomarker Results
      </h3>
      {showSource && (
        <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "16px" }}>
          Combined from all your lab uploads (bloodwork, DNA, hormones). Latest value per biomarker.
        </p>
      )}

      {grouped.map(([category, markers]) => (
        <div key={category} style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-teal)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {category}
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Biomarker</th>
                  <th style={thStyle}>Value</th>
                  <th style={thStyle}>Reference Range</th>
                  {showSource && <th style={thStyle}>Source</th>}
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {markers.map((bm) => (
                  <tr key={bm._id}>
                    <td style={{ ...tdStyle, color: "var(--text-primary)", fontWeight: 500 }}>{bm.biomarker}</td>
                    <td style={tdStyle}>
                      {bm.value} {bm.unit}
                    </td>
                    <td style={tdStyle}>
                      {bm.referenceRangeLow} - {bm.referenceRangeHigh} {bm.unit}
                    </td>
                    {showSource && (
                      <td style={tdStyle}>
                        {bm.source ? `${TEST_TYPE_LABELS[bm.source.testType] ?? bm.source.testType} (${bm.source.labDate})` : "—"}
                      </td>
                    )}
                    <td style={tdStyle}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: STATUS_COLORS[bm.status] ?? "var(--text-tertiary)",
                        }}
                      >
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: STATUS_COLORS[bm.status] ?? "var(--text-tertiary)",
                          }}
                        />
                        {STATUS_LABELS[bm.status] ?? bm.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {biomarkers.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--text-tertiary)", textAlign: "center", padding: "24px" }}>
          No biomarker data available.
        </p>
      )}
    </motion.div>
  );
}

const RISK_LEVEL_COLORS: Record<string, string> = {
  elevated: "var(--status-critical)",
  average: "var(--status-normal)",
  reduced: "var(--status-optimal)",
  unknown: "var(--text-tertiary)",
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  pathogenic: "Pathogenic",
  likely_pathogenic: "Likely Pathogenic",
  vus: "VUS",
  likely_benign: "Likely Benign",
  benign: "Benign",
};

function GeneticFindingsPreview({
  genetics,
}: {
  genetics: Array<{
    _id: string;
    gene: string;
    variant: string;
    zygosity: string;
    classification: string;
    diseaseCategory: string;
    riskLevel: string;
    interpretation: string;
    recommendations: string[];
  }>;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, typeof genetics>();
    for (const g of genetics) {
      const cat = g.diseaseCategory.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const existing = map.get(cat) ?? [];
      existing.push(g);
      map.set(cat, existing);
    }
    return Array.from(map.entries());
  }, [genetics]);

  const tdStyle: React.CSSProperties = {
    padding: "10px 12px",
    fontSize: "13px",
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-subtle)",
  };

  return (
    <motion.div custom={1.5} variants={fadeUp} style={cardStyle}>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          marginBottom: "16px",
        }}
      >
        Genetic Findings
      </h3>
      <p style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "16px" }}>
        Variants from your DNA report. Discuss pathogenic or VUS findings with a genetic counselor.
      </p>

      {grouped.map(([category, markers]) => (
        <div key={category} style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-teal)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {category}
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ ...tdStyle, textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Gene</th>
                  <th style={{ ...tdStyle, textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Variant</th>
                  <th style={{ ...tdStyle, textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Zygosity</th>
                  <th style={{ ...tdStyle, textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Classification</th>
                  <th style={{ ...tdStyle, textAlign: "left", fontSize: "11px", fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Risk</th>
                </tr>
              </thead>
              <tbody>
                {markers.map((g) => (
                  <tr key={g._id}>
                    <td style={{ ...tdStyle, color: "var(--text-primary)", fontWeight: 500 }}>{g.gene}</td>
                    <td style={tdStyle}>{g.variant}</td>
                    <td style={tdStyle}>{g.zygosity.replace(/_/g, " ")}</td>
                    <td style={tdStyle}>{CLASSIFICATION_LABELS[g.classification] ?? g.classification}</td>
                    <td style={{ ...tdStyle, color: RISK_LEVEL_COLORS[g.riskLevel] ?? "var(--text-secondary)", fontWeight: 600 }}>
                      {g.riskLevel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {markers.some((g) => g.interpretation || g.recommendations?.length) && (
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {markers.map((g) => (
                <div
                  key={g._id}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "8px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>
                    {g.gene} {g.variant}
                  </div>
                  {g.interpretation && (
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "0 0 4px", lineHeight: 1.4 }}>
                      {g.interpretation}
                    </p>
                  )}
                  {g.recommendations?.length > 0 && (
                    <ul style={{ margin: 0, paddingLeft: "16px", fontSize: "11px", color: "var(--text-tertiary)" }}>
                      {g.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {genetics.length === 0 && (
        <p style={{ fontSize: "13px", color: "var(--text-tertiary)", textAlign: "center", padding: "24px" }}>
          No genetic data available.
        </p>
      )}
    </motion.div>
  );
}

function KeyFindingsPreview({
  plan,
}: {
  plan: {
    keyFindings: string[];
    riskAreas: Array<{
      area: string;
      severity: string;
      description: string;
      relatedBiomarkers: string[];
      actionItems: string[];
    }>;
  };
}) {
  return (
    <motion.div custom={2} variants={fadeUp} style={cardStyle}>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          marginBottom: "16px",
        }}
      >
        Key Findings
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
        {plan.keyFindings.map((finding, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              gap: "12px",
              padding: "12px 16px",
              borderRadius: "10px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                background: "var(--accent-teal-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-teal)" }}>{i + 1}</span>
            </div>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{finding}</p>
          </div>
        ))}
      </div>

      {plan.riskAreas.length > 0 && (
        <>
          <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
            Risk Areas
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {plan.riskAreas.map((risk, i) => {
              const style = SEVERITY_STYLES[risk.severity] ?? SEVERITY_STYLES.low;
              return (
                <div
                  key={i}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    background: style.bg,
                    border: `1px solid ${style.border}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: style.text }}>{risk.area}</span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        background: `${style.border}`,
                        color: style.text,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                    {risk.description}
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}

function SupplementPreview({
  supplements,
}: {
  supplements: Array<{
    name: string;
    dosage: string;
    form: string;
    timing: string;
    purpose: string;
    duration: string;
  }>;
}) {
  return (
    <motion.div custom={3} variants={fadeUp} style={cardStyle}>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          marginBottom: "16px",
        }}
      >
        Supplement Protocol
      </h3>

      {supplements.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-tertiary)", textAlign: "center" }}>No supplements recommended.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
          {supplements.map((supp, i) => (
            <div
              key={i}
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "var(--accent-teal)",
                  }}
                />
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{supp.name}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Dosage:</span>{" "}
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{supp.dosage}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Form:</span>{" "}
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{supp.form}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Timing:</span>{" "}
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{supp.timing}</span>
                </div>
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>Duration:</span>{" "}
                  <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>{supp.duration}</span>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: "8px 0 0", lineHeight: 1.5 }}>
                {supp.purpose}
              </p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function NutritionPreview({
  nutrition,
}: {
  nutrition: {
    dailyCalories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
    keyFoods: string[];
    avoidFoods: string[];
    mealTiming: string;
    hydration: string;
    notes: string;
  };
}) {
  return (
    <motion.div custom={4} variants={fadeUp} style={cardStyle}>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          marginBottom: "16px",
        }}
      >
        Nutrition Framework
      </h3>

      {/* Macros */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
        {[
          { label: "Calories", value: `${nutrition.dailyCalories}`, unit: "kcal", color: "var(--accent-teal)" },
          { label: "Protein", value: `${nutrition.proteinGrams}`, unit: "g", color: "var(--status-normal)" },
          { label: "Carbs", value: `${nutrition.carbGrams}`, unit: "g", color: "var(--status-suboptimal)" },
          { label: "Fat", value: `${nutrition.fatGrams}`, unit: "g", color: "var(--status-critical)" },
        ].map((macro) => (
          <div
            key={macro.label}
            style={{
              padding: "14px",
              borderRadius: "12px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {macro.label}
            </span>
            <p style={{ fontSize: "22px", fontWeight: 800, color: macro.color, fontFamily: "var(--font-display)", margin: "4px 0 0" }}>
              {macro.value}
              <span style={{ fontSize: "12px", fontWeight: 400, color: "var(--text-tertiary)" }}> {macro.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Foods */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--status-optimal)", marginBottom: "8px" }}>Key Foods</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {nutrition.keyFoods.map((food, i) => (
              <span
                key={i}
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(34, 197, 94, 0.1)",
                  color: "var(--status-optimal)",
                  fontWeight: 500,
                }}
              >
                {food}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--status-critical)", marginBottom: "8px" }}>Avoid</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            {nutrition.avoidFoods.map((food, i) => (
              <span
                key={i}
                style={{
                  fontSize: "12px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "var(--status-critical)",
                  fontWeight: 500,
                }}
              >
                {food}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        <p style={{ margin: "0 0 4px" }}><strong style={{ color: "var(--text-primary)" }}>Meal Timing:</strong> {nutrition.mealTiming}</p>
        <p style={{ margin: "0 0 4px" }}><strong style={{ color: "var(--text-primary)" }}>Hydration:</strong> {nutrition.hydration}</p>
        {nutrition.notes && <p style={{ margin: 0 }}><strong style={{ color: "var(--text-primary)" }}>Notes:</strong> {nutrition.notes}</p>}
      </div>
    </motion.div>
  );
}

function TrainingPreview({
  training,
}: {
  training: {
    splitType: string;
    sessionsPerWeek: number;
    sessionDuration: string;
    intensity: string;
    focusAreas: string[];
    cardioRecommendation: string;
    recoveryNotes: string;
    progressionModel: string;
    notes: string;
  };
}) {
  return (
    <motion.div custom={5} variants={fadeUp} style={cardStyle}>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: "var(--text-primary)",
          fontFamily: "var(--font-display)",
          marginBottom: "16px",
        }}
      >
        Training Program
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px", marginBottom: "16px" }}>
        {[
          { label: "Split", value: training.splitType },
          { label: "Frequency", value: `${training.sessionsPerWeek}x/week` },
          { label: "Duration", value: training.sessionDuration },
          { label: "Intensity", value: training.intensity },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {item.label}
            </span>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", margin: "4px 0 0" }}>{item.value}</p>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: "12px" }}>
        <h4 style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>Focus Areas</h4>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {training.focusAreas.map((area, i) => (
            <span
              key={i}
              style={{
                fontSize: "12px",
                padding: "4px 10px",
                borderRadius: "6px",
                background: "var(--accent-teal-glow)",
                color: "var(--accent-teal)",
                fontWeight: 500,
              }}
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
        <p style={{ margin: "0 0 4px" }}><strong style={{ color: "var(--text-primary)" }}>Cardio:</strong> {training.cardioRecommendation}</p>
        <p style={{ margin: "0 0 4px" }}><strong style={{ color: "var(--text-primary)" }}>Recovery:</strong> {training.recoveryNotes}</p>
        <p style={{ margin: "0 0 4px" }}><strong style={{ color: "var(--text-primary)" }}>Progression:</strong> {training.progressionModel}</p>
        {training.notes && <p style={{ margin: 0 }}><strong style={{ color: "var(--text-primary)" }}>Notes:</strong> {training.notes}</p>}
      </div>
    </motion.div>
  );
}

function DisclaimerPreview() {
  return (
    <motion.div
      custom={6}
      variants={fadeUp}
      style={{
        ...cardStyle,
        background: "var(--bg-secondary)",
        border: "1px solid rgba(245, 158, 11, 0.2)",
      }}
    >
      <div style={{ display: "flex", gap: "12px" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--status-suboptimal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "2px" }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--status-suboptimal)", marginBottom: "6px" }}>
            Medical Disclaimer
          </h4>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", lineHeight: 1.7, margin: 0 }}>
            This report is generated by AI analysis and is intended for informational purposes only.
            It does not constitute medical advice, diagnosis, or treatment. Always consult with a qualified
            healthcare professional before making changes to your diet, supplement regimen, or exercise program.
            BioTransform is not responsible for any health outcomes resulting from following these recommendations.
            If you experience any adverse effects, discontinue use and seek medical attention immediately.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── PDF Generation (60-Day Plan, max 5 pages) ───────────────────── */

type BiomarkerRow = {
  biomarker: string;
  category: string;
  value: number;
  unit: string;
  referenceRangeLow: number;
  referenceRangeHigh: number;
  optimalRangeLow?: number;
  optimalRangeHigh?: number;
  status: string;
  interpretation?: string;
};

type ComparisonRow = {
  biomarker: string;
  unit: string;
  before: number;
  after: number;
  delta: number;
  pctChange: number | null;
  direction: "improved" | "worsened" | "stable";
};

type GeneticRow = {
  _id: string;
  gene: string;
  variant: string;
  zygosity: string;
  classification: string;
  diseaseCategory: string;
  riskLevel: string;
  interpretation: string;
  recommendations: string[];
};

async function generatePDF({
  upload,
  biomarkers,
  genetics,
  plan,
  profile,
  previousUpload,
  previousBiomarkers,
  sources,
}: {
  upload: { labDate: string; labProvider?: string; testType: string };
  biomarkers: BiomarkerRow[];
  genetics?: GeneticRow[];
  plan: {
    summary: string;
    keyFindings: string[];
    riskAreas: Array<{
      area: string;
      severity: string;
      description: string;
      relatedBiomarkers: string[];
      actionItems: string[];
    }>;
    supplements: Array<{
      name: string;
      dosage: string;
      form: string;
      timing: string;
      purpose: string;
      duration: string;
      interactions: string;
    }>;
    nutritionPlan: {
      dailyCalories: number;
      proteinGrams: number;
      carbGrams: number;
      fatGrams: number;
      keyFoods: string[];
      avoidFoods: string[];
      mealTiming: string;
      hydration: string;
      notes: string;
    };
    trainingProgram: {
      splitType: string;
      sessionsPerWeek: number;
      sessionDuration: string;
      intensity: string;
      focusAreas: string[];
      cardioRecommendation: string;
      recoveryNotes: string;
      progressionModel: string;
      notes: string;
    };
  };
  profile: { dateOfBirth?: string; biologicalSex?: string; height?: number; weight?: number } | null;
  previousUpload?: { labDate: string };
  previousBiomarkers?: BiomarkerRow[];
  sources?: Array<{ testType: string; labDate: string }>;
}) {
  const { pdf, Document, Page, Text, View, StyleSheet } = await import("@react-pdf/renderer");
  const { createElement } = await import("react");
  const h = createElement;

  // Build comparison rows when previous upload exists
  const prevMap = new Map<string, BiomarkerRow>();
  for (const b of previousBiomarkers ?? []) prevMap.set(b.biomarker, b);
  const comparisonRows: ComparisonRow[] = [];
  for (const curr of biomarkers) {
    const prev = prevMap.get(curr.biomarker);
    if (!prev || prev.unit !== curr.unit) continue;
    const delta = curr.value - prev.value;
    const pctChange = prev.value !== 0 ? (delta / prev.value) * 100 : null;
    let direction: ComparisonRow["direction"] = "stable";
    if (Math.abs(delta) > 0.01) {
      direction = delta < 0 ? "improved" : "worsened";
      if (curr.optimalRangeLow != null && curr.optimalRangeHigh != null) {
        const wasInRange = prev.value >= curr.optimalRangeLow && prev.value <= curr.optimalRangeHigh;
        const nowInRange = curr.value >= curr.optimalRangeLow && curr.value <= curr.optimalRangeHigh;
        if (!wasInRange && nowInRange) direction = "improved";
        else if (wasInRange && !nowInRange) direction = "worsened";
      }
    }
    comparisonRows.push({
      biomarker: curr.biomarker,
      unit: curr.unit,
      before: prev.value,
      after: curr.value,
      delta,
      pctChange,
      direction,
    });
  }

  const s = StyleSheet.create({
    page: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#0B0B12", color: "#F0F0F5" },
    coverPage: { padding: 40, fontFamily: "Helvetica", backgroundColor: "#0B0B12", color: "#F0F0F5", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" },
    coverTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#00F0B5", marginBottom: 8, textAlign: "center" },
    coverSubtitle: { fontSize: 14, color: "#A0A0B8", marginBottom: 12, textAlign: "center" },
    coverMeta: { fontSize: 11, color: "#6B6B80", textAlign: "center", marginBottom: 4 },
    sectionTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#00F0B5", marginBottom: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)", paddingBottom: 6 },
    subTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#F0F0F5", marginBottom: 6, marginTop: 10 },
    text: { fontSize: 9, color: "#A0A0B8", lineHeight: 1.5, marginBottom: 4 },
    textPrimary: { fontSize: 9, color: "#F0F0F5", lineHeight: 1.5, marginBottom: 4 },
    tableHeader: { flexDirection: "row", backgroundColor: "#1A1A2E", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.1)", paddingVertical: 5, paddingHorizontal: 6 },
    tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", paddingVertical: 4, paddingHorizontal: 6 },
    thCell: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#6B6B80", textTransform: "uppercase" },
    tdCell: { fontSize: 8, color: "#A0A0B8" },
    tdCellPrimary: { fontSize: 8, color: "#F0F0F5", fontFamily: "Helvetica-Bold" },
    card: { backgroundColor: "#16162A", borderRadius: 6, padding: 10, marginBottom: 6 },
    tag: { fontSize: 8, paddingVertical: 2, paddingHorizontal: 5, borderRadius: 4, marginRight: 4, marginBottom: 3 },
    disclaimer: { backgroundColor: "#1A1A2E", borderRadius: 8, padding: 12, borderLeftWidth: 3, borderLeftColor: "#F59E0B" },
    disclaimerTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#F59E0B", marginBottom: 6 },
    disclaimerText: { fontSize: 8, color: "#6B6B80", lineHeight: 1.6 },
    footer: { position: "absolute", bottom: 16, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7, color: "#6B6B80" },
  });

  const dateStr = formatDate(new Date(), { year: "numeric", month: "long", day: "numeric" });
  const concernsBiomarkers = biomarkers.filter((b) => b.status === "suboptimal" || b.status === "critical");

  const doc = h(
    Document,
    {},

    // Page 1: Cover — 60-Day Plan
    h(
      Page,
      { size: "A4", style: s.coverPage },
      h(View, { style: { alignItems: "center", marginTop: 120 } },
        h(Text, { style: s.coverTitle }, "BioTransform"),
        h(Text, { style: { fontSize: 20, color: "#00F0B5", marginBottom: 8, textAlign: "center", fontFamily: "Helvetica-Bold" } }, "60-Day Health Plan"),
        h(Text, { style: s.coverSubtitle }, "Your personalized roadmap to target change"),
        h(Text, { style: s.coverSubtitle }, `${upload.testType.charAt(0).toUpperCase() + upload.testType.slice(1)} · Lab: ${upload.labDate}`),
        upload.labProvider ? h(Text, { style: s.coverMeta }, upload.labProvider) : null,
        profile?.biologicalSex ? h(Text, { style: s.coverMeta }, profile.biologicalSex.charAt(0).toUpperCase() + profile.biologicalSex.slice(1)) : null,
        h(Text, { style: { ...s.coverMeta, marginTop: 12 } }, `Generated: ${dateStr}`)
      ),
      h(View, { style: s.footer }, h(Text, {}, "60-Day Plan"), h(Text, {}, "Page 1"))
    ),

    // Page 2: Areas of Concern — grounded, actionable
    h(
      Page,
      { size: "A4", style: s.page },
      sources && sources.length > 0
        ? h(Text, { style: { ...s.text, marginBottom: 8 } }, `This plan uses your combined lab data: ${sources.map((s) => `${s.testType} (${s.labDate})`).join(", ")}.`)
        : null,
      h(Text, { style: s.sectionTitle }, "Areas of Concern"),
      h(Text, { style: s.text }, "Based on your lab results, these are the key areas to focus on over the next 60 days. Each ties directly to your biomarkers and daily life."),
      ...plan.riskAreas.slice(0, 5).map((risk, i) =>
        h(View, {
          key: `r-${i}`,
          style: {
            ...s.card,
            borderLeftWidth: 3,
            borderLeftColor: risk.severity === "high" ? "#EF4444" : risk.severity === "moderate" ? "#F59E0B" : "#00F0B5",
          },
        },
          h(Text, { style: { ...s.tdCellPrimary, fontSize: 10 } }, risk.area),
          h(Text, { style: s.text }, risk.description),
          risk.actionItems.length > 0
            ? h(View, { style: { marginTop: 4 } },
                ...risk.actionItems.slice(0, 2).map((a, j) =>
                  h(Text, { key: j, style: { ...s.text, marginLeft: 8 } }, `• ${a}`)
                ))
            : null
        )
      ),
      concernsBiomarkers.length > 0
        ? h(View, { style: { marginTop: 12 } },
            h(Text, { style: s.subTitle }, "Biomarkers to Watch"),
            ...concernsBiomarkers.slice(0, 8).map((bm, i) =>
              h(View, { key: `bm-${i}`, style: { ...s.tableRow, backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" } },
                h(Text, { style: { ...s.tdCellPrimary, width: "35%" } }, bm.biomarker),
                h(Text, { style: { ...s.tdCell, width: "20%" } }, `${bm.value} ${bm.unit}`),
                h(Text, { style: { ...s.tdCell, width: "25%" } }, `Optimal: ${bm.referenceRangeLow}–${bm.referenceRangeHigh}`),
                h(Text, { style: { fontSize: 8, color: PDF_STATUS_COLORS[bm.status], width: "20%" } }, bm.status)
              )
            ))
        : null,
      genetics && genetics.length > 0
        ? h(View, { style: { marginTop: 12 } },
            h(Text, { style: s.subTitle }, "Genetic Findings"),
            ...genetics.slice(0, 6).map((g, i) =>
              h(View, { key: `g-${i}`, style: { ...s.card, flexDirection: "column" } },
                h(Text, { style: { ...s.tdCellPrimary, fontSize: 10 } }, `${g.gene} ${g.variant}`),
                h(Text, { style: s.text }, `${g.zygosity.replace(/_/g, " ")} · ${g.classification} · ${g.riskLevel} risk`),
                g.interpretation ? h(Text, { style: s.text }, g.interpretation) : null,
                g.recommendations?.length > 0
                  ? h(Text, { style: { ...s.text, fontSize: 8, color: "#F59E0B", marginTop: 2 } }, `→ ${g.recommendations[0]}`)
                  : null
              )
            ))
        : null,
      h(View, { style: s.footer }, h(Text, {}, "60-Day Plan"), h(Text, {}, "Page 2"))
    ),

    // Page 3: Plan of Action — Supplements
    h(
      Page,
      { size: "A4", style: s.page },
      h(Text, { style: s.sectionTitle }, "Plan of Action: Supplements"),
      h(Text, { style: s.text }, "Take these consistently for 60 days. Retest after to measure change."),
      ...plan.supplements.map((supp, i) =>
        h(View, { key: `s-${i}`, style: { ...s.card, flexDirection: "column" } },
          h(Text, { style: { ...s.tdCellPrimary, fontSize: 10 } }, supp.name),
          h(Text, { style: s.text }, `${supp.dosage} · ${supp.timing}`),
          h(Text, { style: s.text }, supp.purpose),
          supp.interactions ? h(Text, { style: { ...s.text, fontSize: 8, color: "#F59E0B", marginTop: 2 } }, `Note: ${supp.interactions}`) : null
        )
      ),
      h(View, { style: s.footer }, h(Text, {}, "60-Day Plan"), h(Text, {}, "Page 3"))
    ),

    // Page 4: Plan of Action — Nutrition + Exercise
    h(
      Page,
      { size: "A4", style: s.page },
      h(Text, { style: s.sectionTitle }, "Plan of Action: Nutrition & Exercise"),
      h(Text, { style: s.subTitle }, "Nutrition"),
      h(Text, { style: s.text }, `Target: ${plan.nutritionPlan.dailyCalories} kcal · P: ${plan.nutritionPlan.proteinGrams}g C: ${plan.nutritionPlan.carbGrams}g F: ${plan.nutritionPlan.fatGrams}g`),
      h(Text, { style: s.text }, `Eat: ${plan.nutritionPlan.keyFoods.join(", ")}`),
      plan.nutritionPlan.avoidFoods.length > 0
        ? h(Text, { style: s.text }, `Limit: ${plan.nutritionPlan.avoidFoods.join(", ")}`)
        : null,
      h(Text, { style: s.text }, `${plan.nutritionPlan.mealTiming} · ${plan.nutritionPlan.hydration}`),
      h(Text, { style: s.subTitle }, "Exercise"),
      h(Text, { style: s.text }, `${plan.trainingProgram.splitType} · ${plan.trainingProgram.sessionsPerWeek}x/week · ${plan.trainingProgram.sessionDuration}`),
      h(Text, { style: s.text }, `Focus: ${plan.trainingProgram.focusAreas.join(", ")}`),
      h(Text, { style: s.text }, `Cardio: ${plan.trainingProgram.cardioRecommendation}`),
      h(Text, { style: s.text }, `Recovery: ${plan.trainingProgram.recoveryNotes}`),
      h(View, { style: s.footer }, h(Text, {}, "60-Day Plan"), h(Text, {}, "Page 4"))
    ),

    // Page 5: Comparison (if previous) + Disclaimer
    h(
      Page,
      { size: "A4", style: s.page },
      previousUpload && comparisonRows.length > 0
        ? h(View, {},
            h(Text, { style: s.sectionTitle }, "Change Since Last Test"),
            h(Text, { style: s.text }, `Comparing ${previousUpload.labDate} → ${upload.labDate}`),
            h(View, { style: s.tableHeader },
              h(Text, { style: { ...s.thCell, width: "30%" } }, "BIOMARKER"),
              h(Text, { style: { ...s.thCell, width: "18%" } }, "BEFORE"),
              h(Text, { style: { ...s.thCell, width: "18%" } }, "AFTER"),
              h(Text, { style: { ...s.thCell, width: "18%" } }, "CHANGE"),
              h(Text, { style: { ...s.thCell, width: "16%" } }, "STATUS")
            ),
            ...comparisonRows.slice(0, 12).map((row, i) =>
              h(View, { key: `c-${i}`, style: { ...s.tableRow, backgroundColor: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)" } },
                h(Text, { style: { ...s.tdCellPrimary, width: "30%" } }, row.biomarker),
                h(Text, { style: { ...s.tdCell, width: "18%" } }, `${row.before} ${row.unit}`),
                h(Text, { style: { ...s.tdCell, width: "18%" } }, `${row.after} ${row.unit}`),
                h(Text, { style: { ...s.tdCell, width: "18%" } }, row.pctChange != null ? `${row.delta > 0 ? "+" : ""}${row.pctChange.toFixed(1)}%` : "—"),
                h(Text, {
                  style: {
                    fontSize: 8,
                    width: "16%",
                    color: row.direction === "improved" ? "#22C55E" : row.direction === "worsened" ? "#EF4444" : "#6B6B80",
                  },
                }, row.direction)
              )
            )
          )
        : null,
      h(View, { style: { marginTop: previousUpload && comparisonRows.length > 0 ? 16 : 0 } },
        h(View, { style: s.disclaimer },
          h(Text, { style: s.disclaimerTitle }, "Medical Disclaimer"),
          h(Text, { style: s.disclaimerText },
            "This report is for educational purposes only. Not medical advice. Consult your healthcare provider before changing supplements, diet, or exercise. BioTransform is not responsible for health outcomes. Discontinue and seek care if you experience adverse effects."
          )
        )
      ),
      h(View, { style: { marginTop: 12, alignItems: "center" } },
        h(Text, { style: { fontSize: 9, color: "#6B6B80" } }, `Generated ${dateStr}`)
      ),
      h(View, { style: s.footer }, h(Text, {}, "60-Day Plan"), h(Text, {}, "Page 5"))
    )
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `biotransform-60day-plan-${upload.labDate}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Main Report Page ────────────────────────────────────────────── */

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const uploadId = id as Id<"bloodworkUploads">;

  const upload = useQuery(api.uploads.getUpload, { uploadId });
  const previousUpload = useQuery(api.uploads.getPreviousUpload, { uploadId });
  const comparableUploads = useQuery(api.uploads.getComparableUploads, { uploadId });
  const [selectedComparisonId, setSelectedComparisonId] = useState<Id<"bloodworkUploads"> | null>(null);

  const selectedComparisonUpload = useQuery(
    api.uploads.getUpload,
    selectedComparisonId ? { uploadId: selectedComparisonId } : "skip"
  );
  const comparisonUpload = selectedComparisonId ? selectedComparisonUpload : previousUpload;
  const comparisonUploadId = comparisonUpload?._id;

  const reportData = useQuery(api.biomarkers.getReportData, {});
  const previousBiomarkers = useQuery(
    api.biomarkers.getByUpload,
    comparisonUploadId ? { uploadId: comparisonUploadId } : "skip"
  );
  const plan = useQuery(api.healthPlans.getByUpload, { uploadId });
  const profile = useQuery(api.profiles.get);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const biomarkers = useMemo(() => reportData?.biomarkers ?? [], [reportData?.biomarkers]);
  const genetics = useMemo(() => reportData?.genetics ?? [], [reportData?.genetics]);
  const sources = useMemo(() => reportData?.sources ?? [], [reportData?.sources]);

  const isLoading = upload === undefined || reportData === undefined || plan === undefined || profile === undefined;

  const handleDownload = useCallback(async () => {
    if (!upload || !plan) return;
    setGenerating(true);
    setError(null);
    try {
      await generatePDF({
        upload,
        biomarkers,
        genetics,
        plan,
        profile: profile ?? null,
        previousUpload: comparisonUpload ?? undefined,
        previousBiomarkers: previousBiomarkers ?? undefined,
        sources,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      setError("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [upload, biomarkers, genetics, plan, profile, comparisonUpload, previousBiomarkers, sources]);

  if (isLoading) return <ReportLoading />;
  if (upload === null) return <ReportError message="This upload was not found or you don't have access to it." />;

  const hasData = (biomarkers.length > 0 || genetics.length > 0) && plan;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <Nav />

      <motion.main
        id="main-content"
        initial="hidden"
        animate="visible"
        variants={stagger}
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        {/* Header */}
        <motion.div
          custom={0}
          variants={fadeUp}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "28px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
              <Link
                href="/dashboard"
                style={{
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                  transition: "color 0.15s ease",
                }}
              >
                Dashboard
              </Link>
              <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>/</span>
              <Link
                href={`/results/${id}`}
                style={{
                  fontSize: "13px",
                  color: "var(--text-tertiary)",
                  textDecoration: "none",
                }}
              >
                Results
              </Link>
              <span style={{ color: "var(--text-tertiary)", fontSize: "12px" }}>/</span>
              <span style={{ fontSize: "13px", color: "var(--accent-teal)" }}>Report</span>
            </div>
            <h1
              style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
                letterSpacing: "-0.02em",
              }}
            >
              60-Day Health Plan
            </h1>
          </div>

          {hasData && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AnimatePresence>
                {error && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{ fontSize: "13px", color: "var(--status-critical)" }}
                  >
                    {error}
                  </motion.span>
                )}
              </AnimatePresence>
              <button
                onClick={handleDownload}
                disabled={generating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  background: generating ? "var(--bg-tertiary)" : "var(--accent-teal)",
                  color: generating ? "var(--text-secondary)" : "var(--bg-primary)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: generating ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  transition: "opacity 0.15s ease, transform 0.15s ease",
                }}
              >
                {generating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        border: "2px solid var(--border-medium)",
                        borderTopColor: "var(--text-secondary)",
                      }}
                    />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>

        {/* Report Preview */}
        {!hasData ? (
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            style={{
              textAlign: "center",
              padding: "80px 24px",
              ...cardStyle,
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "16px",
                background: "var(--accent-teal-glow)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: "8px" }}>
              {upload.status === "processing" ? "Analysis in Progress" : "No Report Data"}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-tertiary)", maxWidth: "400px", margin: "0 auto" }}>
              {upload.status === "processing"
                ? "Your lab results are being analyzed. The report will be available once processing is complete."
                : upload.status === "failed"
                  ? `Processing failed: ${upload.errorMessage ?? "Unknown error"}. Please try re-uploading.`
                  : "Biomarker data or health plan is not yet available for this upload."}
            </p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <CoverPreview upload={upload} profile={profile} hasComparison={!!comparisonUpload && !!previousBiomarkers?.length} />
            {sources.length > 0 && <DataSourcesCallout sources={sources} />}
            {comparableUploads && comparableUploads.length > 0 && (
              <ComparisonSelector
                comparableUploads={comparableUploads}
                selectedId={selectedComparisonId ?? comparisonUpload?._id ?? undefined}
                onSelect={(id) => setSelectedComparisonId(id)}
                currentLabDate={upload.labDate}
              />
            )}
            {comparisonUpload && previousBiomarkers && previousBiomarkers.length > 0 && (
              <ComparisonPreview
                currentLabDate={upload.labDate}
                previousLabDate={comparisonUpload.labDate}
                currentBiomarkers={biomarkers}
                previousBiomarkers={previousBiomarkers}
              />
            )}
            <BiomarkerTablePreview biomarkers={biomarkers} showSource={sources.length > 1} />
            {genetics.length > 0 && <GeneticFindingsPreview genetics={genetics} />}
            <KeyFindingsPreview plan={plan} />
            <SupplementPreview supplements={plan.supplements} />
            <NutritionPreview nutrition={plan.nutritionPlan} />
            <TrainingPreview training={plan.trainingProgram} />
            <DisclaimerPreview />
          </div>
        )}
      </motion.main>
    </div>
  );
}
