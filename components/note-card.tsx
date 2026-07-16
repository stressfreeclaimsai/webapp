/**
 * EXAMPLE component — replace per project alongside the example entity.
 * Demonstrates token-only styling: every color, radius, and font here comes
 * from the @theme tokens in app/globals.css (no ad-hoc hex / font names).
 */
export type NoteCardData = {
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  updatedAt: Date;
};

export function NoteCard({ note }: { note: NoteCardData }) {
  return (
    <article
      data-testid="note-card"
      className="rounded-card border border-border bg-surface-raised p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-ink">{note.title}</h3>
        {note.pinned && (
          <span className="shrink-0 rounded-pill bg-accent px-2 py-0.5 text-eyebrow font-medium uppercase text-accent-ink">
            Pinned
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">{note.body}</p>
      {note.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {note.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-pill border border-border px-2.5 py-0.5 text-eyebrow text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
