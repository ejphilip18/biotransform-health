"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion } from "framer-motion";
import { Nav } from "@/components/nav";
import { fadeUp, stagger, DURATION_NORMAL, EASE_OUT } from "@/lib/animations";
import { formatDate } from "@/lib/format";

type Status = "optimal" | "normal" | "suboptimal" | "critical";

type DomainId = "energy" | "metabolic" | "hormonal" | "inflammation";

const TEST_TYPE_LABELS: Record<string, string> = {
  bloodwork: "Bloodwork",
  hormone: "Hormones",
  dna: "DNA",
};

const DOMAIN_META: Record<
  DomainId,
  {
    label: string;
    hint: string;
    categories: string[];
  }
> = {
  energy: {
    label: "Energy & Recovery",
    hint: "Sleep quality, oxygen transport, and nutrient availability.",
    categories: ["CBC", "Vitamins", "Minerals", "Iron"],
  },
  metabolic: {
    label: "Metabolic Health",
    hint: "Blood sugar stability and lipid regulation.",
    categories: ["CMP", "Lipids", "Metabolic", "Kidney", "Liver"],
  },
  hormonal: {
    label: "Hormonal Balance",
    hint: "Thyroid and hormone axis resilience.",
    categories: ["Hormones", "Thyroid"],
  },
  inflammation: {
    label: "Inflammation",
    hint: "Systemic stress and immune response load.",
    categories: ["Inflammation"],
  },
};

const STATUS_COLOR: Record<Status, string> = {
  optimal: "var(--status-optimal)",
  normal: "var(--status-normal)",
  suboptimal: "var(--status-suboptimal)",
  critical: "var(--status-critical)",
};

