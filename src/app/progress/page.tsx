"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { Nav } from "@/components/nav";
import { fadeUp, stagger, EASE_OUT, DURATION_NORMAL, SCALE_ENTER_MIN } from "@/lib/animations";
import { formatDate } from "@/lib/format";

/* ─── Status Helpers ─────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  optimal: "var(--status-optimal)",
  normal: "var(--status-normal)",
  suboptimal: "var(--status-suboptimal)",
  critical: "var(--status-critical)",
};

const STATUS_WEIGHT: Record<string, number> = {
  optimal: 3,
  normal: 2,
  suboptimal: 1,
  critical: 0,
};

/* ─── Types ──────────────────────────────────────────────────────── */

interface BiomarkerResult {
  _id: string;
  biomarker: string;
  category: string;
  value: number;
  unit: string;
  status: "optimal" | "normal" | "suboptimal" | "critical";
  optimalRangeLow: number;
  optimalRangeHigh: number;
  labDate: string;
  uploadId: string;
}

type UploadTestType = "bloodwork" | "hormone" | "dna";
type ComparisonDirection = "improved" | "worsened" | "stable" | "insufficient";

function distanceToOptimal(value: number, low: number, high: number): number {
  if (value < low) return low - value;
  if (value > high) return value - high;
  return 0;
}

function compareTowardsOptimal(
  previous: BiomarkerResult | undefined,
  current: BiomarkerResult | undefined,
): ComparisonDirection {
  if (!previous || !current) return "insufficient";
  const prevDist = distanceToOptimal(previous.value, previous.optimalRangeLow, previous.optimalRangeHigh);
  const currDist = distanceToOptimal(current.value, current.optimalRangeLow, current.optimalRangeHigh);
  if (Math.abs(currDist - prevDist) <= 0.001) return "stable";
  return currDist < prevDist ? "improved" : "worsened";
}

const TEST_TYPE_LABELS: Record<string, string> = {
  bloodwork: "Bloodwork",
  hormone: "Hormones",
  dna: "DNA",
};

const EASE_OUT_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

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
      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
      style={{ width, height, borderRadius, background: "var(--bg-tertiary)" }}
    />
  );
}

/* ─── Custom Tooltip for Recharts ────────────────────────────────── */

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { unit?: string } }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-medium)",
        borderRadius: "10px",
        padding: "10px 14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-tertiary)",
          marginBottom: "4px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontSize: "15px",
          fontWeight: 700,
          fontFamily: "var(--font-display)",
          color: "var(--accent-teal)",
        }}
      >
        {payload[0].value}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 400,
            color: "var(--text-tertiary)",
            marginLeft: "4px",
          }}
        >
          {payload[0].payload?.unit ?? ""}
        </span>
      </p>
    </div>
  );
}

/* ─── Progress Ring (SVG) ────────────────────────────────────────── */

function ProgressRing({
  value,
  max,
  label,
  sublabel,
  color,
  size = 120,
}: {
  value: number;
  max: number;
  label: string;
  sublabel: string;
  color: string;
  size?: number;
}) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const dashOffset = circumference * (1 - pct);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.2 }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            {value}
          </span>
          <span style={{ fontSize: "10px", color: "var(--text-tertiary)" }}>
            / {max}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
          {label}
        </p>
        <p style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
          {sublabel}
        </p>
      </div>
    </div>
  );
}

/* ─── Biomarker Trend Card ───────────────────────────────────────── */

