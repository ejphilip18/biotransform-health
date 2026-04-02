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
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1.5rem 2rem", borderBottom: "1px solid #333" }}>
        <Link href="/" style={{ fontSize: "1.3rem", fontWeight: "bold", textDecoration: "none", color: "#fff" }}>
          🧬 BioTransform
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

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: "900", marginBottom: "0.5rem" }}>
          Welcome, {user?.name || "User"}!
        </h1>
        <p style={{ color: "#999", marginBottom: "2rem" }}>Your health optimization dashboard</p>

        <div style={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: "1rem", padding: "2rem", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "1rem" }}>✅ Demo Mode Active</h2>
          <p style={{ color: "#999", marginBottom: "1rem" }}>
            You're currently using BioTransform in demo mode. This version showcases the UI and user experience.
          </p>
          <ul style={{ color: "#999", marginLeft: "1.5rem", lineHeight: "1.8" }}>
            <li>✓ Sign in/up with any email and password (min 8 chars)</li>
            <li>✓ Access the dashboard</li>
            <li>✓ To enable full functionality: Set up Convex backend + Gemini API</li>
          </ul>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem" }}>
          {[
            { icon: "📄", title: "Upload Results", desc: "Upload your bloodwork PDFs" },
            { icon: "🤖", title: "AI Analysis", desc: "Get personalized insights" },
            { icon: "📋", title: "Health Plans", desc: "Receive supplement stacks & training" },
          ].map((feature) => (
            <div key={feature.title} style={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: "1rem", padding: "1.5rem" }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{feature.icon}</div>
              <h3 style={{ fontWeight: "900", marginBottom: "0.5rem" }}>{feature.title}</h3>
              <p style={{ color: "#999", fontSize: "0.9rem" }}>{feature.desc}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem" }}>
          <Link
            href="/auth"
            style={{
              background: "#14B8A6",
              color: "#000",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              textDecoration: "none",
              fontWeight: "bold",
              display: "inline-block",
            }}
          >
            Try Another Account
          </Link>
          <button
            onClick={handleLogout}
            style={{
              background: "#1a1a2e",
              color: "#fff",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #333",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  );
}
