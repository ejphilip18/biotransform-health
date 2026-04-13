"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence } from "framer-motion";
import { Nav } from "@/components/nav";
import { fadeUp, stagger, modalEnter, EASE_OUT, DURATION_NORMAL, DURATION_FAST, SCALE_ENTER_MIN } from "@/lib/animations";
import { formatDate } from "@/lib/format";

const modalOverlay = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalPanel = {
  ...modalEnter,
  exit: { ...modalEnter.exit, transition: { duration: DURATION_FAST } },
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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: "10px",
  border: "1px solid var(--border-medium)",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  fontSize: "14px",
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.15s ease",
};

const STATUS_COLORS: Record<string, string> = {
  optimal: "var(--status-optimal)",
  normal: "var(--status-normal)",
  suboptimal: "var(--status-suboptimal)",
  critical: "var(--status-critical)",
};

/* ─── Access Denied ───────────────────────────────────────────────── */

function AccessDenied() {
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
        <motion.div
          initial={{ opacity: 0, scale: SCALE_ENTER_MIN }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: DURATION_NORMAL, ease: EASE_OUT }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--status-critical)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              marginBottom: "8px",
            }}
          >
            Access Denied
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-tertiary)", maxWidth: "360px" }}>
            You don&apos;t have admin privileges. This page is restricted to administrators only.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Loading State ───────────────────────────────────────────────── */

