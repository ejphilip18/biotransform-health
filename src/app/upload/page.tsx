"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, EASE_OUT, DURATION_NORMAL } from "@/lib/animations";
import type { Id } from "../../../convex/_generated/dataModel";
import { Nav } from "@/components/nav";

/* ─── Types ───────────────────────────────────────────────────────── */

type TestType = "bloodwork" | "hormone" | "dna";
type UploadStatus = "idle" | "uploading" | "pending" | "processing" | "complete" | "failed";

const CATEGORIES: { type: TestType; label: string; icon: string }[] = [
  { type: "bloodwork", label: "Bloodwork", icon: "🩸" },
  { type: "hormone", label: "Hormones", icon: "🧬" },
  { type: "dna", label: "DNA", icon: "🧪" },
];

/* ─── Status Step Indicator ───────────────────────────────────────── */

const STEPS: { key: UploadStatus; label: string }[] = [
  { key: "uploading", label: "Uploading file" },
  { key: "pending", label: "Queued for analysis" },
  { key: "processing", label: "AI analyzing results" },
  { key: "complete", label: "Analysis complete" },
];

function StatusTracker({
  status,
  uploadId,
  testType,
}: {
  status: UploadStatus;
  uploadId: Id<"bloodworkUploads"> | null;
  testType: TestType;
}) {
  const upload = useQuery(
    api.uploads.getUpload,
    uploadId ? { uploadId } : "skip"
  );

  const liveStatus: UploadStatus = upload?.status ?? status;
  const isFailed = liveStatus === "failed";
  const stepIndex = STEPS.findIndex((s) => s.key === liveStatus);
  const typeLabel = CATEGORIES.find((c) => c.type === testType)?.label ?? testType;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION_NORMAL, ease: EASE_OUT }}
      className="rounded-2xl border p-6"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <h3
        className="mb-5 text-sm font-semibold"
        style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
      >
        {typeLabel} — Processing Status
      </h3>

      {isFailed ? (
        <div className="rounded-xl px-4 py-4 text-center" style={{ background: "rgba(239,68,68,0.08)" }}>
          <div className="mb-2 text-2xl">⚠️</div>
          <p className="text-sm font-medium" style={{ color: "var(--status-critical)" }}>
            Analysis Failed
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
            {upload?.errorMessage || "Something went wrong. Please try uploading again."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const isActive = i === stepIndex;
            const isDone = i < stepIndex || liveStatus === "complete";
            const isPending = i > stepIndex;

            return (
              <div key={step.key} className="flex items-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div
                    className="h-3 w-3 rounded-full transition-colors"
                    style={{
                      background: isDone
                        ? "var(--accent-teal)"
                        : isActive
                          ? "var(--accent-teal)"
                          : "var(--border-medium)",
                    }}
                  />
                  {isActive && !isDone && (
                    <div
                      className="absolute h-3 w-3 animate-ping rounded-full"
                      style={{ background: "var(--accent-teal)", opacity: 0.4 }}
                    />
                  )}
                </div>
                <span
                  className="text-sm font-medium"
                  style={{
                    color: isDone || isActive
                      ? "var(--text-primary)"
                      : isPending
                        ? "var(--text-muted)"
                        : "var(--text-secondary)",
                  }}
                >
                  {step.label}
                </span>
                {isDone && step.key !== "complete" && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}

      {liveStatus === "complete" && uploadId && (
        <Link
          href={`/results/${uploadId}`}
          className="mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: "var(--accent-teal)", color: "var(--bg-primary)" }}
        >
          View Results →
        </Link>
      )}
    </motion.div>
  );
}

/* ─── Category Upload Section ─────────────────────────────────────── */

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

type CategoryState = {
  files: File[];
  labDate: string;
  labProvider: string;
  uploading: boolean;
  uploadingFileIndex: number;
  uploadingFileTotal: number;
  completedIds: Id<"bloodworkUploads">[];
  currentStatus: UploadStatus;
  currentUploadId: Id<"bloodworkUploads"> | null;
  error: string;
};

const initialCategoryState = (): CategoryState => ({
  files: [],
  labDate: "",
  labProvider: "",
  uploading: false,
  uploadingFileIndex: 0,
  uploadingFileTotal: 0,
  completedIds: [],
  currentStatus: "idle",
  currentUploadId: null,
  error: "",
});

function CategorySection({
  testType,
  label,
  icon,
  state,
  onStateChange,
  generateUploadUrl,
  createUpload,
  fileInputRefs,
}: {
  testType: TestType;
  label: string;
  icon: string;
  state: CategoryState;
  onStateChange: (updater: (s: CategoryState) => CategoryState) => void;
  generateUploadUrl: () => Promise<string>;
  createUpload: (args: {
    fileId: Id<"_storage">;
    labDate: string;
    labProvider?: string;
    testType: TestType;
  }) => Promise<Id<"bloodworkUploads">>;
  fileInputRefs: React.MutableRefObject<Record<TestType, HTMLInputElement | null>>;
}) {
  const [dragActive, setDragActive] = useState(false);

  const validateFile = useCallback((f: File): boolean => {
    if (f.type !== "application/pdf") return false;
    if (f.size > MAX_SIZE) return false;
    return true;
  }, []);

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      const valid = newFiles.filter(validateFile);
      const invalidCount = newFiles.length - valid.length;
      onStateChange((s) => ({
        ...s,
        files: [...s.files, ...valid],
        error: invalidCount > 0 ? `${invalidCount} file(s) skipped (PDF only, max 20MB)` : "",
      }));
    },
    [validateFile, onStateChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type === "application/pdf" && f.size <= MAX_SIZE);
      if (files.length) handleFiles(files);
    },
    [handleFiles]
  );

  const removeFile = (index: number) => {
    onStateChange((s) => ({
      ...s,
      files: s.files.filter((_, i) => i !== index),
      error: "",
    }));
    const input = fileInputRefs.current[testType];
    if (input) input.value = "";
  };

  const handleBrowse = () => fileInputRefs.current[testType]?.click();

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) handleFiles(files);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (state.files.length === 0) return;
    if (!state.labDate) {
      onStateChange((s) => ({ ...s, error: "Please select the lab date." }));
      return;
    }

    const filesToUpload = [...state.files];
    onStateChange((s) => ({
      ...s,
      error: "",
      uploading: true,
      uploadingFileIndex: 0,
      uploadingFileTotal: filesToUpload.length,
      completedIds: [],
      currentUploadId: null,
    }));

    const ids: Id<"bloodworkUploads">[] = [];
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      try {
        onStateChange((s) => ({ ...s, uploadingFileIndex: i, currentStatus: "uploading" }));

        const url = await generateUploadUrl();
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error("File upload failed");
        const { storageId } = await result.json();

        onStateChange((s) => ({ ...s, currentStatus: "pending" }));

        const id = await createUpload({
          fileId: storageId,
          labDate: state.labDate,
          labProvider: state.labProvider || undefined,
          testType,
        });

        ids.push(id);
        onStateChange((s) => ({
          ...s,
          completedIds: [...s.completedIds, id],
          currentUploadId: id,
          currentStatus: "processing",
        }));
      } catch (err) {
        onStateChange((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Upload failed.",
          uploading: false,
          currentStatus: "idle",
        }));
        return;
      }
    }

    onStateChange((s) => ({
      ...s,
      files: [],
      uploading: false,
      currentStatus: "idle",
      currentUploadId: ids[ids.length - 1] ?? null,
    }));
  };

  const labDateId = `${testType}-lab-date`;
  const labProviderId = `${testType}-lab-provider`;
  const dropzoneLabel = `${label} file upload`;

  const showStatus = state.uploading || state.completedIds.length > 0;
  const latestId = state.currentUploadId ?? state.completedIds[state.completedIds.length - 1] ?? null;

  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      custom={CATEGORIES.findIndex((c) => c.type === testType)}
      className="rounded-2xl border p-6"
      style={{ background: "var(--bg-card)", borderColor: "var(--border-subtle)" }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3
          className="text-base font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
        >
          {label}
        </h3>
      </div>

      <input
        ref={(el) => {
          fileInputRefs.current[testType] = el;
        }}
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleFileInput}
        className="hidden"
      />

      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onClick={state.files.length === 0 ? handleBrowse : undefined}
        onKeyDown={(e) => {
          if (state.files.length === 0 && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleBrowse();
          }
        }}
        role={state.files.length === 0 ? "button" : undefined}
        tabIndex={state.files.length === 0 ? 0 : -1}
        aria-label={state.files.length === 0 ? dropzoneLabel : undefined}
        className="relative cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors"
        style={{
          borderColor: dragActive
            ? "var(--accent-teal)"
            : state.files.length
              ? "rgba(0,240,181,0.3)"
              : "var(--border-medium)",
          background: dragActive
            ? "rgba(0,240,181,0.05)"
            : state.files.length
              ? "rgba(0,240,181,0.03)"
              : "var(--bg-secondary)",
        }}
      >
        {state.files.length === 0 ? (
          <>
            <div
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "var(--accent-teal-glow)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Drag and drop PDFs or click to browse
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
              Multiple files · PDF only · Max 20MB each
            </p>
          </>
        ) : (
          <div className="space-y-2 text-left">
            {state.files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--bg-tertiary)" }}>
                <div className="flex min-w-0 items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-teal)" strokeWidth="2" className="shrink-0">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="truncate text-sm" style={{ color: "var(--text-primary)" }}>{f.name}</span>
                  <span className="shrink-0 text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {(f.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="shrink-0 rounded p-1.5 transition-colors hover:bg-[var(--bg-secondary)]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBrowse();
              }}
              className="w-full rounded-lg border border-dashed py-2 text-xs font-medium transition-colors hover:border-[var(--accent-teal)]"
              style={{ borderColor: "var(--border-medium)", color: "var(--text-secondary)" }}
            >
              + Add more files
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {state.files.length > 0 && !state.uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4 overflow-hidden"
          >
            <div>
              <label htmlFor={labDateId} className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Lab Date <span style={{ color: "var(--status-critical)" }}>*</span>
              </label>
              <input
                id={labDateId}
                name={`${testType}-lab-date`}
                type="date"
                value={state.labDate}
                onChange={(e) => onStateChange((s) => ({ ...s, labDate: e.target.value }))}
                max={new Date().toISOString().split("T")[0]}
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-teal)]"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                  colorScheme: "dark",
                }}
              />
            </div>
            <div>
              <label htmlFor={labProviderId} className="mb-1.5 block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Lab Provider <span style={{ color: "var(--text-tertiary)", fontWeight: 400 }}>(optional)</span>
              </label>
              <input
                id={labProviderId}
                name={`${testType}-lab-provider`}
                type="text"
                value={state.labProvider}
                onChange={(e) => onStateChange((s) => ({ ...s, labProvider: e.target.value }))}
                placeholder="e.g. Quest, LabCorp"
                className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent-teal)]"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            {state.error && (
              <div
                className="rounded-lg px-4 py-2.5 text-xs"
                style={{ background: "rgba(239,68,68,0.1)", color: "var(--status-critical)" }}
              >
                {state.error}
              </div>
            )}
            <button
              onClick={handleUpload}
              disabled={state.uploading}
              className="w-full rounded-xl py-3 text-sm font-bold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{ background: "var(--accent-teal)", color: "var(--bg-primary)" }}
            >
              {state.uploading ? "Uploading…" : `Upload ${state.files.length} file${state.files.length > 1 ? "s" : ""} & Analyze`}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state when uploading/processing */}
      {state.uploading && (
        <div
          className="mt-4 flex items-center gap-3 rounded-xl border px-4 py-4"
          style={{
            background: "rgba(0,240,181,0.08)",
            borderColor: "rgba(0,240,181,0.3)",
          }}
        >
          <div
            className="h-8 w-8 shrink-0 animate-spin rounded-full border-2 border-[var(--accent-teal)] border-t-transparent"
          />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {state.currentStatus === "uploading"
                ? `Uploading file ${state.uploadingFileIndex + 1} of ${state.uploadingFileTotal}`
                : state.currentStatus === "pending" || state.currentStatus === "processing"
                  ? `Processing file ${state.uploadingFileIndex + 1} of ${state.uploadingFileTotal} — AI analyzing…`
                  : `Processing file ${state.uploadingFileIndex + 1} of ${state.uploadingFileTotal}`}
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Your plan will update automatically when complete (usually 1–2 min)
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showStatus && latestId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <StatusTracker
              status={state.currentStatus}
              uploadId={latestId}
              testType={testType}
            />
            {state.completedIds.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {state.completedIds.slice(0, -1).map((id) => (
                  <Link
                    key={id}
                    href={`/results/${id}`}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                    style={{ background: "var(--accent-teal-glow)", color: "var(--accent-teal)" }}
                  >
                    View result #{state.completedIds.indexOf(id) + 1}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Upload Page ────────────────────────────────────────────── */

export default function UploadPage() {
  const generateUploadUrl = useMutation(api.uploads.generateUploadUrl);
  const createUpload = useMutation(api.uploads.createUpload);
  const fileInputRefs = useRef<Record<TestType, HTMLInputElement | null>>({
    bloodwork: null,
    hormone: null,
    dna: null,
  });

  const [categoryState, setCategoryState] = useState<Record<TestType, CategoryState>>(() => ({
    bloodwork: initialCategoryState(),
    hormone: initialCategoryState(),
    dna: initialCategoryState(),
  }));

  const updateCategory = useCallback((type: TestType, updater: (s: CategoryState) => CategoryState) => {
    setCategoryState((prev) => ({ ...prev, [type]: updater(prev[type]) }));
  }, []);

  return (
    <div className="min-h-dvh" style={{ background: "var(--bg-primary)" }}>
      <Nav />

      <main id="main-content" className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION_NORMAL }}
          className="mb-8"
        >
          <h1
            className="text-2xl font-black text-balance md:text-3xl"
            style={{ fontFamily: "var(--font-display)", color: "var(--text-primary)" }}
          >
            Upload Lab Results
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            Upload PDFs for bloodwork, hormone panels, and DNA tests. Each category supports multiple files.
          </p>
        </motion.div>

        <div className="space-y-6">
          {CATEGORIES.map(({ type, label, icon }) => (
            <CategorySection
              key={type}
              testType={type}
              label={label}
              icon={icon}
              state={categoryState[type]}
              onStateChange={(updater) => updateCategory(type, updater)}
              generateUploadUrl={generateUploadUrl}
              createUpload={createUpload}
              fileInputRefs={fileInputRefs}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
