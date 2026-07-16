import { prisma } from "@/lib/db";
import { NoteCard, type NoteCardData } from "@/components/note-card";

// This route reads from the database, so render it dynamically — never bake a
// build-time snapshot of the seed data into a static page.
export const dynamic = "force-dynamic";

// The single seeded demo user is loaded IMPLICITLY (constitution §2): there is
// no login, signup, account menu, or user picker anywhere in the prototype.
// We simply read the one seeded user that the prototype runs as.
async function loadDemoData() {
  const user = await prisma.user.findFirst({
    include: { notes: { orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }] } },
  });
  return user;
}

export default async function Home() {
  let user: Awaited<ReturnType<typeof loadDemoData>> = null;
  let dbReady = true;

  try {
    user = await loadDemoData();
  } catch {
    // Database not yet created — show a directional setup state instead of crashing
    // (constitution §4: no console errors on primary flows).
    dbReady = false;
  }

  if (!dbReady || !user) {
    return (
      <section className="rounded-card border border-border bg-surface-raised p-8 text-center">
        <h1 className="text-display">No demo data yet</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          The prototype runs on seeded throwaway data. Populate it, then reload this page.
        </p>
        <code className="mt-4 inline-block rounded-pill border border-border px-3 py-1 text-sm text-ink">
          npm run seed
        </code>
      </section>
    );
  }

  const notes: NoteCardData[] = user.notes.map((note) => ({
    title: note.title,
    body: note.body,
    pinned: note.pinned,
    updatedAt: note.updatedAt,
    tags: note.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean),
  }));

  return (
    <section>
      <header className="mb-8">
        <p className="text-eyebrow uppercase text-accent">{user.name}&rsquo;s workspace</p>
        <h1 className="mt-1 text-display">Notes</h1>
        <p className="mt-2 text-muted">
          {notes.length} {notes.length === 1 ? "note" : "notes"} in this prototype.
        </p>
      </header>

      {notes.length === 0 ? (
        <p className="rounded-card border border-border bg-surface-raised p-6 text-muted">
          No notes yet. Add one to the seed script and run{" "}
          <code className="text-ink">npm run seed</code> to see it here.
        </p>
      ) : (
        <div className="grid gap-4">
          {notes.map((note, i) => (
            <NoteCard key={i} note={note} />
          ))}
        </div>
      )}
    </section>
  );
}
