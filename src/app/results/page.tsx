"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, fetch from database using id
    // For now, use mock data
    setTimeout(() => {
      setAnalysis({
        biomarkers: [
          { name: "Vitamin D", value: 28, unit: "ng/mL", status: "low", optimalRange: "30-100" },
          { name: "Testosterone", value: 742, unit: "ng/dL", status: "optimal", optimalRange: "700-900" },
          { name: "hs-CRP", value: 2.4, unit: "mg/L", status: "high", optimalRange: "<1.0" },
          { name: "HbA1c", value: 5.1, unit: "%", status: "optimal", optimalRange: "<5.7" },
          { name: "Ferritin", value: 45, unit: "ng/mL", status: "optimal", optimalRange: "30-300" },
          { name: "TSH", value: 3.8, unit: "mIU/L", status: "optimal", optimalRange: "0.4-4.0" },
        ],
        summary: "Your bloodwork shows mostly optimal levels with some areas needing attention. Vitamin D is deficient and inflammation markers are elevated.",
        recommendations: [
          { supplement: "Vitamin D3 + K2", dosage: "5000 IU", timing: "morning", reason: "Low vitamin D levels" },
          { supplement: "Omega-3 Fish Oil", dosage: "2000mg EPA/DHA", timing: "with meals", reason: "Reduce inflammation" },
          { supplement: "Magnesium Glycinate", dosage: "400mg", timing: "evening", reason: "Support sleep and recovery" },
        ],
        riskAreas: ["Vitamin D deficiency", "Elevated inflammation markers"],
        nextSteps: ["Retest in 90 days", "Increase sun exposure", "Consider anti-inflammatory diet"],
      });
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0B12", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div>Analyzing your bloodwork...</div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0B12", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1>Analysis not found</h1>
          <Link href="/upload" style={{ color: "#14B8A6", textDecoration: "underline" }}>Upload another file</Link>
        </div>
      </div>
    );
  }

  const lowBiomarkers = analysis.biomarkers.filter((b: any) => b.status === "low");
  const highBiomarkers = analysis.biomarkers.filter((b: any) => b.status === "high");

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

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.5rem" }}>Your Analysis Results</h1>
        <p style={{ color: "#999", marginBottom: "2rem" }}>AI-powered insights from your bloodwork</p>

        {/* Summary */}
        <div style={{ background: "rgba(26, 26, 46, 0.5)", border: "1px solid rgba(20, 184, 166, 0.2)", borderRadius: "1rem", padding: "2rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "1rem", color: "#fff" }}>Summary</h2>
          <p style={{ color: "#999", lineHeight: "1.7" }}>{analysis.summary}</p>
        </div>

        {/* Biomarkers Grid */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "1rem", color: "#fff" }}>Biomarker Analysis</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            {analysis.biomarkers.map((biomarker: any) => (
              <div key={biomarker.name} style={{ background: "rgba(26, 26, 46, 0.5)", border: `1px solid ${biomarker.status === "low" ? "rgba(245, 158, 11, 0.3)" : biomarker.status === "high" ? "rgba(239, 68, 68, 0.3)" : "rgba(20, 184, 166, 0.3)"}`, borderRadius: "0.75rem", padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#fff", marginBottom: "0.25rem" }}>{biomarker.name}</div>
                    <div style={{ color: "#666", fontSize: "0.85rem" }}>Optimal: {biomarker.optimalRange}</div>
                  </div>
                  <span style={{ background: biomarker.status === "low" ? "rgba(245, 158, 11, 0.2)" : biomarker.status === "high" ? "rgba(239, 68, 68, 0.2)" : "rgba(20, 184, 166, 0.2)", color: biomarker.status === "low" ? "#F59E0B" : biomarker.status === "high" ? "#EF4444" : "#14B8A6", padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>
                    {biomarker.status}
                  </span>
                </div>
                <div style={{ fontSize: "1.5rem", fontWeight: "900", color: biomarker.status === "low" ? "#F59E0B" : biomarker.status === "high" ? "#EF4444" : "#14B8A6" }}>
                  {biomarker.value} {biomarker.unit}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "1rem", color: "#fff" }}>Personalized Recommendations</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {analysis.recommendations.map((rec: any, idx: number) => (
              <div key={idx} style={{ background: "rgba(26, 26, 46, 0.5)", border: "1px solid rgba(20, 184, 166, 0.1)", borderRadius: "0.75rem", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1rem", fontWeight: "900", color: "#fff", margin: 0, marginBottom: "0.25rem" }}>{rec.supplement}</h3>
                    <p style={{ color: "#999", fontSize: "0.9rem", margin: 0 }}>{rec.reason}</p>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem", marginTop: "1rem" }}>
                  <div>
                    <div style={{ color: "#666", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Dosage</div>
                    <div style={{ color: "#14B8A6", fontWeight: "600" }}>{rec.dosage}</div>
                  </div>
                  <div>
                    <div style={{ color: "#666", fontSize: "0.85rem", marginBottom: "0.25rem" }}>Timing</div>
                    <div style={{ color: "#14B8A6", fontWeight: "600" }}>{rec.timing}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Areas */}
        {analysis.riskAreas.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "1rem", color: "#fff" }}>Areas Needing Attention</h2>
            <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "0.75rem", padding: "1.5rem" }}>
              <ul style={{ color: "#999", lineHeight: "1.8", marginLeft: "1.5rem", margin: 0 }}>
                {analysis.riskAreas.map((risk: string, idx: number) => (
                  <li key={idx}>{risk}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div style={{ background: "rgba(20, 184, 166, 0.1)", border: "1px solid rgba(20, 184, 166, 0.3)", borderRadius: "0.75rem", padding: "1.5rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "900", marginBottom: "1rem", color: "#fff" }}>Next Steps</h2>
          <ul style={{ color: "#999", lineHeight: "1.8", marginLeft: "1.5rem", margin: 0 }}>
            {analysis.nextSteps.map((step: string, idx: number) => (
              <li key={idx}>{step}</li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
          <Link href="/upload" style={{ background: "#14B8A6", color: "#000", padding: "0.75rem 2rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "bold", display: "inline-block" }}>
            Upload Another Test
          </Link>
          <Link href="/dashboard" style={{ background: "rgba(26, 26, 46, 0.5)", color: "#fff", padding: "0.75rem 2rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "bold", display: "inline-block", border: "1px solid rgba(20, 184, 166, 0.2)" }}>
            Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
