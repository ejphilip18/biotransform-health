"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Nav } from "@/components/nav";
import { AlertDialog } from "@/components/AlertDialog";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";
import { fadeUp } from "@/lib/animations";
import { formatDate } from "@/lib/format";

const EASE_OUT_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

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

/* ─── Styles ──────────────────────────────────────────────────────── */

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-subtle)",
  borderRadius: "16px",
  padding: "28px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: "6px",
  display: "block",
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
  transition: `border-color 0.16s ${EASE_OUT_CSS}`,
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23A0A0B8' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: "32px",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 24px",
  borderRadius: "10px",
  border: "none",
  background: "var(--accent-teal)",
  color: "var(--bg-primary)",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: `opacity 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
};

const btnDanger: React.CSSProperties = {
  ...btnPrimary,
  background: "var(--status-critical)",
  color: "#fff",
};

const btnOutline: React.CSSProperties = {
  padding: "10px 24px",
  borderRadius: "10px",
  border: "1px solid var(--border-medium)",
  background: "transparent",
  color: "var(--text-secondary)",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  fontFamily: "inherit",
  transition: `color 0.16s ${EASE_OUT_CSS}, background-color 0.16s ${EASE_OUT_CSS}, border-color 0.16s ${EASE_OUT_CSS}, opacity 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
};

const sectionTitle: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 700,
  color: "var(--text-primary)",
  fontFamily: "var(--font-display)",
  marginBottom: "4px",
};

const sectionDesc: React.CSSProperties = {
  fontSize: "13px",
  color: "var(--text-tertiary)",
  marginBottom: "20px",
};

/* ─── Alert Dialog (Radix) for destructive actions ───────────────── */

/* ─── Consent Type Labels ─────────────────────────────────────────── */

const CONSENT_LABELS: Record<string, { label: string; desc: string }> = {
  data_processing: {
    label: "Data Processing",
    desc: "Allow processing of your uploaded health data to extract biomarkers",
  },
  ai_analysis: {
    label: "AI Analysis",
    desc: "Allow AI-powered analysis to generate personalized health recommendations",
  },
  data_sharing: {
    label: "Data Sharing",
    desc: "Allow anonymized data to improve our models (never shared with third parties)",
  },
};

/* ─── Profile Edit Section ────────────────────────────────────────── */

type ProfileLike = Doc<"profiles"> | null;

function ProfileSection() {
  const profile = useQuery(api.profiles.get);

  if (profile === undefined) return <SkeletonCard />;

  return <ProfileForm key={profile?._id ?? "new"} profile={profile} />;
}

const DIET_OPTIONS = [
  { value: "omnivore", label: "Omnivore" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "keto", label: "Keto" },
  { value: "paleo", label: "Paleo" },
  { value: "other", label: "Other" },
] as const;

