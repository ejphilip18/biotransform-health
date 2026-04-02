import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "#0B0B12", color: "#fff", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Navigation */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "sticky", top: 0, background: "rgba(11, 11, 18, 0.95)", backdropFilter: "blur(10px)", zIndex: 50 }}>
        <div style={{ fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ background: "#14B8A6", color: "#000", width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "900" }}>✦</span>
          BioTransform
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <Link href="/auth" style={{ color: "#999", textDecoration: "none", fontSize: "0.9rem", transition: "color 0.2s" }}>Sign In</Link>
          <Link href="/auth" style={{ background: "#14B8A6", color: "#000", padding: "0.5rem 1rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "bold", fontSize: "0.9rem", display: "inline-block" }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ maxWidth: "1400px", margin: "0 auto", padding: "3rem 1.5rem" }}>
        {/* Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "2rem", width: "fit-content" }}>
          <span style={{ background: "rgba(20, 184, 166, 0.2)", color: "#14B8A6", padding: "0.4rem 0.8rem", borderRadius: "999px", fontSize: "0.8rem", fontWeight: "600", border: "1px solid rgba(20, 184, 166, 0.3)" }}>● AI-Powered Health Analysis</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "3rem", alignItems: "center", marginBottom: "6rem" }}>
          {/* Left Column */}
          <div>
            <h1 style={{ fontSize: "clamp(2rem, 8vw, 4rem)", fontWeight: "900", marginBottom: "1.5rem", lineHeight: "1.1", letterSpacing: "-0.02em" }}>
              Decode your <span style={{ color: "#14B8A6" }}>bloodwork.</span><br />
              Optimize your <span style={{ color: "#14B8A6" }}>biology.</span>
            </h1>
            <p style={{ fontSize: "1rem", color: "#999", marginBottom: "2rem", lineHeight: "1.7", maxWidth: "500px" }}>
              Upload your lab results. Our AI analyzes 50+ biomarkers against functional optimal ranges — not just "normal" — and builds your personalized supplement stack, nutrition plan, and training program.
            </p>
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap" }}>
              <Link href="/auth" style={{ background: "#14B8A6", color: "#000", padding: "0.75rem 1.5rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "bold", display: "inline-flex", alignItems: "center", gap: "0.5rem", transition: "transform 0.2s" }}>
                Start Free Analysis →
              </Link>
              <span style={{ color: "#666", fontSize: "0.9rem" }}>No credit card required</span>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2rem", marginTop: "3rem" }}>
              {[
                { num: "50+", label: "Biomarkers Analyzed" },
                { num: "Functional", label: "Optimal Ranges" },
                { num: "90 days", label: "Recommended Cadence" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#14B8A6", marginBottom: "0.25rem" }}>{stat.num}</div>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Biomarker Card */}
          <div style={{ background: "rgba(26, 26, 46, 0.5)", border: "1px solid rgba(20, 184, 166, 0.2)", borderRadius: "1rem", padding: "2rem", backdropFilter: "blur(10px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "600", color: "#fff", margin: 0 }}>Biomarker Overview</h3>
              <span style={{ background: "rgba(20, 184, 166, 0.1)", color: "#14B8A6", padding: "0.3rem 0.8rem", borderRadius: "999px", fontSize: "0.75rem", fontWeight: "600" }}>6 markers</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "1.5rem" }}>
              {[
                { name: "Vitamin D", value: "28", unit: "ng/mL", status: "warning" },
                { name: "Testosterone", value: "742", unit: "ng/dL", status: "optimal" },
                { name: "hs-CRP", value: "2.4", unit: "mg/L", status: "warning" },
                { name: "HbA1c", value: "5.1", unit: "%", status: "optimal" },
                { name: "Ferritin", value: "45", unit: "ng/mL", status: "optimal" },
                { name: "TSH", value: "3.8", unit: "mIU/L", status: "warning" },
              ].map((item) => (
                <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: item.status === "optimal" ? "#14B8A6" : "#F59E0B" }}></span>
                    <span style={{ fontSize: "0.9rem" }}>{item.name}</span>
                  </div>
                  <span style={{ color: item.status === "optimal" ? "#14B8A6" : "#F59E0B", fontWeight: "600", fontSize: "0.9rem" }}>{item.value}{item.unit}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(20, 184, 166, 0.1)", border: "1px solid rgba(20, 184, 166, 0.2)", borderRadius: "0.75rem", padding: "1rem" }}>
              <div style={{ fontSize: "0.85rem", color: "#999", marginBottom: "0.5rem" }}>Recommended</div>
              <div style={{ fontWeight: "600", color: "#14B8A6", fontSize: "0.95rem" }}>Vitamin D3 + K2</div>
              <div style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.25rem" }}>5000 IU / morning</div>
            </div>
            <Link href="/auth" style={{ display: "block", textAlign: "center", marginTop: "1rem", color: "#14B8A6", textDecoration: "none", fontSize: "0.9rem", fontWeight: "600" }}>
              View full analysis →
            </Link>
          </div>
        </div>

        {/* How it works */}
        <section style={{ marginBottom: "6rem" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: "900", textAlign: "center", marginBottom: "3rem", letterSpacing: "-0.02em" }}>
            From raw data to <span style={{ color: "#14B8A6" }}>actionable protocol</span>
          </h2>
          <p style={{ textAlign: "center", color: "#666", marginBottom: "3rem", fontSize: "1rem" }}>Three steps. Upload once every 90 days. Track your regression toward optimal health.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
            {[
              { step: "01", title: "Upload", desc: "Drop your bloodwork PDF. Our AI reads Quest, LabCorp, and 100+ lab formats." },
              { step: "02", title: "Analyze", desc: "50+ biomarkers mapped to functional optimal ranges. Risk areas identified. Correlations found." },
              { step: "03", title: "Optimize", desc: "Personalized supplement stack, nutrition framework, and training program built for your biology." },
            ].map((item) => (
              <div key={item.step} style={{ background: "rgba(26, 26, 46, 0.5)", border: "1px solid rgba(20, 184, 166, 0.1)", borderRadius: "1rem", padding: "2rem" }}>
                <div style={{ fontSize: "0.85rem", color: "#14B8A6", fontWeight: "600", marginBottom: "1rem" }}>Step {item.step}</div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "900", marginBottom: "1rem", color: "#fff" }}>{item.title}</h3>
                <p style={{ color: "#999", fontSize: "0.95rem", lineHeight: "1.6" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ background: "rgba(20, 184, 166, 0.05)", border: "1px solid rgba(20, 184, 166, 0.2)", borderRadius: "1rem", padding: "3rem 2rem", textAlign: "center", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", fontWeight: "900", marginBottom: "1rem", letterSpacing: "-0.02em" }}>Stop guessing. Start optimizing.</h2>
          <p style={{ color: "#999", marginBottom: "2rem", fontSize: "1rem", maxWidth: "600px", margin: "0 auto 2rem" }}>Your bloodwork holds the answers. We just make them readable — and actionable.</p>
          <Link href="/auth" style={{ background: "#14B8A6", color: "#000", padding: "0.75rem 2rem", borderRadius: "0.5rem", textDecoration: "none", fontWeight: "bold", display: "inline-block", fontSize: "1rem" }}>
            Upload Your First Test →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.1)", padding: "2rem 1.5rem", textAlign: "center", color: "#666", display: "flex", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
        <Link href="#" style={{ color: "#666", textDecoration: "none", fontSize: "0.9rem" }}>Privacy</Link>
        <Link href="#" style={{ color: "#666", textDecoration: "none", fontSize: "0.9rem" }}>Terms</Link>
      </footer>
    </div>
  );
}
