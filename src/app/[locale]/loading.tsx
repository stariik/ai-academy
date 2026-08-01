// ponytail: one spinner for the whole locale subtree. Per-route skeletons
// only if a specific page's wait turns out to feel wrong.
export default function Loading() {
  return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div
        role="status"
        aria-label="Loading"
        className="h-8 w-8 rounded-full border-2 border-border border-t-pulse animate-spin"
      />
    </div>
  );
}
