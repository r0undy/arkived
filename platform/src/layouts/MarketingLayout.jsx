import { Link, Outlet } from 'react-router-dom';
import { ArkivedMark } from '../components/Wordmark';

export default function MarketingLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-900 text-neutral-50">
      <header className="sticky top-0 z-30 border-b border-neutral-750 bg-neutral-900/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link className="flex items-center gap-2" to="/">
            <ArkivedMark className="h-7 w-7" />
            <span className="text-xl font-bold tracking-tight">arkived</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link className="rounded-md px-3 py-2 text-sm text-neutral-200 transition hover:text-brand-400 sm:px-4" to="/login">
              Login
            </Link>
            <Link
              className="rounded-md bg-brand-500 px-3 py-2 text-sm font-semibold transition hover:-translate-y-px hover:bg-brand-600 sm:px-4"
              to="/signup"
            >
              Start free
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-neutral-750">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Arkived. Rent smarter. Grow faster.</p>
          <div className="flex items-center gap-4">
            <Link className="hover:text-neutral-300" to="/login">Login</Link>
            <Link className="hover:text-neutral-300" to="/signup">Get started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