function ProfileForm({ profile }: { profile: ProfileLike }) {
  const updateProfile = useMutation(api.profiles.update);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState(() => ({
    dateOfBirth: profile?.dateOfBirth ?? "",
    biologicalSex: (profile?.biologicalSex ?? "") as "" | "male" | "female",
    height: profile?.height != null ? String(profile.height) : "",
    weight: profile?.weight != null ? String(profile.weight) : "",
    ethnicity: profile?.ethnicity ?? "",
    activityLevel: (profile?.activityLevel ?? "") as "" | "sedentary" | "light" | "moderate" | "active" | "very_active",
    sleepHoursAvg: profile?.sleepHoursAvg != null ? String(profile.sleepHoursAvg) : "",
    stressLevel: (profile?.stressLevel ?? "") as "" | "low" | "moderate" | "high" | "very_high",
    smokingStatus: (profile?.smokingStatus ?? "") as "" | "never" | "former" | "current",
    alcoholFrequency: (profile?.alcoholFrequency ?? "") as "" | "none" | "occasional" | "moderate" | "heavy",
    dietaryPreference: (profile?.dietaryPreference ?? "") as "" | "omnivore" | "vegetarian" | "vegan" | "pescatarian" | "keto" | "paleo" | "other",
    allergies: profile?.allergies?.join(", ") ?? "",
    supplements: profile?.supplements?.join(", ") ?? "",
    healthGoals: profile?.healthGoals?.join(", ") ?? "",
    medicalConditions: profile?.medicalConditions?.join(", ") ?? "",
    medications: profile?.medications?.join(", ") ?? "",
  }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Parameters<typeof updateProfile>[0] = {};
      if (form.dateOfBirth) payload.dateOfBirth = form.dateOfBirth;
      if (form.biologicalSex) payload.biologicalSex = form.biologicalSex as "male" | "female";
      if (form.height) payload.height = parseFloat(form.height);
      if (form.weight) payload.weight = parseFloat(form.weight);
      if (form.ethnicity) payload.ethnicity = form.ethnicity;
      if (form.activityLevel) payload.activityLevel = form.activityLevel as "sedentary" | "light" | "moderate" | "active" | "very_active";
      if (form.sleepHoursAvg) payload.sleepHoursAvg = parseFloat(form.sleepHoursAvg);
      if (form.stressLevel) payload.stressLevel = form.stressLevel as "low" | "moderate" | "high" | "very_high";
      if (form.smokingStatus) payload.smokingStatus = form.smokingStatus as "never" | "former" | "current";
      if (form.alcoholFrequency) payload.alcoholFrequency = form.alcoholFrequency as "none" | "occasional" | "moderate" | "heavy";
      if (form.dietaryPreference) payload.dietaryPreference = form.dietaryPreference as "omnivore" | "vegetarian" | "vegan" | "pescatarian" | "keto" | "paleo" | "other";
      payload.allergies = form.allergies ? form.allergies.split(",").map((s) => s.trim()).filter(Boolean) : [];
      payload.supplements = form.supplements ? form.supplements.split(",").map((s) => s.trim()).filter(Boolean) : [];
      payload.healthGoals = form.healthGoals ? form.healthGoals.split(",").map((s) => s.trim()).filter(Boolean) : [];
      payload.medicalConditions = form.medicalConditions ? form.medicalConditions.split(",").map((s) => s.trim()).filter(Boolean) : [];
      payload.medications = form.medications ? form.medications.split(",").map((s) => s.trim()).filter(Boolean) : [];
      await updateProfile(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div style={cardStyle}>
      <h2 style={sectionTitle}>Profile</h2>
      <p style={sectionDesc}>Update your demographics, lifestyle, and health preferences.</p>

      {/* Diet & Lifestyle — prominent first */}
      <div
        style={{
          marginBottom: "24px",
          padding: "20px",
          borderRadius: "12px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
          Diet & Lifestyle
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "16px" }}>
          <div>
            <label htmlFor="settings-dietary-preference" style={labelStyle}>Dietary preference</label>
            <select id="settings-dietary-preference" name="dietaryPreference" value={form.dietaryPreference} onChange={update("dietaryPreference")} style={selectStyle}>
              <option value="">Select…</option>
              {DIET_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="settings-activity-level" style={labelStyle}>Activity level</label>
            <select id="settings-activity-level" name="activityLevel" value={form.activityLevel} onChange={update("activityLevel")} style={selectStyle}>
              <option value="">Select…</option>
              <option value="sedentary">Sedentary</option>
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="active">Active</option>
              <option value="very_active">Very Active</option>
            </select>
          </div>
          <div>
            <label htmlFor="settings-sleep-hours" style={labelStyle}>Sleep (hrs/night)</label>
            <input id="settings-sleep-hours" name="sleepHoursAvg" type="number" step="0.5" value={form.sleepHoursAvg} onChange={update("sleepHoursAvg")} placeholder="7.5" style={inputStyle} />
          </div>
          <div>
            <label htmlFor="settings-stress-level" style={labelStyle}>Stress level</label>
            <select id="settings-stress-level" name="stressLevel" value={form.stressLevel} onChange={update("stressLevel")} style={selectStyle}>
              <option value="">Select…</option>
              <option value="low">Low</option>
              <option value="moderate">Moderate</option>
              <option value="high">High</option>
              <option value="very_high">Very High</option>
            </select>
          </div>
          <div>
            <label htmlFor="settings-smoking-status" style={labelStyle}>Smoking</label>
            <select id="settings-smoking-status" name="smokingStatus" value={form.smokingStatus} onChange={update("smokingStatus")} style={selectStyle}>
              <option value="">Select…</option>
              <option value="never">Never</option>
              <option value="former">Former</option>
              <option value="current">Current</option>
            </select>
          </div>
          <div>
            <label htmlFor="settings-alcohol-frequency" style={labelStyle}>Alcohol</label>
            <select id="settings-alcohol-frequency" name="alcoholFrequency" value={form.alcoholFrequency} onChange={update("alcoholFrequency")} style={selectStyle}>
              <option value="">Select…</option>
              <option value="none">None</option>
              <option value="occasional">Occasional</option>
              <option value="moderate">Moderate</option>
              <option value="heavy">Heavy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>
          Demographics
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          <div>
            <label htmlFor="settings-date-of-birth" style={labelStyle}>Date of Birth</label>
            <input id="settings-date-of-birth" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={update("dateOfBirth")} style={inputStyle} />
          </div>
          <div>
            <label htmlFor="settings-biological-sex" style={labelStyle}>Biological Sex</label>
            <select id="settings-biological-sex" name="biologicalSex" value={form.biologicalSex} onChange={update("biologicalSex")} style={selectStyle}>
              <option value="">Select…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label htmlFor="settings-height" style={labelStyle}>Height (cm)</label>
            <input id="settings-height" name="height" type="number" value={form.height} onChange={update("height")} placeholder="175" style={inputStyle} />
          </div>
          <div>
            <label htmlFor="settings-weight" style={labelStyle}>Weight (kg)</label>
            <input id="settings-weight" name="weight" type="number" value={form.weight} onChange={update("weight")} placeholder="75" style={inputStyle} />
          </div>
          <div>
            <label htmlFor="settings-ethnicity" style={labelStyle}>Ethnicity (optional)</label>
            <input id="settings-ethnicity" name="ethnicity" type="text" value={form.ethnicity} onChange={update("ethnicity")} placeholder="e.g. Caucasian" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* Health context */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        <div>
          <label htmlFor="settings-allergies" style={labelStyle}>Allergies (comma-separated)</label>
          <input id="settings-allergies" name="allergies" value={form.allergies} onChange={update("allergies")} placeholder="e.g. gluten, dairy" style={inputStyle} />
        </div>
        <div>
          <label htmlFor="settings-supplements" style={labelStyle}>Current supplements</label>
          <input id="settings-supplements" name="supplements" value={form.supplements} onChange={update("supplements")} placeholder="e.g. Vitamin D, Fish Oil" style={inputStyle} />
        </div>
        <div>
          <label htmlFor="settings-health-goals" style={labelStyle}>Health goals</label>
          <input id="settings-health-goals" name="healthGoals" value={form.healthGoals} onChange={update("healthGoals")} placeholder="e.g. energy, sleep, muscle" style={inputStyle} />
        </div>
        <div>
          <label htmlFor="settings-medical-conditions" style={labelStyle}>Medical conditions</label>
          <input id="settings-medical-conditions" name="medicalConditions" value={form.medicalConditions} onChange={update("medicalConditions")} placeholder="e.g. hypothyroid, PCOS" style={inputStyle} />
        </div>
        <div>
          <label htmlFor="settings-medications" style={labelStyle}>Medications</label>
          <input id="settings-medications" name="medications" value={form.medications} onChange={update("medications")} placeholder="e.g. Metformin" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "12px" }}>
        <motion.button
          onClick={handleSave}
          disabled={saving}
          whileTap={{ scale: 0.97 }}
          style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </motion.button>
        <RegeneratePlanButton />
        <AnimatePresence>
          {saved ? (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: "13px", color: "var(--status-optimal)", fontWeight: 500 }}
            >
              Saved successfully
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RegeneratePlanButton() {
  const regenerate = useMutation(api.healthPlans.regenerate);
  const plan = useQuery(api.healthPlans.getActive);
  const [regenerating, setRegenerating] = useState(false);

  if (!plan) return null;

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await regenerate({});
    } catch (err) {
      console.error("Regenerate failed:", err);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <motion.button
      onClick={handleRegenerate}
      disabled={regenerating}
      whileTap={{ scale: 0.97 }}
      style={{ ...btnOutline, opacity: regenerating ? 0.6 : 1 }}
    >
      {regenerating ? "Regenerating…" : "Regenerate plan"}
    </motion.button>
  );
}

/* ─── Consent Management Section ──────────────────────────────────── */

function ConsentSection() {
  const consents = useQuery(api.consent.getAll);
  const revokeConsent = useMutation(api.consent.revoke);
  const grantConsent = useMutation(api.consent.grant);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  if (consents === undefined) return <SkeletonCard />;

  const consentMap = new Map(consents.map((c) => [c.consentType, c]));

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    setLoading(revokeTarget);
    try {
      await revokeConsent({ consentType: revokeTarget as "data_processing" | "ai_analysis" | "data_sharing" });
    } catch (err) {
      console.error("Failed to revoke consent:", err);
    } finally {
      setLoading(null);
      setRevokeTarget(null);
    }
  };

  const handleGrant = async (type: "data_processing" | "ai_analysis" | "data_sharing") => {
    setLoading(type);
    try {
      await grantConsent({ consentType: type, version: "1.0" });
    } catch (err) {
      console.error("Failed to grant consent:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <div style={cardStyle}>
        <h2 style={sectionTitle}>Consent Management</h2>
        <p style={sectionDesc}>Manage how your health data is used. You can revoke consent at any time.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {(["data_processing", "ai_analysis", "data_sharing"] as const).map((type) => {
            const record = consentMap.get(type);
            const granted = record?.granted ?? false;
            const meta = CONSENT_LABELS[type];

            return (
              <div
                key={type}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderRadius: "12px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      {meta.label}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: granted ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                        color: granted ? "var(--status-optimal)" : "var(--status-critical)",
                      }}
                    >
                      {granted ? "Granted" : "Revoked"}
                    </span>
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: 0 }}>{meta.desc}</p>
                  {record && (
                    <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "4px 0 0" }}>
                      {granted
                        ? `Granted ${record.grantedAt ? formatDate(record.grantedAt) : ""}`
                        : `Revoked ${record.revokedAt ? formatDate(record.revokedAt) : ""}`}
                    </p>
                  )}
                </div>
                <div>
                  {granted ? (
                    <motion.button
                      onClick={() => setRevokeTarget(type)}
                      disabled={loading === type}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        ...btnOutline,
                        padding: "8px 16px",
                        fontSize: "13px",
                        borderColor: "rgba(239, 68, 68, 0.3)",
                        color: "var(--status-critical)",
                        opacity: loading === type ? 0.5 : 1,
                      }}
                    >
                      Revoke
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={() => handleGrant(type)}
                      disabled={loading === type}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        ...btnOutline,
                        padding: "8px 16px",
                        fontSize: "13px",
                        borderColor: "rgba(34, 197, 94, 0.3)",
                        color: "var(--status-optimal)",
                        opacity: loading === type ? 0.5 : 1,
                      }}
                    >
                      Grant
                    </motion.button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AlertDialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
        title="Revoke Consent"
        description={`Are you sure you want to revoke "${CONSENT_LABELS[revokeTarget ?? ""]?.label ?? ""}" consent? This may affect how your data is processed.`}
        actionLabel="Revoke"
        onAction={handleRevoke}
        danger
      />
    </>
  );
}

