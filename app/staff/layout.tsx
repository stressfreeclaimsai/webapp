import Link from "next/link";
import { notFound } from "next/navigation";
import { signOutStaff } from "@/app/staff/actions";
import { StaffAccessUnavailableError, requireStaff } from "@/lib/staff-auth";
import { staffAuthProvider } from "@/lib/staff-auth-provider";

export const dynamic = "force-dynamic";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  let staff;
  try {
    staff = await requireStaff();
  } catch (error) {
    // No active staff identity: reveal nothing about the workspace.
    if (error instanceof StaffAccessUnavailableError) notFound();
    throw error;
  }
  const managed = staffAuthProvider() === "workos";

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
            {managed ? "Staff workspace" : "Staff workspace · local development"}
          </p>
        </div>
        <div className="flex items-end gap-4 text-sm sm:text-right">
          <div>
            <p className="font-semibold text-ink">{staff.displayName}</p>
            <p className="mt-0.5 capitalize text-muted">{staff.role}</p>
          </div>
          {managed && (
            <form action={signOutStaff}>
              <button
                type="submit"
                className="min-h-11 rounded-pill border border-border-strong px-4 font-semibold text-warn underline-offset-4 hover:underline"
              >
                Sign out
              </button>
            </form>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
