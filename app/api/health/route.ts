import { NextResponse } from "next/server";
import { runtimeConfig } from "@/lib/runtime-config";

export const dynamic = "force-dynamic";

export function GET() {
  const config = runtimeConfig();

  return NextResponse.json(
    {
      status: "ok",
      mode: config.mode,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

