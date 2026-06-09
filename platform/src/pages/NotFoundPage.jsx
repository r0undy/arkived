import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-neutral-400">The route you requested does not exist.</p>
      <Link className="mt-6 inline-block rounded-md bg-brand-500 px-4 py-2 font-semibold hover:bg-brand-600" to="/">
        Go home
      </Link>
    </div>
  );
}