function AdminLoading() {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <Nav />
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
        <SkeletonPulse width="200px" height="28px" />
        <div style={{ marginTop: "24px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={cardStyle}>
              <SkeletonPulse width="50%" height="14px" />
              <div style={{ marginTop: "12px" }}>
                <SkeletonPulse width="60%" height="32px" />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "24px", ...cardStyle }}>
          <SkeletonPulse width="30%" height="20px" />
          <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonPulse key={i} width="100%" height="48px" borderRadius="8px" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Stats Cards ─────────────────────────────────────────────────── */

function StatsCards() {
  const stats = useQuery(api.admin.getAggregateStats);

  if (stats === undefined) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={cardStyle}>
            <SkeletonPulse width="50%" height="12px" />
            <div style={{ marginTop: "12px" }}>
              <SkeletonPulse width="60%" height="28px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      label: "Total Users",
      value: stats.totalUsers,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: "var(--accent-teal)",
    },
    {
      label: "Total Uploads",
      value: stats.totalUploads,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-normal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      ),
      color: "var(--status-normal)",
    },
    {
      label: "Uploads This Month",
      value: stats.uploadsThisMonth,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-suboptimal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      color: "var(--status-suboptimal)",
    },
    {
      label: "Total Check-ins",
      value: stats.totalCheckins,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--status-optimal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 11 12 14 22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      ),
      color: "var(--status-optimal)",
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
      {cards.map((card, i) => (
        <motion.div key={card.label} custom={i} variants={fadeUp} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {card.label}
            </span>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: `${card.color}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {card.icon}
            </div>
          </div>
          <span
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
            }}
          >
            {card.value.toLocaleString()}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── User Detail Modal ───────────────────────────────────────────── */

function UserDetailModal({
  userId,
  onClose,
}: {
  userId: Id<"users">;
  onClose: () => void;
}) {
  const detail = useQuery(api.admin.getUserDetail, { targetUserId: userId });

  return (
    <motion.div
      variants={modalOverlay}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "24px",
      }}
    >
      <motion.div
        variants={modalPanel}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-medium)",
          borderRadius: "16px",
          padding: "28px",
          maxWidth: "720px",
          width: "100%",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
      >
        {/* Close button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
            }}
          >
            User Detail
          </h2>
          <button
            type="button"
            aria-label="Close user detail"
            onClick={onClose}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              background: "transparent",
              color: "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
            }}
          >
            &times;
          </button>
        </div>

        {!detail ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <SkeletonPulse width="60%" height="20px" />
            <SkeletonPulse width="100%" height="60px" borderRadius="10px" />
            <SkeletonPulse width="100%" height="80px" borderRadius="10px" />
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* User Info */}
            <div style={{ ...cardStyle, background: "var(--bg-tertiary)", padding: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Email</span>
                  <p style={{ fontSize: "14px", color: "var(--text-primary)", margin: "4px 0 0", fontWeight: 500 }}>
                    {detail.user.email ?? "N/A"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Role</span>
                  <p style={{ fontSize: "14px", color: "var(--text-primary)", margin: "4px 0 0", fontWeight: 500 }}>
                    {detail.user.role ?? "user"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Onboarded</span>
                  <p style={{ fontSize: "14px", color: detail.user.onboardingComplete ? "var(--status-optimal)" : "var(--text-secondary)", margin: "4px 0 0", fontWeight: 500 }}>
                    {detail.user.onboardingComplete ? "Yes" : "No"}
                  </p>
                </div>
                <div>
                  <span style={{ fontSize: "11px", color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Joined</span>
                  <p style={{ fontSize: "14px", color: "var(--text-primary)", margin: "4px 0 0", fontWeight: 500 }}>
                    {formatDate(detail.user._creationTime)}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Summary */}
            {detail.profile && (
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
                  Profile Summary
                </h3>
                <div style={{ ...cardStyle, background: "var(--bg-tertiary)", padding: "16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "13px", color: "var(--text-secondary)" }}>
                    {detail.profile.biologicalSex && <span>Sex: <strong style={{ color: "var(--text-primary)" }}>{detail.profile.biologicalSex}</strong></span>}
                    {detail.profile.height && <span>Height: <strong style={{ color: "var(--text-primary)" }}>{detail.profile.height} cm</strong></span>}
                    {detail.profile.weight && <span>Weight: <strong style={{ color: "var(--text-primary)" }}>{detail.profile.weight} kg</strong></span>}
                    {detail.profile.activityLevel && <span>Activity: <strong style={{ color: "var(--text-primary)" }}>{detail.profile.activityLevel}</strong></span>}
                    {detail.profile.dietaryPreference && <span>Diet: <strong style={{ color: "var(--text-primary)" }}>{detail.profile.dietaryPreference}</strong></span>}
                  </div>
                </div>
              </div>
            )}

            {/* Uploads */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
                Uploads ({detail.uploads.length})
              </h3>
              {detail.uploads.length === 0 ? (
                <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>No uploads yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {detail.uploads.slice(0, 5).map((upload) => (
                    <div
                      key={upload._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-subtle)",
                        fontSize: "13px",
                      }}
                    >
                      <span style={{ color: "var(--text-primary)" }}>{upload.testType} &mdash; {upload.labDate}</span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background:
                            upload.status === "complete" ? "rgba(34, 197, 94, 0.12)" :
                            upload.status === "failed" ? "rgba(239, 68, 68, 0.12)" :
                            "rgba(59, 130, 246, 0.12)",
                          color:
                            upload.status === "complete" ? "var(--status-optimal)" :
                            upload.status === "failed" ? "var(--status-critical)" :
                            "var(--status-normal)",
                        }}
                      >
                        {upload.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Latest Biomarkers */}
            {detail.latestBiomarkers.length > 0 && (
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
                  Latest Biomarkers ({detail.latestBiomarkers.length})
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "8px" }}>
                  {detail.latestBiomarkers.slice(0, 12).map((bm) => (
                    <div
                      key={bm._id}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-primary)" }}>{bm.biomarker}</span>
                        <span
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: STATUS_COLORS[bm.status] ?? "var(--text-tertiary)",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        {bm.value} {bm.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Plan */}
            {detail.activePlan && (
              <div>
                <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
                  Active Plan
                </h3>
                <div style={{ ...cardStyle, background: "var(--bg-tertiary)", padding: "16px" }}>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {detail.activePlan.summary}
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "10px" }}>
                    {detail.activePlan.keyFindings.slice(0, 4).map((finding, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "11px",
                          padding: "4px 10px",
                          borderRadius: "6px",
                          background: "var(--accent-teal-glow)",
                          color: "var(--accent-teal)",
                          fontWeight: 500,
                        }}
                      >
                        {finding.length > 50 ? finding.slice(0, 50) + "…" : finding}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Consent Records */}
            <div>
              <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "10px" }}>
                Consent Records
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {detail.consents.map((c) => (
                  <div
                    key={c._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      background: "var(--bg-tertiary)",
                      fontSize: "13px",
                    }}
                  >
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{c.consentType.replace(/_/g, " ")}</span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: c.granted ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: c.granted ? "var(--status-optimal)" : "var(--status-critical)",
                      }}
                    >
                      {c.granted ? "Granted" : "Revoked"}
                    </span>
                  </div>
                ))}
                {detail.consents.length === 0 && (
                  <p style={{ fontSize: "13px", color: "var(--text-tertiary)" }}>No consent records.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/* ─── User List Table ─────────────────────────────────────────────── */

function UserListTable() {
  const users = useQuery(api.admin.listUsers);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<Id<"users"> | null>(null);

  if (users === undefined) {
    return (
      <div style={cardStyle}>
        <SkeletonPulse width="30%" height="20px" />
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonPulse key={i} width="100%" height="48px" borderRadius="8px" />
          ))}
        </div>
      </div>
    );
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (u.email ?? "").toLowerCase().includes(q) ||
      (u.name ?? "").toLowerCase().includes(q)
    );
  });

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "10px 14px",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border-subtle)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "12px 14px",
    fontSize: "13px",
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-subtle)",
  };

  return (
    <>
      <motion.div custom={5} variants={fadeUp} style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)" }}>
            Users ({users.length})
          </h2>
          <div style={{ position: "relative", width: "260px" }}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-tertiary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              aria-label="Search users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users…"
              style={{ ...inputStyle, paddingLeft: "36px" }}
            />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Signup Date</th>
                <th style={thStyle}>Onboarded</th>
                <th style={thStyle}>Uploads</th>
                <th style={thStyle}>Consent</th>
                <th style={thStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, textAlign: "center", color: "var(--text-tertiary)", padding: "32px" }}>
                    {search ? "No users match your search." : "No users yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user._id}>
                    <td style={{ ...tdStyle, color: "var(--text-primary)", fontWeight: 500 }}>
                      {user.email ?? "N/A"}
                    </td>
                    <td style={tdStyle}>
                      {formatDate(user._creationTime)}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background: user.onboardingComplete ? "rgba(34, 197, 94, 0.12)" : "rgba(255, 255, 255, 0.04)",
                          color: user.onboardingComplete ? "var(--status-optimal)" : "var(--text-tertiary)",
                        }}
                      >
                        {user.onboardingComplete ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      {user.uploadCount}
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          display: "inline-block",
                          background: user.consentStatus ? "var(--status-optimal)" : "var(--text-tertiary)",
                          marginRight: "6px",
                        }}
                      />
                      {user.consentStatus ? "Active" : "None"}
                    </td>
                    <td style={tdStyle}>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(user._id)}
                        style={{
                          border: "1px solid var(--border-medium)",
                          background: "transparent",
                          color: "var(--text-primary)",
                          borderRadius: "8px",
                          padding: "4px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal
            userId={selectedUser}
            onClose={() => setSelectedUser(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Audit Logs ──────────────────────────────────────────────────── */

function AuditLogViewer() {
  const result = useQuery(api.admin.getAuditLogs, { limit: 50 });

  if (result === undefined) {
    return (
      <div style={cardStyle}>
        <SkeletonPulse width="30%" height="20px" />
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {[1, 2, 3].map((i) => (
            <SkeletonPulse key={i} width="100%" height="40px" borderRadius="8px" />
          ))}
        </div>
      </div>
    );
  }

  const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "10px 14px",
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text-tertiary)",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid var(--border-subtle)",
  };

  const tdStyle: React.CSSProperties = {
    padding: "10px 14px",
    fontSize: "13px",
    color: "var(--text-secondary)",
    borderBottom: "1px solid var(--border-subtle)",
  };

  return (
    <motion.div custom={6} variants={fadeUp} style={cardStyle}>
      <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", fontFamily: "var(--font-display)", marginBottom: "16px" }}>
        Audit Log
      </h2>

      {result.logs.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-tertiary)", textAlign: "center", padding: "24px" }}>
          No audit entries yet.
        </p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Resource</th>
                <th style={thStyle}>Actor</th>
              </tr>
            </thead>
            <tbody>
              {result.logs.map((log) => (
                <tr key={log._id}>
                  <td style={tdStyle}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={{ ...tdStyle, color: "var(--text-primary)", fontWeight: 500 }}>
                    {log.action.replace(/_/g, " ")}
                  </td>
                  <td style={tdStyle}>
                    {log.resource}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: "11px" }}>
                    {String(log.actorId).slice(-8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Main Admin Page ─────────────────────────────────────────────── */

export default function AdminPage() {
  const isAdmin = useQuery(api.users.isAdmin);

  if (isAdmin === undefined) return <AdminLoading />;
  if (!isAdmin) return <AccessDenied />;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <Nav />

      <motion.main
        id="main-content"
        initial="hidden"
        animate="visible"
        variants={stagger}
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        {/* Header */}
        <motion.div custom={0} variants={fadeUp} style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              letterSpacing: "-0.02em",
              marginBottom: "6px",
            }}
          >
            Admin Dashboard
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>
            Platform overview and user management.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <StatsCards />
          <UserListTable />
          <AuditLogViewer />
        </div>
      </motion.main>
    </div>
  );
}
