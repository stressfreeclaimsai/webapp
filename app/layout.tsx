import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Public_Sans } from "next/font/google";
import { PrototypeBanner } from "@/components/prototype-banner";
import "./globals.css";

// Identity typefaces (see globals.css for the rationale). Self-hosted by
// next/font at build time — the running app makes no external font requests,
// which matters for the post-storm bad-connection scenario.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
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
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable}`}>
      <body>
        <PrototypeBanner />
        <header className="mx-auto w-full max-w-xl px-5 pt-6 sm:px-6">
          <Link href="/" className="font-display text-lg font-semibold tracking-tight">
            StressFreeClaim<span className="text-accent">.ai</span>
          </Link>
        </header>
        <main className="mx-auto w-full max-w-xl px-5 py-8 sm:px-6 sm:py-10">{children}</main>
      </body>
    </html>
  );
}
