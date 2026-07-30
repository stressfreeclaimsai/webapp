import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { EnvironmentBanner } from "@/components/environment-banner";
import { runtimeConfig } from "@/lib/runtime-config";
import "./globals.css";

// Identity typefaces (see globals.css for the rationale). Self-hosted by
// next/font at build time — the running app makes no external font requests,
// which matters for the post-storm bad-connection scenario.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export function generateMetadata(): Metadata {
  const config = runtimeConfig();
  return {
    title: "StressFreeClaim.ai",
    description: config.isPilot
      ? "Tell us what happened. Our team will review your information and contact you about next steps."
      : "Tell us what happened and we'll take it from there — the stress-free way to start a storm claim.",
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <EnvironmentBanner />
        <main className="mx-auto w-full max-w-[700px] px-5 py-5 sm:px-7 sm:py-12">{children}</main>
      </body>
    </html>
  );
}
