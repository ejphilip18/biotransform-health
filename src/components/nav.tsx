"use client";

import Link from "next/link";

export function Nav() {
  return (
    <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem", borderBottom: "1px solid #333", background: "#0B0B12" }}>
      <Link href="/dashboard" style={{ textDecoration: "none", color: "#fff", fontWeight: "bold" }}>
        🧬 BioTransform
      </Link>
      <div style={{ display: "flex", gap: "1rem" }}>
        <Link href="/dashboard" style={{ color: "#999", textDecoration: "none" }}>Dashboard</Link>
        <Link href="/settings" style={{ color: "#999", textDecoration: "none" }}>Settings</Link>
      </div>
    </nav>
  );
}
