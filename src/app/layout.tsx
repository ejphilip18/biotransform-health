import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BioTransform — Optimize Your Biology",
  description: "Upload your bloodwork. Get AI-powered analysis. Receive personalized supplement stacks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
