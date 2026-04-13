"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { EASE_OUT, DURATION_NORMAL } from "@/lib/animations";
import Link from "next/link";

export default function AuthPage() {
  const { signIn } = useAuthActions();
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
      await signIn("password", {
        email,
        password,
        flow: mode === "signup" ? "signUp" : "signIn",
        ...(mode === "signup" ? { name } : {}),
      });
      router.push("/dashboard");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        mode === "signin"
          ? msg.includes("Invalid credentials")
            ? "Invalid email or password."
            : msg
          : msg.includes("already exists")
            ? "That email is already registered. Try signing in instead."
            : msg
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-dvh items-center justify-center px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      {/* Background glow */}
      <div
        className="pointer-events-none absolute top-[20%] left-[50%] h-[500px] w-[500px] -translate-x-1/2 rounded-full opacity-15 blur-[120px]"
        style={{ background: "var(--accent-teal)" }}
      />

      <main id="main-content" className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION_NORMAL, ease: EASE_OUT }}
        >
        {/* Logo */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: "var(--accent-teal)" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--bg-primary)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <span
            className="text-lg font-bold"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--text-primary)",
            }}
          >
            BioTransform
          </span>
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="mb-6 text-center">
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--text-primary)",
              }}
            >
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              {mode === "signin"
                ? "Sign in to access your health dashboard"
                : "Start optimizing your biology today"}
            </p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-1.5 block text-xs font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Full Name
                </label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name…"
                  required
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
                  style={{
                    background: "var(--bg-secondary)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            )}
            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <input
                id="auth-email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com…"
                required
                spellCheck={false}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-xs font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
                style={{
                  background: "var(--bg-secondary)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-lg px-4 py-2.5 text-xs"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "var(--status-critical)",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-bold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[var(--accent-teal)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
              style={{
                background: "var(--accent-teal)",
                color: "var(--bg-primary)",
              }}
            >
              {loading
                ? "Signing in…"
                : mode === "signin"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setError("");
              }}
              className="text-sm transition-colors hover:opacity-80"
              style={{ color: "var(--text-secondary)" }}
            >
              {mode === "signin"
                ? "Don't have an account? "
                : "Already have an account? "}
              <span
                className="font-semibold"
                style={{ color: "var(--accent-teal)" }}
              >
                {mode === "signin" ? "Sign Up" : "Sign In"}
              </span>
            </button>
          </div>
        </div>

        <p
          className="mt-6 text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
        </motion.div>
      </main>
    </div>
  );
}
