"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUpCustom, EASE_OUT, DURATION_SLOW } from "@/lib/animations";

const fadeUp = fadeUpCustom(0.08, DURATION_SLOW);

const biomarkers = [
  { name: "Vitamin D", value: "28", unit: "ng/mL", status: "suboptimal" as const },
  { name: "Testosterone", value: "742", unit: "ng/dL", status: "optimal" as const },
  { name: "hs-CRP", value: "2.4", unit: "mg/L", status: "suboptimal" as const },
  { name: "HbA1c", value: "5.1", unit: "%", status: "optimal" as const },
  { name: "Ferritin", value: "45", unit: "ng/mL", status: "normal" as const },
  { name: "TSH", value: "3.8", unit: "mIU/L", status: "suboptimal" as const },
];

const statusColor = {
  optimal: "text-[var(--status-optimal)]",
  normal: "text-[var(--status-normal)]",
  suboptimal: "text-[var(--status-suboptimal)]",
  critical: "text-[var(--status-critical)]",
};

const statusDot = {
  optimal: "bg-[var(--status-optimal)]",
  normal: "bg-[var(--status-normal)]",
  suboptimal: "bg-[var(--status-suboptimal)]",
  critical: "bg-[var(--status-critical)]",
};

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <div className="pointer-events-none absolute top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]" style={{ background: "var(--accent-teal)" }} />
      <div className="pointer-events-none absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full opacity-10 blur-[100px]" style={{ background: "var(--accent-teal)" }} />

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-teal)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bg-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
            BioTransform
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/auth"
            className="text-sm font-medium transition-colors hover:opacity-80"
            style={{ color: "var(--text-secondary)" }}
          >
            Sign In
          </Link>
          <Link
            href="/auth"
            className="rounded-lg px-5 py-2.5 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "var(--accent-teal)",
              color: "var(--bg-primary)",
            }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main id="main-content" className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-32 md:px-12 md:pt-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
          <div>
            <motion.div
              initial="hidden"
              animate="visible"
              custom={0}
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: "var(--border-medium)",
                color: "var(--accent-teal)",
                background: "var(--accent-teal-glow)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--accent-teal)" }} />
              AI-Powered Health Analysis
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              custom={1}
              variants={fadeUp}
              className="text-4xl font-black leading-[1.08] text-balance md:text-6xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Decode your
              <br />
              <span style={{ color: "var(--accent-teal)" }}>bloodwork.</span>
              <br />
              Optimize your
              <br />
              biology.
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="visible"
              custom={2}
              variants={fadeUp}
              className="mt-6 max-w-md text-base leading-relaxed md:text-lg"
              style={{ color: "var(--text-secondary)" }}
            >
              Upload your lab results. Our AI analyzes 50+ biomarkers against
              functional optimal ranges — not just &quot;normal&quot; — and builds your
              personalized supplement stack, nutrition plan, and training program.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={3}
              variants={fadeUp}
              className="mt-8 flex items-center gap-4"
            >
              <Link
                href="/auth"
                className="group relative rounded-xl px-7 py-3.5 text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "var(--accent-teal)",
                  color: "var(--bg-primary)",
                }}
              >
                Start Free Analysis
                <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                No credit card required
              </span>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              custom={4}
              variants={fadeUp}
              className="mt-12 flex items-center gap-8"
            >
              {[
                { label: "Biomarkers Analyzed", value: "50+" },
                { label: "Optimal Ranges", value: "Functional" },
                { label: "Recommended Cadence", value: "90 days" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-lg font-bold tabular-nums" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40, rotateY: -5 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ delay: 0.2, duration: 0.5, ease: EASE_OUT }}
            className="relative"
          >
            <div
              className="rounded-2xl border p-6 backdrop-blur-sm"
              style={{
                background: "var(--bg-card)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                    Biomarker Overview
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    Latest blood panel results
                  </div>
                </div>
                <div
                  className="rounded-lg px-3 py-1 text-xs font-medium"
                  style={{
                    background: "var(--accent-teal-glow)",
                    color: "var(--accent-teal)",
                  }}
                >
                  6 markers
                </div>
              </div>

              <div className="space-y-3">
                {biomarkers.map((bm, i) => (
                  <motion.div
                    key={bm.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.06, duration: 0.25, ease: EASE_OUT }}
                    className="flex items-center justify-between rounded-xl border px-4 py-3"
                    style={{
                      borderColor: "var(--border-subtle)",
                      background: "var(--bg-secondary)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${statusDot[bm.status]}`} />
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {bm.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold tabular-nums ${statusColor[bm.status]}`}>
                        {bm.value}
                      </span>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {bm.unit}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  3 markers need attention
                </div>
                <div
                  className="text-xs font-medium"
                  style={{ color: "var(--accent-teal)" }}
                >
                  View full analysis →
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.3, ease: EASE_OUT }}
              className="absolute -bottom-6 -left-6 rounded-xl border p-4 backdrop-blur-md"
              style={{
                background: "rgba(22, 22, 42, 0.9)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Recommended
              </div>
              <div className="mt-1 text-sm font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}>
                Vitamin D3 + K2
              </div>
              <div className="text-xs" style={{ color: "var(--accent-teal)" }}>
                5000 IU / morning
              </div>
            </motion.div>
          </motion.div>
        </div>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="mt-32"
        >
          <motion.div custom={0} variants={fadeUp} className="text-center mb-16">
            <h2
              className="text-3xl font-black text-balance md:text-4xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              From raw data to{" "}
              <span style={{ color: "var(--accent-teal)" }}>actionable protocol</span>
            </h2>
            <p className="mt-4 mx-auto max-w-lg text-base" style={{ color: "var(--text-secondary)" }}>
              Three steps. Upload once every 90 days. Track your regression toward optimal health.
            </p>
          </motion.div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload",
                desc: "Drop your bloodwork PDF. Our AI reads Quest, LabCorp, and 100+ lab formats.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Analyze",
                desc: "50+ biomarkers mapped to functional optimal ranges. Risk areas identified. Correlations found.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Optimize",
                desc: "Personalized supplement stack, nutrition framework, and training program built for your biology.",
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                    <polyline points="16 7 22 7 22 13" />
                  </svg>
                ),
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.step}
                custom={i + 1}
                variants={fadeUp}
                className="group relative rounded-2xl border p-8 transition-colors"
                style={{
                  background: "var(--bg-card)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                <div
                  className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    background: "var(--accent-teal-glow)",
                    color: "var(--accent-teal)",
                  }}
                >
                  {feature.icon}
                </div>
                <div
                  className="text-xs font-bold uppercase mb-2"
                  style={{ color: "var(--accent-teal)" }}
                >
                  Step {feature.step}
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-32 text-center"
        >
          <motion.div
            custom={0}
            variants={fadeUp}
            className="rounded-3xl border p-12 md:p-16"
            style={{
              background: "var(--bg-card)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <h2
              className="text-3xl font-black text-balance md:text-4xl"
              style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
            >
              Stop guessing. Start optimizing.
            </h2>
            <p className="mt-4 mx-auto max-w-md text-base" style={{ color: "var(--text-secondary)" }}>
              Your bloodwork holds the answers. We just make them readable — and actionable.
            </p>
            <Link
              href="/auth"
              className="mt-8 inline-block rounded-xl px-8 py-4 text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: "var(--accent-teal)",
                color: "var(--bg-primary)",
              }}
            >
              Upload Your First Test →
            </Link>
          </motion.div>
        </motion.section>

        <footer className="mt-20 flex items-center justify-between border-t py-8" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            © 2026 BioTransform. Not medical advice.
          </div>
          <div className="flex gap-6 text-xs" style={{ color: "var(--text-tertiary)" }}>
            <Link href="/settings" className="hover:opacity-80 transition-opacity">Privacy</Link>
            <Link href="/settings" className="hover:opacity-80 transition-opacity">Terms</Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