const STATUS_WEIGHT: Record<Status, number> = {
  optimal: 100,
  normal: 75,
  suboptimal: 40,
  critical: 10,
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border ${className}`}
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      {children}
    </div>
  );
}

function getISODate(daysAgo = 0): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split("T")[0];
}

function calculateDaysUntilRetest(labDate?: string): number | null {
  if (!labDate) return null;
  const anchor = new Date(labDate);
  if (Number.isNaN(anchor.getTime())) return null;
  const next = new Date(anchor);
  next.setDate(next.getDate() + 90);
  return Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function StatusChip({ status }: { status: Status }) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
      style={{
        color: STATUS_COLOR[status],
        background: `${STATUS_COLOR[status]}22`,
      }}
    >
      {status}
    </span>
  );
}

export default function DashboardPage() {
  const todayCheckin = useQuery(api.checkins.getToday);
  const streak = useQuery(api.checkins.getStreak);
  const healthScore = useQuery(api.checkins.getHealthScore);
  const uploads = useQuery(api.uploads.listUploads);
  const biomarkers = useQuery(api.biomarkers.getLatest);
  const allResults = useQuery(api.biomarkers.getAllResults);
  const recentCheckins = useQuery(api.checkins.getHistory, {
    startDate: getISODate(6),
    endDate: getISODate(0),
  });

  const latestUpload = uploads?.[0] ?? null;
  const daysUntilRetest = calculateDaysUntilRetest(latestUpload?.labDate);

  const adherence = useMemo(() => {
    if (!recentCheckins || recentCheckins.length === 0) {
      return { supplementRate: 0, workoutRate: 0, checkinDays: 0 };
    }
    const checkinDays = recentCheckins.length;
    const supplementRate = Math.round((recentCheckins.filter((c) => c.supplementsTaken).length / checkinDays) * 100);
    const workoutRate = Math.round((recentCheckins.filter((c) => c.workoutCompleted).length / checkinDays) * 100);
    return { supplementRate, workoutRate, checkinDays };
  }, [recentCheckins]);

  const priorities = useMemo(() => {
    const items: Array<{ title: string; reason: string; impact: string; href: string; cta: string; level: "high" | "medium" }> = [];

    if (todayCheckin === null) {
      items.push({
        title: "Complete today’s check-in",
        reason: "No check-in logged for today.",
        impact: "Improves consistency score and trend confidence.",
        href: "/checkin",
        cta: "Check in now",
        level: "high",
      });
    }

    if (!latestUpload) {
      items.push({
        title: "Upload your first test",
        reason: "No lab data found.",
        impact: "Unlocks personalized protocol and biomarker tracking.",
        href: "/upload",
        cta: "Upload test",
        level: "high",
      });
    } else if (daysUntilRetest !== null && daysUntilRetest <= 0) {
      items.push({
        title: "Retest now",
        reason: `Your 90-day cycle is overdue by ${Math.abs(daysUntilRetest)} day${Math.abs(daysUntilRetest) === 1 ? "" : "s"}.`,
        impact: "Refreshes protocol accuracy and trend quality.",
        href: "/upload",
        cta: "Upload new panel",
        level: "high",
      });
    }

    const concernCount = (biomarkers ?? []).filter((b) => b.status === "critical" || b.status === "suboptimal").length;
    if (concernCount > 0) {
      items.push({
        title: "Review your risk areas",
        reason: `${concernCount} biomarker${concernCount === 1 ? " is" : "s are"} outside optimal/normal ranges.`,
        impact: "Focuses your daily actions on the highest-return changes.",
        href: "/plan",
        cta: "Open protocol",
        level: "medium",
      });
    }

    if ((healthScore?.overall ?? 0) > 0 && (healthScore?.overall ?? 0) < 70) {
      items.push({
        title: "Strengthen adherence this week",
        reason: `Health score is ${healthScore?.overall}.`,
        impact: "Consistent supplements + workouts can move this fastest.",
        href: "/checkin",
        cta: "Update check-in",
        level: "medium",
      });
    }

    if (items.length === 0) {
      items.push({
        title: "Stay consistent",
        reason: "No urgent blockers detected today.",
        impact: "Keep your current trajectory by maintaining daily adherence.",
        href: "/checkin",
        cta: "Log today",
        level: "medium",
      });
    }

    return items.slice(0, 3);
  }, [todayCheckin, latestUpload, daysUntilRetest, biomarkers, healthScore]);

  const domainCards = useMemo(() => {
    if (!allResults || allResults.length === 0) {
      return (Object.keys(DOMAIN_META) as DomainId[]).map((id) => ({
        id,
        label: DOMAIN_META[id].label,
        hint: DOMAIN_META[id].hint,
        score: null as number | null,
        delta: 0,
        sample: 0,
        status: null as Status | null,
      }));
    }

    const byBiomarker = new Map<string, typeof allResults>();
    for (const row of allResults) {
      const existing = byBiomarker.get(row.biomarker) ?? [];
      existing.push(row);
      byBiomarker.set(row.biomarker, existing);
    }

    const sortedByDate = (items: typeof allResults) => [...items].sort((a, b) => a.labDate.localeCompare(b.labDate));

    return (Object.keys(DOMAIN_META) as DomainId[]).map((id) => {
      const categories = new Set(DOMAIN_META[id].categories);
      const relevant = allResults.filter((r) => categories.has(r.category));
      const sample = new Set(relevant.map((r) => r.biomarker)).size;

      if (relevant.length === 0) {
        return {
          id,
          label: DOMAIN_META[id].label,
          hint: DOMAIN_META[id].hint,
          score: null,
          delta: 0,
          sample,
          status: null,
        };
      }

      let latestScoreTotal = 0;
      let latestCount = 0;
      let previousScoreTotal = 0;
      let previousCount = 0;
      let worst: Status = "optimal";

      for (const values of byBiomarker.values()) {
        const scoped = values.filter((v) => categories.has(v.category));
        if (scoped.length === 0) continue;
        const sorted = sortedByDate(scoped);
        const latest = sorted[sorted.length - 1];
        const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;

        latestScoreTotal += STATUS_WEIGHT[latest.status as Status] ?? 50;
        latestCount += 1;
        if (previous) {
          previousScoreTotal += STATUS_WEIGHT[previous.status as Status] ?? 50;
          previousCount += 1;
        }
        if ((STATUS_WEIGHT[latest.status as Status] ?? 50) < (STATUS_WEIGHT[worst] ?? 100)) {
          worst = latest.status as Status;
        }
      }

      const score = latestCount > 0 ? Math.round(latestScoreTotal / latestCount) : null;
      const previousScore = previousCount > 0 ? previousScoreTotal / previousCount : null;
      const delta = score != null && previousScore != null ? Math.round(score - previousScore) : 0;

      return {
        id,
        label: DOMAIN_META[id].label,
        hint: DOMAIN_META[id].hint,
        score,
        delta,
        sample,
        status: score == null ? null : worst,
      };
    });
  }, [allResults]);

  const focusBiomarker = useMemo(() => {
    if (!allResults || allResults.length === 0 || !biomarkers || biomarkers.length === 0) return null;

    const latestConcern = [...biomarkers].sort((a, b) => {
      const wa = STATUS_WEIGHT[a.status as Status] ?? 50;
      const wb = STATUS_WEIGHT[b.status as Status] ?? 50;
      return wa - wb;
    })[0];

    const history = allResults
      .filter((r) => r.biomarker === latestConcern.biomarker)
      .sort((a, b) => a.labDate.localeCompare(b.labDate))
      .slice(-6);

    const previous = history.length > 1 ? history[history.length - 2] : null;
    const delta = previous ? Number((latestConcern.value - previous.value).toFixed(2)) : null;

    return { latest: latestConcern, history, delta };
  }, [allResults, biomarkers]);

  const upcoming = useMemo(() => {
    const items: Array<{ title: string; subtitle: string; href: string }> = [];

    if (daysUntilRetest != null) {
      if (daysUntilRetest <= 0) {
        items.push({
          title: "Retest overdue",
          subtitle: `${Math.abs(daysUntilRetest)} day${Math.abs(daysUntilRetest) === 1 ? "" : "s"} overdue from 90-day cadence`,
          href: "/upload",
        });
      } else {
        items.push({
          title: "Next retest window",
          subtitle: `${daysUntilRetest} day${daysUntilRetest === 1 ? "" : "s"} remaining`,
          href: "/upload",
        });
      }
    }

    items.push({
      title: todayCheckin ? "Check-in logged" : "Check-in pending",
      subtitle: todayCheckin ? "You can update entries before end of day" : "Log today to protect consistency score",
      href: "/checkin",
    });

    if (uploads && uploads.length > 0) {
      items.push({
        title: "Latest analysis",
        subtitle: `${TEST_TYPE_LABELS[uploads[0].testType] ?? uploads[0].testType} • ${formatDate(uploads[0].uploadedAt, { month: "short", day: "numeric", year: "numeric" })}`,
        href: `/results/${uploads[0]._id}`,
      });
    }

    return items.slice(0, 3);
  }, [daysUntilRetest, todayCheckin, uploads]);

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg-primary)" }}>
      <Nav />

      <main id="main-content" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION_NORMAL, ease: EASE_OUT }}
          className="mb-8"
        >
          <h1 className="text-2xl font-black md:text-3xl" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            Daily Decision Cockpit
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Status • trend • next best action
          </p>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={stagger} className="grid gap-5 lg:grid-cols-12">
          <motion.div variants={fadeUp} className="lg:col-span-8">
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  Today’s priorities
                </h2>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  Top {priorities.length}
                </span>
              </div>
              <div className="space-y-3">
                {priorities.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border p-4"
                    style={{
                      background: item.level === "high" ? "rgba(239,68,68,0.06)" : "var(--bg-secondary)",
                      borderColor: item.level === "high" ? "rgba(239,68,68,0.25)" : "var(--border-subtle)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--text-secondary)" }}>{item.reason}</p>
                        <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>{item.impact}</p>
                      </div>
                      <Link
                        href={item.href}
                        className="shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-opacity hover:opacity-85"
                        style={{ background: "var(--accent-teal)", color: "var(--bg-primary)" }}
                      >
                        {item.cta}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} className="lg:col-span-4">
            <Card className="p-6">
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                Protocol adherence
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Last 7 days behavior signal
              </p>

              <div className="mt-5 space-y-3">
                {[
                  { label: "Supplements", value: adherence.supplementRate },
                  { label: "Workouts", value: adherence.workoutRate },
                  { label: "Check-in streak", value: streak ?? 0, suffix: "d" },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                      <span>{item.label}</span>
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                        {item.suffix ? `${item.value}${item.suffix}` : `${item.value}%`}
                      </span>
                    </div>
                    {!item.suffix && (
                      <div className="h-2 rounded-full" style={{ background: "var(--bg-secondary)" }}>
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${Math.min(100, item.value)}%`, background: "var(--accent-teal)" }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-lg border p-3" style={{ borderColor: "var(--border-subtle)", background: "var(--bg-secondary)" }}>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Health score</p>
                <p className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  {healthScore?.overall ?? "--"}
                </p>
              </div>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} className="lg:col-span-12">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {domainCards.map((domain) => (
                <Card key={domain.id} className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                      {domain.label}
                    </h3>
                    {domain.status ? <StatusChip status={domain.status} /> : null}
                  </div>
                  <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>{domain.hint}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <p className="text-3xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                      {domain.score ?? "--"}
                    </p>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: domain.delta >= 0 ? "var(--status-optimal)" : "var(--status-critical)" }}
                    >
                      {domain.delta >= 0 ? "▲" : "▼"} {Math.abs(domain.delta)}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                    Based on {domain.sample} biomarker{domain.sample === 1 ? "" : "s"}
                  </p>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="lg:col-span-8">
            <Card className="p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                  Biomarker focus
                </h2>
                <Link href="/progress" className="text-xs font-medium" style={{ color: "var(--accent-teal)" }}>
                  Open full trends →
                </Link>
              </div>

              {!focusBiomarker ? (
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>Upload at least one test to unlock trend focus.</p>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-3">
                    <p className="text-xl font-black" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                      {focusBiomarker.latest.biomarker}
                    </p>
                    <StatusChip status={focusBiomarker.latest.status as Status} />
                    <span className="text-sm font-semibold" style={{ color: STATUS_COLOR[focusBiomarker.latest.status as Status] }}>
                      {focusBiomarker.latest.value} {focusBiomarker.latest.unit}
                    </span>
                    {focusBiomarker.delta != null && (
                      <span className="text-xs" style={{ color: focusBiomarker.delta <= 0 ? "var(--status-optimal)" : "var(--status-critical)" }}>
                        {focusBiomarker.delta <= 0 ? "Improving" : "Worsening"} ({focusBiomarker.delta > 0 ? "+" : ""}{focusBiomarker.delta})
                      </span>
                    )}
                  </div>

                  <div className="flex items-end gap-2">
                    {focusBiomarker.history.map((point, index) => {
                      const height = Math.max(16, Math.min(84, Math.round((point.value / (focusBiomarker.latest.referenceRangeHigh || 1)) * 64)));
                      return (
                        <div key={`${point.labDate}-${index}`} className="flex flex-col items-center gap-1">
                          <div
                            className="w-8 rounded-t-md"
                            style={{
                              height,
                              background: point.status === "optimal" || point.status === "normal" ? "var(--status-optimal)" : "var(--status-suboptimal)",
                              opacity: index === focusBiomarker.history.length - 1 ? 1 : 0.55,
                            }}
                          />
                          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                            {formatDate(point.labDate, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs" style={{ color: "var(--text-secondary)" }}>
                    Optimal target: {focusBiomarker.latest.optimalRangeLow} - {focusBiomarker.latest.optimalRangeHigh} {focusBiomarker.latest.unit}
                  </p>
                </>
              )}
            </Card>
          </motion.div>

          <motion.div variants={fadeUp} className="lg:col-span-4">
            <Card className="p-6">
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                Upcoming actions
              </h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
                Time-based reminders
              </p>

              <div className="mt-4 space-y-3">
                {upcoming.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="block rounded-xl border p-3 transition-colors hover:bg-[var(--bg-secondary)]"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>{item.subtitle}</p>
                  </Link>
                ))}
              </div>

              <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                <Link href="/upload" className="text-xs font-medium" style={{ color: "var(--accent-teal)" }}>
                  + Upload new report
                </Link>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
