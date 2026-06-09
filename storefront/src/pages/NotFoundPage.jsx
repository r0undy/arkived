import { Link } from 'react-router-dom';

export default function NotFoundPage({ title = 'Not found', message = 'The page could not be found.' }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';
  const canonicalUrl = `${origin}${pathname}`;

  return (
    <>
      <title>{title} | Storefront</title>
      <meta content={message} name="description" />
      <link href={canonicalUrl} rel="canonical" />

      <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-slate-600">{message}</p>
        <Link
          className="mt-6 inline-block rounded-md px-4 py-2 font-semibold text-white"
          style={{ backgroundColor: 'var(--color-primary)' }}
          to="/"
        >
          Go home
        </Link>
      </div>
    </>
  );
}
