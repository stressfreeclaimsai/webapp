import Link from "next/link";
import { notFound } from "next/navigation";
import { StaffAccessUnavailableError, requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  let staff;
  try {
    staff = await requireStaff();
  } catch (error) {
    if (error instanceof StaffAccessUnavailableError) notFound();
    throw error;
  }

  return (
    <div className="relative left-1/2 w-[calc(100vw-2.5rem)] max-w-[1180px] -translate-x-1/2 sm:w-[calc(100vw-3.5rem)]">
      <header className="mb-7 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/staff/claims"
            className="inline-flex min-h-11 items-center font-display text-xl font-semibold text-ink-display underline-offset-4 hover:underline"
          >
            StressFreeClaim.ai
          </Link>
          <p className="mt-0.5 text-sm font-medium text-muted">
            Staff workspace · local development
          </p>
        </div>
        <div className="text-sm sm:text-right">
          <p className="font-semibold text-ink">{staff.displayName}</p>
          <p className="mt-0.5 capitalize text-muted">{staff.role}</p>
        </div>
      </header>
      {children}
    </div>
  );
}