function BiomarkerTrendCard({
  biomarker,
  allResults,
  uploadsMap,
}: {
  biomarker: string;
  allResults: BiomarkerResult[];
  uploadsMap: Map<string, string>;
}) {
  const data = useMemo(() => {
    return allResults
      .filter((r) => r.biomarker === biomarker)
      .sort((a, b) => a.labDate.localeCompare(b.labDate))
      .map((r) => ({
        date: formatDate(r.labDate, {
          month: "short",
          day: "numeric",
        }),
        value: r.value,
        unit: r.unit,
        status: r.status,
        optimalLow: r.optimalRangeLow,
        optimalHigh: r.optimalRangeHigh,
      }));
  }, [allResults, biomarker]);

  if (data.length === 0) return null;

  const latest = data[data.length - 1];
  const sourcesForBiomarker = [
    ...new Set(
      allResults
        .filter((r) => r.biomarker === biomarker)
        .map((r) => uploadsMap.get(r.uploadId))
        .filter(Boolean),
    ),
  ] as string[];
  const previous = data.length >= 2 ? data[data.length - 2] : null;
  const delta = previous ? latest.value - previous.value : 0;
  const pctChange = previous && previous.value !== 0
    ? ((delta / previous.value) * 100).toFixed(1)
    : null;

  // Determine direction
  let arrow = "→";
  let dirLabel = "Stable";
  let dirColor = "var(--text-tertiary)";
  if (delta > 0.01) {
    arrow = "↑";
    dirLabel = "Increasing";
    dirColor = "var(--status-suboptimal)";
  } else if (delta < -0.01) {
    arrow = "↓";
    dirLabel = "Decreasing";
    dirColor = "var(--status-normal)";
  }

  const hasChart = data.length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: EASE_OUT }}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: STATUS_COLORS[latest.status],
              boxShadow: `0 0 6px ${STATUS_COLORS[latest.status]}`,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            {biomarker}
          </span>
          {sourcesForBiomarker.length > 0 && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: "4px",
                background: "var(--bg-tertiary)",
                color: "var(--text-tertiary)",
              }}
            >
              {sourcesForBiomarker.map((s) => TEST_TYPE_LABELS[s] ?? s).join(", ")}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "18px",
              fontWeight: 700,
              color: STATUS_COLORS[latest.status],
            }}
          >
            {latest.value}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
            {latest.unit}
          </span>
        </div>
      </div>

      {/* Delta indicator */}
      {previous && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            borderRadius: "8px",
            background: "var(--bg-secondary)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px", color: dirColor, fontWeight: 700 }}>{arrow}</span>
            <span style={{ fontSize: "12px", color: dirColor, fontWeight: 500 }}>{dirLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
              prev: {previous.value}
            </span>
            {pctChange && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  background: delta > 0 ? "rgba(245, 158, 11, 0.1)" : "rgba(59, 130, 246, 0.1)",
                  color: delta > 0 ? "var(--status-suboptimal)" : "var(--status-normal)",
                }}
              >
                {delta > 0 ? "+" : ""}{pctChange}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Mini Chart */}
      {hasChart && (
        <div style={{ width: "100%", height: "120px", marginTop: "4px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#6B6B80" }}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6B6B80" }}
                axisLine={false}
                tickLine={false}
                domain={["auto", "auto"]}
              />
              {latest.optimalLow != null && (
                <ReferenceLine
                  y={latest.optimalLow}
                  stroke="rgba(0, 240, 181, 0.2)"
                  strokeDasharray="4 4"
                />
              )}
              {latest.optimalHigh != null && (
                <ReferenceLine
                  y={latest.optimalHigh}
                  stroke="rgba(0, 240, 181, 0.2)"
                  strokeDasharray="4 4"
                />
              )}
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.06)" }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#00F0B5"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: "#0B0B12",
                  stroke: "#00F0B5",
                  strokeWidth: 2,
                }}
                activeDot={{
                  r: 6,
                  fill: "#00F0B5",
                  stroke: "#0B0B12",
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Optimal range footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          borderTop: "1px solid var(--border-subtle)",
          paddingTop: "10px",
          fontSize: "11px",
          color: "var(--text-tertiary)",
        }}
      >
        <span>
          Optimal: {latest.optimalLow} – {latest.optimalHigh} {latest.unit}
        </span>
        <span>{data.length} data point{data.length !== 1 ? "s" : ""}</span>
      </div>
    </motion.div>
  );
}

/* ─── Main Page Component ────────────────────────────────────────── */

