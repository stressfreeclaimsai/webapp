import Link from "next/link";
import { runtimeConfig } from "@/lib/runtime-config";

export function EnvironmentBanner() {
  const config = runtimeConfig();

  return (
    <header className="border-b border-border bg-surface/90">
      <div className="mx-auto flex min-h-14 w-full max-w-[1080px] flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-2 sm:px-6">
        <Link
          href="/"
          className="font-display text-[1.08rem] font-semibold tracking-[-0.015em] text-ink transition-colors duration-200 hover:text-ink-display"
        >
          StressFreeClaim<span className="text-accent">.ai</span>
        </Link>
        <div
          className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.13em] text-warn"
          role="status"
        >
          <span aria-hidden="true" className="size-1.5 rounded-pill bg-accent" />
          {config.isPilot ? "Private pilot" : "Prototype — not for real data"}
        </div>
      </div>
    </header>
  );
}
