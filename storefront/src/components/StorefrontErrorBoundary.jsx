import React from 'react';

/**
 * Top-level error boundary for the storefront. Prevents a render error from
 * leaving a customer staring at a blank page; offers a one-click reload.
 */
export default class StorefrontErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // eslint-disable-next-line no-console
    console.error('[storefront] uncaught render error', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center bg-slate-50 p-6">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">
              We hit an unexpected error. Reloading the page usually fixes it.
            </p>
            <button
              className="mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary, #4f46e5)' }}
              onClick={() => window.location.reload()}
              type="button"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
