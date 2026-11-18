type NoResultsProps = { query: string };

/** Shown when a Resources search matches nothing. */
export default function NoResults({ query }: NoResultsProps) {
  return (
    <p
      role="status"
      className="rounded-[30px] border border-border-soft px-6 py-12 text-center text-sm text-subtle-foreground"
    >
      No results for “
      {query.trim()}
      ”. Try a different keyword.
    </p>
  );
}
