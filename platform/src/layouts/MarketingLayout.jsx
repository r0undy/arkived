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
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 text-sm text-neutral-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Arkived. Rent smarter. Grow faster.</p>
          <div className="flex items-center gap-4">
            <Link className="hover:text-neutral-300" to="/login">Login</Link>
            <Link className="hover:text-neutral-300" to="/signup">Get started</Link>
            <a
              className="text-neutral-500 transition hover:text-brand-400"
              href="https://www.facebook.com/arkivedsolutions"
              target="_blank"
              rel="noreferrer"
              aria-label="Arkived on Facebook"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
