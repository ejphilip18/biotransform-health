"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockUser = localStorage.getItem("mockUser");
    if (!mockUser) {
      router.push("/auth");
    } else {
      setUser(JSON.parse(mockUser));
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("mockUser");
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0B12", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0B0B12", color: "#fff" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <Link href="/" style={{ fontSize: "1.3rem", fontWeight: "bold", textDecoration: "none", color: "#fff", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ background: "#14B8A6", color: "#000", width: "32px", height: "32px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", fontWeight: "900" }}>✦</span>
          BioTransform
        </Link>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <span>{user?.name || user?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              color: "#ef4444",
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.5rem" }}>
          Welcome, {user?.name || "User"}!
        </h1>
        <p style={{ color: "#999", marginBottom: "3rem" }}>Your health optimization dashboard</p>

        {/* Quick Actions */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginBottom: "3rem" }}>
          {/* Upload Card */}
          <Link href="/upload" style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ background: "rgba(26, 26, 46, 0.5)", border: "1px solid rgba(20, 184, 166, 0.2)", borderRadius: "1rem", padding: "2rem", cursor: "pointer", transition: "all 0.2s", hover: { borderColor: "rgba(20, 184, 166, 0.5)" } }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📄</div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "0.5rem", color: "#fff" }}>Upload Results</h3>
              <p style={{ color: "#999", fontSize: "0.9rem", marginBottom: "1rem" }}>Upload your bloodwork PDFs</p>
              <div style={{ color: "#14B8A6", fontWeight: "600", fontSize: "0.9rem" }}>Start Analysis →</div>
            </div>
          </Link>

          {/* AI Analysis Card */}
          <div style={{ background: "rgba(26, 26, 46, 0.5)", border: "1px solid rgba(20, 184, 166, 0.2)", borderRadius: "1rem", padding: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>🤖</div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "0.5rem", color: "#fff" }}>AI Analysis</h3>
            <p style={{ color: "#999", fontSize: "0.9rem", marginBottom: "1rem" }}>Get personalized insights</p>
            <div style={{ color: "#999", fontWeight: "600", fontSize: "0.9rem" }}>Upload to analyze</div>
          </div>

          {/* Health Plans Card */}
          <div style={{ background: "rgba(26, 26, 46, 0.5)", border: "1px solid rgba(20, 184, 166, 0.2)", borderRadius: "1rem", padding: "2rem" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📋</div>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "0.5rem", color: "#fff" }}>Health Plans</h3>
            <p style={{ color: "#999", fontSize: "0.9rem", marginBottom: "1rem" }}>Supplement stacks & training</p>
            <div style={{ color: "#999", fontWeight: "600", fontSize: "0.9rem" }}>Coming soon</div>
          </div>
        </div>

        {/* Info Section */}
        <div style={{ background: "rgba(20, 184, 166, 0.05)", border: "1px solid rgba(20, 184, 166, 0.2)", borderRadius: "1rem", padding: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "1rem", color: "#fff" }}>✅ Demo Mode Active</h2>
          <p style={{ color: "#999", marginBottom: "1rem", lineHeight: "1.6" }}>
            You're currently using BioTransform in demo mode. This version showcases the UI and user experience with AI-powered analysis capabilities.
          </p>
          <ul style={{ color: "#999", marginLeft: "1.5rem", lineHeight: "1.8" }}>
            <li>✓ Upload bloodwork PDFs</li>
            <li>✓ AI analyzes 50+ biomarkers</li>
            <li>✓ Get personalized recommendations</li>
            <li>✓ Track your health progress</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
