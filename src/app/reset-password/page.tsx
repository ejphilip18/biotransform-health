"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { EASE_OUT, DURATION_NORMAL } from "@/lib/animations";
import Link from "next/link";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    // Verify token on mount
    const verifyToken = async () => {
      if (!token) {
        setError("No reset token provided. Please use the link from your email.");
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-reset-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Invalid or expired reset link.");
          setVerifying(false);
          return;
        }

        setTokenValid(true);
        setVerifying(false);
      } catch (err) {
        setError("Failed to verify reset link. Please try again.");
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess("Password reset successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/auth");
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
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
                Reset your password
              </h1>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                Enter your new password below
              </p>
            </div>

            {verifying ? (
              <div className="text-center">
                <div
                  className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[var(--border-medium)] border-t-[var(--accent-teal)]"
                />
                <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
                  Verifying reset link…
                </p>
              </div>
            ) : tokenValid ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-1.5 block text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    New Password
                  </label>
                  <input
                    id="new-password"
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-1.5 block text-xs font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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

                {success && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-lg px-4 py-2.5 text-xs"
                    style={{
                      background: "rgba(34, 197, 94, 0.1)",
                      color: "var(--accent-teal)",
                    }}
                  >
                    {success}
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
                  {loading ? "Resetting…" : "Reset Password"}
                </button>
              </form>
            ) : (
              <div className="text-center">
                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-lg px-4 py-2.5 text-xs mb-4"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "var(--status-critical)",
                    }}
                  >
                    {error}
                  </div>
                )}
                <Link
                  href="/auth"
                  className="inline-block rounded-xl px-6 py-3 text-sm font-bold transition-transform hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    background: "var(--accent-teal)",
                    color: "var(--bg-primary)",
                  }}
                >
                  Back to Sign In
                </Link>
              </div>
            )}

            <div className="mt-6 text-center">
              <Link
                href="/auth"
                className="text-xs transition-colors hover:opacity-80"
                style={{ color: "var(--text-secondary)" }}
              >
                Back to{" "}
                <span
                  className="font-semibold"
                  style={{ color: "var(--accent-teal)" }}
                >
                  Sign In
                </span>
              </Link>
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
