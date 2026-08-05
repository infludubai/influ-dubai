/**
 * Loading state for the dashboard only.
 *
 * Deliberately NOT at the app root: a root-level loading.tsx wraps every page
 * in a Suspense boundary, so Next streams a 200 shell before a server page can
 * call notFound(). That turns every missing brand or blog post into a soft 404
 * that search engines will happily index.
 */
export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] items-center justify-center"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}
