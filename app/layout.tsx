import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { PrototypeBanner } from "@/components/prototype-banner";
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

export const metadata: Metadata = {
  title: "StressFreeClaim.ai",
  description:
    "Tell us what happened and we'll take it from there — the stress-free way to start a storm claim.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <PrototypeBanner />
        <main className="mx-auto w-full max-w-[660px] px-5 py-8 sm:px-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
