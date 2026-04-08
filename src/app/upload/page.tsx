"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (f: File) => {
    if (f.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }
    setFile(f);
    setError("");
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      router.push(`/results?id=${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B0B12", color: "#fff" }}>
      {/* Navigation */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href="/dashboard" style={{ fontSize: "1.2rem", fontWeight: "bold", textDecoration: "none", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ background: "#14B8A6", color: "#000", width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "900" }}>✦</span>
          BioTransform
        </Link>
        <Link href="/dashboard" style={{ color: "#999", textDecoration: "none" }}>Back to Dashboard</Link>
      </nav>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: "900", marginBottom: "1rem" }}>Upload Your Bloodwork</h1>
        <p style={{ color: "#999", marginBottom: "2rem", fontSize: "1rem" }}>
          Upload your lab results PDF. Our AI will analyze 50+ biomarkers and create your personalized health optimization plan.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* File Upload Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: dragActive ? "2px solid #14B8A6" : "2px dashed rgba(20, 184, 166, 0.3)",
              borderRadius: "1rem",
              padding: "3rem",
              textAlign: "center",
              background: dragActive ? "rgba(20, 184, 166, 0.05)" : "rgba(26, 26, 46, 0.5)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              style={{ display: "none" }}
              id="file-input"
            />
            <label htmlFor="file-input" style={{ cursor: "pointer", display: "block" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📄</div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "0.5rem", color: "#fff" }}>
                {file ? file.name : "Drop your PDF here"}
              </h3>
              <p style={{ color: "#999", marginBottom: "1rem" }}>
                {file ? "Click to change file" : "or click to browse"}
              </p>
              <p style={{ color: "#666", fontSize: "0.85rem" }}>Supports Quest, LabCorp, and 100+ lab formats. Max 10MB.</p>
            </label>
          </div>

          {error && (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "1rem", borderRadius: "0.5rem", fontSize: "0.9rem" }}>
              {error}
            </div>
          )}

          {file && (
            <div style={{ background: "rgba(20, 184, 166, 0.1)", border: "1px solid rgba(20, 184, 166, 0.3)", borderRadius: "0.5rem", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: "600", color: "#fff", marginBottom: "0.25rem" }}>{file.name}</div>
                  <div style={{ color: "#999", fontSize: "0.85rem" }}>{(file.size / 1024).toFixed(2)} KB</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none", padding: "0.5rem 1rem", borderRadius: "0.5rem", cursor: "pointer", fontWeight: "600" }}
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!file || loading}
            style={{
              background: "#14B8A6",
              color: "#000",
              padding: "1rem",
              borderRadius: "0.5rem",
              border: "none",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: loading || !file ? "not-allowed" : "pointer",
              opacity: loading || !file ? 0.5 : 1,
            }}
          >
            {loading ? "Analyzing..." : "Analyze My Bloodwork"}
          </button>
        </form>

        {/* Info Section */}
        <div style={{ marginTop: "3rem", background: "rgba(26, 26, 46, 0.5)", border: "1px solid rgba(20, 184, 166, 0.1)", borderRadius: "1rem", padding: "2rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "900", marginBottom: "1rem", color: "#fff" }}>What happens next?</h3>
          <ul style={{ color: "#999", lineHeight: "1.8", marginLeft: "1.5rem" }}>
            <li>Our AI reads your lab results</li>
            <li>Analyzes 50+ biomarkers against functional optimal ranges</li>
            <li>Identifies areas needing attention</li>
            <li>Creates your personalized supplement stack</li>
            <li>Builds your nutrition and training plan</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
