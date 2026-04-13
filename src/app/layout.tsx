import type { Metadata, Viewport } from "next";
import { Instrument_Sans } from "next/font/google";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "@/providers/convex-provider";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "BioTransform — Optimize Your Biology",
  description:
    "Upload your bloodwork. Get AI-powered analysis. Receive personalized supplement stacks, nutrition plans, and training programs.",
};

export const viewport: Viewport = {
  themeColor: "#0B0B12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
        <body className={`${instrumentSans.variable} antialiased`}>
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          <ConvexClientProvider>
            <OnboardingGuard>{children}</OnboardingGuard>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
