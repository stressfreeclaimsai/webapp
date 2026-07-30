import Link from "next/link";
import { redirect } from "next/navigation";
import { runtimeConfig } from "@/lib/runtime-config";

export default function UnsupportedState() {
  const config = runtimeConfig();
  if (!config.isPilot) redirect("/");

  return (
    <section className="pt-2 sm:pt-6">
      <h1 className="text-balance font-display text-display">
        We&rsquo;re not accepting reports in that state yet.
      </h1>
      <p className="mt-3 leading-relaxed text-muted">
        This private pilot is limited to a small number of states. We don&rsquo;t want to collect
        your information unless our team can properly follow up.
      </p>
      {config.supportEmail && (
        <p className="mt-4 leading-relaxed text-muted">
          Questions? Email{" "}
          <a
            className="font-medium text-warn underline-offset-4 hover:underline"
            href={`mailto:${config.supportEmail}`}
          >
            {config.supportEmail}
          </a>
          .
        </p>
      )}
      <Link
        href="/"
        className="mt-7 inline-block rounded-pill bg-accent-btn px-7 py-3.5 font-semibold text-accent-ink"
      >
        Return to the start
      </Link>
    </section>
  );
}

