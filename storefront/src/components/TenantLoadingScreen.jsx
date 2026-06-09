export default function TenantLoadingScreen() {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-10">
      <div className="h-10 w-56 animate-pulse rounded-md bg-slate-200" />
      <div className="mt-8 h-52 animate-pulse rounded-xl bg-slate-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="h-36 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-36 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-36 animate-pulse rounded-lg bg-slate-200" />
      </div>
    </div>
  );
}
