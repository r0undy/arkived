import { Link, Outlet } from 'react-router-dom';

export default function MarketingLayout() {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-50">
      <header className="border-b border-neutral-750">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link className="text-xl font-semibold tracking-tight" to="/">
            arkived
          </Link>
          <nav className="flex items-center gap-3">
            <Link className="rounded-md px-4 py-2 text-sm text-neutral-200 hover:text-brand-400" to="/login">
              Login
            </Link>
            <Link className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold hover:bg-brand-600" to="/signup">
              Start free
            </Link>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