export default function ProgressPage() {
  const uploads = useQuery(api.uploads.listUploads);

  const allBiomarkersRaw = useQuery(api.biomarkers.getAllResults);

  const uploadMetaById = useMemo(() => {
    const m = new Map<string, { uploadedAt: number; labDate: string; testType: string; status: string }>();
    for (const u of uploads ?? []) {
      m.set(u._id, {
        uploadedAt: u.uploadedAt,
        labDate: u.labDate,
        testType: u.testType,
        status: u.status,
      });
    }
    return m;
  }, [uploads]);

  // Collapse duplicate uploads for the same lab panel (same test type + lab date), keep newest upload.
  const canonicalUploadIds = useMemo(() => {
    const byGroup = new Map<string, { uploadId: string; uploadedAt: number }>();
    for (const u of uploads ?? []) {
      const key = `${u.testType}::${u.labDate}`;
      const existing = byGroup.get(key);
      if (!existing || u.uploadedAt > existing.uploadedAt) {
        byGroup.set(key, { uploadId: u._id, uploadedAt: u.uploadedAt });
      }
    }
    return new Set([...byGroup.values()].map((x) => x.uploadId));
  }, [uploads]);

  const canonicalUploads = useMemo(() => {
    return (uploads ?? [])
      .filter((u) => canonicalUploadIds.has(u._id))
      .sort((a, b) => {
        const byDate = a.labDate.localeCompare(b.labDate);
        return byDate !== 0 ? byDate : a.uploadedAt - b.uploadedAt;
      });
  }, [uploads, canonicalUploadIds]);

  const allResults: BiomarkerResult[] = useMemo(() => {
    if (!allBiomarkersRaw || !Array.isArray(allBiomarkersRaw)) return [];
    const raw = allBiomarkersRaw as unknown as BiomarkerResult[];

    // Keep one result per biomarker + source panel date (latest upload wins for duplicates).
    const byKey = new Map<
      string,
      { row: BiomarkerResult; uploadedAt: number }
    >();

    for (const row of raw) {
      const meta = uploadMetaById.get(row.uploadId);
      if (!meta) continue;
      if (!canonicalUploadIds.has(row.uploadId)) continue;
      const key = `${row.biomarker}::${row.labDate}::${meta.testType}`;
      const existing = byKey.get(key);
      if (!existing || meta.uploadedAt > existing.uploadedAt) {
        byKey.set(key, { row, uploadedAt: meta.uploadedAt });
      }
    }

    return [...byKey.values()].map((x) => x.row);
  }, [allBiomarkersRaw, canonicalUploadIds, uploadMetaById]);

  // Group unique biomarker names by category
  const biomarkersByCategory = useMemo(() => {
    const latestByBiomarker = new Map<string, BiomarkerResult>();
    for (const row of allResults) {
      const existing = latestByBiomarker.get(row.biomarker);
      if (!existing || row.labDate > existing.labDate) {
        latestByBiomarker.set(row.biomarker, row);
      }
    }

    const map: Record<string, string[]> = {};
    for (const r of latestByBiomarker.values()) {
      if (!map[r.category]) map[r.category] = [];
      map[r.category].push(r.biomarker);
    }

    for (const category of Object.keys(map)) {
      map[category].sort((a, b) => a.localeCompare(b));
    }

    return map;
  }, [allResults]);

  const categories = Object.keys(biomarkersByCategory).sort();
  const trackedBiomarkersCount = useMemo(() => new Set(allResults.map((r) => r.biomarker)).size, [allResults]);

  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const uploadsWithBiomarkers = useMemo(() => {
    if (!uploads) return [];
    const countByUpload = new Map<string, number>();
    for (const row of allResults) {
      countByUpload.set(row.uploadId, (countByUpload.get(row.uploadId) ?? 0) + 1);
    }
    return canonicalUploads
      .filter((u) => (countByUpload.get(u._id) ?? 0) > 0)
      .sort((a, b) => a.labDate.localeCompare(b.labDate));
  }, [uploads, allResults, canonicalUploads]);

  const comparisonTypes = useMemo(
    () => [...new Set(uploadsWithBiomarkers.map((u) => u.testType as UploadTestType))].sort(),
    [uploadsWithBiomarkers],
  );
  const [selectedComparisonType, setSelectedComparisonType] = useState<UploadTestType | "">("");
  const effectiveComparisonType = selectedComparisonType !== "" && comparisonTypes.includes(selectedComparisonType)
    ? selectedComparisonType
    : (comparisonTypes[0] ?? "");
  const comparisonUploads = useMemo(
    () => uploadsWithBiomarkers.filter((u) => u.testType === effectiveComparisonType),
    [uploadsWithBiomarkers, effectiveComparisonType],
  );

  const [baselineUploadId, setBaselineUploadId] = useState<string>("");
  const [currentUploadId, setCurrentUploadId] = useState<string>("");

  const defaultBaselineUploadId = comparisonUploads[0]?._id ?? "";
  const defaultCurrentUploadId = comparisonUploads[comparisonUploads.length - 1]?._id ?? "";
  const effectiveBaselineUploadId = comparisonUploads.some((u) => u._id === baselineUploadId)
    ? baselineUploadId
    : defaultBaselineUploadId;
  const effectiveCurrentUploadId = comparisonUploads.some((u) => u._id === currentUploadId)
    ? currentUploadId
    : defaultCurrentUploadId;

  const comparisonRows = useMemo(() => {
    if (!effectiveBaselineUploadId || !effectiveCurrentUploadId || effectiveBaselineUploadId === effectiveCurrentUploadId) return [];
    const baselineRows = allResults.filter((r) => r.uploadId === effectiveBaselineUploadId);
    const currentRows = allResults.filter((r) => r.uploadId === effectiveCurrentUploadId);
    const baselineByName = new Map(baselineRows.map((r) => [r.biomarker, r]));
    const currentByName = new Map(currentRows.map((r) => [r.biomarker, r]));
    const names = new Set<string>([...baselineByName.keys(), ...currentByName.keys()]);

    const rows = [...names].map((name) => {
      const previous = baselineByName.get(name);
      const current = currentByName.get(name);
      const direction = compareTowardsOptimal(previous, current);
      const delta =
        previous && current ? Number((current.value - previous.value).toFixed(2)) : null;
      return {
        name,
        unit: current?.unit ?? previous?.unit ?? "",
        previous,
        current,
        delta,
        direction,
      };
    });

    return rows.sort((a, b) => {
      const aSeverity = Math.min(
        STATUS_WEIGHT[a.previous?.status ?? "normal"] ?? 2,
        STATUS_WEIGHT[a.current?.status ?? "normal"] ?? 2,
      );
      const bSeverity = Math.min(
        STATUS_WEIGHT[b.previous?.status ?? "normal"] ?? 2,
        STATUS_WEIGHT[b.current?.status ?? "normal"] ?? 2,
      );
      if (aSeverity !== bSeverity) return aSeverity - bSeverity;
      return a.name.localeCompare(b.name);
    });
  }, [allResults, effectiveBaselineUploadId, effectiveCurrentUploadId]);

  const comparisonSummary = useMemo(() => {
    return comparisonRows.reduce(
      (acc, row) => {
        acc[row.direction] += 1;
        return acc;
      },
      { improved: 0, worsened: 0, stable: 0, insufficient: 0 } as Record<ComparisonDirection, number>,
    );
  }, [comparisonRows]);

  const displayCategories = selectedCategory
    ? { [selectedCategory]: biomarkersByCategory[selectedCategory] ?? [] }
    : biomarkersByCategory;

  // Timeline data
  const timelineUploads = useMemo(() => {
    return canonicalUploads;
  }, [canonicalUploads]);

  const timelineGroups = useMemo(() => {
    const byDate = new Map<string, typeof timelineUploads>();
    for (const upload of timelineUploads) {
      const arr = byDate.get(upload.labDate) ?? [];
      arr.push(upload);
      byDate.set(upload.labDate, arr);
    }
    return [...byDate.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([labDate, items]) => ({
        labDate,
        items: [...items].sort((a, b) => a.uploadedAt - b.uploadedAt),
      }));
  }, [timelineUploads]);

  const latestTimelineUploadId = useMemo(() => {
    if (timelineUploads.length === 0) return null;
    return [...timelineUploads].sort((a, b) => b.uploadedAt - a.uploadedAt)[0]._id;
  }, [timelineUploads]);

  const uploadsMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const u of canonicalUploads) {
      m.set(u._id, u.testType);
    }
    return m;
  }, [canonicalUploads]);

  // 90-day progress (use stable "now" to avoid impure Date.now() during render)
  const [now] = useState(() => Date.now());
  const latestUploadDate = timelineUploads.length > 0
    ? timelineUploads[timelineUploads.length - 1].uploadedAt
    : null;
  const daysSinceTest = latestUploadDate
    ? Math.floor((now - latestUploadDate) / (1000 * 60 * 60 * 24))
    : 0;
  const daysUntilNext = Math.max(90 - daysSinceTest, 0);

  /* ─── Loading ───────────────────────────────────────────── */

  if (uploads === undefined || allBiomarkersRaw === undefined) {
    return (
      <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
        <Nav />
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 24px" }}>
          <SkeletonPulse width="240px" height="28px" />
          <div style={{ marginTop: "12px" }}>
            <SkeletonPulse width="300px" height="16px" />
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginTop: "32px",
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "16px",
                  padding: "24px",
                }}
              >
                <SkeletonPulse width="60%" height="18px" />
                <div style={{ marginTop: "16px" }}>
                  <SkeletonPulse width="100%" height="120px" borderRadius="10px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Empty State ───────────────────────────────────────── */

  if (!uploads || uploads.length < 1) {
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
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
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
            Start tracking progress
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
            Upload bloodwork to start tracking your biomarker trends over time.
            We recommend testing every 90 days.
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

  /* ─── Main Content ─────────────────────────────────────── */

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <Nav />

      {/* Background glow */}
      <div
        style={{
          position: "fixed",
          bottom: "-10%",
          left: "20%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "var(--accent-teal)",
          opacity: 0.03,
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
        <motion.div initial="hidden" animate="visible" variants={stagger}>
          {/* ─── Header ────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "32px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.02em",
              }}
            >
              Progress Tracking
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-secondary)",
                marginTop: "6px",
              }}
            >
              {canonicalUploads.length} unique panel{canonicalUploads.length !== 1 ? "s" : ""} analyzed
              {" "} &middot; {" "}
              {trackedBiomarkersCount} biomarkers tracked
            </p>
          </motion.div>

          {/* ─── Upload Timeline + Progress Rings ──────── */}
          <motion.div
            variants={fadeUp}
            style={{
              marginTop: "32px",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "20px",
              alignItems: "start",
            }}
          >
            {/* Timeline */}
            <div
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
                  marginBottom: "20px",
                }}
              >
                Upload Timeline
              </h3>
              <div style={{ position: "relative", padding: "0 8px" }}>
                {/* Track line */}
                {timelineGroups.length > 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: "20px",
                      left: "8px",
                      right: "8px",
                      height: "2px",
                      background: "var(--border-subtle)",
                    }}
                  />
                )}
                {/* Date groups */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: timelineGroups.length > 1 ? "space-between" : "center",
                    position: "relative",
                    alignItems: "flex-start",
                  }}
                >
                  {timelineGroups.map((group, groupIndex) => {
                    const typeLabels = group.items.map((u) => TEST_TYPE_LABELS[u.testType] ?? u.testType);
                    const summary =
                      typeLabels.length <= 2 ? typeLabels.join(" + ") : `${typeLabels.length} panels`;

                    return (
                      <div
                        key={group.labDate}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "8px",
                          minWidth: "120px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", minHeight: "40px" }}>
                          {group.items.map((upload, itemIndex) => {
                            const isLatest = upload._id === latestTimelineUploadId;
                            const statusColor =
                              upload.status === "complete"
                                ? "var(--status-optimal)"
                                : upload.status === "processing"
                                  ? "var(--status-suboptimal)"
                                  : upload.status === "failed"
                                    ? "var(--status-critical)"
                                    : "var(--text-tertiary)";

                            return (
                              <Link
                                key={upload._id}
                                href={`/results/${upload._id}`}
                                title={`${TEST_TYPE_LABELS[upload.testType] ?? upload.testType} • ${upload.labDate}`}
                                style={{ textDecoration: "none" }}
                              >
                                <motion.div
                                  initial={{ scale: SCALE_ENTER_MIN }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: 0.08 + groupIndex * 0.04 + itemIndex * 0.03, duration: DURATION_NORMAL, ease: EASE_OUT }}
                                  style={{
                                    width: isLatest ? "16px" : "12px",
                                    height: isLatest ? "16px" : "12px",
                                    borderRadius: "50%",
                                    background: statusColor,
                                    boxShadow: isLatest ? `0 0 12px ${statusColor}` : "none",
                                    border: "2px solid var(--bg-card)",
                                  }}
                                />
                              </Link>
                            );
                          })}
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {formatDate(group.labDate, { month: "short", day: "numeric" })}
                          </p>
                          <p
                            style={{
                              fontSize: "11px",
                              color: "var(--text-tertiary)",
                            }}
                          >
                            {summary}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 90-Day Progress Ring */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "24px 32px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "20px",
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
                90-Day Cycle
              </h3>
              <div style={{ display: "flex", gap: "24px" }}>
                <ProgressRing
                  value={daysSinceTest}
                  max={90}
                  label="Days elapsed"
                  sublabel="since last test"
                  color={daysSinceTest > 90 ? "#EF4444" : "#00F0B5"}
                />
                <ProgressRing
                  value={daysUntilNext}
                  max={90}
                  label="Days until"
                  sublabel="next recommended"
                  color={daysUntilNext <= 14 ? "#F59E0B" : "#3B82F6"}
                />
              </div>
            </div>
          </motion.div>

          {/* ─── Upload Comparison ─────────────────────── */}
          {comparisonUploads.length >= 2 && (
            <motion.div
              variants={fadeUp}
              style={{
                marginTop: "24px",
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "16px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>
                    Multi-upload comparison
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "4px" }}>
                    Compare two uploads of the same test type and track movement toward optimal ranges.
                  </p>
                </div>
                {comparisonTypes.length > 1 && (
                  <label style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                    Test type
                    <select
                      value={effectiveComparisonType}
                      onChange={(e) => setSelectedComparisonType(e.target.value as UploadTestType)}
                      style={{
                        marginLeft: "6px",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        padding: "6px 8px",
                      }}
                    >
                      {comparisonTypes.map((type) => (
                        <option key={`type-${type}`} value={type}>
                          {TEST_TYPE_LABELS[type] ?? type}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <label style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                    Baseline
                    <select
                      value={effectiveBaselineUploadId}
                      onChange={(e) => setBaselineUploadId(e.target.value)}
                      style={{
                        marginLeft: "6px",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        padding: "6px 8px",
                      }}
                    >
                      {comparisonUploads.map((u) => (
                        <option key={`base-${u._id}`} value={u._id}>
                          {(TEST_TYPE_LABELS[u.testType] ?? u.testType)} · {u.labDate}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                    Current
                    <select
                      value={effectiveCurrentUploadId}
                      onChange={(e) => setCurrentUploadId(e.target.value)}
                      style={{
                        marginLeft: "6px",
                        background: "var(--bg-secondary)",
                        color: "var(--text-primary)",
                        border: "1px solid var(--border-medium)",
                        borderRadius: "8px",
                        fontSize: "12px",
                        padding: "6px 8px",
                      }}
                    >
                      {comparisonUploads.map((u) => (
                        <option key={`current-${u._id}`} value={u._id}>
                          {(TEST_TYPE_LABELS[u.testType] ?? u.testType)} · {u.labDate}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div style={{ marginTop: "14px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "11px", color: "var(--status-optimal)", background: "rgba(16,185,129,0.12)", padding: "4px 8px", borderRadius: "999px" }}>
                  Improved: {comparisonSummary.improved}
                </span>
                <span style={{ fontSize: "11px", color: "var(--status-critical)", background: "rgba(239,68,68,0.12)", padding: "4px 8px", borderRadius: "999px" }}>
                  Worsened: {comparisonSummary.worsened}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", background: "var(--bg-secondary)", padding: "4px 8px", borderRadius: "999px" }}>
                  Stable: {comparisonSummary.stable}
                </span>
              </div>

              {effectiveBaselineUploadId === effectiveCurrentUploadId ? (
                <p style={{ marginTop: "14px", fontSize: "12px", color: "var(--text-tertiary)" }}>
                  Select two different uploads to calculate deltas.
                </p>
              ) : (
                <div style={{ marginTop: "14px", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "680px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                        <th style={{ textAlign: "left", padding: "8px 6px", fontSize: "11px", color: "var(--text-tertiary)" }}>Biomarker</th>
                        <th style={{ textAlign: "left", padding: "8px 6px", fontSize: "11px", color: "var(--text-tertiary)" }}>Baseline</th>
                        <th style={{ textAlign: "left", padding: "8px 6px", fontSize: "11px", color: "var(--text-tertiary)" }}>Current</th>
                        <th style={{ textAlign: "left", padding: "8px 6px", fontSize: "11px", color: "var(--text-tertiary)" }}>Delta</th>
                        <th style={{ textAlign: "left", padding: "8px 6px", fontSize: "11px", color: "var(--text-tertiary)" }}>Direction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonRows.map((row) => (
                        <tr key={row.name} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                          <td style={{ padding: "10px 6px", fontSize: "12px", color: "var(--text-primary)", fontWeight: 600 }}>{row.name}</td>
                          <td style={{ padding: "10px 6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                            {row.previous ? `${row.previous.value} ${row.unit}` : "—"}
                          </td>
                          <td style={{ padding: "10px 6px", fontSize: "12px", color: row.current ? STATUS_COLORS[row.current.status] : "var(--text-secondary)" }}>
                            {row.current ? `${row.current.value} ${row.unit}` : "—"}
                          </td>
                          <td style={{ padding: "10px 6px", fontSize: "12px", color: "var(--text-secondary)" }}>
                            {row.delta == null ? "—" : `${row.delta > 0 ? "+" : ""}${row.delta} ${row.unit}`}
                          </td>
                          <td style={{ padding: "10px 6px", fontSize: "12px" }}>
                            <span
                              style={{
                                color:
                                  row.direction === "improved"
                                    ? "var(--status-optimal)"
                                    : row.direction === "worsened"
                                      ? "var(--status-critical)"
                                      : "var(--text-secondary)",
                              }}
                            >
                              {row.direction === "improved"
                                ? "Improved"
                                : row.direction === "worsened"
                                  ? "Worsened"
                                  : row.direction === "stable"
                                    ? "Stable"
                                    : "Insufficient data"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

          {allResults.length === 0 && (
            <motion.div
              variants={fadeUp}
              style={{
                marginTop: "24px",
                border: "1px solid var(--border-subtle)",
                borderRadius: "14px",
                background: "var(--bg-card)",
                padding: "16px",
                fontSize: "13px",
                color: "var(--text-secondary)",
              }}
            >
              Biomarker extraction is still pending for your uploads. Trend cards will appear after analysis completes.
            </motion.div>
          )}

          {/* ─── Category Filter ───────────────────────── */}
          {categories.length > 1 && (
            <motion.div
              variants={fadeUp}
              style={{
                marginTop: "32px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-tertiary)",
                  marginRight: "4px",
                }}
              >
                Filter:
              </span>
              <motion.button
                onClick={() => setSelectedCategory(null)}
                whileTap={{ scale: 0.97 }}
                style={{
                  padding: "6px 14px",
                  borderRadius: "100px",
                  border: "1px solid",
                  borderColor: selectedCategory === null
                    ? "rgba(0, 240, 181, 0.3)"
                    : "var(--border-medium)",
                  background: selectedCategory === null
                    ? "var(--accent-teal-glow)"
                    : "transparent",
                  color: selectedCategory === null
                    ? "var(--accent-teal)"
                    : "var(--text-secondary)",
                  fontSize: "12px",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: `color 0.16s ${EASE_OUT_CSS}, background-color 0.16s ${EASE_OUT_CSS}, border-color 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
                  fontFamily: "var(--font-body)",
                }}
              >
                All
              </motion.button>
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  onClick={() =>
                    setSelectedCategory(selectedCategory === cat ? null : cat)
                  }
                  whileTap={{ scale: 0.97 }}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "100px",
                    border: "1px solid",
                    borderColor: selectedCategory === cat
                      ? "rgba(0, 240, 181, 0.3)"
                      : "var(--border-medium)",
                    background: selectedCategory === cat
                      ? "var(--accent-teal-glow)"
                      : "transparent",
                    color: selectedCategory === cat
                      ? "var(--accent-teal)"
                      : "var(--text-secondary)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: `color 0.16s ${EASE_OUT_CSS}, background-color 0.16s ${EASE_OUT_CSS}, border-color 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  {cat}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* ─── Biomarker Trend Cards ─────────────────── */}
          <motion.div
            variants={fadeUp}
            style={{ marginTop: "24px" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={selectedCategory ?? "all"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16, ease: EASE_OUT }}
              >
                {Object.entries(displayCategories).map(
                  ([category, biomarkerNames]) => (
                    <div key={category} style={{ marginBottom: "32px" }}>
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: "17px",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginBottom: "14px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {category}
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 400,
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {biomarkerNames.length} marker
                          {biomarkerNames.length !== 1 ? "s" : ""}
                        </span>
                      </h3>
                      <motion.div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(340px, 1fr))",
                          gap: "16px",
                        }}
                      >
                        {biomarkerNames.map((name) => (
                          <BiomarkerTrendCard
                            key={name}
                            biomarker={name}
                            allResults={allResults}
                            uploadsMap={uploadsMap}
                          />
                        ))}
                      </motion.div>
                    </div>
                  )
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* ─── Upload CTA ────────────────────────────── */}
          <motion.div
            variants={fadeUp}
            style={{
              marginTop: "20px",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Link
              href="/upload"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                borderRadius: "12px",
                background: "var(--accent-teal)",
                color: "var(--bg-primary)",
                fontWeight: 700,
                fontSize: "14px",
                textDecoration: "none",
                fontFamily: "var(--font-display)",
                transition: `opacity 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
              }}
            >
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload New Test
            </Link>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
