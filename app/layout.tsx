import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { PrototypeBanner } from "@/components/prototype-banner";
import "./globals.css";

// Placeholder typeface. Swapped per project by the design-tokens skill —
// the rest of the app references type only through the --font-sans token.
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Foundry Prototype",
  description: "A customer-testable prototype scaffolded by the Foundry engine.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <PrototypeBanner />
        <main className="mx-auto w-full max-w-3xl px-5 py-10 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
