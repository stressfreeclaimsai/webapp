import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Archetype default: keep config minimal. Add options here only with an
  // Architect decision logged in /mission/spec/open-decisions.md (constitution §3).

  // Bundle the build-time seeded SQLite file into every route's serverless
  // function on Vercel; lib/db.ts copies it to /tmp (the writable path) on
  // cold start. See open-decisions.md B12.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
