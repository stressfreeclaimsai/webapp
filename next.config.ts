import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Archetype default: keep config minimal. Add options here only with an
  // Architect decision logged in /mission/spec/open-decisions.md (constitution §3).

  // Bundle the build-time seeded SQLite file into every route's serverless
  // function on Vercel; lib/db.ts copies it to /tmp (the writable path) on
  // cold start. See open-decisions.md B12.
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },
};

export default nextConfig;
