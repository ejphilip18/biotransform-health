"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { motion } from "framer-motion";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/upload", label: "Upload" },
  { href: "/plan", label: "Plan" },
  { href: "/progress", label: "Progress" },
  { href: "/checkin", label: "Check-in" },
  { href: "/settings", label: "Settings" },
];

const EASE_OUT_CSS = "cubic-bezier(0.22, 1, 0.36, 1)";

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "max(16px, env(safe-area-inset-top)) 24px 16px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(11, 11, 18, 0.95)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          textDecoration: "none",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "var(--accent-teal)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg aria-hidden
            width="16"
            height="16"
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
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "16px",
            color: "var(--text-primary)",
            letterSpacing: "-0.01em",
          }}
        >
          BioTransform
        </span>
      </Link>

      {/* Links */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        {NAV_LINKS.map((link) => {
          const isActive =
            pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <motion.div key={link.href} whileTap={{ scale: 0.97 }} style={{ position: "relative" }}>
            {isActive && (
              <motion.div
                layoutId="nav-active-pill"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "8px",
                  background: "var(--accent-teal-glow)",
                }}
              />
            )}
            <Link
              href={link.href}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? "var(--accent-teal)"
                  : "var(--text-secondary)",
                background: "transparent",
                textDecoration: "none",
                transition: `color 0.16s ${EASE_OUT_CSS}, background-color 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
                position: "relative",
                zIndex: 1,
              }}
            >
              {link.label}
            </Link>
            </motion.div>
          );
        })}

        {/* Sign out */}
        <motion.button
          type="button"
          aria-label="Sign out"
          whileTap={{ scale: 0.97 }}
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
          style={{
            marginLeft: "12px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border-medium)",
            background: "transparent",
            color: "var(--text-tertiary)",
            fontSize: "13px",
            fontWeight: 500,
            cursor: "pointer",
            transition: `color 0.16s ${EASE_OUT_CSS}, background-color 0.16s ${EASE_OUT_CSS}, border-color 0.16s ${EASE_OUT_CSS}, transform 0.14s ${EASE_OUT_CSS}`,
            fontFamily: "var(--font-body)",
          }}
        >
          Sign Out
        </motion.button>
      </div>
    </nav>
  );
}
