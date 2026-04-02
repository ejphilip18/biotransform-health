"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (password.length < 8) {
        throw new Error("Password must be at least 8 characters.");
      }

      localStorage.setItem("mockUser", JSON.stringify({ 
        email, 
        name: mode === "signup" ? name : email.split("@")[0],
      }));

      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0B0B12", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", justifyContent: "center", textDecoration: "none", color: "#fff" }}>
          <span style={{ fontSize: "1.5rem" }}>🧬</span>
          <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>BioTransform</span>
        </Link>

        <div style={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: "1rem", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "900", marginBottom: "0.5rem", color: "#fff" }}>
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p style={{ color: "#999", marginBottom: "2rem", fontSize: "0.9rem" }}>
            {mode === "signin" ? "Sign in to access your dashboard" : "Start optimizing your biology"}
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {mode === "signup" && (
              <div>
                <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "#999" }}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  style={{ width: "100%", padding: "0.75rem", background: "#0B0B12", border: "1px solid #333", borderRadius: "0.5rem", color: "#fff", fontSize: "1rem", boxSizing: "border-box" }}
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "#999" }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={{ width: "100%", padding: "0.75rem", background: "#0B0B12", border: "1px solid #333", borderRadius: "0.5rem", color: "#fff", fontSize: "1rem", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.85rem", color: "#999" }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                style={{ width: "100%", padding: "0.75rem", background: "#0B0B12", border: "1px solid #333", borderRadius: "0.5rem", color: "#fff", fontSize: "1rem", boxSizing: "border-box" }}
              />
            </div>

            {error && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.9rem" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: "#14B8A6",
                color: "#000",
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "none",
                fontWeight: "bold",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "Loading..." : mode === "signin" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
              }}
              style={{ background: "none", border: "none", color: "#14B8A6", cursor: "pointer", textDecoration: "underline", fontSize: "0.9rem" }}
            >
              {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>

        <p style={{ textAlign: "center", color: "#666", fontSize: "0.85rem", marginTop: "2rem" }}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