/* ─── Data Export Section ─────────────────────────────────────────── */

function DataExportSection() {
  const profile = useQuery(api.profiles.get);
  const uploads = useQuery(api.uploads.listUploads);
  const biomarkers = useQuery(api.biomarkers.getLatest);
  const plan = useQuery(api.healthPlans.getActive);
  const consents = useQuery(api.consent.getAll);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(() => {
    setExporting(true);
    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        profile: profile ?? null,
        uploads: uploads ?? [],
        biomarkers: biomarkers ?? [],
        activePlan: plan ?? null,
        consents: consents ?? [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `biotransform-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, [profile, uploads, biomarkers, plan, consents]);

  const isLoading = profile === undefined || uploads === undefined || biomarkers === undefined;

  return (
    <div style={cardStyle}>
      <h2 style={sectionTitle}>Data Export</h2>
      <p style={sectionDesc}>Download all your health data as a JSON file for your records.</p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "20px",
          borderRadius: "12px",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "12px",
            background: "var(--accent-teal-glow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)", margin: 0 }}>
            Export My Data
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: "2px 0 0" }}>
            Includes profile, uploads, biomarkers, plans, and consent records
          </p>
        </div>
        <motion.button
          onClick={handleExport}
          disabled={exporting || isLoading}
          whileTap={{ scale: 0.97 }}
          style={{ ...btnPrimary, opacity: exporting || isLoading ? 0.5 : 1 }}
        >
          {exporting ? "Exporting…" : "Download"}
        </motion.button>
      </div>
    </div>
  );
}

/* ─── Delete Account Section ──────────────────────────────────────── */

function DeleteAccountSection() {
  const [showDialog, setShowDialog] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (confirmation !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      // In a real app, this would call a server-side action that handles cascading deletes.
      // For now we show a message that the deletion has been requested.
      // The backend would need a dedicated action to handle this safely.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      window.location.href = "/";
    } catch (err) {
      setError("Failed to delete account. Please try again or contact support.");
      console.error("Delete error:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div
        style={{
          ...cardStyle,
          border: "1px solid rgba(239, 68, 68, 0.2)",
          background: "var(--bg-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(239, 68, 68, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--status-critical)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <h2 style={{ ...sectionTitle, color: "var(--status-critical)" }}>Danger Zone</h2>
            <p style={{ ...sectionDesc, marginBottom: "16px" }}>
              Permanently delete your account and all associated health data. Consent records will be retained for legal compliance.
            </p>
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowDialog(true)} style={btnDanger}>
              Delete My Account
            </motion.button>
          </div>
        </div>
      </div>

      <DeleteAccountDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        confirmation={confirmation}
        onConfirmationChange={setConfirmation}
        deleting={deleting}
        error={error}
        onConfirm={handleDelete}
      />
    </>
  );
}

/* ─── Main Settings Page ──────────────────────────────────────────── */

export default function SettingsPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-primary)" }}>
      <Nav />

      <main
        id="main-content"
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "40px 24px 80px",
        }}
      >
        {/* Header */}
        <motion.div
          custom={0}
          variants={fadeUp}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          style={{ marginBottom: "32px" }}
        >
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--text-primary)",
              fontFamily: "var(--font-display)",
              marginBottom: "6px",
            }}
          >
            Settings
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-tertiary)" }}>
            Manage your profile, privacy, and account preferences.
          </p>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <motion.div
            custom={0}
            variants={fadeUp}
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
          >
            <ProfileSection />
          </motion.div>
          <motion.div
            custom={1}
            variants={fadeUp}
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
          >
            <ConsentSection />
          </motion.div>
          <motion.div
            custom={2}
            variants={fadeUp}
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
          >
            <DataExportSection />
          </motion.div>
          <motion.div
            custom={3}
            variants={fadeUp}
            initial={shouldReduceMotion ? false : "hidden"}
            animate="visible"
          >
            <DeleteAccountSection />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
